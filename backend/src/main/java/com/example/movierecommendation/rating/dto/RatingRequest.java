package com.example.movierecommendation.rating.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class RatingRequest {
    @NotNull(message = "User public ID is required")
    private UUID userPublicId;

    @NotNull(message = "Movie public ID is required")
    private UUID moviePublicId;

    private Double ratingValue;
}