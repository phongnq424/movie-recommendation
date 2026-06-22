package com.example.recommendation.core.rerank;

import com.example.recommendation.core.model.RecommendationItem;
import com.example.recommendation.core.model.ScoringMovie;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class GenreDiversityReRankerTest {

    private final GenreDiversityReRanker reRanker = new GenreDiversityReRanker();

    @Test
    void reRank_shouldReturnEmptyList_whenInputIsNull() {
        List<RecommendationItem> result = reRanker.reRank(null, Map.of(), 10);

        assertTrue(result.isEmpty());
    }

    @Test
    void reRank_shouldRemoveDuplicatedItemsByItemKey() {
        RecommendationItem first = item(1L, "movie-1", 0.90);
        RecommendationItem duplicated = item(1L, "movie-1", 0.80);
        RecommendationItem second = item(2L, "movie-2", 0.70);

        List<RecommendationItem> result = reRanker.reRank(
                List.of(first, duplicated, second),
                Map.of(
                        "movie-1", 10L,
                        "movie-2", 20L),
                10);

        assertEquals(2, result.size());
        assertEquals("movie-1", result.get(0).itemKey());
        assertEquals("movie-2", result.get(1).itemKey());
        assertEquals(0.90, result.get(0).getFinalScore(), 0.0001);
    }

    @Test
    void reRank_shouldUseMovieIdAsFallbackKey_whenItemKeyIsBlank() {
        RecommendationItem blankItem = item(1L, "   ", 0.90);
        RecommendationItem validItem = item(2L, "movie-2", 0.80);

        List<RecommendationItem> result = reRanker.reRank(
                List.of(blankItem, validItem),
                Map.of(
                        "1", 10L,
                        "movie-2", 20L),
                10);

        assertEquals(2, result.size());
        assertEquals("1", result.get(0).itemKey());
        assertEquals("movie-2", result.get(1).itemKey());
    }

    @Test
    void reRank_shouldLimitSamePrimaryGenreInTopPartOfList() {
        GenreDiversityReRanker strictReRanker = new GenreDiversityReRanker(1);

        RecommendationItem action1 = item(1L, "action-1", 0.99);
        RecommendationItem action2 = item(2L, "action-2", 0.98);
        RecommendationItem drama1 = item(3L, "drama-1", 0.70);
        RecommendationItem comedy1 = item(4L, "comedy-1", 0.60);

        List<RecommendationItem> result = strictReRanker.reRank(
                List.of(action1, action2, drama1, comedy1),
                Map.of(
                        "action-1", 10L,
                        "action-2", 10L,
                        "drama-1", 20L,
                        "comedy-1", 30L),
                4);

        assertEquals(4, result.size());
        assertEquals("action-1", result.get(0).itemKey());
        assertEquals("drama-1", result.get(1).itemKey());
        assertEquals("comedy-1", result.get(2).itemKey());
        assertEquals("action-2", result.get(3).itemKey());
    }

    @Test
    void reRank_shouldUseDefaultLimitTwenty_whenLimitIsInvalid() {
        List<RecommendationItem> items = List.of(
                item(1L, "movie-1", 0.90),
                item(2L, "movie-2", 0.80),
                item(3L, "movie-3", 0.70));

        List<RecommendationItem> result = reRanker.reRank(
                items,
                Map.of(
                        "movie-1", 10L,
                        "movie-2", 20L,
                        "movie-3", 30L),
                0);

        assertEquals(3, result.size());
    }

    private RecommendationItem item(Long movieId, String itemKey, double finalScore) {
        ScoringMovie movie = ScoringMovie.of(
                movieId,
                itemKey,
                2024,
                4.0,
                10,
                100L);

        return new RecommendationItem(movie, finalScore, null);
    }
}