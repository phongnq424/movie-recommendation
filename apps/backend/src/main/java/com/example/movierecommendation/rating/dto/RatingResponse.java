package com.example.movierecommendation.rating.dto;

import com.example.movierecommendation.rating.Rating;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@Builder
public class RatingResponse {

    private Long id;
    private UUID userPublicId;
    private UUID moviePublicId;
    private String userFullName;
    private String movieTitle;
    private Double ratingValue;

    public static RatingResponse from(Rating rating) {
        return RatingResponse.builder()
                .id(rating.getId())
                .userPublicId(rating.getUser().getPublicId())
                .userFullName(rating.getUser().getFullName())
                .moviePublicId(rating.getMovie().getPublicId())
                .movieTitle(rating.getMovie().getTitle())
                .ratingValue(rating.getRatingValue())
                .build();
    }
}