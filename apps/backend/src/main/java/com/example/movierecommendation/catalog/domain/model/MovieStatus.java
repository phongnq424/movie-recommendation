package com.example.movierecommendation.catalog.domain.model;

public enum MovieStatus {
    DRAFT,
    PUBLISHED,
    HIDDEN,
    DELETED,
    UNKNOWN;

    public static MovieStatus from(String value) {
        if (value == null || value.isBlank()) {
            return UNKNOWN;
        }

        try {
            return MovieStatus.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException exception) {
            return UNKNOWN;
        }
    }
}