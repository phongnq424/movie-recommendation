package com.example.movierecommendation.recommendation.scheduler;

import lombok.Getter;

import java.util.UUID;

@Getter
public class RecommendationRefreshRequestedEvent {

    private final UUID userPublicId;
    private final String reason;

    public RecommendationRefreshRequestedEvent(UUID userPublicId, String reason) {
        this.userPublicId = userPublicId;
        this.reason = reason;
    }
}