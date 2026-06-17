package com.example.movierecommendation.movieactor.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class SetMovieActorsRequest {

    @NotNull(message = "Actors are required")
    @Valid
    private List<MovieActorItemRequest> actors;
}