package com.example.movierecommendation.genre.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GenreRequest {

    @NotBlank(message = "Genre name is required")
    private String name;

    private String description;

    private String status;
}