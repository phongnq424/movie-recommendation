package com.example.movierecommendation.rating.dto;

import com.example.movierecommendation.rating.Rating;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class RatingResponse {

    private Long id;
    private Long userId;
    private String userFullName;
    private Long movieId;
    private String movieTitle;
    private Double ratingValue;

    public static RatingResponse from(Rating rating) {
        return RatingResponse.builder()
                .id(rating.getId())
                .userId(rating.getUser().getId())
                .userFullName(rating.getUser().getFullName())
                .movieId(rating.getMovie().getId())
                .movieTitle(rating.getMovie().getTitle())
                .ratingValue(rating.getRatingValue())
                .build();
    }
}