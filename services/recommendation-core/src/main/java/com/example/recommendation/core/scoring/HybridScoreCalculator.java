package com.example.recommendation.core.scoring;

import com.example.recommendation.core.model.RecommendationItem;
import com.example.recommendation.core.model.ScoreBreakdown;
import com.example.recommendation.core.model.ScoringContext;
import com.example.recommendation.core.model.ScoringMovie;
import com.example.recommendation.core.weight.RecommendationWeights;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

public class HybridScoreCalculator {

    private static final double RATING_CONFIDENCE_K = 5.0;
    private static final double TARGET_RATING_COUNT = 50.0;
    private static final double TARGET_VIEW_COUNT = 1000.0;

    public RecommendationItem calculate(
            ScoringMovie movie,
            ScoringContext context,
            RecommendationWeights weights
    ) {
        double contentScore = calculateContentScore(movie, context);
        double collaborativeScore = context.getCollaborativeScores()
                .getOrDefault(movie.getMovieId(), 0.0);
        double popularityScore = calculatePopularityScore(movie);
        double freshnessScore = calculateFreshnessScore(movie, context);
        double sentimentScore = context.getSentimentScores()
                .getOrDefault(movie.getMovieId(), 0.5);

        double positiveScore =
                weights.getContent() * contentScore
                        + weights.getCollaborative() * collaborativeScore
                        + weights.getPopularity() * popularityScore
                        + weights.getFreshness() * freshnessScore
                        + weights.getSentiment() * sentimentScore;

        double negativePenalty = calculateNegativePenalty(movie, sentimentScore);
        double finalScore = clamp(positiveScore * negativePenalty);

        ScoreBreakdown breakdown = new ScoreBreakdown(
                round(contentScore),
                round(collaborativeScore),
                round(popularityScore),
                round(freshnessScore),
                round(sentimentScore),
                round(negativePenalty),
                weights.getContent(),
                weights.getCollaborative(),
                weights.getPopularity(),
                weights.getFreshness(),
                weights.getSentiment(),
                weights.getStrategy()
        );

        return new RecommendationItem(movie, round(finalScore), breakdown);
    }

    private double calculateContentScore(ScoringMovie movie, ScoringContext context) {
        double semanticContentScore = context.getSemanticContentScores()
                .getOrDefault(movie.getMovieId(), -1.0);

        if (semanticContentScore >= 0.0) {
            return clamp(semanticContentScore);
        }

        double genreScore = calculateGenreScore(movie, context);
        double actorScore = calculateActorScore(movie, context);

        return clamp(0.70 * genreScore + 0.30 * actorScore);
    }

    private double calculateGenreScore(ScoringMovie movie, ScoringContext context) {
        Map<Long, Double> userGenreWeights = context.getUserGenreWeights();

        if (userGenreWeights.isEmpty()) {
            return 0.0;
        }

        Set<Long> movieGenreIds = context.getCandidateGenreIds()
                .getOrDefault(movie.getMovieId(), Set.of());

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

    private double calculateActorScore(ScoringMovie movie, ScoringContext context) {
        Map<Long, Double> userActorWeights = context.getUserActorWeights();

        if (userActorWeights.isEmpty()) {
            return 0.0;
        }

        Set<Long> movieActorIds = context.getCandidateActorIds()
                .getOrDefault(movie.getMovieId(), Set.of());

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

    private double calculatePopularityScore(ScoringMovie movie) {
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

    private double calculateFreshnessScore(ScoringMovie movie, ScoringContext context) {
        Integer releaseYear = movie.getReleaseYear();

        if (releaseYear == null || releaseYear <= 0) {
            return 0.5;
        }

        int age = Math.max(0, context.getCurrentYear() - releaseYear);

        return clamp(Math.exp(-age / 8.0));
    }

    private double calculateNegativePenalty(ScoringMovie movie, double sentimentScore) {
        double ratingPenalty = calculateLowRatingPenalty(movie);
        double sentimentPenalty = calculateLowSentimentPenalty(sentimentScore);

        return clamp(ratingPenalty * sentimentPenalty);
    }

    private double calculateLowRatingPenalty(ScoringMovie movie) {
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

    private double clampPenalty(double value) {
        return Math.max(0.35, Math.min(1.0, value));
    }

    private double round(double value) {
        return Math.round(value * 10000.0) / 10000.0;
    }
}
