package com.example.movierecommendation.moviegenre.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class MovieGenreRequest {

    @NotNull(message = "Movie public ID is required")
    private UUID moviePublicId;

    @NotNull(message = "Genre public ID is required")
    private UUID genrePublicId;
}