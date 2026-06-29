package com.example.movierecommendation.catalog.application.query;

import java.util.UUID;

public record FindSimilarMoviesQuery(
        UUID moviePublicId,
        int limit
) {
    private static final int DEFAULT_LIMIT = 20;
    private static final int MAX_LIMIT = 50;

    public FindSimilarMoviesQuery {
        if (moviePublicId == null) {
            throw new IllegalArgumentException("Movie public id is required");
        }

        limit = normalizeLimit(limit);
    }

    private static int normalizeLimit(int value) {
        if (value <= 0) {
            return DEFAULT_LIMIT;
        }

        return Math.min(value, MAX_LIMIT);
    }
}