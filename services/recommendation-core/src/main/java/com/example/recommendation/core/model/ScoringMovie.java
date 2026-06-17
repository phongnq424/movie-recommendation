package com.example.recommendation.core.model;

import java.util.Objects;

public class ScoringMovie {

    private final Long movieId;
    private final String itemKey;
    private final Integer releaseYear;
    private final Double averageRating;
    private final Integer ratingCount;
    private final Long viewCount;

    public ScoringMovie(
            Long movieId,
            String itemKey,
            Integer releaseYear,
            Double averageRating,
            Integer ratingCount,
            Long viewCount
    ) {
        this.movieId = movieId;
        this.itemKey = itemKey;
        this.releaseYear = releaseYear;
        this.averageRating = averageRating;
        this.ratingCount = ratingCount;
        this.viewCount = viewCount;
    }

    public static ScoringMovie of(
            Long movieId,
            String itemKey,
            Integer releaseYear,
            Double averageRating,
            Integer ratingCount,
            Long viewCount
    ) {
        return new ScoringMovie(
                movieId,
                itemKey,
                releaseYear,
                averageRating,
                ratingCount,
                viewCount
        );
    }

    public Long getMovieId() {
        return movieId;
    }

    public String getItemKey() {
        return itemKey;
    }

    public Integer getReleaseYear() {
        return releaseYear;
    }

    public Double getAverageRating() {
        return averageRating;
    }

    public Integer getRatingCount() {
        return ratingCount;
    }

    public Long getViewCount() {
        return viewCount;
    }

    public String stableItemKey() {
        if (itemKey != null && !itemKey.isBlank()) {
            return itemKey;
        }

        return Objects.toString(movieId, null);
    }
}
