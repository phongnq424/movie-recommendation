package com.example.movierecommendation.recommendation;

import com.example.movierecommendation.movie.Movie;
import com.example.movierecommendation.movieactor.MovieActor;
import com.example.movierecommendation.movieactor.MovieActorRepository;
import com.example.movierecommendation.moviegenre.MovieGenre;
import com.example.movierecommendation.moviegenre.MovieGenreRepository;
import com.example.movierecommendation.rating.Rating;
import com.example.movierecommendation.rating.RatingRepository;
import com.example.movierecommendation.recommendation.dto.*;
import com.example.movierecommendation.reviewanalysis.ReviewAnalysisRepository;
import com.example.movierecommendation.user.User;
import com.example.movierecommendation.movie.MovieRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.Year;
import java.util.*;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class RecommendationScoreCalculator {

    private static final double MIN_SIMILARITY = 0.30;
    private static final String STATUS_PUBLISHED = "PUBLISHED";
    private static final double RATING_CONFIDENCE_K = 5.0;
    private static final double TARGET_RATING_COUNT = 50.0;
    private static final double TARGET_VIEW_COUNT = 1000.0;

    private final UserSimilarityCalculator userSimilarityCalculator;
    private final RatingRepository ratingRepository;
    private final MovieGenreRepository movieGenreRepository;
    private final MovieActorRepository movieActorRepository;
    private final ReviewAnalysisRepository reviewAnalysisRepository;
    private final UserMovieInterestService userMovieInterestService;
    private final MovieRepository movieRepository;

    public RecommendationContext buildContext(
            User user,
            List<Movie> candidates,
            Map<Long, Double> collaborativeScores
    ) {
        List<Rating> userRatings = ratingRepository.findByUserId(user.getId());

        List<Long> candidateMovieIds = candidates.stream()
                .map(Movie::getId)
                .toList();

        Map<Long, Set<Long>> candidateGenreIds = loadCandidateGenreIds(candidateMovieIds);
        Map<Long, Set<Long>> candidateActorIds = loadCandidateActorIds(candidateMovieIds);

        UserMovieInterestProfile interestProfile = userMovieInterestService.build(user.getId(), userRatings);

        Map<Long, Double> genreIdfScores = loadGenreIdfScores();
        Map<Long, Double> actorIdfScores = loadActorIdfScores();

        Map<Long, Double> userGenreWeights = buildUserGenreWeights(
                interestProfile.getMovieInterestScores(),
                genreIdfScores
        );
        Map<Long, Double> userActorWeights = buildUserActorWeights(
                interestProfile.getMovieInterestScores(),
                actorIdfScores
        );

        Map<Long, Double> sentimentScores = loadSentimentScores(candidateMovieIds);


        int maxRatingCount = candidates.stream()
                .map(Movie::getRatingCount)
                .filter(Objects::nonNull)
                .max(Integer::compareTo)
                .orElse(0);

        long maxViewCount = candidates.stream()
                .map(Movie::getViewCount)
                .filter(Objects::nonNull)
                .max(Long::compareTo)
                .orElse(0L);

        return RecommendationContext.builder()
                .userRatings(userRatings)
                .movieInterestScores(interestProfile.getMovieInterestScores())
                .userGenreWeights(userGenreWeights)
                .userActorWeights(userActorWeights)
                .candidateGenreIds(candidateGenreIds)
                .candidateActorIds(candidateActorIds)
                .genreIdfScores(genreIdfScores)
                .actorIdfScores(actorIdfScores)
                .collaborativeScores(collaborativeScores == null ? Map.of() : collaborativeScores)
                .sentimentScores(sentimentScores)
                .similarUserCount(0)
                .interactionCount(interestProfile.getInteractionCount())
                .maxRatingCount(maxRatingCount)
                .maxViewCount(maxViewCount)
                .currentYear(Year.now().getValue())
                .build();
    }

    public RecommendationContext buildAnonymousContext(List<Movie> candidates) {
        List<Long> candidateMovieIds = candidates.stream()
                .map(Movie::getId)
                .toList();

        int maxRatingCount = candidates.stream()
                .map(Movie::getRatingCount)
                .filter(Objects::nonNull)
                .max(Integer::compareTo)
                .orElse(0);

        long maxViewCount = candidates.stream()
                .map(Movie::getViewCount)
                .filter(Objects::nonNull)
                .max(Long::compareTo)
                .orElse(0L);
        Map<Long, Double> genreIdfScores = loadGenreIdfScores();
        Map<Long, Double> actorIdfScores = loadActorIdfScores();

        return RecommendationContext.builder()
                .userRatings(List.of())
                .movieInterestScores(Map.of())
                .userGenreWeights(Map.of())
                .userActorWeights(Map.of())
                .candidateGenreIds(loadCandidateGenreIds(candidateMovieIds))
                .candidateActorIds(loadCandidateActorIds(candidateMovieIds))
                .genreIdfScores(genreIdfScores)
                .actorIdfScores(actorIdfScores)
                .collaborativeScores(Map.of())
                .sentimentScores(loadSentimentScores(candidateMovieIds))
                .similarUserCount(0)
                .interactionCount(0)
                .maxRatingCount(maxRatingCount)
                .maxViewCount(maxViewCount)
                .currentYear(Year.now().getValue())
                .build();
    }

    public RecommendationResponse calculate(
            Movie movie,
            RecommendationContext context,
            RecommendationWeights weights
    ) {
        double contentScore = calculateContentScore(movie, context);
        double collaborativeScore = context.getCollaborativeScores()
                .getOrDefault(movie.getId(), 0.0);
        double popularityScore = calculatePopularityScore(movie, context);
        double freshnessScore = calculateFreshnessScore(movie, context);
        double sentimentScore = context.getSentimentScores()
                .getOrDefault(movie.getId(), 0.5);

        double positiveScore =
                weights.getContent() * contentScore
                        + weights.getCollaborative() * collaborativeScore
                        + weights.getPopularity() * popularityScore
                        + weights.getFreshness() * freshnessScore
                        + weights.getSentiment() * sentimentScore;

        double negativePenalty = calculateNegativePenalty(movie, sentimentScore);

        double finalScore = clamp(positiveScore * negativePenalty);

        RecommendationScoreBreakdown breakdown = RecommendationScoreBreakdown.builder()
                .contentScore(round(contentScore))
                .collaborativeScore(round(collaborativeScore))
                .popularityScore(round(popularityScore))
                .freshnessScore(round(freshnessScore))
                .sentimentScore(round(sentimentScore))
                .negativePenalty(round(negativePenalty))
                .contentWeight(weights.getContent())
                .collaborativeWeight(weights.getCollaborative())
                .popularityWeight(weights.getPopularity())
                .freshnessWeight(weights.getFreshness())
                .sentimentWeight(weights.getSentiment())
                .strategy(weights.getStrategy())
                .build();

        return RecommendationResponse.from(movie, round(finalScore), breakdown);
    }

    private double calculateContentScore(Movie movie, RecommendationContext context) {
        double genreScore = calculateGenreScore(movie, context);
        double actorScore = calculateActorScore(movie, context);

        return clamp(0.70 * genreScore + 0.30 * actorScore);
    }

    private double calculateGenreScore(Movie movie, RecommendationContext context) {
        Map<Long, Double> userGenreWeights = context.getUserGenreWeights();

        if (userGenreWeights == null || userGenreWeights.isEmpty()) {
            return 0.0;
        }

        Set<Long> movieGenreIds = context.getCandidateGenreIds()
                .getOrDefault(movie.getId(), Set.of());

        if (movieGenreIds.isEmpty()) {
            return 0.0;
        }

        Map<Long, Double> movieGenreVector = new HashMap<>();

        for (Long genreId : movieGenreIds) {
            double idf = context.getGenreIdfScores().getOrDefault(genreId, 1.0);
            movieGenreVector.put(genreId, idf);
        }

        return calculateCosineSimilarity(userGenreWeights, movieGenreVector);
    }

    private double calculateActorScore(Movie movie, RecommendationContext context) {
        Map<Long, Double> userActorWeights = context.getUserActorWeights();

        if (userActorWeights == null || userActorWeights.isEmpty()) {
            return 0.0;
        }

        Set<Long> movieActorIds = context.getCandidateActorIds()
                .getOrDefault(movie.getId(), Set.of());

        if (movieActorIds.isEmpty()) {
            return 0.0;
        }

        Map<Long, Double> movieActorVector = new HashMap<>();

        for (Long actorId : movieActorIds) {
            double idf = context.getActorIdfScores().getOrDefault(actorId, 1.0);
            movieActorVector.put(actorId, idf);
        }

        return calculateCosineSimilarity(userActorWeights, movieActorVector);
    }

    private double calculatePopularityScore(Movie movie, RecommendationContext context) {
        int ratingCount = safeInt(movie.getRatingCount());
        long viewCount = safeLong(movie.getViewCount());

        double averageRating = safeDouble(movie.getAverageRating());

        double ratingConfidence = ratingCount / (ratingCount + RATING_CONFIDENCE_K);
        double ratingScore = (averageRating / 5.0) * ratingConfidence;

        double ratingCountScore = Math.log1p(ratingCount) / Math.log1p(TARGET_RATING_COUNT);
        ratingCountScore = clamp(ratingCountScore);

        double viewScore = Math.log1p(viewCount) / Math.log1p(TARGET_VIEW_COUNT);
        viewScore = clamp(viewScore);

        return clamp(
                0.50 * ratingScore
                        + 0.25 * ratingCountScore
                        + 0.25 * viewScore
        );
    }

    private double calculateFreshnessScore(Movie movie, RecommendationContext context) {
        Integer releaseYear = movie.getReleaseYear();

        if (releaseYear == null || releaseYear <= 0) {
            return 0.5;
        }

        int age = Math.max(0, context.getCurrentYear() - releaseYear);

        return clamp(Math.exp(-age / 8.0));
    }

    private Map<Long, Double> buildUserGenreWeights(
            Map<Long, Double> movieInterestScores,
            Map<Long, Double> genreIdfScores
    ) {
        if (movieInterestScores == null || movieInterestScores.isEmpty()) {
            return Map.of();
        }

        List<Long> movieIds = new ArrayList<>(movieInterestScores.keySet());

        Map<Long, Double> weights = new HashMap<>();

        for (MovieGenre movieGenre : movieGenreRepository.findByMovieIds(movieIds)) {
            if (movieGenre == null) {
                continue;
            }

            if (movieGenre.getMovie() == null || movieGenre.getMovie().getId() == null) {
                continue;
            }

            if (movieGenre.getGenre() == null || movieGenre.getGenre().getId() == null) {
                continue;
            }

            Long movieId = movieGenre.getMovie().getId();
            Long genreId = movieGenre.getGenre().getId();

            double interest = movieInterestScores.getOrDefault(movieId, 0.0);
            double idf = genreIdfScores.getOrDefault(genreId, 1.0);

            weights.merge(genreId, interest * idf, Double::sum);
        }

        return weights;
    }

    private Map<Long, Double> buildUserActorWeights(
            Map<Long, Double> movieInterestScores,
            Map<Long, Double> actorIdfScores
    ) {
        if (movieInterestScores == null || movieInterestScores.isEmpty()) {
            return Map.of();
        }

        List<Long> movieIds = new ArrayList<>(movieInterestScores.keySet());

        Map<Long, Double> weights = new HashMap<>();

        for (MovieActor movieActor : movieActorRepository.findByMovieIds(movieIds)) {
            if (movieActor == null) {
                continue;
            }

            if (!isImportantActor(movieActor)) {
                continue;
            }

            if (movieActor.getMovie() == null || movieActor.getMovie().getId() == null) {
                continue;
            }

            if (movieActor.getActor() == null || movieActor.getActor().getId() == null) {
                continue;
            }

            Long movieId = movieActor.getMovie().getId();
            Long actorId = movieActor.getActor().getId();

            double interest = movieInterestScores.getOrDefault(movieId, 0.0);
            double idf = actorIdfScores.getOrDefault(actorId, 1.0);
            double roleWeight = calculateActorRoleWeight(movieActor);

            weights.merge(actorId, interest * idf * roleWeight, Double::sum);
        }

        return weights;
    }

    private Map<Long, Set<Long>> loadCandidateGenreIds(List<Long> movieIds) {
        if (movieIds == null || movieIds.isEmpty()) {
            return Map.of();
        }

        Map<Long, Set<Long>> result = new HashMap<>();

        for (MovieGenre movieGenre : movieGenreRepository.findByMovieIds(movieIds)) {
            result.computeIfAbsent(movieGenre.getMovie().getId(), key -> new HashSet<>())
                    .add(movieGenre.getGenre().getId());
        }

        return result;
    }

    private Map<Long, Set<Long>> loadCandidateActorIds(List<Long> movieIds) {
        if (movieIds == null || movieIds.isEmpty()) {
            return Map.of();
        }

        Map<Long, Set<Long>> result = new HashMap<>();

        for (MovieActor movieActor : movieActorRepository.findByMovieIds(movieIds)) {
            if (!isImportantActor(movieActor)) {
                continue;
            }

            result.computeIfAbsent(movieActor.getMovie().getId(), key -> new HashSet<>())
                    .add(movieActor.getActor().getId());
        }

        return result;
    }

    private Map<Long, Double> loadSentimentScores(List<Long> movieIds) {
        if (movieIds == null || movieIds.isEmpty()) {
            return Map.of();
        }

        Map<Long, Double> result = new HashMap<>();

        for (Object[] row : reviewAnalysisRepository.findAverageSentimentByMovieIds(movieIds)) {
            Long movieId = (Long) row[0];
            Double averageSentiment = (Double) row[1];

            result.put(movieId, normalizeSentiment(averageSentiment));
        }

        return result;
    }

    private CollaborativeResult calculateCollaborativeScores(
            User user,
            List<Rating> userRatings,
            List<Movie> candidates
    ) {
        if (userRatings.isEmpty() || candidates.isEmpty()) {
            return new CollaborativeResult(Map.of(), 0);
        }

        Set<Long> candidateMovieIds = candidates.stream()
                .map(Movie::getId)
                .collect(Collectors.toSet());

        Map<Long, Double> currentUserRatingMap = userRatings.stream()
                .collect(Collectors.toMap(
                        rating -> rating.getMovie().getId(),
                        rating -> safeDouble(rating.getRatingValue())
                ));

        List<Rating> otherRatings = ratingRepository.findOtherUsersRatings(user.getId());

        Map<Long, List<Rating>> ratingsByOtherUser = otherRatings.stream()
                .collect(Collectors.groupingBy(rating -> rating.getUser().getId()));

        Map<Long, Double> similarityByUser = new HashMap<>();

        for (Map.Entry<Long, List<Rating>> entry : ratingsByOtherUser.entrySet()) {
            double similarity = userSimilarityCalculator.calculate(currentUserRatingMap, entry.getValue());

            if (similarity >= MIN_SIMILARITY) {
                similarityByUser.put(entry.getKey(), similarity);
            }
        }

        if (similarityByUser.isEmpty()) {
            return new CollaborativeResult(Map.of(), 0);
        }

        Map<Long, Double> numeratorByMovie = new HashMap<>();
        Map<Long, Double> denominatorByMovie = new HashMap<>();

        for (Rating rating : otherRatings) {
            Long otherUserId = rating.getUser().getId();
            Long movieId = rating.getMovie().getId();

            if (!candidateMovieIds.contains(movieId)) {
                continue;
            }

            Double similarity = similarityByUser.get(otherUserId);

            if (similarity == null || similarity <= 0) {
                continue;
            }

            double normalizedRating = safeDouble(rating.getRatingValue()) / 5.0;

            numeratorByMovie.merge(movieId, similarity * normalizedRating, Double::sum);
            denominatorByMovie.merge(movieId, similarity, Double::sum);
        }

        Map<Long, Double> collaborativeScores = new HashMap<>();

        for (Long movieId : numeratorByMovie.keySet()) {
            double denominator = denominatorByMovie.getOrDefault(movieId, 0.0);

            if (denominator > 0) {
                collaborativeScores.put(movieId, clamp(numeratorByMovie.get(movieId) / denominator));
            }
        }

        return new CollaborativeResult(collaborativeScores, similarityByUser.size());
    }

    private boolean isImportantActor(MovieActor movieActor) {
        if (Boolean.TRUE.equals(movieActor.getMainCast())) {
            return true;
        }

        Integer castOrder = movieActor.getCastOrder();

        return castOrder != null && castOrder <= 5;
    }

    private double normalizeSentiment(Double value) {
        if (value == null) {
            return 0.5;
        }

        if (value >= -1.0 && value <= 1.0) {
            return clamp((value + 1.0) / 2.0);
        }

        return clamp(value);
    }

    private double safeDouble(Double value) {
        return value == null ? 0.0 : value;
    }

    private int safeInt(Integer value) {
        return value == null ? 0 : value;
    }

    private long safeLong(Long value) {
        return value == null ? 0L : value;
    }

    private double clamp(double value) {
        return Math.max(0.0, Math.min(1.0, value));
    }

    private double round(double value) {
        return Math.round(value * 10000.0) / 10000.0;
    }

    private record CollaborativeResult(
            Map<Long, Double> collaborativeScores,
            int similarUserCount
    ) {
    }

    private Map<Long, Double> loadGenreIdfScores() {
        long totalMovies = movieRepository.countByStatus(STATUS_PUBLISHED);

        if (totalMovies <= 0) {
            return Map.of();
        }

        Map<Long, Double> idfScores = new HashMap<>();

        for (Object[] row : movieGenreRepository.countPublishedMoviesByGenre(STATUS_PUBLISHED)) {
            Long genreId = (Long) row[0];
            Long movieCount = (Long) row[1];

            idfScores.put(genreId, calculateIdf(totalMovies, movieCount));
        }

        return idfScores;
    }

    private Map<Long, Double> loadActorIdfScores() {
        long totalMovies = movieRepository.countByStatus(STATUS_PUBLISHED);

        if (totalMovies <= 0) {
            return Map.of();
        }

        Map<Long, Double> idfScores = new HashMap<>();

        for (Object[] row : movieActorRepository.countPublishedMoviesByActor(STATUS_PUBLISHED)) {
            Long actorId = (Long) row[0];
            Long movieCount = (Long) row[1];

            idfScores.put(actorId, calculateIdf(totalMovies, movieCount));
        }

        return idfScores;
    }

    private double calculateIdf(long totalMovies, long moviesWithFeature) {
        return Math.log((totalMovies + 1.0) / (moviesWithFeature + 1.0)) + 1.0;
    }

    private double calculateCosineSimilarity(
            Map<Long, Double> userVector,
            Map<Long, Double> movieVector
    ) {
        if (userVector == null || userVector.isEmpty()) {
            return 0.0;
        }

        if (movieVector == null || movieVector.isEmpty()) {
            return 0.0;
        }

        double dotProduct = 0.0;

        for (Map.Entry<Long, Double> entry : movieVector.entrySet()) {
            Long featureId = entry.getKey();
            double movieWeight = entry.getValue();

            double userWeight = userVector.getOrDefault(featureId, 0.0);

            dotProduct += userWeight * movieWeight;
        }

        double userNorm = userVector.values()
                .stream()
                .mapToDouble(value -> value * value)
                .sum();

        double movieNorm = movieVector.values()
                .stream()
                .mapToDouble(value -> value * value)
                .sum();

        if (userNorm <= 0.0 || movieNorm <= 0.0) {
            return 0.0;
        }

        return clamp(dotProduct / (Math.sqrt(userNorm) * Math.sqrt(movieNorm)));
    }

    private double calculateActorRoleWeight(MovieActor movieActor) {
        if (Boolean.TRUE.equals(movieActor.getMainCast())) {
            return 1.0;
        }

        Integer castOrder = movieActor.getCastOrder();

        if (castOrder == null) {
            return 0.5;
        }

        if (castOrder <= 1) {
            return 1.0;
        }

        if (castOrder == 2) {
            return 0.9;
        }

        if (castOrder == 3) {
            return 0.8;
        }

        if (castOrder == 4) {
            return 0.7;
        }

        if (castOrder == 5) {
            return 0.6;
        }

        return 0.5;
    }
    private double calculateNegativePenalty(Movie movie, double sentimentScore) {
        double ratingPenalty = calculateLowRatingPenalty(movie);
        double sentimentPenalty = calculateLowSentimentPenalty(sentimentScore);

        return clamp(ratingPenalty * sentimentPenalty);
    }

    private double calculateLowRatingPenalty(Movie movie) {
        int ratingCount = safeInt(movie.getRatingCount());
        double averageRating = safeDouble(movie.getAverageRating());

        if (ratingCount <= 0) {
            return 1.0;
        }

        if (averageRating >= 3.0) {
            return 1.0;
        }

        double confidence = ratingCount / (ratingCount + 5.0);
        double lowRatingStrength = (3.0 - averageRating) / 2.0;

        double penalty = 1.0 - 0.45 * confidence * lowRatingStrength;

        return clampPenalty(penalty);
    }

    private double calculateLowSentimentPenalty(double sentimentScore) {
        if (sentimentScore >= 0.4) {
            return 1.0;
        }

        double negativeStrength = (0.4 - sentimentScore) / 0.4;

        double penalty = 1.0 - 0.30 * negativeStrength;

        return clampPenalty(penalty);
    }

    private double clampPenalty(double value) {
        return Math.max(0.35, Math.min(1.0, value));
    }
}