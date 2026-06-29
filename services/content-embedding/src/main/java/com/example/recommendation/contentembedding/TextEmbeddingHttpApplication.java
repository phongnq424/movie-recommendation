package com.example.recommendation.contentembedding;

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
import com.google.gson.Gson;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Properties;
import java.util.concurrent.Executors;

public class TextEmbeddingHttpApplication {

    private static final Gson GSON = new Gson();

    public static void main(String[] args) throws Exception {
        TextEmbeddingHttpConfig config = TextEmbeddingHttpConfig.load(args);

        System.out.println("Starting text embedding HTTP service.");
        System.out.println("Port       : " + config.port());
        System.out.println("Model name : " + config.modelName());
        System.out.println("Model url  : " + config.modelUrl());
        System.out.println("Model path : " + config.modelPath());
        System.out.println("Dimension  : " + config.dimension());

        try (DjlSentenceEmbeddingModel embeddingModel = new DjlSentenceEmbeddingModel(config)) {
            HttpServer server = HttpServer.create(new InetSocketAddress(config.port()), 0);

            server.createContext("/health", exchange -> {
                if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
                    writeJson(exchange, 405, new ErrorResponse("Method not allowed"));
                    return;
                }

                writeJson(exchange, 200, new HealthResponse(true));
            });

            server.createContext("/api/embeddings/text", exchange -> handleEmbedText(exchange, config, embeddingModel));

            server.setExecutor(Executors.newFixedThreadPool(config.threadCount()));
            server.start();

            System.out.println("Text embedding HTTP service started.");
            Thread.currentThread().join();
        }
    }

    private static void handleEmbedText(
            HttpExchange exchange,
            TextEmbeddingHttpConfig config,
            DjlSentenceEmbeddingModel embeddingModel) throws IOException {
        if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
            writeJson(exchange, 405, new ErrorResponse("Method not allowed"));
            return;
        }

        try (InputStreamReader reader = new InputStreamReader(exchange.getRequestBody(), StandardCharsets.UTF_8)) {
            EmbeddingRequest request = GSON.fromJson(reader, EmbeddingRequest.class);

            if (request == null || request.text() == null || request.text().isBlank()) {
                writeJson(exchange, 400, new ErrorResponse("Text is required"));
                return;
            }

            List<Double> embedding = embeddingModel.embedOne(request.text().trim());

            writeJson(exchange, 200, new EmbeddingResponse(
                    config.modelName(),
                    config.dimension(),
                    embedding));
        } catch (Exception exception) {
            exception.printStackTrace();
            writeJson(exchange, 500, new ErrorResponse(exception.getMessage()));
        }
    }

    private static void writeJson(HttpExchange exchange, int status, Object body) throws IOException {
        byte[] bytes = GSON.toJson(body).getBytes(StandardCharsets.UTF_8);

        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
        exchange.sendResponseHeaders(status, bytes.length);

        try (OutputStream outputStream = exchange.getResponseBody()) {
            outputStream.write(bytes);
        }
    }

    private record HealthResponse(
            boolean ok) {
    }

    private record ErrorResponse(
            String message) {
    }

    private record EmbeddingRequest(
            String text) {
    }

    private record EmbeddingResponse(
            String modelName,
            int dimension,
            List<Double> embedding) {
    }

    private record TextEmbeddingHttpConfig(
            int port,
            int threadCount,
            String modelName,
            String modelUrl,
            String modelPath,
            String tokenizer,
            int dimension,
            boolean includeTokenTypes,
            boolean int32,
            String poolingMode) {
        private static TextEmbeddingHttpConfig load(String[] args) throws IOException {
            Properties env = loadEnvironment();
            Properties cli = parseArgs(args);

            return new TextEmbeddingHttpConfig(
                    Integer.parseInt(get(env, cli, "CONTENT_EMBEDDING_HTTP_PORT", "8081")),
                    Integer.parseInt(get(env, cli, "CONTENT_EMBEDDING_HTTP_THREADS", "4")),
                    get(env, cli, "CONTENT_EMBEDDING_MODEL_NAME", "sentence-transformers/all-MiniLM-L6-v2"),
                    get(env, cli, "CONTENT_EMBEDDING_MODEL_URL",
                            "https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2/resolve/main/onnx/model.onnx"),
                    blankToNull(get(env, cli, "CONTENT_EMBEDDING_MODEL_PATH", null)),
                    get(env, cli, "CONTENT_EMBEDDING_TOKENIZER", "sentence-transformers/all-MiniLM-L6-v2"),
                    Integer.parseInt(get(env, cli, "CONTENT_EMBEDDING_DIMENSION", "384")),
                    Boolean.parseBoolean(get(env, cli, "CONTENT_EMBEDDING_INCLUDE_TOKEN_TYPES", "true")),
                    Boolean.parseBoolean(get(env, cli, "CONTENT_EMBEDDING_INT32", "false")),
                    get(env, cli, "CONTENT_EMBEDDING_POOLING_MODE", "mean"));
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

    private static final class DjlSentenceEmbeddingModel implements AutoCloseable {

        private final TextEmbeddingHttpConfig config;
        private final ZooModel<String, float[]> model;
        private final Predictor<String, float[]> predictor;

        private DjlSentenceEmbeddingModel(TextEmbeddingHttpConfig config)
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

        private static HuggingFaceTokenizer createTokenizer(TextEmbeddingHttpConfig config) throws IOException {
            if (config.modelPath() != null) {
                return HuggingFaceTokenizer.newInstance(Path.of(config.modelPath()));
            }

            return HuggingFaceTokenizer.newInstance(config.tokenizer());
        }

        private synchronized List<Double> embedOne(String text) throws TranslateException {
            float[] vector = predictor.predict(text);

            if (vector.length != config.dimension()) {
                throw new IllegalStateException(
                        "Unexpected embedding dimension: "
                                + vector.length
                                + ". Expected: "
                                + config.dimension());
            }

            float[] normalized = normalize(vector);
            List<Double> result = new ArrayList<>(normalized.length);

            for (float value : normalized) {
                result.add((double) value);
            }

            return result;
        }

        private float[] normalize(float[] vector) {
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

        @Override
        public void close() {
            predictor.close();
            model.close();
        }
    }
}