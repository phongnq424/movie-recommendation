package com.example.movierecommendation.review.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class ReviewRequest {

    @NotNull(message = "Movie ID is required")
    private UUID moviePublicId;

    @NotBlank(message = "Review content is required")
    @Size(max = 3000, message = "Review content must not exceed 3000 characters")
    private String content;

    private Boolean spoiler;
}