package com.example.recommendation.core.scoring;

import com.example.recommendation.core.model.RecommendationItem;
import com.example.recommendation.core.model.ScoringContext;
import com.example.recommendation.core.model.ScoringMovie;
import com.example.recommendation.core.weight.RecommendationWeights;
import org.junit.jupiter.api.Test;

import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class HybridScoreCalculatorTest {

    private final HybridScoreCalculator calculator = new HybridScoreCalculator();

    @Test
    void calculate_shouldUseSemanticContentScore_whenSemanticScoreExists() {
        ScoringMovie movie = ScoringMovie.of(1L, "movie-1", 2024, 4.5, 20, 500L);

        ScoringContext context = ScoringContext.builder()
                .currentYear(2026)
                .semanticContentScores(Map.of(1L, 0.82))
                .build();

        RecommendationWeights weights = new RecommendationWeights(
                1.0, 0.0, 0.0, 0.0, 0.0, "TEST_CONTENT_ONLY"
        );

        RecommendationItem item = calculator.calculate(movie, context, weights);

        assertEquals(0.82, item.getScoreBreakdown().getContentScore(), 0.0001);
        assertEquals(0.82, item.getFinalScore(), 0.0001);
    }

    @Test
    void calculate_shouldFallbackToGenreAndActorScore_whenSemanticScoreDoesNotExist() {
        ScoringMovie movie = ScoringMovie.of(1L, "movie-1", 2024, 4.5, 20, 500L);

        ScoringContext context = ScoringContext.builder()
                .currentYear(2026)
                .userGenreWeights(Map.of(10L, 1.0))
                .candidateGenreIds(Map.of(1L, Set.of(10L)))
                .genreIdfScores(Map.of(10L, 1.0))
                .userActorWeights(Map.of(99L, 1.0))
                .candidateActorIds(Map.of(1L, Set.of(99L)))
                .actorIdfScores(Map.of(99L, 1.0))
                .build();

        RecommendationWeights weights = new RecommendationWeights(
                1.0, 0.0, 0.0, 0.0, 0.0, "TEST_CONTENT_ONLY"
        );

        RecommendationItem item = calculator.calculate(movie, context, weights);

        assertEquals(1.0, item.getScoreBreakdown().getContentScore(), 0.0001);
        assertEquals(1.0, item.getFinalScore(), 0.0001);
    }

    @Test
    void calculate_shouldUseDefaultSentimentScore_whenSentimentDoesNotExist() {
        ScoringMovie movie = ScoringMovie.of(1L, "movie-1", 2024, 4.5, 20, 500L);

        ScoringContext context = ScoringContext.builder()
                .currentYear(2026)
                .build();

        RecommendationWeights weights = new RecommendationWeights(
                0.0, 0.0, 0.0, 0.0, 1.0, "TEST_SENTIMENT_ONLY"
        );

        RecommendationItem item = calculator.calculate(movie, context, weights);

        assertEquals(0.5, item.getScoreBreakdown().getSentimentScore(), 0.0001);
        assertEquals(0.5, item.getFinalScore(), 0.0001);
    }

    @Test
    void calculate_shouldApplyLowRatingPenalty_whenAverageRatingIsBelowThree() {
        ScoringMovie movie = ScoringMovie.of(1L, "movie-1", 2020, 2.0, 50, 100L);

        ScoringContext context = ScoringContext.builder()
                .currentYear(2026)
                .semanticContentScores(Map.of(1L, 1.0))
                .sentimentScores(Map.of(1L, 0.80))
                .build();

        RecommendationWeights weights = new RecommendationWeights(
                1.0, 0.0, 0.0, 0.0, 0.0, "TEST_CONTENT_ONLY"
        );

        RecommendationItem item = calculator.calculate(movie, context, weights);

        assertTrue(item.getScoreBreakdown().getNegativePenalty() < 1.0);
        assertTrue(item.getFinalScore() < 1.0);
    }

    @Test
    void calculate_shouldClampFinalScoreToOne_whenWeightedScoreExceedsOne() {
        ScoringMovie movie = ScoringMovie.of(1L, "movie-1", 2026, 5.0, 100, 10_000L);

        ScoringContext context = ScoringContext.builder()
                .currentYear(2026)
                .semanticContentScores(Map.of(1L, 1.0))
                .collaborativeScores(Map.of(1L, 1.0))
                .sentimentScores(Map.of(1L, 1.0))
                .build();

        RecommendationWeights weights = new RecommendationWeights(
                1.0, 1.0, 1.0, 1.0, 1.0, "TEST_OVER_WEIGHTED"
        );

        RecommendationItem item = calculator.calculate(movie, context, weights);

        assertEquals(1.0, item.getFinalScore(), 0.0001);
    }
}