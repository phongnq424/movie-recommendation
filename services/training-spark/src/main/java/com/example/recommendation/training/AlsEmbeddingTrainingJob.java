package com.example.recommendation.training;

import org.apache.spark.ml.recommendation.ALS;
import org.apache.spark.ml.recommendation.ALSModel;
import org.apache.spark.sql.Dataset;
import org.apache.spark.sql.Row;
import org.apache.spark.sql.SparkSession;

import java.io.BufferedReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.util.List;
import java.util.Properties;

import static org.apache.spark.sql.functions.col;
import static org.apache.spark.sql.functions.max;

public class AlsEmbeddingTrainingJob {

    public static void main(String[] args) throws Exception {
        Properties env = loadDotEnv();

        String jdbcUrl = getRequired(env, "DB_URL");
        String dbUser = getRequired(env, "DB_USERNAME");
        String dbPassword = getRequired(env, "DB_PASSWORD");

        String modelVersion = get(env, "RECOMMENDATION_MODEL_VERSION", "als_v1");
        int factors = Integer.parseInt(get(env, "RECOMMENDATION_FACTORS", "64"));
        int maxIter = Integer.parseInt(get(env, "RECOMMENDATION_MAX_ITER", "20"));
        double regParam = Double.parseDouble(get(env, "RECOMMENDATION_REG_PARAM", "0.08"));

        Class.forName("org.postgresql.Driver");

        SparkSession spark = SparkSession.builder()
                .appName("MovieRecommendationALS")
                .master("local[*]")
                .config("spark.ui.enabled", "false")
                .config("spark.sql.shuffle.partitions", "4")
                .config("spark.driver.host", "127.0.0.1")
                .getOrCreate();

        try {
            Dataset<Row> ratings = spark.read()
                    .format("jdbc")
                    .option("url", jdbcUrl)
                    .option("driver", "org.postgresql.Driver")
                    .option("dbtable", """
                (
                    select
                        r.user_id,
                        r.movie_id,
                        r.rating_value::double precision as strength
                    from ratings r
                    join users u on u.id = r.user_id
                    join movies m on m.id = r.movie_id
                    where r.user_id is not null
                      and r.movie_id is not null
                      and r.rating_value is not null
                      and r.rating_value > 0
                ) rating_events
                """)
                    .option("user", dbUser)
                    .option("password", dbPassword)
                    .load();

            Dataset<Row> interactions = spark.read()
                    .format("jdbc")
                    .option("url", jdbcUrl)
                    .option("driver", "org.postgresql.Driver")
                    .option("dbtable", """
                (
                    select
                        i.user_id,
                        i.movie_id,
                        case
                            when i.completed = true then 5.0
                            when i.progress_percent >= 95 then 5.0
                            when i.progress_percent >= 75 then 4.0
                            when i.progress_percent >= 50 then 3.0
                            when i.progress_percent >= 25 then 2.0
                            when i.interaction_type = 'FINISH_WATCHING' then 5.0
                            when i.interaction_type = 'WATCH_75_PERCENT' then 4.0
                            when i.interaction_type = 'WATCH_50_PERCENT' then 3.0
                            when i.interaction_type = 'WATCH_25_PERCENT' then 2.0
                            when i.interaction_type = 'PLAY' then 1.5
                            when i.interaction_type = 'VIEW_DETAIL' then 1.0
                            when i.interaction_type = 'PAUSE' then 0.3
                            else coalesce(i.value, 0.0)
                        end as strength
                    from user_movie_interactions i
                    join users u on u.id = i.user_id
                    join movies m on m.id = i.movie_id
                    where i.user_id is not null
                      and i.movie_id is not null
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
                return;
            }

            System.out.println("Training rows: " + rowCount);

            ALS als = new ALS()
                    .setUserCol("userId")
                    .setItemCol("movieId")
                    .setRatingCol("strength")
                    .setImplicitPrefs(true)
                    .setRank(factors)
                    .setMaxIter(maxIter)
                    .setRegParam(regParam)
                    .setColdStartStrategy("drop");

            ALSModel model = als.fit(trainingData);

            Dataset<Row> userFactors = model.userFactors();
            Dataset<Row> movieFactors = model.itemFactors();

            saveModelVersion(jdbcUrl, dbUser, dbPassword, modelVersion, factors);
            saveUserFactors(jdbcUrl, dbUser, dbPassword, userFactors.collectAsList(), modelVersion);
            saveMovieFactors(jdbcUrl, dbUser, dbPassword, movieFactors.collectAsList(), modelVersion);

            System.out.println("ALS training completed. Model version = " + modelVersion);
        } finally {
            spark.stop();
        }
    }

    private static void saveModelVersion(
            String jdbcUrl,
            String dbUser,
            String dbPassword,
            String modelVersion,
            int factors
    ) throws Exception {
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
                statement.setString(1, modelVersion);
                statement.setString(2, "Spark ALS learned retrieval model from ratings and user_movie_interactions");
                statement.setInt(3, factors);
                statement.executeUpdate();
            }
        }
    }

    private static void saveUserFactors(
            String jdbcUrl,
            String dbUser,
            String dbPassword,
            List<Row> rows,
            String modelVersion
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
                    statement.setString(3, modelVersion);
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
            List<Row> rows,
            String modelVersion
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
                    statement.setString(3, modelVersion);
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

    private static Properties loadDotEnv() throws Exception {
        Properties properties = new Properties();
        Path path = Path.of(".env");

        if (!Files.exists(path)) {
            return properties;
        }

        try (BufferedReader reader = Files.newBufferedReader(path)) {
            String line;

            while ((line = reader.readLine()) != null) {
                String trimmed = line.trim();

                if (trimmed.isBlank() || trimmed.startsWith("#")) {
                    continue;
                }

                int equalIndex = trimmed.indexOf("=");

                if (equalIndex <= 0) {
                    continue;
                }

                String key = trimmed.substring(0, equalIndex).trim();
                String value = trimmed.substring(equalIndex + 1).trim();

                properties.setProperty(key, removeWrappingQuotes(value));
            }
        }

        return properties;
    }

    private static String getRequired(Properties properties, String key) {
        String value = get(properties, key, null);

        if (value == null || value.isBlank()) {
            throw new IllegalStateException(key + " is required");
        }

        return value;
    }

    private static String get(Properties properties, String key, String defaultValue) {
        String envValue = System.getenv(key);

        if (envValue != null && !envValue.isBlank()) {
            return removeWrappingQuotes(envValue.trim());
        }

        String fileValue = properties.getProperty(key);

        if (fileValue != null && !fileValue.isBlank()) {
            return removeWrappingQuotes(fileValue.trim());
        }

        return defaultValue;
    }

    private static String removeWrappingQuotes(String value) {
        if (value == null || value.length() < 2) {
            return value;
        }

        if (value.startsWith("\"") && value.endsWith("\"")) {
            return value.substring(1, value.length() - 1);
        }

        if (value.startsWith("'") && value.endsWith("'")) {
            return value.substring(1, value.length() - 1);
        }

        return value;
    }
}