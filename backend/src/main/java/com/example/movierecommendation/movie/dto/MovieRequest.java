package com.example.movierecommendation.movie.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MovieRequest {

    @NotBlank(message = "Movie title is required")
    private String title;

    private String originalTitle;

    private String description;

    @NotNull(message = "Release year is required")
    private Integer releaseYear;

    private Integer durationMinutes;

    private String posterUrl;

    private String backdropUrl;

    private String trailerUrl;

    private String movieUrl;

    private String quality;

    private String ageRating;

    private String status;
}