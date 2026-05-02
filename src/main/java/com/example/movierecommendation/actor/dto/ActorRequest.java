package com.example.movierecommendation.actor.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ActorRequest {

    private String fullName;
    private String biography;
    private String avatarUrl;
    private String nationality;
    private Integer birthYear;
    private Boolean featured;
}