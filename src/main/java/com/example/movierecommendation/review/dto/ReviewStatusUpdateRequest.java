package com.example.movierecommendation.review.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReviewStatusUpdateRequest {

    @NotBlank(message = "Status is required")
    private String status;
}