package com.example.recommendation.contentembedding;

import com.example.recommendation.core.content.MovieSemanticTextBuilder;

import ai.djl.MalformedModelException;
import ai.djl.huggingface.tokenizers.HuggingFaceTokenizer;
import ai.djl.huggingface.translator.TextEmbeddingTranslator;
import ai.djl.inference.Predictor;
import ai.djl.repository.zoo.Criteria;
import ai.djl.repository.zoo.ModelNotFoundException;
import ai.djl.repository.zoo.ModelZoo;
import ai.djl.repository.zoo.ZooModel;
import ai.djl.training.util.ProgressBar;
import ai.djl.translate.TranslateException;
import main.java.com.example.movierecommendation.recommendation.embedding.MovieContentEmbeddingMessage;

import com.google.gson.Gson;
import com.rabbitmq.client.BuiltinExchangeType;
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.ConnectionFactory;
import com.rabbitmq.client.DeliverCallback;

import java.io.BufferedReader;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Properties;

/**
 * Java-only transformer content embedding worker.
 *
 * Supported modes:
 * 1. RabbitMQ mode:
 * - consume movie content changed messages from RabbitMQ
 * - fetch movie text from DB
 * - compare content_hash
 * - embed changed movies
 * - upsert movie_content_embeddings
 *
 * 2. Batch scan mode:
 * - scan all PUBLISHED movies
 * - compare content_hash
 * - embed changed movies
 *
 * 3. Legacy job mode:
 * - read movie_content_embedding_jobs directly
 * - claim PENDING jobs
 * - embed only affected movies
 * - mark jobs DONE / FAILED
 */
public class ContentEmbeddingApplication {

    private static final Gson GSON = new Gson();

    public static void main(String[] args) throws Exception {
        ContentEmbeddingConfig config = ContentEmbeddingConfig.load(args);
        Class.forName("org.postgresql.Driver");

        MovieTextRepository repository = new MovieTextRepository(config);

        System.out.println("Starting semantic content embedding worker.");
        System.out.println("Model name : " + config.modelName());
        System.out.println("Model url  : " + config.modelUrl());
        System.out.println("Model path : " + config.modelPath());
        System.out.println("Batch size : " + config.batchSize());
        System.out.println("Job mode   : " + config.jobMode());
        System.out.println("Rabbit mode: " + config.rabbitMode());

        try (SentenceEmbeddingModel embeddingModel = new DjlSentenceEmbeddingModel(config)) {
            if (config.rabbitMode()) {
                runRabbitConsumerMode(config, repository, embeddingModel);
            } else if (config.jobMode()) {
                runJobMode(config, repository, embeddingModel);
            } else {
                runBatchScanMode(config, repository, embeddingModel);
            }
        }
    }

    private static void runRabbitConsumerMode(
            ContentEmbeddingConfig config,
            MovieTextRepository repository,
            SentenceEmbeddingModel embeddingModel) throws Exception {
        if (config.rabbitmqUrl() == null || config.rabbitmqUrl().isBlank()) {
            throw new IllegalStateException("RABBITMQ_URL is required when CONTENT_EMBEDDING_RABBIT_MODE=true");
        }

        ConnectionFactory factory = new ConnectionFactory();
        factory.setUri(config.rabbitmqUrl());
        factory.setAutomaticRecoveryEnabled(true);
        factory.setNetworkRecoveryInterval(5000);

        com.rabbitmq.client.Connection connection = factory.newConnection();
        Channel channel = connection.createChannel();

        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            try {
                if (channel.isOpen()) {
                    channel.close();
                }
            } catch (Exception ignored) {
            }

            try {
                if (connection.isOpen()) {
                    connection.close();
                }
            } catch (Exception ignored) {
            }
        }));

        channel.exchangeDeclare(
                config.rabbitExchange(),
                BuiltinExchangeType.DIRECT,
                true);

        channel.queueDeclare(
                config.rabbitQueue(),
                true,
                false,
                false,
                null);

        channel.queueBind(
                config.rabbitQueue(),
                config.rabbitExchange(),
                config.rabbitRoutingKey());

        channel.basicQos(config.rabbitPrefetch());

        System.out.println("RabbitMQ content embedding consumer started.");
        System.out.println("Exchange: " + config.rabbitExchange());
        System.out.println("Queue   : " + config.rabbitQueue());
        System.out.println("Routing : " + config.rabbitRoutingKey());
        System.out.println("Prefetch: " + config.rabbitPrefetch());

        DeliverCallback deliverCallback = (consumerTag, delivery) -> {
            long deliveryTag = delivery.getEnvelope().getDeliveryTag();

            try {
                String payload = new String(delivery.getBody(), StandardCharsets.UTF_8);

                MovieContentEmbeddingMessage message = GSON.fromJson(payload, MovieContentEmbeddingMessage.class);

                if (message == null || message.movieId() == null) {
                    System.out.println("Invalid RabbitMQ message. payload=" + payload);
                    channel.basicAck(deliveryTag, false);
                    return;
                }

                MovieContentEmbeddingResult result = processSingleMovieMessage(
                        config,
                        repository,
                        embeddingModel,
                        message);

                System.out.println("Processed content embedding message. movieId="
                        + message.movieId()
                        + ", reason=" + message.reason()
                        + ", embedded=" + result.embedded()
                        + ", skipped=" + result.skipped()
                        + ", message=" + result.message()
                        + ", time=" + LocalDateTime.now());

                channel.basicAck(deliveryTag, false);
            } catch (Exception exception) {
                System.out.println("Failed to process RabbitMQ content embedding message. error="
                        + exception.getMessage()
                        + ", time=" + LocalDateTime.now());

                channel.basicNack(
                        deliveryTag,
                        false,
                        config.rabbitRequeueOnFailure());
            }
        };

        channel.basicConsume(
                config.rabbitQueue(),
                false,
                deliverCallback,
                consumerTag -> {
                });

        Thread.currentThread().join();
    }

    private static MovieContentEmbeddingResult processSingleMovieMessage(
            ContentEmbeddingConfig config,
            MovieTextRepository repository,
            SentenceEmbeddingModel embeddingModel,
            MovieContentEmbeddingMessage message) throws SQLException, TranslateException {
        Optional<MovieTextItem> optionalItem = repository.fetchMovieTextByMovieId(message.movieId());

        if (optionalItem.isEmpty()) {
            return new MovieContentEmbeddingResult(
                    false,
                    true,
                    "Movie not found or not published");
        }

        MovieTextItem item = optionalItem.get();

        if (item.text().isBlank()) {
            return new MovieContentEmbeddingResult(
                    false,
                    true,
                    "Movie semantic text is blank");
        }

        if (!config.force() && item.contentHash().equals(item.existingContentHash())) {
            return new MovieContentEmbeddingResult(
                    false,
                    true,
                    "Content hash unchanged");
        }

        List<float[]> vectors = embeddingModel.embed(List.of(item.text()));

        if (vectors.size() != 1) {
            throw new IllegalStateException(
                    "Embedding output size mismatch. Expected 1, got " + vectors.size());
        }

        repository.upsertEmbeddings(List.of(item), vectors);

        return new MovieContentEmbeddingResult(
                true,
                false,
                "Embedding upserted");
    }

    private static void runBatchScanMode(
            ContentEmbeddingConfig config,
            MovieTextRepository repository,
            SentenceEmbeddingModel embeddingModel) throws SQLException, TranslateException {
        long processed = 0;
        long skipped = 0;
        long embedded = 0;
        long afterId = 0;

        while (true) {
            List<MovieTextItem> items = repository.fetchMovieTextBatch(afterId);
            if (items.isEmpty()) {
                break;
            }

            List<MovieTextItem> itemsToEmbed = new ArrayList<>();

            for (MovieTextItem item : items) {
                processed++;
                afterId = Math.max(afterId, item.movieId());

                if (item.text().isBlank()) {
                    skipped++;
                    continue;
                }

                if (!config.force() && item.contentHash().equals(item.existingContentHash())) {
                    skipped++;
                    continue;
                }

                itemsToEmbed.add(item);
            }

            if (!itemsToEmbed.isEmpty()) {
                List<String> texts = itemsToEmbed.stream()
                        .map(MovieTextItem::text)
                        .toList();

                List<float[]> vectors = embeddingModel.embed(texts);

                if (vectors.size() != itemsToEmbed.size()) {
                    throw new IllegalStateException("Embedding output size mismatch. input="
                            + itemsToEmbed.size() + ", output=" + vectors.size());
                }

                repository.upsertEmbeddings(itemsToEmbed, vectors);
                embedded += vectors.size();

                System.out.println("Embedded batch. processed=" + processed
                        + ", embedded=" + embedded
                        + ", skipped=" + skipped
                        + ", lastMovieId=" + afterId
                        + ", time=" + LocalDateTime.now());
            }
        }

        System.out.println("Semantic content embedding completed. processed=" + processed
                + ", embedded=" + embedded
                + ", skipped=" + skipped);
    }

    private static void runJobMode(
            ContentEmbeddingConfig config,
            MovieTextRepository repository,
            SentenceEmbeddingModel embeddingModel) throws SQLException {
        long claimed = 0;
        long embedded = 0;
        long skipped = 0;
        long failed = 0;

        while (true) {
            List<EmbeddingJobItem> jobs = repository.claimPendingEmbeddingJobs();

            if (jobs.isEmpty()) {
                break;
            }

            claimed += jobs.size();

            List<MovieTextJobItem> itemsToEmbed = new ArrayList<>();

            for (EmbeddingJobItem job : jobs) {
                try {
                    Optional<MovieTextItem> optionalItem = repository.fetchMovieTextByMovieId(job.movieId());

                    if (optionalItem.isEmpty()) {
                        repository.markJobDone(job.id());
                        skipped++;
                        continue;
                    }

                    MovieTextItem item = optionalItem.get();

                    if (item.text().isBlank()) {
                        repository.markJobDone(job.id());
                        skipped++;
                        continue;
                    }

                    if (!config.force() && item.contentHash().equals(item.existingContentHash())) {
                        repository.markJobDone(job.id());
                        skipped++;
                        continue;
                    }

                    itemsToEmbed.add(new MovieTextJobItem(job, item));
                } catch (Exception exception) {
                    repository.markJobFailed(job.id(), exception.getMessage());
                    failed++;
                }
            }

            if (!itemsToEmbed.isEmpty()) {
                try {
                    List<String> texts = itemsToEmbed.stream()
                            .map(item -> item.movieTextItem().text())
                            .toList();

                    List<float[]> vectors = embeddingModel.embed(texts);

                    if (vectors.size() != itemsToEmbed.size()) {
                        throw new IllegalStateException("Embedding output size mismatch. input="
                                + itemsToEmbed.size() + ", output=" + vectors.size());
                    }

                    List<MovieTextItem> movieTextItems = itemsToEmbed.stream()
                            .map(MovieTextJobItem::movieTextItem)
                            .toList();

                    repository.upsertEmbeddings(movieTextItems, vectors);

                    for (MovieTextJobItem item : itemsToEmbed) {
                        repository.markJobDone(item.job().id());
                    }

                    embedded += vectors.size();

                    System.out.println("Embedded job batch. claimed=" + claimed
                            + ", embedded=" + embedded
                            + ", skipped=" + skipped
                            + ", failed=" + failed
                            + ", time=" + LocalDateTime.now());
                } catch (Exception exception) {
                    for (MovieTextJobItem item : itemsToEmbed) {
                        repository.markJobFailed(item.job().id(), exception.getMessage());
                    }

                    failed += itemsToEmbed.size();

                    System.out.println("Failed embedding job batch. failed=" + failed
                            + ", error=" + exception.getMessage()
                            + ", time=" + LocalDateTime.now());
                }
            }
        }

        System.out.println("Semantic content embedding job mode completed. claimed=" + claimed
                + ", embedded=" + embedded
                + ", skipped=" + skipped
                + ", failed=" + failed);
    }

    private record ContentEmbeddingConfig(
            String jdbcUrl,
            String dbUser,
            String dbPassword,
            String modelName,
            String modelUrl,
            String modelPath,
            String tokenizer,
            int dimension,
            int batchSize,
            int actorLimit,
            boolean force,
            Long movieId,
            String status,
            boolean includeTokenTypes,
            boolean int32,
            String poolingMode,
            boolean jobMode,
            int jobMaxAttempts,
            int jobRetryDelaySeconds,
            boolean rabbitMode,
            String rabbitmqUrl,
            String rabbitExchange,
            String rabbitQueue,
            String rabbitRoutingKey,
            int rabbitPrefetch,
            boolean rabbitRequeueOnFailure) {

        private static ContentEmbeddingConfig load(String[] args) throws IOException {
            Properties env = loadEnvironment();
            Properties cli = parseArgs(args);

            return new ContentEmbeddingConfig(
                    getRequired(env, cli, "DB_URL"),
                    getRequired(env, cli, "DB_USERNAME"),
                    getRequired(env, cli, "DB_PASSWORD"),
                    get(env, cli, "CONTENT_EMBEDDING_MODEL_NAME", "sentence-transformers/all-MiniLM-L6-v2"),
                    get(env, cli, "CONTENT_EMBEDDING_MODEL_URL",
                            "https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2/resolve/main/onnx/model.onnx"),
                    blankToNull(get(env, cli, "CONTENT_EMBEDDING_MODEL_PATH", null)),
                    get(env, cli, "CONTENT_EMBEDDING_TOKENIZER", "sentence-transformers/all-MiniLM-L6-v2"),
                    Integer.parseInt(get(env, cli, "CONTENT_EMBEDDING_DIMENSION", "384")),
                    Integer.parseInt(get(env, cli, "CONTENT_EMBEDDING_BATCH_SIZE", "32")),
                    Integer.parseInt(get(env, cli, "CONTENT_EMBEDDING_ACTOR_LIMIT", "8")),
                    Boolean.parseBoolean(get(env, cli, "CONTENT_EMBEDDING_FORCE", "false")),
                    parseLongOrNull(get(env, cli, "CONTENT_EMBEDDING_MOVIE_ID", null)),
                    get(env, cli, "CONTENT_EMBEDDING_STATUS", "PUBLISHED"),
                    Boolean.parseBoolean(get(env, cli, "CONTENT_EMBEDDING_INCLUDE_TOKEN_TYPES", "true")),
                    Boolean.parseBoolean(get(env, cli, "CONTENT_EMBEDDING_INT32", "false")),
                    get(env, cli, "CONTENT_EMBEDDING_POOLING_MODE", "mean"),
                    Boolean.parseBoolean(get(env, cli, "CONTENT_EMBEDDING_JOB_MODE", "false")),
                    Integer.parseInt(get(env, cli, "CONTENT_EMBEDDING_JOB_MAX_ATTEMPTS", "3")),
                    Integer.parseInt(get(env, cli, "CONTENT_EMBEDDING_JOB_RETRY_DELAY_SECONDS", "300")),
                    Boolean.parseBoolean(get(env, cli, "CONTENT_EMBEDDING_RABBIT_MODE", "false")),
                    blankToNull(get(env, cli, "RABBITMQ_URL", null)),
                    get(env, cli, "CONTENT_EMBEDDING_RABBIT_EXCHANGE", "movie.events"),
                    get(env, cli, "CONTENT_EMBEDDING_RABBIT_QUEUE", "movie.content.embedding"),
                    get(env, cli, "CONTENT_EMBEDDING_RABBIT_ROUTING_KEY", "movie.content.changed"),
                    Integer.parseInt(get(env, cli, "CONTENT_EMBEDDING_RABBIT_PREFETCH", "1")),
                    Boolean.parseBoolean(get(env, cli, "CONTENT_EMBEDDING_RABBIT_REQUEUE_ON_FAILURE", "true")));
        }

        private static Properties loadEnvironment() throws IOException {
            Properties properties = new Properties();

            System.getenv().forEach(properties::setProperty);

            Path path = Path.of(".env");

            if (!Files.exists(path)) {
                return properties;
            }

            try (BufferedReader reader = Files.newBufferedReader(path, StandardCharsets.UTF_8)) {
                String line;

                while ((line = reader.readLine()) != null) {
                    String trimmed = line.trim();

                    if (trimmed.isBlank() || trimmed.startsWith("#")) {
                        continue;
                    }

                    int equalIndex = trimmed.indexOf('=');

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

        private static Properties parseArgs(String[] args) {
            Properties properties = new Properties();
            if (args == null) {
                return properties;
            }

            for (String arg : args) {
                if (arg == null || !arg.startsWith("--")) {
                    continue;
                }

                String raw = arg.substring(2);
                int equalsIndex = raw.indexOf('=');
                if (equalsIndex <= 0) {
                    properties.setProperty(raw, "true");
                } else {
                    properties.setProperty(raw.substring(0, equalsIndex), raw.substring(equalsIndex + 1));
                }
            }

            return properties;
        }

        private static String getRequired(Properties env, Properties cli, String key) {
            String value = get(env, cli, key, null);
            if (value == null || value.isBlank()) {
                throw new IllegalStateException(key + " is required");
            }
            return value;
        }

        private static String get(Properties env, Properties cli, String key, String defaultValue) {
            String cliValue = cli.getProperty(key);
            if (cliValue != null && !cliValue.isBlank()) {
                return cliValue;
            }

            String envValue = env.getProperty(key);
            if (envValue != null && !envValue.isBlank()) {
                return envValue;
            }

            return defaultValue;
        }

        private static String blankToNull(String value) {
            if (value == null || value.isBlank()) {
                return null;
            }
            return value;
        }

        private static Long parseLongOrNull(String value) {
            if (value == null || value.isBlank()) {
                return null;
            }
            return Long.parseLong(value);
        }

        private static String removeWrappingQuotes(String value) {
            if (value == null || value.length() < 2) {
                return value;
            }

            if ((value.startsWith("\"") && value.endsWith("\""))
                    || (value.startsWith("'") && value.endsWith("'"))) {
                return value.substring(1, value.length() - 1);
            }

            return value;
        }
    }

    private interface SentenceEmbeddingModel extends AutoCloseable {
        List<float[]> embed(List<String> texts) throws TranslateException;

        @Override
        void close();
    }

    private static final class DjlSentenceEmbeddingModel implements SentenceEmbeddingModel {
        private final ContentEmbeddingConfig config;
        private final ZooModel<String, float[]> model;
        private final Predictor<String, float[]> predictor;

        private DjlSentenceEmbeddingModel(ContentEmbeddingConfig config)
                throws ModelNotFoundException, MalformedModelException, IOException {
            this.config = config;

            HuggingFaceTokenizer tokenizer = createTokenizer(config);
            TextEmbeddingTranslator translator = TextEmbeddingTranslator.builder(tokenizer)
                    .optNormalize(true)
                    .optPoolingMode(config.poolingMode())
                    .optIncludeTokenTypes(config.includeTokenTypes())
                    .optInt32(config.int32())
                    .build();

            Criteria.Builder<String, float[]> builder = Criteria.builder()
                    .setTypes(String.class, float[].class)
                    .optEngine("OnnxRuntime")
                    .optTranslator(translator)
                    .optProgress(new ProgressBar());

            if (config.modelPath() != null) {
                builder.optModelPath(Path.of(config.modelPath()));
            } else {
                builder.optModelUrls(config.modelUrl());
            }

            this.model = ModelZoo.loadModel(builder.build());
            this.predictor = model.newPredictor();
        }

        private static HuggingFaceTokenizer createTokenizer(ContentEmbeddingConfig config) throws IOException {
            if (config.modelPath() != null) {
                return HuggingFaceTokenizer.newInstance(Path.of(config.modelPath()));
            }

            return HuggingFaceTokenizer.newInstance(config.tokenizer());
        }

        @Override
        public List<float[]> embed(List<String> texts) throws TranslateException {
            List<float[]> result = new ArrayList<>(texts.size());

            for (String text : texts) {
                float[] vector = predictor.predict(text);

                if (vector.length != config.dimension()) {
                    throw new IllegalStateException("Unexpected embedding dimension: "
                            + vector.length + ". Expected: " + config.dimension());
                }

                result.add(VectorUtils.normalize(vector));
            }

            return result;
        }

        @Override
        public void close() {
            predictor.close();
            model.close();
        }
    }

    private static final class MovieTextRepository {
        private final ContentEmbeddingConfig config;

        private MovieTextRepository(ContentEmbeddingConfig config) {
            this.config = config;
        }

        private List<MovieTextItem> fetchMovieTextBatch(long afterId) throws SQLException {
            try (Connection connection = DriverManager.getConnection(
                    config.jdbcUrl(), config.dbUser(), config.dbPassword())) {

                String movieFilter = config.movieId() == null ? "" : " and m.id = ? ";

                String sql = movieTextSelectSql("""
                        where m.id > ?
                          and m.status = ?
                        """ + movieFilter + """
                        order by m.id asc
                        limit ?
                        """);

                try (PreparedStatement statement = connection.prepareStatement(sql)) {
                    int index = 1;
                    statement.setInt(index++, config.actorLimit());
                    statement.setLong(index++, afterId);
                    statement.setString(index++, config.status());

                    if (config.movieId() != null) {
                        statement.setLong(index++, config.movieId());
                    }

                    statement.setInt(index, config.batchSize());

                    return mapMovieTextItems(statement);
                }
            }
        }

        private Optional<MovieTextItem> fetchMovieTextByMovieId(long movieId) throws SQLException {
            try (Connection connection = DriverManager.getConnection(
                    config.jdbcUrl(), config.dbUser(), config.dbPassword())) {

                String sql = movieTextSelectSql("""
                        where m.id = ?
                          and m.status = ?
                        limit 1
                        """);

                try (PreparedStatement statement = connection.prepareStatement(sql)) {
                    int index = 1;
                    statement.setInt(index++, config.actorLimit());
                    statement.setLong(index++, movieId);
                    statement.setString(index, config.status());

                    List<MovieTextItem> items = mapMovieTextItems(statement);

                    if (items.isEmpty()) {
                        return Optional.empty();
                    }

                    return Optional.of(items.get(0));
                }
            }
        }

        private String movieTextSelectSql(String whereAndLimitSql) {
            return """
                    select
                        m.id,
                        coalesce(m.title, '') as title,
                        coalesce(m.original_title, '') as original_title,
                        coalesce(m.description, '') as description,
                        m.release_year,
                        coalesce((
                            select string_agg(g.name, ', ' order by g.name)
                            from movie_genres mg
                            join genres g on g.id = mg.genre_id
                            where mg.movie_id = m.id
                              and coalesce(g.status, 'ACTIVE') <> 'DELETED'
                        ), '') as genres,
                        coalesce((
                            select string_agg(actor_rows.full_name, ', ')
                            from (
                                select a.full_name
                                from movie_actors ma
                                join actors a on a.id = ma.actor_id
                                where ma.movie_id = m.id
                                  and coalesce(a.status, 'ACTIVE') <> 'DELETED'
                                order by coalesce(ma.main_cast, false) desc,
                                         ma.cast_order nulls last,
                                         a.full_name asc
                                limit ?
                            ) actor_rows
                        ), '') as actors,
                        e.content_hash as existing_content_hash
                    from movies m
                    left join movie_content_embeddings e on e.movie_id = m.id
                    """ + whereAndLimitSql;
        }

        private List<MovieTextItem> mapMovieTextItems(PreparedStatement statement) throws SQLException {
            try (ResultSet rs = statement.executeQuery()) {
                List<MovieTextItem> result = new ArrayList<>();

                while (rs.next()) {
                    long movieId = rs.getLong("id");

                    String text = MovieSemanticTextBuilder.build(
                            rs.getString("title"),
                            rs.getString("original_title"),
                            rs.getString("description"),
                            rs.getObject("release_year") == null ? null : rs.getInt("release_year"),
                            rs.getString("genres"),
                            rs.getString("actors"));

                    String hash = HashUtils.sha256(text);

                    result.add(new MovieTextItem(
                            movieId,
                            text,
                            hash,
                            rs.getString("existing_content_hash")));
                }

                return result;
            }
        }

        private List<EmbeddingJobItem> claimPendingEmbeddingJobs() throws SQLException {
            try (Connection connection = DriverManager.getConnection(
                    config.jdbcUrl(), config.dbUser(), config.dbPassword())) {
                connection.setAutoCommit(false);

                try (PreparedStatement statement = connection.prepareStatement("""
                        update movie_content_embedding_jobs j
                        set status = 'PROCESSING',
                            attempts = attempts + 1,
                            updated_at = now()
                        where j.id in (
                            select id
                            from movie_content_embedding_jobs
                            where status = 'PENDING'
                              and next_run_at <= now()
                              and attempts < ?
                            order by created_at asc
                            limit ?
                            for update skip locked
                        )
                        returning j.id, j.movie_id
                        """)) {
                    statement.setInt(1, config.jobMaxAttempts());
                    statement.setInt(2, config.batchSize());

                    List<EmbeddingJobItem> jobs = new ArrayList<>();

                    try (ResultSet rs = statement.executeQuery()) {
                        while (rs.next()) {
                            jobs.add(new EmbeddingJobItem(
                                    rs.getLong("id"),
                                    rs.getLong("movie_id")));
                        }
                    }

                    connection.commit();

                    return jobs;
                } catch (Exception exception) {
                    connection.rollback();
                    throw exception;
                } finally {
                    connection.setAutoCommit(true);
                }
            }
        }

        private void markJobDone(long jobId) throws SQLException {
            try (Connection connection = DriverManager.getConnection(
                    config.jdbcUrl(), config.dbUser(), config.dbPassword());
                    PreparedStatement statement = connection.prepareStatement("""
                            update movie_content_embedding_jobs
                            set status = 'DONE',
                                last_error = null,
                                updated_at = now()
                            where id = ?
                            """)) {
                statement.setLong(1, jobId);
                statement.executeUpdate();
            }
        }

        private void markJobFailed(long jobId, String errorMessage) throws SQLException {
            String safeError = errorMessage == null || errorMessage.isBlank()
                    ? "Unknown content embedding error"
                    : errorMessage;

            if (safeError.length() > 4000) {
                safeError = safeError.substring(0, 4000);
            }

            try (Connection connection = DriverManager.getConnection(
                    config.jdbcUrl(), config.dbUser(), config.dbPassword());
                    PreparedStatement statement = connection.prepareStatement("""
                            update movie_content_embedding_jobs
                            set status = case
                                    when attempts >= ? then 'FAILED'
                                    else 'PENDING'
                                end,
                                last_error = ?,
                                next_run_at = case
                                    when attempts >= ? then next_run_at
                                    else now() + make_interval(secs => ?)
                                end,
                                updated_at = now()
                            where id = ?
                            """)) {
                int index = 1;
                statement.setInt(index++, config.jobMaxAttempts());
                statement.setString(index++, safeError);
                statement.setInt(index++, config.jobMaxAttempts());
                statement.setInt(index++, config.jobRetryDelaySeconds());
                statement.setLong(index, jobId);
                statement.executeUpdate();
            }
        }

        private void upsertEmbeddings(List<MovieTextItem> items, List<float[]> vectors) throws SQLException {
            if (items.isEmpty()) {
                return;
            }

            try (Connection connection = DriverManager.getConnection(
                    config.jdbcUrl(), config.dbUser(), config.dbPassword())) {
                connection.setAutoCommit(false);

                try (PreparedStatement statement = connection.prepareStatement("""
                        insert into movie_content_embeddings
                            (movie_id, embedding, model_name, content_hash, updated_at)
                        values
                            (?, ?::vector, ?, ?, now())
                        on conflict (movie_id)
                        do update set
                            embedding = excluded.embedding,
                            model_name = excluded.model_name,
                            content_hash = excluded.content_hash,
                            updated_at = now()
                        """)) {
                    for (int i = 0; i < items.size(); i++) {
                        MovieTextItem item = items.get(i);
                        float[] vector = vectors.get(i);

                        statement.setLong(1, item.movieId());
                        statement.setString(2, VectorUtils.toPgVector(vector));
                        statement.setString(3, config.modelName());
                        statement.setString(4, item.contentHash());
                        statement.addBatch();
                    }

                    statement.executeBatch();
                    connection.commit();
                } catch (Exception exception) {
                    connection.rollback();
                    throw exception;
                } finally {
                    connection.setAutoCommit(true);
                }
            }
        }
    }

    private record MovieContentEmbeddingMessage(
            Long movieId,
            String reason) {
    }

    private record MovieContentEmbeddingResult(
            boolean embedded,
            boolean skipped,
            String message) {
    }

    private record EmbeddingJobItem(
            long id,
            long movieId) {
    }

    private record MovieTextJobItem(
            EmbeddingJobItem job,
            MovieTextItem movieTextItem) {
    }

    private record MovieTextItem(
            long movieId,
            String text,
            String contentHash,
            String existingContentHash) {
    }

    private static final class VectorUtils {
        private VectorUtils() {
        }

        private static float[] normalize(float[] vector) {
            float[] result = new float[vector.length];
            double sum = 0.0;

            for (float value : vector) {
                sum += value * value;
            }

            if (sum <= 0.0) {
                System.arraycopy(vector, 0, result, 0, vector.length);
                return result;
            }

            double norm = Math.sqrt(sum);

            for (int i = 0; i < vector.length; i++) {
                result[i] = (float) (vector[i] / norm);
            }

            return result;
        }

        private static String toPgVector(float[] vector) {
            StringBuilder builder = new StringBuilder("[");

            for (int i = 0; i < vector.length; i++) {
                if (i > 0) {
                    builder.append(',');
                }

                builder.append(vector[i]);
            }

            builder.append(']');
            return builder.toString();
        }
    }

    private static final class HashUtils {
        private HashUtils() {
        }

        private static String sha256(String value) {
            try {
                MessageDigest digest = MessageDigest.getInstance("SHA-256");
                byte[] hash = digest.digest(Objects.toString(value, "").getBytes(StandardCharsets.UTF_8));
                return HexFormat.of().formatHex(hash);
            } catch (Exception exception) {
                throw new IllegalStateException("Failed to calculate SHA-256", exception);
            }
        }
    }
}