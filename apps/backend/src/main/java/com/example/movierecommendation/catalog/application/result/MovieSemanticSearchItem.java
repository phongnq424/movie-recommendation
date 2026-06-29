package com.example.movierecommendation.catalog.application.result;

import java.util.UUID;

public record MovieSemanticSearchItem(
        UUID publicId,
        String title,
        String slug,
        String posterUrl,
        Integer releaseYear,
        Double averageRating,
        Integer ratingCount,
        Long viewCount,
        double similarity
) {
}