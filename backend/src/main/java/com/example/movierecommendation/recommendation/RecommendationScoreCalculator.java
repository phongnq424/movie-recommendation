package com.example.movierecommendation.recommendation;

import com.example.movierecommendation.movie.Movie;
import com.example.movierecommendation.movieactor.MovieActor;
import com.example.movierecommendation.movieactor.MovieActorRepository;
import com.example.movierecommendation.moviegenre.MovieGenre;
import com.example.movierecommendation.moviegenre.MovieGenreRepository;
import com.example.movierecommendation.rating.Rating;
import com.example.movierecommendation.rating.RatingRepository;
import com.example.movierecommendation.recommendation.dto.RecommendationContext;
import com.example.movierecommendation.recommendation.dto.RecommendationResponse;
import com.example.movierecommendation.recommendation.dto.RecommendationScoreBreakdown;
import com.example.movierecommendation.recommendation.dto.RecommendationWeights;
import com.example.movierecommendation.reviewanalysis.ReviewAnalysisRepository;
import com.example.movierecommendation.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.Year;
import java.util.*;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class RecommendationScoreCalculator {

    private static final double LIKED_RATING_THRESHOLD = 4.0;
    private static final double MIN_SIMILARITY = 0.30;

    private final UserSimilarityCalculator userSimilarityCalculator;
    private final RatingRepository ratingRepository;
    private final MovieGenreRepository movieGenreRepository;
    private final MovieActorRepository movieActorRepository;
    private final ReviewAnalysisRepository reviewAnalysisRepository;

    public RecommendationContext buildContext(User user, List<Movie> candidates) {
        List<Rating> userRatings = ratingRepository.findByUserId(user.getId());

        List<Long> candidateMovieIds = candidates.stream()
                .map(Movie::getId)
                .toList();

        Map<Long, Set<Long>> candidateGenreIds = loadCandidateGenreIds(candidateMovieIds);
        Map<Long, Set<Long>> candidateActorIds = loadCandidateActorIds(candidateMovieIds);

        Map<Long, Double> userGenreWeights = buildUserGenreWeights(userRatings);
        Map<Long, Double> userActorWeights = buildUserActorWeights(userRatings);

        CollaborativeResult collaborativeResult = calculateCollaborativeScores(
                user,
                userRatings,
                candidates
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
                .userGenreWeights(userGenreWeights)
                .userActorWeights(userActorWeights)
                .candidateGenreIds(candidateGenreIds)
                .candidateActorIds(candidateActorIds)
                .collaborativeScores(collaborativeResult.collaborativeScores())
                .sentimentScores(sentimentScores)
                .similarUserCount(collaborativeResult.similarUserCount())
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

        return RecommendationContext.builder()
                .userRatings(List.of())
                .userGenreWeights(Map.of())
                .userActorWeights(Map.of())
                .candidateGenreIds(loadCandidateGenreIds(candidateMovieIds))
                .candidateActorIds(loadCandidateActorIds(candidateMovieIds))
                .collaborativeScores(Map.of())
                .sentimentScores(loadSentimentScores(candidateMovieIds))
                .similarUserCount(0)
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

        double finalScore =
                weights.getContent() * contentScore
                        + weights.getCollaborative() * collaborativeScore
                        + weights.getPopularity() * popularityScore
                        + weights.getFreshness() * freshnessScore
                        + weights.getSentiment() * sentimentScore;

        finalScore = clamp(finalScore);

        RecommendationScoreBreakdown breakdown = RecommendationScoreBreakdown.builder()
                .contentScore(round(contentScore))
                .collaborativeScore(round(collaborativeScore))
                .popularityScore(round(popularityScore))
                .freshnessScore(round(freshnessScore))
                .sentimentScore(round(sentimentScore))
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

        double matchedWeight = movieGenreIds.stream()
                .mapToDouble(genreId -> userGenreWeights.getOrDefault(genreId, 0.0))
                .sum();

        double totalWeight = userGenreWeights.values()
                .stream()
                .mapToDouble(Double::doubleValue)
                .sum();

        if (totalWeight <= 0) {
            return 0.0;
        }

        return clamp(matchedWeight / totalWeight);
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

        double matchedWeight = movieActorIds.stream()
                .mapToDouble(actorId -> userActorWeights.getOrDefault(actorId, 0.0))
                .sum();

        double totalWeight = userActorWeights.values()
                .stream()
                .mapToDouble(Double::doubleValue)
                .sum();

        if (totalWeight <= 0) {
            return 0.0;
        }

        return clamp(matchedWeight / totalWeight);
    }

    private double calculatePopularityScore(Movie movie, RecommendationContext context) {
        double ratingScore = safeDouble(movie.getAverageRating()) / 5.0;

        double ratingCountScore = 0.0;
        if (context.getMaxRatingCount() > 0) {
            ratingCountScore = Math.log1p(safeInt(movie.getRatingCount()))
                    / Math.log1p(context.getMaxRatingCount());
        }

        double viewScore = 0.0;
        if (context.getMaxViewCount() > 0) {
            viewScore = Math.log1p(safeLong(movie.getViewCount()))
                    / Math.log1p(context.getMaxViewCount());
        }

        return clamp(
                0.45 * ratingScore
                        + 0.30 * ratingCountScore
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

    private Map<Long, Double> buildUserGenreWeights(List<Rating> userRatings) {
        List<Rating> likedRatings = userRatings.stream()
                .filter(rating -> safeDouble(rating.getRatingValue()) >= LIKED_RATING_THRESHOLD)
                .toList();

        if (likedRatings.isEmpty()) {
            return Map.of();
        }

        List<Long> likedMovieIds = likedRatings.stream()
                .map(rating -> rating.getMovie().getId())
                .toList();

        Map<Long, Double> ratingByMovieId = likedRatings.stream()
                .collect(Collectors.toMap(
                        rating -> rating.getMovie().getId(),
                        rating -> safeDouble(rating.getRatingValue()) / 5.0,
                        Double::sum
                ));

        Map<Long, Double> weights = new HashMap<>();

        for (MovieGenre movieGenre : movieGenreRepository.findByMovieIds(likedMovieIds)) {
            Long movieId = movieGenre.getMovie().getId();
            Long genreId = movieGenre.getGenre().getId();

            double weight = ratingByMovieId.getOrDefault(movieId, 0.0);
            weights.merge(genreId, weight, Double::sum);
        }

        return weights;
    }

    private Map<Long, Double> buildUserActorWeights(List<Rating> userRatings) {
        List<Rating> likedRatings = userRatings.stream()
                .filter(rating -> safeDouble(rating.getRatingValue()) >= LIKED_RATING_THRESHOLD)
                .toList();

        if (likedRatings.isEmpty()) {
            return Map.of();
        }

        List<Long> likedMovieIds = likedRatings.stream()
                .map(rating -> rating.getMovie().getId())
                .toList();

        Map<Long, Double> ratingByMovieId = likedRatings.stream()
                .collect(Collectors.toMap(
                        rating -> rating.getMovie().getId(),
                        rating -> safeDouble(rating.getRatingValue()) / 5.0,
                        Double::sum
                ));

        Map<Long, Double> weights = new HashMap<>();

        for (MovieActor movieActor : movieActorRepository.findByMovieIds(likedMovieIds)) {
            if (!isImportantActor(movieActor)) {
                continue;
            }

            Long movieId = movieActor.getMovie().getId();
            Long actorId = movieActor.getActor().getId();

            double weight = ratingByMovieId.getOrDefault(movieId, 0.0);
            weights.merge(actorId, weight, Double::sum);
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
}