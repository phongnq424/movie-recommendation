package com.example.movierecommendation.moviegenre.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MovieGenreRequest {

    @NotNull(message = "Movie ID is required")
    private Long movieId;

    @NotNull(message = "Genre ID is required")
    private Long genreId;
}