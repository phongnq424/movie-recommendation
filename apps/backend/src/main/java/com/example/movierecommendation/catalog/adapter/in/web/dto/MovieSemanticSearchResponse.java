package com.example.movierecommendation.catalog.adapter.in.web.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.UUID;

@Getter
@Builder
public class MovieSemanticSearchResponse {

    private UUID publicId;
    private String title;
    private String slug;
    private String posterUrl;
    private Integer releaseYear;
    private Double averageRating;
    private Integer ratingCount;
    private Long viewCount;
    private Double similarity;
}