package com.example.movierecommendation.catalog.domain.model;

public record MovieSemanticSearchResult(
        CatalogMovie movie,
        double similarity
) {
}