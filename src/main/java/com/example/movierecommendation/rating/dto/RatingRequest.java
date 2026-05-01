package com.example.movierecommendation.rating.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RatingRequest {
    private Long userId;
    private Long movieId;
    private Double ratingValue;
}