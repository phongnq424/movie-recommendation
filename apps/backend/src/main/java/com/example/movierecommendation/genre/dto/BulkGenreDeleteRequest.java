package com.example.movierecommendation.genre.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class BulkGenreDeleteRequest {

    @NotEmpty(message = "Genre public IDs are required")
    private List<UUID> publicIds;
}