package com.example.movierecommendation.catalog.adapter.in.web.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MovieSemanticSearchRequest {

    @NotBlank(message = "Search query is required")
    private String query;

    private Integer limit;
}