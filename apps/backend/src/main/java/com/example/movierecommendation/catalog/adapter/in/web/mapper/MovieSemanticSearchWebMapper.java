package com.example.movierecommendation.catalog.adapter.in.web.mapper;

import com.example.movierecommendation.catalog.adapter.in.web.dto.MovieSemanticSearchResponse;
import com.example.movierecommendation.catalog.application.result.MovieSemanticSearchItem;

public final class MovieSemanticSearchWebMapper {

    private MovieSemanticSearchWebMapper() {
    }

    public static MovieSemanticSearchResponse toResponse(MovieSemanticSearchItem item) {
        return MovieSemanticSearchResponse.builder()
                .publicId(item.publicId())
                .title(item.title())
                .slug(item.slug())
                .posterUrl(item.posterUrl())
                .releaseYear(item.releaseYear())
                .averageRating(item.averageRating())
                .ratingCount(item.ratingCount())
                .viewCount(item.viewCount())
                .similarity(item.similarity())
                .build();
    }
}