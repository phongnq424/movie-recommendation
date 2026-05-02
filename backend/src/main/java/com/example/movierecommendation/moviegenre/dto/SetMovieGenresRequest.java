package com.example.movierecommendation.moviegenre.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class SetMovieGenresRequest {

    @NotNull(message = "Genre public IDs are required")
    private List<UUID> genrePublicIds;
}