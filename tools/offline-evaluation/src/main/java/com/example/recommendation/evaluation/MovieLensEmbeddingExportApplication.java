package com.example.recommendation.evaluation;

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

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Year;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Properties;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class MovieLensEmbeddingExportApplication {

    private static final Pattern MOVIELENS_YEAR_PATTERN = Pattern.compile("\\((\\d{4})\\)\\s*$");

    public static void main(String[] args) throws Exception {
        EmbeddingExportConfig config = EmbeddingExportConfig.load(args);

        requireFile(config.metadataPath());

        System.out.println("Starting MovieLens semantic embedding export job.");
        System.out.println("Metadata path : " + config.metadataPath());
        System.out.println("Output path   : " + config.outputPath());
        System.out.println("Model name    : " + config.modelName());
        System.out.println("Model url     : " + config.modelUrl());
        System.out.println("Model path    : " + config.modelPath());
        System.out.println("Tokenizer     : " + config.tokenizer());
        System.out.println("Dimension     : " + config.dimension());
        System.out.println("Batch size    : " + config.batchSize());
        System.out.println("Limit         : " + config.limit());
        System.out.println("Force         : " + config.force());

        List<EnrichedMovieRow> movies = readMetadata(config.metadataPath());
        System.out.println("Metadata rows loaded: " + movies.size());

        Set<Integer> alreadyExported = config.force()
                ? Set.of()
                : readExistingMovieIds(config.outputPath());

        if (!alreadyExported.isEmpty()) {
            System.out.println("Existing embeddings found: " + alreadyExported.size());
        }

        Files.createDirectories(config.outputPath().getParent());

        boolean outputExists = Files.exists(config.outputPath()) && !config.force();

        try (
                SentenceEmbeddingModel embeddingModel = new DjlSentenceEmbeddingModel(config);
                BufferedWriter writer = Files.newBufferedWriter(
                        config.outputPath(),
                        StandardCharsets.UTF_8,
                        outputExists
                                ? java.nio.file.StandardOpenOption.APPEND
                                : java.nio.file.StandardOpenOption.CREATE,
                        outputExists
                                ? java.nio.file.StandardOpenOption.APPEND
                                : java.nio.file.StandardOpenOption.TRUNCATE_EXISTING)) {
            if (!outputExists) {
                writer.write("movieId,embedding");
                writer.newLine();
                writer.flush();
            }

            List<EnrichedMovieRow> batch = new ArrayList<>();
            long scanned = 0;
            long skipped = 0;
            long embedded = 0;

            for (EnrichedMovieRow movie : movies) {
                if (config.limit() > 0 && embedded >= config.limit()) {
                    break;
                }

                scanned++;

                if (alreadyExported.contains(movie.movieId())) {
                    skipped++;
                    continue;
                }

                if (movie.embeddingText().isBlank()) {
                    skipped++;
                    continue;
                }

                batch.add(movie);

                if (batch.size() >= config.batchSize()) {
                    embedded += embedAndWriteBatch(embeddingModel, writer, batch, embedded);
                    batch.clear();

                    System.out.println("Progress scanned=" + scanned
                            + ", embedded=" + embedded
                            + ", skipped=" + skipped);
                }
            }

            if (!batch.isEmpty()) {
                embedded += embedAndWriteBatch(embeddingModel, writer, batch, embedded);
                batch.clear();
            }

            writer.flush();

            System.out.println("Embedding export completed. scanned=" + scanned
                    + ", embedded=" + embedded
                    + ", skipped=" + skipped
                    + ", output=" + config.outputPath());
        }
    }

    private static long embedAndWriteBatch(
            SentenceEmbeddingModel embeddingModel,
            BufferedWriter writer,
            List<EnrichedMovieRow> batch,
            long embeddedBefore) throws TranslateException, IOException {
        List<String> texts = batch.stream()
                .map(EnrichedMovieRow::embeddingText)
                .toList();

        List<float[]> vectors = embeddingModel.embed(texts);

        if (vectors.size() != batch.size()) {
            throw new IllegalStateException("Embedding output size mismatch. input="
                    + batch.size() + ", output=" + vectors.size());
        }

        for (int i = 0; i < batch.size(); i++) {
            EnrichedMovieRow movie = batch.get(i);
            float[] vector = vectors.get(i);

            writer.write(String.valueOf(movie.movieId()));
            writer.write(",");
            writer.write("\"");
            writer.write(VectorUtils.toVectorText(vector));
            writer.write("\"");
            writer.newLine();
        }

        writer.flush();

        System.out.println("Embedded batch size=" + batch.size()
                + ", totalEmbedded=" + (embeddedBefore + batch.size()));

        return batch.size();
    }

    private static List<EnrichedMovieRow> readMetadata(Path metadataPath) throws IOException {
        List<EnrichedMovieRow> result = new ArrayList<>();

        try (BufferedReader reader = Files.newBufferedReader(metadataPath, StandardCharsets.UTF_8)) {
            String headerLine = reader.readLine();

            if (headerLine == null || headerLine.isBlank()) {
                return result;
            }

            List<String> headers = parseCsvLine(headerLine);
            Map<String, Integer> indexByHeader = new HashMap<>();

            for (int i = 0; i < headers.size(); i++) {
                indexByHeader.put(headers.get(i), i);
            }

            requireColumn(indexByHeader, "movieId");

            String line;

            while ((line = reader.readLine()) != null) {
                if (line.isBlank()) {
                    continue;
                }

                List<String> columns = parseCsvLine(line);

                Integer movieId = parseInteger(get(columns, indexByHeader, "movieId"));

                if (movieId == null) {
                    continue;
                }

                String movielensTitle = get(columns, indexByHeader, "movielensTitle");
                String movielensGenres = get(columns, indexByHeader, "movielensGenres");
                String tmdbTitle = get(columns, indexByHeader, "tmdbTitle");
                String tmdbOriginalTitle = get(columns, indexByHeader, "tmdbOriginalTitle");
                String overview = get(columns, indexByHeader, "overview");
                String tmdbGenres = get(columns, indexByHeader, "tmdbGenres");
                String topCast = get(columns, indexByHeader, "topCast");
                String releaseDate = get(columns, indexByHeader, "releaseDate");
                String status = get(columns, indexByHeader, "status");

                String title = firstNonBlank(tmdbTitle, cleanMovieLensTitle(movielensTitle));
                String originalTitle = firstNonBlank(tmdbOriginalTitle, "");
                String description = firstNonBlank(overview, "");
                Integer releaseYear = parseReleaseYear(releaseDate, movielensTitle);
                String genres = normalizeListText(firstNonBlank(tmdbGenres, movielensGenres));
                String mainCast = normalizeListText(topCast);

                String embeddingText = MovieSemanticTextBuilder.build(
                        title,
                        originalTitle,
                        description,
                        releaseYear,
                        genres,
                        mainCast);

                result.add(new EnrichedMovieRow(
                        movieId,
                        status,
                        embeddingText));
            }
        }

        return result;
    }

    private static Set<Integer> readExistingMovieIds(Path outputPath) throws IOException {
        if (!Files.exists(outputPath)) {
            return Set.of();
        }

        Set<Integer> result = new HashSet<>();

        try (BufferedReader reader = Files.newBufferedReader(outputPath, StandardCharsets.UTF_8)) {
            String header = reader.readLine();

            if (header == null) {
                return result;
            }

            String line;

            while ((line = reader.readLine()) != null) {
                if (line.isBlank()) {
                    continue;
                }

                int commaIndex = line.indexOf(',');

                if (commaIndex <= 0) {
                    continue;
                }

                Integer movieId = parseInteger(line.substring(0, commaIndex));

                if (movieId != null) {
                    result.add(movieId);
                }
            }
        }

        return result;
    }

    private static void requireColumn(Map<String, Integer> indexByHeader, String column) {
        if (!indexByHeader.containsKey(column)) {
            throw new IllegalArgumentException("Required column not found in metadata CSV: " + column);
        }
    }

    private static String get(List<String> columns, Map<String, Integer> indexByHeader, String column) {
        Integer index = indexByHeader.get(column);

        if (index == null || index < 0 || index >= columns.size()) {
            return "";
        }

        return Objects.toString(columns.get(index), "").trim();
    }

    private static List<String> parseCsvLine(String line) {
        List<String> result = new ArrayList<>();

        if (line == null) {
            return result;
        }

        StringBuilder current = new StringBuilder();
        boolean inQuotes = false;

        for (int i = 0; i < line.length(); i++) {
            char currentChar = line.charAt(i);

            if (currentChar == '"') {
                if (inQuotes && i + 1 < line.length() && line.charAt(i + 1) == '"') {
                    current.append('"');
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (currentChar == ',' && !inQuotes) {
                result.add(current.toString());
                current.setLength(0);
            } else {
                current.append(currentChar);
            }
        }

        result.add(current.toString());

        return result;
    }

    private static Integer parseInteger(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        try {
            return Integer.parseInt(value.trim());
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private static Integer parseReleaseYear(String releaseDate, String movielensTitle) {
        if (releaseDate != null && releaseDate.length() >= 4) {
            String yearText = releaseDate.substring(0, 4);

            try {
                return Integer.parseInt(yearText);
            } catch (NumberFormatException ignored) {
                // fallback below
            }
        }

        if (movielensTitle == null) {
            return null;
        }

        Matcher matcher = MOVIELENS_YEAR_PATTERN.matcher(movielensTitle);

        if (!matcher.find()) {
            return null;
        }

        try {
            return Integer.parseInt(matcher.group(1));
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private static String cleanMovieLensTitle(String title) {
        if (title == null || title.isBlank()) {
            return "";
        }

        return MOVIELENS_YEAR_PATTERN.matcher(title).replaceAll("").trim();
    }

    private static String normalizeListText(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }

        return value
                .replace("|", ", ")
                .replaceAll("\\s*,\\s*", ", ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private static String firstNonBlank(String first, String second) {
        if (first != null && !first.isBlank()) {
            return first.trim();
        }

        if (second != null && !second.isBlank()) {
            return second.trim();
        }

        return "";
    }

    private static void requireFile(Path path) {
        if (!Files.exists(path)) {
            throw new IllegalArgumentException("Required file not found: " + path);
        }
    }

    private record EnrichedMovieRow(
            int movieId,
            String status,
            String embeddingText) {
    }

    private record EmbeddingExportConfig(
            Path metadataPath,
            Path outputPath,
            String modelName,
            String modelUrl,
            String modelPath,
            String tokenizer,
            int dimension,
            int batchSize,
            int limit,
            boolean force,
            boolean includeTokenTypes,
            boolean int32,
            String poolingMode) {
        private static EmbeddingExportConfig load(String[] args) {
            Properties cli = parseArgs(args);

            return new EmbeddingExportConfig(
                    Path.of(get(cli, "metadataPath", "../datasets/ml-32m/movie_metadata_enriched.csv")),
                    Path.of(get(cli, "outputPath", "../datasets/ml-32m/movie_embeddings.csv")),
                    get(cli, "modelName", "sentence-transformers/all-MiniLM-L6-v2"),
                    get(cli, "modelUrl",
                            "https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2/resolve/main/onnx/model.onnx"),
                    blankToNull(get(cli, "modelPath", null)),
                    get(cli, "tokenizer", "sentence-transformers/all-MiniLM-L6-v2"),
                    Integer.parseInt(get(cli, "dimension", "384")),
                    Integer.parseInt(get(cli, "batchSize", "32")),
                    Integer.parseInt(get(cli, "limit", "0")),
                    Boolean.parseBoolean(get(cli, "force", "false")),
                    Boolean.parseBoolean(get(cli, "includeTokenTypes", "true")),
                    Boolean.parseBoolean(get(cli, "int32", "false")),
                    get(cli, "poolingMode", "mean"));
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

        private static String get(Properties cli, String key, String defaultValue) {
            String value = cli.getProperty(key);

            if (value != null && !value.isBlank()) {
                return value;
            }

            return defaultValue;
        }

        private static String blankToNull(String value) {
            if (value == null || value.isBlank()) {
                return null;
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
        private final EmbeddingExportConfig config;
        private final ZooModel<String, float[]> model;
        private final Predictor<String, float[]> predictor;

        private DjlSentenceEmbeddingModel(EmbeddingExportConfig config)
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

        private static HuggingFaceTokenizer createTokenizer(EmbeddingExportConfig config) throws IOException {
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

    private static final class MovieSemanticTextBuilder {
        private MovieSemanticTextBuilder() {
        }

        private static String build(
                String title,
                String originalTitle,
                String description,
                Integer releaseYear,
                String genres,
                String mainCast) {
            StringBuilder builder = new StringBuilder();

            appendLine(builder, "Title", title);
            appendLine(builder, "Original title", originalTitle);

            if (releaseYear != null) {
                appendLine(builder, "Release year", String.valueOf(releaseYear));
            }

            appendLine(builder, "Genres", genres);
            appendLine(builder, "Main cast", mainCast);
            appendLine(builder, "Description", description);

            return normalizeWhitespace(builder.toString());
        }

        private static void appendLine(StringBuilder builder, String label, String value) {
            if (value == null || value.isBlank()) {
                return;
            }

            builder.append(label)
                    .append(": ")
                    .append(value.trim())
                    .append('.')
                    .append('\n');
        }

        private static String normalizeWhitespace(String value) {
            if (value == null) {
                return "";
            }

            return value.replaceAll("\\s+", " ").trim();
        }
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

        private static String toVectorText(float[] vector) {
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
                java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
                byte[] hash = digest.digest(Objects.toString(value, "").getBytes(StandardCharsets.UTF_8));
                return HexFormat.of().formatHex(hash);
            } catch (Exception exception) {
                throw new IllegalStateException("Failed to calculate SHA-256", exception);
            }
        }
    }
}