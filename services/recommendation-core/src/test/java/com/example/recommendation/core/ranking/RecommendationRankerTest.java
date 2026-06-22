package com.example.recommendation.core.ranking;

import com.example.recommendation.core.model.RecommendationItem;
import com.example.recommendation.core.model.ScoringContext;
import com.example.recommendation.core.model.ScoringMovie;
import com.example.recommendation.core.weight.RecommendationWeights;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class RecommendationRankerTest {

    private final RecommendationRanker ranker = new RecommendationRanker();

    @Test
    void rank_shouldReturnEmptyList_whenInputIsNull() {
        List<RecommendationItem> result = ranker.rank(
                null,
                ScoringContext.builder().build(),
                RecommendationWeights.personalized(),
                10);

        assertTrue(result.isEmpty());
    }

    @Test
    void rank_shouldFilterMoviesWithoutMovieId() {
        ScoringMovie invalidMovie = ScoringMovie.of(
                null,
                "invalid",
                2024,
                5.0,
                10,
                100L);

        List<RecommendationItem> result = ranker.rank(
                List.of(invalidMovie),
                ScoringContext.builder().currentYear(2026).build(),
                RecommendationWeights.personalized(),
                10);

        assertTrue(result.isEmpty());
    }

    @Test
    void rank_shouldSortMoviesByFinalScoreDescending() {
        ScoringMovie lowScoreMovie = ScoringMovie.of(1L, "movie-low", 2020, 4.0, 10, 100L);
        ScoringMovie highScoreMovie = ScoringMovie.of(2L, "movie-high", 2024, 4.0, 10, 100L);

        ScoringContext context = ScoringContext.builder()
                .currentYear(2026)
                .semanticContentScores(Map.of(
                        1L, 0.20,
                        2L, 0.90))
                .build();

        RecommendationWeights weights = new RecommendationWeights(
                1.0, 0.0, 0.0, 0.0, 0.0, "TEST_CONTENT_ONLY");

        List<RecommendationItem> result = ranker.rank(
                List.of(lowScoreMovie, highScoreMovie),
                context,
                weights,
                10);

        assertEquals(2, result.size());
        assertEquals("movie-high", result.get(0).itemKey());
        assertEquals("movie-low", result.get(1).itemKey());
    }

    @Test
    void rank_shouldRespectLimit() {
        ScoringMovie movie1 = ScoringMovie.of(1L, "movie-1", 2024, 4.0, 10, 100L);
        ScoringMovie movie2 = ScoringMovie.of(2L, "movie-2", 2024, 4.0, 10, 100L);
        ScoringMovie movie3 = ScoringMovie.of(3L, "movie-3", 2024, 4.0, 10, 100L);

        ScoringContext context = ScoringContext.builder()
                .currentYear(2026)
                .semanticContentScores(Map.of(
                        1L, 0.30,
                        2L, 0.90,
                        3L, 0.60))
                .build();

        RecommendationWeights weights = new RecommendationWeights(
                1.0, 0.0, 0.0, 0.0, 0.0, "TEST_CONTENT_ONLY");

        List<RecommendationItem> result = ranker.rank(
                List.of(movie1, movie2, movie3),
                context,
                weights,
                2);

        assertEquals(2, result.size());
        assertEquals("movie-2", result.get(0).itemKey());
        assertEquals("movie-3", result.get(1).itemKey());
    }
}