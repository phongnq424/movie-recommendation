package com.example.movierecommendation.movie.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class BulkMovieDeleteRequest {

    @NotEmpty(message = "Movie public IDs are required")
    private List<UUID> publicIds;
}