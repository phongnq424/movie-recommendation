package com.example.movierecommendation.interaction.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TrackInteractionRequest {

    private String interactionType;

    private Double value;

    private Integer watchedSeconds;

    private Integer durationSeconds;

    private Double progressPercent;
}