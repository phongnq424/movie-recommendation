package com.example.movierecommendation.catalog.domain.model;

import java.util.UUID;

public record CatalogMovie(
        Long id,
        UUID publicId,
        String title,
        String slug,
        String posterUrl,
        Integer releaseYear,
        Double averageRating,
        Integer ratingCount,
        Long viewCount,
        MovieStatus status
) {
    public boolean isPublished() {
        return status == MovieStatus.PUBLISHED;
    }
}