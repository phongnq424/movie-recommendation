package com.example.movierecommendation.catalog.application.query;

public record SearchMoviesByTextQuery(
        String text,
        int limit
) {
    private static final int DEFAULT_LIMIT = 20;
    private static final int MAX_LIMIT = 50;

    public SearchMoviesByTextQuery {
        if (text == null || text.isBlank()) {
            throw new IllegalArgumentException("Search text is required");
        }

        text = text.trim();
        limit = normalizeLimit(limit);
    }

    private static int normalizeLimit(int value) {
        if (value <= 0) {
            return DEFAULT_LIMIT;
        }

        return Math.min(value, MAX_LIMIT);
    }
}