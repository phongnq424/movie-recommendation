package com.example.recommendation.evaluation;

import com.example.recommendation.core.model.RecommendationItem;
import com.example.recommendation.core.model.ScoringContext;
import com.example.recommendation.core.model.ScoringMovie;
import com.example.recommendation.core.ranking.RecommendationRanker;
import com.example.recommendation.core.rerank.GenreDiversityReRanker;
import com.example.recommendation.core.weight.RecommendationWeightResolver;
import com.example.recommendation.core.weight.RecommendationWeights;
import org.apache.spark.ml.recommendation.ALS;
import org.apache.spark.ml.recommendation.ALSModel;
import org.apache.spark.sql.Dataset;
import org.apache.spark.sql.Row;
import org.apache.spark.sql.SparkSession;
import org.apache.spark.sql.expressions.Window;
import org.apache.spark.sql.expressions.WindowSpec;

import java.io.BufferedWriter;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Year;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static org.apache.spark.sql.functions.avg;
import static org.apache.spark.sql.functions.coalesce;
import static org.apache.spark.sql.functions.col;
import static org.apache.spark.sql.functions.count;
import static org.apache.spark.sql.functions.floor;
import static org.apache.spark.sql.functions.lit;
import static org.apache.spark.sql.functions.max;
import static org.apache.spark.sql.functions.row_number;

public class OfflineEvaluationApplication {

    private static final String RATINGS_FILE = "ratings.csv";
    private static final String MOVIES_FILE = "movies.csv";
    private static final String MOVIE_EMBEDDINGS_FILE = "movie_embeddings.csv";
    private static final Pattern YEAR_PATTERN = Pattern.compile("\\((\\d{4})\\)\\s*$");

    public static void main(String[] args) throws Exception {
        EvaluationConfig config = EvaluationConfig.fromArgs(args);
        Files.createDirectories(config.outputDir());

        SparkSession spark = SparkSession.builder()
                .appName("MovieRecommendationOfflineEvaluation")
                .master(config.sparkMaster())
                .config("spark.ui.enabled", String.valueOf(config.sparkUiEnabled()))
                .config("spark.sql.shuffle.partitions", String.valueOf(config.shufflePartitions()))
                .config("spark.driver.host", "127.0.0.1")
                .getOrCreate();

        try {
            new EvaluationRunner(config, spark).run();
        } finally {
            spark.stop();
        }
    }

    private static final class EvaluationRunner {
        private final EvaluationConfig config;
        private final SparkSession spark;
        private final RecommendationRanker ranker = new RecommendationRanker();
        private final RecommendationWeightResolver weightResolver = new RecommendationWeightResolver();
        private final GenreDiversityReRanker reRanker = new GenreDiversityReRanker();
        private final Map<String, Integer> genreNameToId = new HashMap<>();

        private EvaluationRunner(EvaluationConfig config, SparkSession spark) {
            this.config = config;
            this.spark = spark;
        }

        private void run() throws IOException {
            Path ratingsPath = config.dataDir().resolve(RATINGS_FILE);
            Path moviesPath = config.dataDir().resolve(MOVIES_FILE);

            requireFile(ratingsPath);
            requireFile(moviesPath);

            System.out.println("Reading MovieLens data from: " + config.dataDir());

            Dataset<Row> rawRatings = readRatings(ratingsPath);
            Dataset<Row> ratings = filterEligibleUsers(rawRatings);
            Dataset<Row> movies = readMovies(moviesPath);

            TrainTestSplit split = temporalSplit(ratings);
            Dataset<Row> train = split.train().cache();
            Dataset<Row> test = split.test().cache();

            long trainRows = train.count();
            long testRows = test.count();

            if (trainRows == 0 || testRows == 0) {
                throw new IllegalStateException("Train/test split is empty. Check minRatingsPerUser and data path.");
            }

            System.out.println("Train rows: " + trainRows);
            System.out.println("Test rows : " + testRows);

            Dataset<Row> testPositive = test
                    .filter(col("rating").geq(config.positiveRatingThreshold()))
                    .select(col("userId"), col("movieId"), col("rating"));

            Dataset<Row> evalUsers = testPositive
                    .select(col("userId"))
                    .distinct()
                    .limit(config.maxUsers())
                    .cache();

            long evalUserCount = evalUsers.count();

            if (evalUserCount == 0) {
                throw new IllegalStateException("No evaluation users with positive test items.");
            }

            System.out.println("Evaluation users: " + evalUserCount);

            System.out.println("Collecting movie metadata and train statistics...");
            Map<Integer, MovieFeature> movieFeatures = collectMovieFeatures(movies, train);
            Map<String, Integer> genreVocabulary = buildGenreVocabulary(movieFeatures.values());

            genreNameToId.clear();
            genreNameToId.putAll(genreVocabulary);

            Map<Long, Double> genreIdfScores = buildGenreIdf(movieFeatures.values(), genreVocabulary);
            Map<Long, List<Integer>> movieIdsByGenre = buildMovieIdsByGenre(movieFeatures.values());
            List<Integer> globalPopularMovies = collectGlobalPopularMovies(movieFeatures);

            System.out.println("Collecting evaluation user train/test data...");
            Map<Integer, List<UserRating>> trainRatingsByUser = collectRatingsByEvalUser(train, evalUsers);
            Map<Integer, Set<Integer>> trainMovieIdsByUser = toMovieIdSet(trainRatingsByUser);
            Map<Integer, Set<Integer>> testPositiveByUser = collectPositiveTestItems(testPositive, evalUsers);

            System.out.println("Training ALS model for offline evaluation...");
            ALSModel alsModel = trainAls(train);

            System.out.println("Generating ALS candidates...");
            Map<Integer, List<ScoredCandidate>> alsCandidatesByUser = generateAlsCandidates(alsModel, evalUsers);

            Map<Integer, List<ScoredCandidate>> semanticCandidatesByUser = Map.of();

            if (config.enableSemanticVariants()) {
                Path embeddingPath = config.embeddingPath() == null
                        ? config.dataDir().resolve(MOVIE_EMBEDDINGS_FILE)
                        : config.embeddingPath();

                requireFile(embeddingPath);

                System.out.println("Reading movie semantic embeddings from: " + embeddingPath);
                Map<Integer, double[]> movieEmbeddings = readMovieEmbeddings(embeddingPath);

                System.out.println("Loaded movie embeddings: " + movieEmbeddings.size());

                System.out.println("Generating semantic candidates...");
                semanticCandidatesByUser = generateSemanticCandidates(
                        trainRatingsByUser,
                        trainMovieIdsByUser,
                        movieEmbeddings,
                        movieFeatures);
            }

            System.out.println("Writing candidate recall diagnostics...");
            CandidateRecallDiagnostics candidateRecallDiagnostics = calculateCandidateRecallDiagnostics(
                    testPositiveByUser,
                    trainMovieIdsByUser,
                    alsCandidatesByUser,
                    semanticCandidatesByUser,
                    globalPopularMovies,
                    movieFeatures);

            writeCandidateRecallDiagnostics(
                    candidateRecallDiagnostics,
                    config.outputDir().resolve("candidate_recall_diagnostics.csv"));

            System.out.println("Candidate recall diagnostics completed. Output: "
                    + config.outputDir().resolve("candidate_recall_diagnostics.csv"));

            System.out.println("Running pipeline variants with recommendation-core ranker/reranker...");

            List<PipelineVariant> variants = new ArrayList<>(List.of(
                    PipelineVariant.POPULARITY,
                    PipelineVariant.CONTENT_BASED,
                    PipelineVariant.ALS_ONLY,
                    PipelineVariant.ALS_HYBRID_RANKING,
                    PipelineVariant.ALS_HYBRID_RANKING_RERANK));

            if (config.enableSemanticVariants()) {
                variants.add(PipelineVariant.SEMANTIC_CONTENT);
                variants.add(PipelineVariant.ALS_SEMANTIC_HYBRID_RANKING);
                variants.add(PipelineVariant.ALS_SEMANTIC_HYBRID_RANKING_RERANK);
            }

            List<VariantMetricSummary> summaries = new ArrayList<>();

            for (PipelineVariant variant : variants) {
                System.out.println("Evaluating variant: " + variant);

                MetricAccumulator accumulator = new MetricAccumulator(config.k(), movieFeatures.keySet().size());

                for (Integer userId : testPositiveByUser.keySet()) {
                    Set<Integer> groundTruth = testPositiveByUser.getOrDefault(userId, Set.of());

                    if (groundTruth.isEmpty()) {
                        continue;
                    }

                    List<UserRating> trainHistory = trainRatingsByUser.getOrDefault(userId, List.of());
                    Set<Integer> alreadySeen = trainMovieIdsByUser.getOrDefault(userId, Set.of());

                    UserProfile profile = buildUserProfile(
                            trainHistory,
                            movieFeatures,
                            genreVocabulary,
                            genreIdfScores);

                    List<RecommendationItem> recommendations = recommendForUser(
                            variant,
                            profile,
                            alreadySeen,
                            alsCandidatesByUser.getOrDefault(userId, List.of()),
                            semanticCandidatesByUser.getOrDefault(userId, List.of()),
                            globalPopularMovies,
                            movieIdsByGenre,
                            movieFeatures,
                            genreIdfScores);

                    accumulator.add(recommendations, groundTruth, movieFeatures);
                }

                summaries.add(accumulator.toSummary(variant));
            }

            writeSummary(summaries, config.outputDir().resolve("summary.csv"));
            System.out.println("Evaluation completed. Summary: " + config.outputDir().resolve("summary.csv"));
        }

        private Dataset<Row> readRatings(Path ratingsPath) {
            return spark.read()
                    .option("header", "true")
                    .option("inferSchema", "true")
                    .csv(ratingsPath.toString())
                    .select(
                            col("userId").cast("int").as("userId"),
                            col("movieId").cast("int").as("movieId"),
                            col("rating").cast("double").as("rating"),
                            col("timestamp").cast("long").as("timestamp"))
                    .filter(col("userId").isNotNull())
                    .filter(col("movieId").isNotNull())
                    .filter(col("rating").gt(0));
        }

        private Dataset<Row> readMovies(Path moviesPath) {
            return spark.read()
                    .option("header", "true")
                    .option("inferSchema", "false")
                    .csv(moviesPath.toString())
                    .select(
                            col("movieId").cast("int").as("movieId"),
                            col("title").cast("string").as("title"),
                            col("genres").cast("string").as("genres"))
                    .filter(col("movieId").isNotNull());
        }

        private Dataset<Row> filterEligibleUsers(Dataset<Row> ratings) {
            Dataset<Row> eligibleUsers = ratings
                    .groupBy(col("userId"))
                    .agg(count(lit(1)).as("ratingCount"))
                    .filter(col("ratingCount").geq(config.minRatingsPerUser()))
                    .select(col("userId"));

            return ratings.join(eligibleUsers, "userId");
        }

        private TrainTestSplit temporalSplit(Dataset<Row> ratings) {
            WindowSpec byUserTime = Window
                    .partitionBy(col("userId"))
                    .orderBy(col("timestamp").asc(), col("movieId").asc());

            WindowSpec byUser = Window.partitionBy(col("userId"));

            Dataset<Row> withIndex = ratings
                    .withColumn("rn", row_number().over(byUserTime))
                    .withColumn("cnt", count(lit(1)).over(byUser))
                    .withColumn("cutoff", floor(col("cnt").multiply(lit(config.trainRatio()))));

            Dataset<Row> train = withIndex
                    .filter(col("rn").leq(col("cutoff")))
                    .select(col("userId"), col("movieId"), col("rating"), col("timestamp"));

            Dataset<Row> test = withIndex
                    .filter(col("rn").gt(col("cutoff")))
                    .select(col("userId"), col("movieId"), col("rating"), col("timestamp"));

            return new TrainTestSplit(train, test);
        }

        private ALSModel trainAls(Dataset<Row> train) {
            Dataset<Row> trainingData = train
                    .groupBy(col("userId"), col("movieId"))
                    .agg(max(col("rating")).as("strength"))
                    .select(
                            col("userId").cast("int").as("userId"),
                            col("movieId").cast("int").as("movieId"),
                            col("strength").cast("float").as("strength"));

            ALS als = new ALS()
                    .setUserCol("userId")
                    .setItemCol("movieId")
                    .setRatingCol("strength")
                    .setImplicitPrefs(config.alsImplicitPrefs())
                    .setRank(config.alsRank())
                    .setMaxIter(config.alsMaxIter())
                    .setRegParam(config.alsRegParam())
                    .setColdStartStrategy("drop");

            if (config.alsImplicitPrefs()) {
                als.setAlpha(config.alsAlpha());
            }

            return als.fit(trainingData);
        }

        private Map<Integer, MovieFeature> collectMovieFeatures(Dataset<Row> movies, Dataset<Row> train) {
            Dataset<Row> stats = train
                    .groupBy(col("movieId"))
                    .agg(
                            avg(col("rating")).as("averageRating"),
                            count(lit(1)).as("ratingCount"));

            Dataset<Row> joined = movies.join(stats, "movieId", "left")
                    .select(
                            col("movieId"),
                            col("title"),
                            col("genres"),
                            coalesce(col("averageRating"), lit(0.0)).as("averageRating"),
                            coalesce(col("ratingCount"), lit(0L)).as("ratingCount"));

            Map<Integer, MovieFeature> result = new HashMap<>();

            for (Row row : joined.collectAsList()) {
                int movieId = row.getInt(row.fieldIndex("movieId"));
                String title = stringValue(row, "title", "");
                String genres = stringValue(row, "genres", "");
                double averageRating = doubleValue(row, "averageRating", 0.0);
                long ratingCount = longValue(row, "ratingCount", 0L);

                result.put(movieId, new MovieFeature(
                        movieId,
                        title,
                        parseReleaseYear(title),
                        parseGenres(genres),
                        averageRating,
                        ratingCount));
            }

            return result;
        }

        private Map<String, Integer> buildGenreVocabulary(Collection<MovieFeature> movies) {
            Map<String, Integer> vocab = new LinkedHashMap<>();

            for (MovieFeature movie : movies) {
                for (String genre : movie.genres()) {
                    if (!genre.isBlank() && !"(no genres listed)".equalsIgnoreCase(genre)) {
                        vocab.computeIfAbsent(genre, key -> vocab.size() + 1);
                    }
                }
            }

            return vocab;
        }

        private Map<Long, Double> buildGenreIdf(
                Collection<MovieFeature> movies,
                Map<String, Integer> genreVocabulary) {
            Map<Long, Long> movieCountByGenre = new HashMap<>();
            long totalMovies = movies.stream()
                    .filter(movie -> !movie.genres().isEmpty())
                    .count();

            for (MovieFeature movie : movies) {
                Set<Long> seenGenres = new HashSet<>();

                for (String genre : movie.genres()) {
                    Integer genreId = genreVocabulary.get(genre);

                    if (genreId != null) {
                        seenGenres.add(genreId.longValue());
                    }
                }

                for (Long genreId : seenGenres) {
                    movieCountByGenre.merge(genreId, 1L, Long::sum);
                }
            }

            Map<Long, Double> idf = new HashMap<>();

            for (Integer genreId : genreVocabulary.values()) {
                long count = movieCountByGenre.getOrDefault(genreId.longValue(), 0L);
                idf.put(genreId.longValue(), Math.log((totalMovies + 1.0) / (count + 1.0)) + 1.0);
            }

            return idf;
        }

        private Map<Long, List<Integer>> buildMovieIdsByGenre(Collection<MovieFeature> movies) {
            Map<Long, List<Integer>> result = new HashMap<>();

            for (MovieFeature movie : movies) {
                if (movie == null || movie.movieId() == null) {
                    continue;
                }

                for (Long genreId : genreIdsOf(movie)) {
                    result.computeIfAbsent(genreId, key -> new ArrayList<>())
                            .add(movie.movieId());
                }
            }

            return result;
        }

        private List<Integer> collectGlobalPopularMovies(Map<Integer, MovieFeature> movieFeatures) {
            return movieFeatures.values()
                    .stream()
                    .filter(movie -> movie.ratingCount() >= config.minMovieRatingCount())
                    .sorted(Comparator
                            .comparingLong(MovieFeature::ratingCount).reversed()
                            .thenComparing(Comparator.comparingDouble(MovieFeature::averageRating).reversed()))
                    .map(MovieFeature::movieId)
                    .limit(config.popularityPoolSize())
                    .toList();
        }

        private Map<Integer, List<UserRating>> collectRatingsByEvalUser(
                Dataset<Row> train,
                Dataset<Row> evalUsers) {
            Dataset<Row> rows = train
                    .join(evalUsers, "userId")
                    .select(col("userId"), col("movieId"), col("rating"), col("timestamp"));

            Map<Integer, List<UserRating>> result = new HashMap<>();

            for (Row row : rows.collectAsList()) {
                int userId = row.getInt(row.fieldIndex("userId"));
                int movieId = row.getInt(row.fieldIndex("movieId"));
                double rating = row.getDouble(row.fieldIndex("rating"));
                long timestamp = row.getLong(row.fieldIndex("timestamp"));

                result.computeIfAbsent(userId, key -> new ArrayList<>())
                        .add(new UserRating(userId, movieId, rating, timestamp));
            }

            return result;
        }

        private Map<Integer, Set<Integer>> collectPositiveTestItems(
                Dataset<Row> testPositive,
                Dataset<Row> evalUsers) {
            Dataset<Row> rows = testPositive
                    .join(evalUsers, "userId")
                    .select(col("userId"), col("movieId"));

            Map<Integer, Set<Integer>> result = new HashMap<>();

            for (Row row : rows.collectAsList()) {
                int userId = row.getInt(row.fieldIndex("userId"));
                int movieId = row.getInt(row.fieldIndex("movieId"));

                result.computeIfAbsent(userId, key -> new HashSet<>()).add(movieId);
            }

            return result;
        }

        private Map<Integer, List<ScoredCandidate>> generateAlsCandidates(
                ALSModel model,
                Dataset<Row> evalUsers) {
            Dataset<Row> recommendations = model.recommendForUserSubset(evalUsers, config.candidateSize());

            Map<Integer, List<ScoredCandidate>> result = new HashMap<>();

            for (Row userRow : recommendations.collectAsList()) {
                int userId = userRow.getInt(userRow.fieldIndex("userId"));
                List<Row> recRows = userRow.getList(userRow.fieldIndex("recommendations"));

                List<ScoredCandidate> rawCandidates = new ArrayList<>();

                for (Row rec : recRows) {
                    int movieId = rec.getInt(0);
                    double prediction = ((Number) rec.get(1)).doubleValue();

                    rawCandidates.add(new ScoredCandidate(movieId, prediction, "ALS"));
                }

                result.put(userId, normalizeCandidateScores(rawCandidates));
            }

            return result;
        }

        private List<ScoredCandidate> normalizeCandidateScores(List<ScoredCandidate> candidates) {
            if (candidates.isEmpty()) {
                return List.of();
            }

            double min = candidates.stream()
                    .mapToDouble(ScoredCandidate::score)
                    .min()
                    .orElse(0.0);

            double max = candidates.stream()
                    .mapToDouble(ScoredCandidate::score)
                    .max()
                    .orElse(0.0);

            if (Math.abs(max - min) < 1e-9) {
                return candidates.stream()
                        .map(candidate -> new ScoredCandidate(
                                candidate.movieId(),
                                1.0,
                                candidate.source()))
                        .toList();
            }

            return candidates.stream()
                    .map(candidate -> new ScoredCandidate(
                            candidate.movieId(),
                            clamp((candidate.score() - min) / (max - min)),
                            candidate.source()))
                    .toList();
        }

        private List<RecommendationItem> recommendForUser(
                PipelineVariant variant,
                UserProfile profile,
                Set<Integer> alreadySeen,
                List<ScoredCandidate> alsCandidates,
                List<ScoredCandidate> semanticCandidates,
                List<Integer> globalPopularMovies,
                Map<Long, List<Integer>> movieIdsByGenre,
                Map<Integer, MovieFeature> movieFeatures,
                Map<Long, Double> genreIdfScores) {
            return switch (variant) {
                case POPULARITY -> recommendPopularity(
                        alreadySeen,
                        globalPopularMovies,
                        movieFeatures,
                        genreIdfScores);

                case CONTENT_BASED -> recommendContent(
                        profile,
                        alreadySeen,
                        globalPopularMovies,
                        movieIdsByGenre,
                        movieFeatures,
                        genreIdfScores);

                case ALS_ONLY -> recommendAlsOnly(
                        alreadySeen,
                        alsCandidates,
                        movieFeatures,
                        genreIdfScores);

                case SEMANTIC_CONTENT -> recommendSemanticOnly(
                        alreadySeen,
                        semanticCandidates,
                        globalPopularMovies,
                        movieFeatures,
                        genreIdfScores);

                case ALS_HYBRID_RANKING -> recommendHybrid(
                        profile,
                        alreadySeen,
                        alsCandidates,
                        globalPopularMovies,
                        movieFeatures,
                        genreIdfScores,
                        false);

                case ALS_HYBRID_RANKING_RERANK -> recommendHybrid(
                        profile,
                        alreadySeen,
                        alsCandidates,
                        globalPopularMovies,
                        movieFeatures,
                        genreIdfScores,
                        true);

                case ALS_SEMANTIC_HYBRID_RANKING -> recommendHybridWithSemantic(
                        profile,
                        alreadySeen,
                        alsCandidates,
                        semanticCandidates,
                        globalPopularMovies,
                        movieFeatures,
                        genreIdfScores,
                        false);

                case ALS_SEMANTIC_HYBRID_RANKING_RERANK -> recommendHybridWithSemantic(
                        profile,
                        alreadySeen,
                        alsCandidates,
                        semanticCandidates,
                        globalPopularMovies,
                        movieFeatures,
                        genreIdfScores,
                        true);
            };
        }

        private List<RecommendationItem> recommendPopularity(
                Set<Integer> alreadySeen,
                List<Integer> globalPopularMovies,
                Map<Integer, MovieFeature> movieFeatures,
                Map<Long, Double> genreIdfScores) {
            List<ScoredCandidate> candidates = globalPopularMovies.stream()
                    .filter(movieId -> !alreadySeen.contains(movieId))
                    .filter(movieFeatures::containsKey)
                    .map(movieId -> new ScoredCandidate(movieId, 0.0, "POPULARITY"))
                    .limit(config.popularityPoolSize())
                    .toList();

            ScoringContext context = buildContext(
                    UserProfile.empty(),
                    candidates,
                    movieFeatures,
                    genreIdfScores,
                    Map.of(),
                    Map.of(),
                    0,
                    0);

            return rankWithCore(
                    candidates,
                    movieFeatures,
                    context,
                    new RecommendationWeights(0.0, 0.0, 1.0, 0.0, 0.0, "POPULARITY"),
                    config.k());
        }

        private List<RecommendationItem> recommendContent(
                UserProfile profile,
                Set<Integer> alreadySeen,
                List<Integer> globalPopularMovies,
                Map<Long, List<Integer>> movieIdsByGenre,
                Map<Integer, MovieFeature> movieFeatures,
                Map<Long, Double> genreIdfScores) {
            List<ScoredCandidate> candidates = buildContentCandidates(
                    profile,
                    alreadySeen,
                    globalPopularMovies,
                    movieIdsByGenre,
                    movieFeatures);

            ScoringContext context = buildContext(
                    profile,
                    candidates,
                    movieFeatures,
                    genreIdfScores,
                    Map.of(),
                    Map.of(),
                    profile.ratingCount(),
                    0);

            return rankWithCore(
                    candidates,
                    movieFeatures,
                    context,
                    new RecommendationWeights(0.80, 0.0, 0.10, 0.10, 0.0, "CONTENT_BASED"),
                    config.k());
        }

        private List<ScoredCandidate> buildContentCandidates(
                UserProfile profile,
                Set<Integer> alreadySeen,
                List<Integer> globalPopularMovies,
                Map<Long, List<Integer>> movieIdsByGenre,
                Map<Integer, MovieFeature> movieFeatures) {
            if (profile == null || profile.genreWeights() == null || profile.genreWeights().isEmpty()) {
                return globalPopularMovies.stream()
                        .filter(movieId -> !alreadySeen.contains(movieId))
                        .filter(movieFeatures::containsKey)
                        .map(movieId -> new ScoredCandidate(movieId, 0.0, "CONTENT_FALLBACK_POPULAR"))
                        .limit(config.popularityPoolSize())
                        .toList();
            }

            Map<Integer, Double> scoreByMovie = new HashMap<>();

            for (Map.Entry<Long, Double> entry : profile.genreWeights().entrySet()) {
                Long genreId = entry.getKey();
                double userGenreWeight = entry.getValue();

                if (userGenreWeight <= 0.0) {
                    continue;
                }

                List<Integer> movieIds = movieIdsByGenre.getOrDefault(genreId, List.of());

                for (Integer movieId : movieIds) {
                    if (movieId == null || alreadySeen.contains(movieId)) {
                        continue;
                    }

                    MovieFeature movie = movieFeatures.get(movieId);

                    if (movie == null) {
                        continue;
                    }

                    if (movie.ratingCount() < config.minMovieRatingCount()) {
                        continue;
                    }

                    scoreByMovie.merge(movieId, userGenreWeight, Double::sum);
                }
            }

            if (scoreByMovie.isEmpty()) {
                return globalPopularMovies.stream()
                        .filter(movieId -> !alreadySeen.contains(movieId))
                        .filter(movieFeatures::containsKey)
                        .map(movieId -> new ScoredCandidate(movieId, 0.0, "CONTENT_FALLBACK_POPULAR"))
                        .limit(config.popularityPoolSize())
                        .toList();
            }

            return scoreByMovie.entrySet()
                    .stream()
                    .sorted((left, right) -> {
                        int byContentScore = Double.compare(right.getValue(), left.getValue());

                        if (byContentScore != 0) {
                            return byContentScore;
                        }

                        MovieFeature leftMovie = movieFeatures.get(left.getKey());
                        MovieFeature rightMovie = movieFeatures.get(right.getKey());

                        long leftRatingCount = leftMovie == null ? 0L : leftMovie.ratingCount();
                        long rightRatingCount = rightMovie == null ? 0L : rightMovie.ratingCount();

                        int byRatingCount = Long.compare(rightRatingCount, leftRatingCount);

                        if (byRatingCount != 0) {
                            return byRatingCount;
                        }

                        double leftAverageRating = leftMovie == null ? 0.0 : leftMovie.averageRating();
                        double rightAverageRating = rightMovie == null ? 0.0 : rightMovie.averageRating();

                        return Double.compare(rightAverageRating, leftAverageRating);
                    })
                    .limit(config.popularityPoolSize())
                    .map(entry -> new ScoredCandidate(
                            entry.getKey(),
                            clamp(entry.getValue()),
                            "CONTENT_GENRE"))
                    .toList();
        }

        private List<RecommendationItem> recommendAlsOnly(
                Set<Integer> alreadySeen,
                List<ScoredCandidate> alsCandidates,
                Map<Integer, MovieFeature> movieFeatures,
                Map<Long, Double> genreIdfScores) {
            List<ScoredCandidate> candidates = alsCandidates.stream()
                    .filter(candidate -> !alreadySeen.contains(candidate.movieId()))
                    .filter(candidate -> movieFeatures.containsKey(candidate.movieId()))
                    .toList();

            Map<Long, Double> collaborativeScores = candidates.stream()
                    .collect(Collectors.toMap(
                            candidate -> candidate.movieId().longValue(),
                            ScoredCandidate::score,
                            Math::max));

            ScoringContext context = buildContext(
                    UserProfile.empty(),
                    candidates,
                    movieFeatures,
                    genreIdfScores,
                    collaborativeScores,
                    Map.of(),
                    0,
                    0);

            return rankWithCore(
                    candidates,
                    movieFeatures,
                    context,
                    new RecommendationWeights(0.0, 1.0, 0.0, 0.0, 0.0, "ALS_ONLY"),
                    config.k());
        }

        private List<RecommendationItem> recommendSemanticOnly(
                Set<Integer> alreadySeen,
                List<ScoredCandidate> semanticCandidates,
                List<Integer> globalPopularMovies,
                Map<Integer, MovieFeature> movieFeatures,
                Map<Long, Double> genreIdfScores) {
            List<ScoredCandidate> candidates = new ArrayList<>();

            for (ScoredCandidate candidate : semanticCandidates) {
                if (alreadySeen.contains(candidate.movieId()) || !movieFeatures.containsKey(candidate.movieId())) {
                    continue;
                }

                candidates.add(candidate);

                if (candidates.size() >= config.candidateSize()) {
                    break;
                }
            }

            if (candidates.size() < config.candidateSize()) {
                for (Integer movieId : globalPopularMovies) {
                    if (alreadySeen.contains(movieId) || !movieFeatures.containsKey(movieId)) {
                        continue;
                    }

                    candidates.add(new ScoredCandidate(movieId, 0.0, "POPULARITY_FALLBACK"));

                    if (candidates.size() >= config.candidateSize()) {
                        break;
                    }
                }
            }

            Map<Long, Double> semanticScores = semanticCandidates.stream()
                    .collect(Collectors.toMap(
                            candidate -> candidate.movieId().longValue(),
                            ScoredCandidate::score,
                            Math::max));

            ScoringContext context = buildContext(
                    UserProfile.empty(),
                    candidates,
                    movieFeatures,
                    genreIdfScores,
                    Map.of(),
                    semanticScores,
                    0,
                    0);

            return rankWithCore(
                    candidates,
                    movieFeatures,
                    context,
                    new RecommendationWeights(1.0, 0.0, 0.0, 0.0, 0.0, "SEMANTIC_CONTENT"),
                    config.k());
        }

        private List<RecommendationItem> recommendHybrid(
                UserProfile profile,
                Set<Integer> alreadySeen,
                List<ScoredCandidate> alsCandidates,
                List<Integer> globalPopularMovies,
                Map<Integer, MovieFeature> movieFeatures,
                Map<Long, Double> genreIdfScores,
                boolean rerank) {
            List<ScoredCandidate> candidates = buildHybridCandidates(
                    alsCandidates,
                    globalPopularMovies,
                    alreadySeen,
                    movieFeatures);

            Map<Long, Double> collaborativeScores = alsCandidates.stream()
                    .collect(Collectors.toMap(
                            candidate -> candidate.movieId().longValue(),
                            ScoredCandidate::score,
                            Math::max));

            ScoringContext context = buildContext(
                    profile,
                    candidates,
                    movieFeatures,
                    genreIdfScores,
                    collaborativeScores,
                    Map.of(),
                    profile.ratingCount(),
                    0);

            RecommendationWeights weights = weightResolver.resolve(context);

            List<RecommendationItem> ranked = rankWithCore(
                    candidates,
                    movieFeatures,
                    context,
                    weights,
                    Math.max(config.candidateSize(), config.k()));

            if (!rerank) {
                return ranked.stream().limit(config.k()).toList();
            }

            Map<String, Long> primaryGenreByItemKey = buildPrimaryGenreByItemKey(candidates, movieFeatures);

            return reRanker.reRank(ranked, primaryGenreByItemKey, config.k());
        }

        private List<ScoredCandidate> buildHybridCandidates(
                List<ScoredCandidate> alsCandidates,
                List<Integer> globalPopularMovies,
                Set<Integer> alreadySeen,
                Map<Integer, MovieFeature> movieFeatures) {
            Map<Integer, ScoredCandidate> result = new LinkedHashMap<>();

            for (ScoredCandidate candidate : alsCandidates) {
                if (alreadySeen.contains(candidate.movieId()) || !movieFeatures.containsKey(candidate.movieId())) {
                    continue;
                }

                result.merge(
                        candidate.movieId(),
                        candidate,
                        (oldValue, newValue) -> oldValue.score() >= newValue.score() ? oldValue : newValue);
            }

            if (result.size() < config.candidateSize()) {
                for (Integer movieId : globalPopularMovies) {
                    if (alreadySeen.contains(movieId) || !movieFeatures.containsKey(movieId)) {
                        continue;
                    }

                    result.putIfAbsent(movieId, new ScoredCandidate(movieId, 0.0, "POPULARITY_FALLBACK"));

                    if (result.size() >= config.candidateSize()) {
                        break;
                    }
                }
            }

            return new ArrayList<>(result.values());
        }

        private List<RecommendationItem> recommendHybridWithSemantic(
                UserProfile profile,
                Set<Integer> alreadySeen,
                List<ScoredCandidate> alsCandidates,
                List<ScoredCandidate> semanticCandidates,
                List<Integer> globalPopularMovies,
                Map<Integer, MovieFeature> movieFeatures,
                Map<Long, Double> genreIdfScores,
                boolean rerank) {
            List<ScoredCandidate> candidates = buildHybridSemanticCandidates(
                    alsCandidates,
                    semanticCandidates,
                    globalPopularMovies,
                    alreadySeen,
                    movieFeatures);

            Set<Integer> candidateMovieIds = candidates.stream()
                    .map(ScoredCandidate::movieId)
                    .collect(Collectors.toSet());

            Map<Long, Double> collaborativeScores = alsCandidates.stream()
                    .filter(candidate -> candidateMovieIds.contains(candidate.movieId()))
                    .collect(Collectors.toMap(
                            candidate -> candidate.movieId().longValue(),
                            ScoredCandidate::score,
                            Math::max));

            Map<Long, Double> semanticScores = semanticCandidates.stream()
                    .filter(candidate -> candidateMovieIds.contains(candidate.movieId()))
                    .collect(Collectors.toMap(
                            candidate -> candidate.movieId().longValue(),
                            ScoredCandidate::score,
                            Math::max));

            ScoringContext context = buildContext(
                    profile,
                    candidates,
                    movieFeatures,
                    genreIdfScores,
                    collaborativeScores,
                    semanticScores,
                    profile.ratingCount(),
                    0);

            RecommendationWeights weights = weightResolver.resolve(context);

            List<RecommendationItem> ranked = rankWithCore(
                    candidates,
                    movieFeatures,
                    context,
                    weights,
                    Math.max(config.candidateSize(), config.k()));

            if (!rerank) {
                return ranked.stream().limit(config.k()).toList();
            }

            Map<String, Long> primaryGenreByItemKey = buildPrimaryGenreByItemKey(candidates, movieFeatures);

            return reRanker.reRank(ranked, primaryGenreByItemKey, config.k());
        }

        private List<ScoredCandidate> buildHybridSemanticCandidates(
                List<ScoredCandidate> alsCandidates,
                List<ScoredCandidate> semanticCandidates,
                List<Integer> globalPopularMovies,
                Set<Integer> alreadySeen,
                Map<Integer, MovieFeature> movieFeatures) {
            Map<Integer, ScoredCandidate> result = new LinkedHashMap<>();

            int alsAdded = 0;
            int semanticAdded = 0;

            for (ScoredCandidate candidate : alsCandidates) {
                if (alreadySeen.contains(candidate.movieId()) || !movieFeatures.containsKey(candidate.movieId())) {
                    continue;
                }

                result.putIfAbsent(candidate.movieId(), candidate);
                alsAdded++;

                if (alsAdded >= config.candidateSize()) {
                    break;
                }
            }

            for (ScoredCandidate candidate : semanticCandidates) {
                if (alreadySeen.contains(candidate.movieId()) || !movieFeatures.containsKey(candidate.movieId())) {
                    continue;
                }

                if (result.containsKey(candidate.movieId())) {
                    continue;
                }

                result.put(candidate.movieId(), candidate);
                semanticAdded++;

                if (semanticAdded >= config.semanticExtraCandidateSize()) {
                    break;
                }
            }

            if (result.size() < config.candidateSize()) {
                for (Integer movieId : globalPopularMovies) {
                    if (alreadySeen.contains(movieId) || !movieFeatures.containsKey(movieId)) {
                        continue;
                    }

                    if (result.containsKey(movieId)) {
                        continue;
                    }

                    result.put(movieId, new ScoredCandidate(movieId, 0.0, "POPULARITY_FALLBACK"));

                    if (result.size() >= config.candidateSize()) {
                        break;
                    }
                }
            }

            return new ArrayList<>(result.values());
        }

        private Map<Integer, double[]> readMovieEmbeddings(Path embeddingPath) throws IOException {
            Map<Integer, double[]> result = new HashMap<>();

            try (var reader = Files.newBufferedReader(embeddingPath, StandardCharsets.UTF_8)) {
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

                    int movieId = Integer.parseInt(line.substring(0, commaIndex).trim());

                    String vectorText = line.substring(commaIndex + 1)
                            .trim()
                            .replace("\"", "");

                    double[] vector = parseVector(vectorText);

                    if (vector.length > 0) {
                        result.put(movieId, vector);
                    }
                }
            }

            return result;
        }

        private double[] parseVector(String value) {
            String normalized = value.trim();

            if (normalized.startsWith("[") && normalized.endsWith("]")) {
                normalized = normalized.substring(1, normalized.length() - 1);
            }

            if (normalized.isBlank()) {
                return new double[0];
            }

            String[] parts = normalized.split(",");
            double[] vector = new double[parts.length];

            for (int i = 0; i < parts.length; i++) {
                vector[i] = Double.parseDouble(parts[i].trim());
            }

            return normalize(vector);
        }

        private Map<Integer, List<ScoredCandidate>> generateSemanticCandidates(
                Map<Integer, List<UserRating>> trainRatingsByUser,
                Map<Integer, Set<Integer>> trainMovieIdsByUser,
                Map<Integer, double[]> movieEmbeddings,
                Map<Integer, MovieFeature> movieFeatures) {
            Map<Integer, List<ScoredCandidate>> result = new HashMap<>();

            if (movieEmbeddings == null || movieEmbeddings.isEmpty()) {
                return result;
            }

            System.out.println("Semantic min movie rating count: " + config.semanticMinMovieRatingCount());
            System.out.println("Semantic positive history limit: " + config.semanticPositiveHistoryLimit());
            System.out.println("Semantic similarity topK: " + config.semanticSimilarityTopK());

            int userCounter = 0;
            int usersWithSemanticCandidates = 0;
            long totalSemanticCandidates = 0;
            long filteredByLowRatingCount = 0;

            for (Map.Entry<Integer, List<UserRating>> entry : trainRatingsByUser.entrySet()) {
                Integer userId = entry.getKey();
                List<UserRating> ratings = entry.getValue();

                List<PositiveSemanticVector> positiveVectors = buildPositiveSemanticVectors(
                        ratings,
                        movieEmbeddings);

                if (positiveVectors.isEmpty()) {
                    result.put(userId, List.of());
                    continue;
                }

                Set<Integer> alreadySeen = trainMovieIdsByUser.getOrDefault(userId, Set.of());

                List<ScoredCandidate> candidates = movieEmbeddings.entrySet()
                        .stream()
                        .map(movieEntry -> {
                            Integer movieId = movieEntry.getKey();

                            if (alreadySeen.contains(movieId)) {
                                return null;
                            }

                            MovieFeature feature = movieFeatures.get(movieId);

                            if (feature == null) {
                                return null;
                            }

                            if (feature.ratingCount() < config.semanticMinMovieRatingCount()) {
                                return new ScoredCandidate(movieId, -1.0, "FILTERED_LOW_RATING_COUNT");
                            }

                            double score = scoreByPositiveMovieSimilarity(
                                    movieEntry.getValue(),
                                    positiveVectors);

                            return new ScoredCandidate(
                                    movieId,
                                    clamp(score),
                                    "SEMANTIC_CONTENT");
                        })
                        .filter(Objects::nonNull)
                        .filter(candidate -> !"FILTERED_LOW_RATING_COUNT".equals(candidate.source()))
                        .sorted(Comparator.comparingDouble(ScoredCandidate::score).reversed())
                        .limit(config.candidateSize())
                        .toList();

                long lowRatingCountFilteredForUser = movieEmbeddings.keySet()
                        .stream()
                        .filter(movieId -> !alreadySeen.contains(movieId))
                        .map(movieFeatures::get)
                        .filter(Objects::nonNull)
                        .filter(feature -> feature.ratingCount() < config.semanticMinMovieRatingCount())
                        .count();

                filteredByLowRatingCount += lowRatingCountFilteredForUser;

                result.put(userId, candidates);

                if (!candidates.isEmpty()) {
                    usersWithSemanticCandidates++;
                    totalSemanticCandidates += candidates.size();
                }

                userCounter++;

                if (userCounter % 500 == 0) {
                    double avgCandidates = usersWithSemanticCandidates == 0
                            ? 0.0
                            : totalSemanticCandidates / (double) usersWithSemanticCandidates;

                    System.out.println("Generated semantic candidates for users: " + userCounter
                            + ", usersWithCandidates=" + usersWithSemanticCandidates
                            + ", avgCandidates=" + String.format(Locale.US, "%.2f", avgCandidates)
                            + ", filteredLowRatingCount=" + filteredByLowRatingCount);
                }
            }

            double avgCandidates = usersWithSemanticCandidates == 0
                    ? 0.0
                    : totalSemanticCandidates / (double) usersWithSemanticCandidates;

            System.out.println("Semantic candidate generation completed."
                    + " users=" + userCounter
                    + ", usersWithCandidates=" + usersWithSemanticCandidates
                    + ", avgCandidates=" + String.format(Locale.US, "%.2f", avgCandidates)
                    + ", filteredLowRatingCount=" + filteredByLowRatingCount);

            return result;
        }

        private List<PositiveSemanticVector> buildPositiveSemanticVectors(
                List<UserRating> ratings,
                Map<Integer, double[]> movieEmbeddings) {
            if (ratings == null || ratings.isEmpty()) {
                return List.of();
            }

            return ratings.stream()
                    .filter(rating -> rating.rating() >= config.positiveRatingThreshold())
                    .sorted(Comparator
                            .comparingDouble(UserRating::rating)
                            .reversed()
                            .thenComparing(Comparator.comparingLong(UserRating::timestamp).reversed()))
                    .limit(config.semanticPositiveHistoryLimit())
                    .map(rating -> {
                        double[] vector = movieEmbeddings.get(rating.movieId());

                        if (vector == null || vector.length == 0) {
                            return null;
                        }

                        return new PositiveSemanticVector(
                                rating.movieId(),
                                vector,
                                clamp(rating.rating() / 5.0),
                                rating.timestamp());
                    })
                    .filter(Objects::nonNull)
                    .toList();
        }

        private double scoreByPositiveMovieSimilarity(
                double[] candidateVector,
                List<PositiveSemanticVector> positiveVectors) {
            if (candidateVector == null
                    || candidateVector.length == 0
                    || positiveVectors == null
                    || positiveVectors.isEmpty()) {
                return 0.0;
            }

            int topK = Math.max(1, config.semanticSimilarityTopK());

            List<Double> similarities = positiveVectors.stream()
                    .map(positive -> cosine(candidateVector, positive.vector()) * positive.weight())
                    .sorted(Comparator.reverseOrder())
                    .limit(topK)
                    .toList();

            if (similarities.isEmpty()) {
                return 0.0;
            }

            double sum = 0.0;

            for (Double similarity : similarities) {
                sum += similarity;
            }

            return sum / similarities.size();
        }

        private double[] buildUserSemanticVector(
                List<UserRating> ratings,
                Map<Integer, double[]> movieEmbeddings) {
            if (ratings == null || ratings.isEmpty()) {
                return null;
            }

            double[] weightedSum = null;
            double totalWeight = 0.0;

            for (UserRating rating : ratings) {
                if (rating.rating() < config.positiveRatingThreshold()) {
                    continue;
                }

                double[] movieVector = movieEmbeddings.get(rating.movieId());

                if (movieVector == null || movieVector.length == 0) {
                    continue;
                }

                double weight = clamp(rating.rating() / 5.0);

                if (weightedSum == null) {
                    weightedSum = new double[movieVector.length];
                }

                if (weightedSum.length != movieVector.length) {
                    continue;
                }

                for (int i = 0; i < movieVector.length; i++) {
                    weightedSum[i] += movieVector[i] * weight;
                }

                totalWeight += weight;
            }

            if (weightedSum == null || totalWeight <= 0.0) {
                return null;
            }

            for (int i = 0; i < weightedSum.length; i++) {
                weightedSum[i] /= totalWeight;
            }

            return normalize(weightedSum);
        }

        private double cosine(double[] left, double[] right) {
            if (left == null || right == null || left.length == 0 || left.length != right.length) {
                return 0.0;
            }

            double dot = 0.0;
            double leftNorm = 0.0;
            double rightNorm = 0.0;

            for (int i = 0; i < left.length; i++) {
                dot += left[i] * right[i];
                leftNorm += left[i] * left[i];
                rightNorm += right[i] * right[i];
            }

            if (leftNorm <= 0.0 || rightNorm <= 0.0) {
                return 0.0;
            }

            return dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
        }

        private double[] normalize(double[] vector) {
            double sum = 0.0;

            for (double value : vector) {
                sum += value * value;
            }

            if (sum <= 0.0) {
                return vector;
            }

            double norm = Math.sqrt(sum);
            double[] result = new double[vector.length];

            for (int i = 0; i < vector.length; i++) {
                result[i] = vector[i] / norm;
            }

            return result;
        }

        private List<RecommendationItem> rankWithCore(
                List<ScoredCandidate> candidates,
                Map<Integer, MovieFeature> movieFeatures,
                ScoringContext context,
                RecommendationWeights weights,
                int limit) {
            List<ScoringMovie> scoringMovies = candidates.stream()
                    .map(candidate -> movieFeatures.get(candidate.movieId()))
                    .filter(Objects::nonNull)
                    .map(MovieFeature::toScoringMovie)
                    .toList();

            return ranker.rank(scoringMovies, context, weights, limit);
        }

        private ScoringContext buildContext(
                UserProfile profile,
                List<ScoredCandidate> candidates,
                Map<Integer, MovieFeature> movieFeatures,
                Map<Long, Double> genreIdfScores,
                Map<Long, Double> collaborativeScores,
                Map<Long, Double> semanticContentScores,
                int userRatingCount,
                int interactionCount) {
            UserProfile safeProfile = profile == null ? UserProfile.empty() : profile;

            List<MovieFeature> candidateMovies = candidates.stream()
                    .map(candidate -> movieFeatures.get(candidate.movieId()))
                    .filter(Objects::nonNull)
                    .toList();

            int maxRatingCount = candidateMovies.stream()
                    .map(MovieFeature::ratingCount)
                    .max(Long::compareTo)
                    .map(value -> value > Integer.MAX_VALUE ? Integer.MAX_VALUE : value.intValue())
                    .orElse(0);

            long maxViewCount = candidateMovies.stream()
                    .map(MovieFeature::ratingCount)
                    .max(Long::compareTo)
                    .orElse(0L);

            Map<Long, Set<Long>> candidateGenreIds = new HashMap<>();
            Map<Long, Double> sentimentScores = new HashMap<>();

            for (MovieFeature movie : candidateMovies) {
                candidateGenreIds.put(movie.movieId().longValue(), genreIdsOf(movie));
                sentimentScores.put(movie.movieId().longValue(), 0.5);
            }

            return ScoringContext.builder()
                    .userRatingCount(userRatingCount)
                    .interactionCount(interactionCount)
                    .similarUserCount(0)
                    .userGenreWeights(safeProfile.genreWeights())
                    .userActorWeights(Map.of())
                    .candidateGenreIds(candidateGenreIds)
                    .candidateActorIds(Map.of())
                    .genreIdfScores(genreIdfScores)
                    .actorIdfScores(Map.of())
                    .collaborativeScores(collaborativeScores == null ? Map.of() : collaborativeScores)
                    .semanticContentScores(semanticContentScores == null ? Map.of() : semanticContentScores)
                    .sentimentScores(sentimentScores)
                    .maxRatingCount(maxRatingCount)
                    .maxViewCount(maxViewCount)
                    .currentYear(config.currentYear())
                    .build();
        }

        private UserProfile buildUserProfile(
                List<UserRating> ratings,
                Map<Integer, MovieFeature> movieFeatures,
                Map<String, Integer> genreVocabulary,
                Map<Long, Double> genreIdfScores) {
            Map<Long, Double> genreWeights = new HashMap<>();
            int positiveCount = 0;

            for (UserRating rating : ratings) {
                if (rating.rating() < config.positiveRatingThreshold()) {
                    continue;
                }

                MovieFeature movie = movieFeatures.get(rating.movieId());

                if (movie == null) {
                    continue;
                }

                positiveCount++;
                double interest = clamp(rating.rating() / 5.0);

                for (String genre : movie.genres()) {
                    Integer genreId = genreVocabulary.get(genre);

                    if (genreId == null) {
                        continue;
                    }

                    long longGenreId = genreId.longValue();
                    double idf = genreIdfScores.getOrDefault(longGenreId, 1.0);

                    genreWeights.merge(longGenreId, interest * idf, Double::sum);
                }
            }

            return new UserProfile(ratings.size(), positiveCount, genreWeights);
        }

        private Set<Long> genreIdsOf(MovieFeature movie) {
            if (movie == null || movie.genres().isEmpty()) {
                return Set.of();
            }

            Set<Long> result = new LinkedHashSet<>();

            for (String genre : movie.genres()) {
                Integer genreId = genreNameToId.get(genre);

                if (genreId != null) {
                    result.add(genreId.longValue());
                }
            }

            return result;
        }

        private Map<String, Long> buildPrimaryGenreByItemKey(
                List<ScoredCandidate> candidates,
                Map<Integer, MovieFeature> movieFeatures) {
            Map<String, Long> result = new HashMap<>();

            for (ScoredCandidate candidate : candidates) {
                MovieFeature movie = movieFeatures.get(candidate.movieId());

                if (movie == null) {
                    continue;
                }

                Long primaryGenreId = movie.primaryGenreId(genreNameToId);

                if (primaryGenreId != null) {
                    result.put(movie.itemKey(), primaryGenreId);
                }
            }

            return result;
        }

        private Map<Integer, Set<Integer>> toMovieIdSet(Map<Integer, List<UserRating>> ratingsByUser) {
            Map<Integer, Set<Integer>> result = new HashMap<>();

            for (Map.Entry<Integer, List<UserRating>> entry : ratingsByUser.entrySet()) {
                result.put(
                        entry.getKey(),
                        entry.getValue()
                                .stream()
                                .map(UserRating::movieId)
                                .collect(Collectors.toSet()));
            }

            return result;
        }

        private CandidateRecallDiagnostics calculateCandidateRecallDiagnostics(
                Map<Integer, Set<Integer>> testPositiveByUser,
                Map<Integer, Set<Integer>> trainMovieIdsByUser,
                Map<Integer, List<ScoredCandidate>> alsCandidatesByUser,
                Map<Integer, List<ScoredCandidate>> semanticCandidatesByUser,
                List<Integer> globalPopularMovies,
                Map<Integer, MovieFeature> movieFeatures) {
            CandidateRecallDiagnostics diagnostics = new CandidateRecallDiagnostics();

            for (Map.Entry<Integer, Set<Integer>> entry : testPositiveByUser.entrySet()) {
                Integer userId = entry.getKey();
                Set<Integer> groundTruth = entry.getValue();

                if (groundTruth == null || groundTruth.isEmpty()) {
                    continue;
                }

                Set<Integer> alreadySeen = trainMovieIdsByUser.getOrDefault(userId, Set.of());

                List<ScoredCandidate> alsCandidates = alsCandidatesByUser.getOrDefault(userId, List.of());
                List<ScoredCandidate> semanticCandidates = semanticCandidatesByUser.getOrDefault(userId, List.of());

                List<ScoredCandidate> hybridSemanticCandidates = buildHybridSemanticCandidates(
                        alsCandidates,
                        semanticCandidates,
                        globalPopularMovies,
                        alreadySeen,
                        movieFeatures);

                diagnostics.add(
                        groundTruth,
                        alsCandidates,
                        semanticCandidates,
                        hybridSemanticCandidates);
            }

            return diagnostics;
        }

        private void writeCandidateRecallDiagnostics(
                CandidateRecallDiagnostics diagnostics,
                Path output) throws IOException {
            try (BufferedWriter writer = Files.newBufferedWriter(output, StandardCharsets.UTF_8)) {
                writer.write("metric,value");
                writer.newLine();

                writer.write("evaluated_users," + diagnostics.evaluatedUsers());
                writer.newLine();

                writer.write("als_candidate_recall_at_pool," + format(diagnostics.alsCandidateRecall()));
                writer.newLine();

                writer.write("semantic_candidate_recall_at_pool," + format(diagnostics.semanticCandidateRecall()));
                writer.newLine();

                writer.write("hybrid_semantic_candidate_recall_at_pool,"
                        + format(diagnostics.hybridSemanticCandidateRecall()));
                writer.newLine();

                writer.write("als_hit_rate_at_pool," + format(diagnostics.alsHitRate()));
                writer.newLine();

                writer.write("semantic_hit_rate_at_pool," + format(diagnostics.semanticHitRate()));
                writer.newLine();

                writer.write("hybrid_semantic_hit_rate_at_pool," + format(diagnostics.hybridSemanticHitRate()));
                writer.newLine();

                writer.write("avg_als_candidates," + format(diagnostics.avgAlsCandidates()));
                writer.newLine();

                writer.write("avg_semantic_candidates," + format(diagnostics.avgSemanticCandidates()));
                writer.newLine();

                writer.write("avg_hybrid_semantic_candidates," + format(diagnostics.avgHybridSemanticCandidates()));
                writer.newLine();
            }
        }

        private void writeSummary(List<VariantMetricSummary> summaries, Path output) throws IOException {
            try (BufferedWriter writer = Files.newBufferedWriter(output, StandardCharsets.UTF_8)) {
                writer.write(
                        "variant,evaluated_users,precision_at_k,recall_at_k,hit_rate_at_k,ndcg_at_k,map_at_k,mrr_at_k,catalog_coverage,distinct_genres_per_item_at_k");
                writer.newLine();

                for (VariantMetricSummary summary : summaries) {
                    writer.write(String.join(
                            ",",
                            summary.variant().name(),
                            String.valueOf(summary.evaluatedUsers()),
                            format(summary.precisionAtK()),
                            format(summary.recallAtK()),
                            format(summary.hitRateAtK()),
                            format(summary.ndcgAtK()),
                            format(summary.mapAtK()),
                            format(summary.mrrAtK()),
                            format(summary.catalogCoverage()),
                            format(summary.distinctGenresPerItemAtK())));
                    writer.newLine();
                }
            }
        }

        private void requireFile(Path path) {
            if (!Files.exists(path)) {
                throw new IllegalArgumentException("Required file not found: " + path);
            }
        }

        private String stringValue(Row row, String field, String defaultValue) {
            int index = row.fieldIndex(field);

            if (row.isNullAt(index)) {
                return defaultValue;
            }

            return row.getString(index);
        }

        private double doubleValue(Row row, String field, double defaultValue) {
            int index = row.fieldIndex(field);

            if (row.isNullAt(index)) {
                return defaultValue;
            }

            return ((Number) row.get(index)).doubleValue();
        }

        private long longValue(Row row, String field, long defaultValue) {
            int index = row.fieldIndex(field);

            if (row.isNullAt(index)) {
                return defaultValue;
            }

            return ((Number) row.get(index)).longValue();
        }
    }

    public record EvaluationConfig(
            Path dataDir,
            Path outputDir,
            String sparkMaster,
            boolean sparkUiEnabled,
            int shufflePartitions,
            int minRatingsPerUser,
            int minMovieRatingCount,
            int semanticMinMovieRatingCount,
            int semanticExtraCandidateSize,
            int semanticPositiveHistoryLimit,
            int semanticSimilarityTopK,
            int maxUsers,
            double trainRatio,
            double positiveRatingThreshold,
            int k,
            int candidateSize,
            int popularityPoolSize,
            int alsRank,
            int alsMaxIter,
            double alsRegParam,
            boolean alsImplicitPrefs,
            double alsAlpha,
            int currentYear,
            Path embeddingPath,
            boolean enableSemanticVariants) {
        public static EvaluationConfig fromArgs(String[] args) {
            Map<String, String> values = parseArgs(args);
            Path dataDir = Path.of(values.getOrDefault("dataDir", "../datasets/ml-32m"));

            return new EvaluationConfig(
                    dataDir,
                    Path.of(values.getOrDefault("outputDir", "./output")),
                    values.getOrDefault("sparkMaster", "local[*]"),
                    Boolean.parseBoolean(values.getOrDefault("sparkUiEnabled", "false")),
                    Integer.parseInt(values.getOrDefault("shufflePartitions", "8")),
                    Integer.parseInt(values.getOrDefault("minRatingsPerUser", "20")),
                    Integer.parseInt(values.getOrDefault("minMovieRatingCount", "10")),
                    Integer.parseInt(values.getOrDefault(
                            "semanticMinMovieRatingCount",
                            values.getOrDefault("minMovieRatingCount", "10"))),
                    Integer.parseInt(values.getOrDefault("semanticExtraCandidateSize", "50")),
                    Integer.parseInt(values.getOrDefault("semanticPositiveHistoryLimit", "30")),
                    Integer.parseInt(values.getOrDefault("semanticSimilarityTopK", "1")),
                    Integer.parseInt(values.getOrDefault("maxUsers", "5000")),
                    Double.parseDouble(values.getOrDefault("trainRatio", "0.8")),
                    Double.parseDouble(values.getOrDefault("positiveRatingThreshold", "4.0")),
                    Integer.parseInt(values.getOrDefault("k", "10")),
                    Integer.parseInt(values.getOrDefault("candidateSize", "200")),
                    Integer.parseInt(values.getOrDefault("popularityPoolSize", "2000")),
                    Integer.parseInt(values.getOrDefault("alsRank", "64")),
                    Integer.parseInt(values.getOrDefault("alsMaxIter", "20")),
                    Double.parseDouble(values.getOrDefault("alsRegParam", "0.08")),
                    Boolean.parseBoolean(values.getOrDefault("alsImplicitPrefs", "true")),
                    Double.parseDouble(values.getOrDefault("alsAlpha", "1.0")),
                    Integer.parseInt(values.getOrDefault("currentYear", String.valueOf(Year.now().getValue()))),
                    Path.of(values.getOrDefault("embeddingPath", dataDir.resolve(MOVIE_EMBEDDINGS_FILE).toString())),
                    Boolean.parseBoolean(values.getOrDefault("enableSemanticVariants", "true")));
        }

        private static Map<String, String> parseArgs(String[] args) {
            Map<String, String> values = new HashMap<>();

            for (String arg : args) {
                if (arg == null || !arg.startsWith("--")) {
                    continue;
                }

                String raw = arg.substring(2);
                int equals = raw.indexOf('=');

                if (equals <= 0) {
                    values.put(raw, "true");
                } else {
                    values.put(raw.substring(0, equals), raw.substring(equals + 1));
                }
            }

            return values;
        }
    }

    private record TrainTestSplit(Dataset<Row> train, Dataset<Row> test) {
    }

    private enum PipelineVariant {
        POPULARITY,
        CONTENT_BASED,
        ALS_ONLY,
        SEMANTIC_CONTENT,
        ALS_HYBRID_RANKING,
        ALS_HYBRID_RANKING_RERANK,
        ALS_SEMANTIC_HYBRID_RANKING,
        ALS_SEMANTIC_HYBRID_RANKING_RERANK
    }

    private record MovieFeature(
            Integer movieId,
            String title,
            Integer releaseYear,
            Set<String> genres,
            double averageRating,
            long ratingCount) {
        private ScoringMovie toScoringMovie() {
            return ScoringMovie.of(
                    movieId.longValue(),
                    itemKey(),
                    releaseYear,
                    averageRating,
                    ratingCount > Integer.MAX_VALUE ? Integer.MAX_VALUE : (int) ratingCount,
                    ratingCount);
        }

        private String itemKey() {
            return String.valueOf(movieId);
        }

        private Long primaryGenreId(Map<String, Integer> genreNameToId) {
            if (genres == null || genres.isEmpty()) {
                return null;
            }

            for (String genre : genres) {
                Integer genreId = genreNameToId.get(genre);

                if (genreId != null) {
                    return genreId.longValue();
                }
            }

            return null;
        }
    }

    private record UserRating(int userId, int movieId, double rating, long timestamp) {
    }

    private record UserProfile(
            int ratingCount,
            int positiveRatingCount,
            Map<Long, Double> genreWeights) {
        private static UserProfile empty() {
            return new UserProfile(0, 0, Map.of());
        }
    }

    private record ScoredCandidate(Integer movieId, double score, String source) {
    }

    private record PositiveSemanticVector(
            int movieId,
            double[] vector,
            double weight,
            long timestamp) {
    }

    private static final class CandidateRecallDiagnostics {
        private int evaluatedUsers;

        private double alsRecallSum;
        private double semanticRecallSum;
        private double hybridSemanticRecallSum;

        private double alsHitRateSum;
        private double semanticHitRateSum;
        private double hybridSemanticHitRateSum;

        private double alsCandidateCountSum;
        private double semanticCandidateCountSum;
        private double hybridSemanticCandidateCountSum;

        private void add(
                Set<Integer> groundTruth,
                List<ScoredCandidate> alsCandidates,
                List<ScoredCandidate> semanticCandidates,
                List<ScoredCandidate> hybridSemanticCandidates) {
            if (groundTruth == null || groundTruth.isEmpty()) {
                return;
            }

            evaluatedUsers++;

            alsRecallSum += candidateRecallAtPool(alsCandidates, groundTruth);
            semanticRecallSum += candidateRecallAtPool(semanticCandidates, groundTruth);
            hybridSemanticRecallSum += candidateRecallAtPool(hybridSemanticCandidates, groundTruth);

            alsHitRateSum += candidateHitRateAtPool(alsCandidates, groundTruth);
            semanticHitRateSum += candidateHitRateAtPool(semanticCandidates, groundTruth);
            hybridSemanticHitRateSum += candidateHitRateAtPool(hybridSemanticCandidates, groundTruth);

            alsCandidateCountSum += alsCandidates == null ? 0 : alsCandidates.size();
            semanticCandidateCountSum += semanticCandidates == null ? 0 : semanticCandidates.size();
            hybridSemanticCandidateCountSum += hybridSemanticCandidates == null ? 0 : hybridSemanticCandidates.size();
        }

        private int evaluatedUsers() {
            return evaluatedUsers;
        }

        private double alsCandidateRecall() {
            return average(alsRecallSum);
        }

        private double semanticCandidateRecall() {
            return average(semanticRecallSum);
        }

        private double hybridSemanticCandidateRecall() {
            return average(hybridSemanticRecallSum);
        }

        private double alsHitRate() {
            return average(alsHitRateSum);
        }

        private double semanticHitRate() {
            return average(semanticHitRateSum);
        }

        private double hybridSemanticHitRate() {
            return average(hybridSemanticHitRateSum);
        }

        private double avgAlsCandidates() {
            return average(alsCandidateCountSum);
        }

        private double avgSemanticCandidates() {
            return average(semanticCandidateCountSum);
        }

        private double avgHybridSemanticCandidates() {
            return average(hybridSemanticCandidateCountSum);
        }

        private double average(double value) {
            if (evaluatedUsers == 0) {
                return 0.0;
            }

            return value / evaluatedUsers;
        }

        private static double candidateRecallAtPool(
                List<ScoredCandidate> candidates,
                Set<Integer> groundTruth) {
            if (candidates == null || candidates.isEmpty() || groundTruth == null || groundTruth.isEmpty()) {
                return 0.0;
            }

            Set<Integer> candidateMovieIds = candidates.stream()
                    .map(ScoredCandidate::movieId)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet());

            long hits = groundTruth.stream()
                    .filter(candidateMovieIds::contains)
                    .count();

            return hits / (double) groundTruth.size();
        }

        private static double candidateHitRateAtPool(
                List<ScoredCandidate> candidates,
                Set<Integer> groundTruth) {
            if (candidates == null || candidates.isEmpty() || groundTruth == null || groundTruth.isEmpty()) {
                return 0.0;
            }

            Set<Integer> candidateMovieIds = candidates.stream()
                    .map(ScoredCandidate::movieId)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet());

            boolean hasHit = groundTruth.stream()
                    .anyMatch(candidateMovieIds::contains);

            return hasHit ? 1.0 : 0.0;
        }
    }

    private static final class MetricAccumulator {
        private final int k;
        private final int totalCatalogSize;
        private int evaluatedUsers;
        private double precisionSum;
        private double recallSum;
        private double hitRateSum;
        private double ndcgSum;
        private double mapSum;
        private double mrrSum;
        private double distinctGenresPerItemSum;
        private final Set<Integer> recommendedCatalog = new HashSet<>();

        private MetricAccumulator(int k, int totalCatalogSize) {
            this.k = k;
            this.totalCatalogSize = Math.max(1, totalCatalogSize);
        }

        private void add(
                List<RecommendationItem> recommendations,
                Set<Integer> groundTruth,
                Map<Integer, MovieFeature> movieFeatures) {
            if (groundTruth == null || groundTruth.isEmpty()) {
                return;
            }

            evaluatedUsers++;

            List<Integer> topK = recommendations.stream()
                    .limit(k)
                    .map(MetricAccumulator::movieIdOf)
                    .filter(Objects::nonNull)
                    .toList();

            int hits = 0;
            double dcg = 0.0;
            double averagePrecisionNumerator = 0.0;
            double reciprocalRank = 0.0;
            int hitSoFar = 0;

            for (int i = 0; i < topK.size(); i++) {
                int movieId = topK.get(i);
                recommendedCatalog.add(movieId);

                if (groundTruth.contains(movieId)) {
                    hits++;
                    hitSoFar++;

                    int rank = i + 1;

                    dcg += 1.0 / log2(rank + 1.0);
                    averagePrecisionNumerator += hitSoFar / (double) rank;

                    if (reciprocalRank == 0.0) {
                        reciprocalRank = 1.0 / rank;
                    }
                }
            }

            int idealHits = Math.min(groundTruth.size(), k);
            double idcg = 0.0;

            for (int i = 0; i < idealHits; i++) {
                int rank = i + 1;
                idcg += 1.0 / log2(rank + 1.0);
            }

            precisionSum += hits / (double) k;
            recallSum += hits / (double) groundTruth.size();
            hitRateSum += hits > 0 ? 1.0 : 0.0;
            ndcgSum += idcg <= 0.0 ? 0.0 : dcg / idcg;
            mapSum += idealHits <= 0 ? 0.0 : averagePrecisionNumerator / idealHits;
            mrrSum += reciprocalRank;
            distinctGenresPerItemSum += calculateDistinctGenresPerItem(topK, movieFeatures);
        }

        private static Integer movieIdOf(RecommendationItem item) {
            if (item == null || item.getMovie() == null || item.getMovie().getMovieId() == null) {
                return null;
            }

            long value = item.getMovie().getMovieId();

            if (value > Integer.MAX_VALUE || value < Integer.MIN_VALUE) {
                return null;
            }

            return (int) value;
        }

        private VariantMetricSummary toSummary(PipelineVariant variant) {
            if (evaluatedUsers == 0) {
                return new VariantMetricSummary(variant, 0, 0, 0, 0, 0, 0, 0, 0, 0);
            }

            return new VariantMetricSummary(
                    variant,
                    evaluatedUsers,
                    precisionSum / evaluatedUsers,
                    recallSum / evaluatedUsers,
                    hitRateSum / evaluatedUsers,
                    ndcgSum / evaluatedUsers,
                    mapSum / evaluatedUsers,
                    mrrSum / evaluatedUsers,
                    recommendedCatalog.size() / (double) totalCatalogSize,
                    distinctGenresPerItemSum / evaluatedUsers);
        }

        private double calculateDistinctGenresPerItem(
                List<Integer> movieIds,
                Map<Integer, MovieFeature> movieFeatures) {
            if (movieIds.isEmpty()) {
                return 0.0;
            }

            Set<String> genres = new HashSet<>();

            for (Integer movieId : movieIds) {
                MovieFeature movie = movieFeatures.get(movieId);

                if (movie == null || movie.genres() == null) {
                    continue;
                }

                genres.addAll(movie.genres());
            }

            return genres.size() / (double) movieIds.size();
        }
    }

    private record VariantMetricSummary(
            PipelineVariant variant,
            int evaluatedUsers,
            double precisionAtK,
            double recallAtK,
            double hitRateAtK,
            double ndcgAtK,
            double mapAtK,
            double mrrAtK,
            double catalogCoverage,
            double distinctGenresPerItemAtK) {
    }

    private static Set<String> parseGenres(String genres) {
        if (genres == null || genres.isBlank() || "(no genres listed)".equalsIgnoreCase(genres)) {
            return Set.of();
        }

        return Arrays.stream(genres.split("\\|"))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private static Integer parseReleaseYear(String title) {
        if (title == null) {
            return null;
        }

        Matcher matcher = YEAR_PATTERN.matcher(title);

        if (!matcher.find()) {
            return null;
        }

        try {
            return Integer.parseInt(matcher.group(1));
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private static double log2(double value) {
        return Math.log(value) / Math.log(2.0);
    }

    private static double clamp(double value) {
        return Math.max(0.0, Math.min(1.0, value));
    }

    private static String format(double value) {
        return String.format(Locale.US, "%.6f", value);
    }
}