package com.example.movierecommendation.recommendation.training;

import org.apache.spark.ml.recommendation.ALS;
import org.apache.spark.ml.recommendation.ALSModel;
import org.apache.spark.sql.*;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.util.List;

import static org.apache.spark.sql.functions.*;

public class AlsEmbeddingTrainingJob {

    private static final int FACTORS = 64;
    private static final int MAX_ITER = 20;
    private static final double REG_PARAM = 0.08;
    private static final String MODEL_VERSION = "als_v1";

    public static void main(String[] args) throws Exception {
        String jdbcUrl = System.getenv("DATABASE_URL");
        String dbUser = System.getenv("DATABASE_USER");
        String dbPassword = System.getenv("DATABASE_PASSWORD");

        if (jdbcUrl == null || dbUser == null || dbPassword == null) {
            throw new IllegalStateException("DATABASE_URL, DATABASE_USER, DATABASE_PASSWORD are required");
        }

        SparkSession spark = SparkSession.builder()
                .appName("MovieRecommendationALS")
                .master("local[*]")
                .getOrCreate();

        Dataset<Row> ratings = spark.read()
                .format("jdbc")
                .option("url", jdbcUrl)
                .option("dbtable", """
                        (
                            select
                                user_id,
                                movie_id,
                                rating_value::double precision as strength
                            from ratings
                            where user_id is not null
                              and movie_id is not null
                              and rating_value is not null
                              and rating_value > 0
                        ) rating_events
                        """)
                .option("user", dbUser)
                .option("password", dbPassword)
                .load();

        Dataset<Row> interactions = spark.read()
                .format("jdbc")
                .option("url", jdbcUrl)
                .option("dbtable", """
                        (
                            select
                                user_id,
                                movie_id,
                                case
                                    when completed = true then 5.0
                                    when progress_percent >= 95 then 5.0
                                    when progress_percent >= 75 then 4.0
                                    when progress_percent >= 50 then 3.0
                                    when progress_percent >= 25 then 2.0
                                    when interaction_type = 'FINISH_WATCHING' then 5.0
                                    when interaction_type = 'WATCH_75_PERCENT' then 4.0
                                    when interaction_type = 'WATCH_50_PERCENT' then 3.0
                                    when interaction_type = 'WATCH_25_PERCENT' then 2.0
                                    when interaction_type = 'PLAY' then 1.5
                                    when interaction_type = 'VIEW_DETAIL' then 1.0
                                    when interaction_type = 'PAUSE' then 0.3
                                    else coalesce(value, 0.0)
                                end as strength
                            from user_movie_interactions
                            where user_id is not null
                              and movie_id is not null
                        ) interaction_events
                        """)
                .option("user", dbUser)
                .option("password", dbPassword)
                .load();

        Dataset<Row> rawEvents = ratings.unionByName(interactions)
                .filter(col("strength").gt(0));

        Dataset<Row> trainingData = rawEvents
                .groupBy(col("user_id"), col("movie_id"))
                .agg(max(col("strength")).as("strength"))
                .select(
                        col("user_id").cast("int").as("userId"),
                        col("movie_id").cast("int").as("movieId"),
                        col("strength").cast("float").as("strength")
                );

        long rowCount = trainingData.count();

        if (rowCount == 0) {
            System.out.println("No training data found.");
            spark.stop();
            return;
        }

        ALS als = new ALS()
                .setUserCol("userId")
                .setItemCol("movieId")
                .setRatingCol("strength")
                .setImplicitPrefs(true)
                .setRank(FACTORS)
                .setMaxIter(MAX_ITER)
                .setRegParam(REG_PARAM)
                .setColdStartStrategy("drop");

        ALSModel model = als.fit(trainingData);

        Dataset<Row> userFactors = model.userFactors();
        Dataset<Row> itemFactors = model.itemFactors();

        saveModelVersion(jdbcUrl, dbUser, dbPassword);
        saveUserFactors(jdbcUrl, dbUser, dbPassword, userFactors.collectAsList());
        saveMovieFactors(jdbcUrl, dbUser, dbPassword, itemFactors.collectAsList());

        spark.stop();

        System.out.println("ALS training completed. Model version = " + MODEL_VERSION);
    }

    private static void saveModelVersion(String jdbcUrl, String dbUser, String dbPassword) throws Exception {
        try (Connection connection = DriverManager.getConnection(jdbcUrl, dbUser, dbPassword)) {
            try (PreparedStatement deactivate = connection.prepareStatement("""
                    update recommendation_model_versions
                    set status = 'INACTIVE'
                    where model_type = 'ALS_RETRIEVAL'
                    """)) {
                deactivate.executeUpdate();
            }

            try (PreparedStatement statement = connection.prepareStatement("""
                    insert into recommendation_model_versions
                        (model_version, model_type, description, factors, trained_at, status)
                    values
                        (?, 'ALS_RETRIEVAL', ?, ?, now(), 'ACTIVE')
                    on conflict (model_version)
                    do update set
                        trained_at = now(),
                        status = 'ACTIVE',
                        factors = excluded.factors,
                        description = excluded.description
                    """)) {
                statement.setString(1, MODEL_VERSION);
                statement.setString(2, "ALS learned retrieval model from ratings and user_movie_interactions");
                statement.setInt(3, FACTORS);
                statement.executeUpdate();
            }
        }
    }

    private static void saveUserFactors(
            String jdbcUrl,
            String dbUser,
            String dbPassword,
            List<Row> rows
    ) throws Exception {
        try (Connection connection = DriverManager.getConnection(jdbcUrl, dbUser, dbPassword)) {
            try (PreparedStatement statement = connection.prepareStatement("""
                    insert into learned_user_embeddings
                        (user_id, embedding, model_version, updated_at)
                    values
                        (?, ?::vector, ?, now())
                    on conflict (user_id)
                    do update set
                        embedding = excluded.embedding,
                        model_version = excluded.model_version,
                        updated_at = now()
                    """)) {
                for (Row row : rows) {
                    int userId = row.getInt(0);
                    List<Float> features = row.getList(1);
                    String vector = toPgVector(normalize(features));

                    statement.setLong(1, userId);
                    statement.setString(2, vector);
                    statement.setString(3, MODEL_VERSION);
                    statement.addBatch();
                }

                statement.executeBatch();
            }
        }
    }

    private static void saveMovieFactors(
            String jdbcUrl,
            String dbUser,
            String dbPassword,
            List<Row> rows
    ) throws Exception {
        try (Connection connection = DriverManager.getConnection(jdbcUrl, dbUser, dbPassword)) {
            try (PreparedStatement statement = connection.prepareStatement("""
                    insert into learned_movie_embeddings
                        (movie_id, embedding, model_version, updated_at)
                    values
                        (?, ?::vector, ?, now())
                    on conflict (movie_id)
                    do update set
                        embedding = excluded.embedding,
                        model_version = excluded.model_version,
                        updated_at = now()
                    """)) {
                for (Row row : rows) {
                    int movieId = row.getInt(0);
                    List<Float> features = row.getList(1);
                    String vector = toPgVector(normalize(features));

                    statement.setLong(1, movieId);
                    statement.setString(2, vector);
                    statement.setString(3, MODEL_VERSION);
                    statement.addBatch();
                }

                statement.executeBatch();
            }
        }
    }

    private static double[] normalize(List<Float> values) {
        double[] vector = new double[values.size()];
        double sum = 0.0;

        for (int i = 0; i < values.size(); i++) {
            vector[i] = values.get(i);
            sum += vector[i] * vector[i];
        }

        if (sum <= 0.0) {
            return vector;
        }

        double norm = Math.sqrt(sum);

        for (int i = 0; i < vector.length; i++) {
            vector[i] = vector[i] / norm;
        }

        return vector;
    }

    private static String toPgVector(double[] vector) {
        StringBuilder builder = new StringBuilder();
        builder.append("[");

        for (int i = 0; i < vector.length; i++) {
            if (i > 0) {
                builder.append(",");
            }

            builder.append(vector[i]);
        }

        builder.append("]");
        return builder.toString();
    }
}