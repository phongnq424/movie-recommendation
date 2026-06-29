package com.example.movierecommendation.catalog.domain.model;

import java.util.List;

public record EmbeddingVector(
        List<Double> values
) {
    public EmbeddingVector {
        if (values == null || values.isEmpty()) {
            throw new IllegalArgumentException("Embedding vector is empty");
        }

        for (Double value : values) {
            if (value == null || value.isNaN() || value.isInfinite()) {
                throw new IllegalArgumentException("Embedding vector contains invalid value");
            }
        }

        values = List.copyOf(values);
    }

    public int dimension() {
        return values.size();
    }
}