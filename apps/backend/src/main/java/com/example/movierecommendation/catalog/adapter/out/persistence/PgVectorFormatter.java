package com.example.movierecommendation.catalog.adapter.out.persistence;

import com.example.movierecommendation.catalog.domain.model.EmbeddingVector;

import java.util.stream.Collectors;

public final class PgVectorFormatter {

    private PgVectorFormatter() {
    }

    public static String format(EmbeddingVector vector) {
        return vector.values()
                .stream()
                .map(String::valueOf)
                .collect(Collectors.joining(",", "[", "]"));
    }
}