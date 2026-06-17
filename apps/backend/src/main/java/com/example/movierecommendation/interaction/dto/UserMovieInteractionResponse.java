package com.example.movierecommendation.interaction.dto;

import com.example.movierecommendation.interaction.UserMovieInteraction;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
public class UserMovieInteractionResponse {

    private Long id;

    private UUID moviePublicId;

    private String movieTitle;

    private String interactionType;

    private Double value;

    private Integer watchedSeconds;

    private Integer durationSeconds;

    private Double progressPercent;

    private Boolean completed;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    public static UserMovieInteractionResponse from(UserMovieInteraction interaction) {
        return UserMovieInteractionResponse.builder()
                .id(interaction.getId())
                .moviePublicId(interaction.getMovie().getPublicId())
                .movieTitle(interaction.getMovie().getTitle())
                .interactionType(interaction.getInteractionType())
                .value(interaction.getValue())
                .watchedSeconds(interaction.getWatchedSeconds())
                .durationSeconds(interaction.getDurationSeconds())
                .progressPercent(interaction.getProgressPercent())
                .completed(interaction.getCompleted())
                .createdAt(interaction.getCreatedAt())
                .updatedAt(interaction.getUpdatedAt())
                .build();
    }
}