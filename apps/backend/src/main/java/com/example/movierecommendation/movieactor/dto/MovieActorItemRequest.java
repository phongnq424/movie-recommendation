package com.example.movierecommendation.movieactor.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class MovieActorItemRequest {

    @NotNull(message = "Actor public ID is required")
    private UUID actorPublicId;

    private String characterName;

    private Integer castOrder;

    private Boolean mainCast;
}