package com.example.movierecommendation.movieactor.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MovieActorRequest {

    private Long movieId;
    private Long actorId;
    private String characterName;
    private Integer castOrder;
    private Boolean mainCast;
}