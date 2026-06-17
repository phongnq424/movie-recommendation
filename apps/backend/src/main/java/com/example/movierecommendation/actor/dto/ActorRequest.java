package com.example.movierecommendation.actor.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ActorRequest {

    @NotBlank(message = "Actor full name is required")
    private String fullName;

    private String biography;

    private String avatarUrl;

    private String nationality;

    private Integer birthYear;

    private Boolean featured;

    private String status;
}