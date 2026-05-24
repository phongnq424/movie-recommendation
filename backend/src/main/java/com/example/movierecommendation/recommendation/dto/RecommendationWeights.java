package com.example.movierecommendation.recommendation.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class RecommendationWeights {

    private double content;
    private double collaborative;
    private double popularity;
    private double freshness;
    private double sentiment;
    private String strategy;

    public static RecommendationWeights anonymous() {
        return RecommendationWeights.builder()
                .content(0.00)
                .collaborative(0.00)
                .popularity(0.60)
                .freshness(0.25)
                .sentiment(0.15)
                .strategy("ANONYMOUS")
                .build();
    }

    public static RecommendationWeights newUser() {
        return RecommendationWeights.builder()
                .content(0.00)
                .collaborative(0.00)
                .popularity(0.55)
                .freshness(0.30)
                .sentiment(0.15)
                .strategy("NEW_USER")
                .build();
    }

    public static RecommendationWeights lightUser() {
        return RecommendationWeights.builder()
                .content(0.45)
                .collaborative(0.00)
                .popularity(0.25)
                .freshness(0.20)
                .sentiment(0.10)
                .strategy("LIGHT_PERSONALIZATION")
                .build();
    }

    public static RecommendationWeights contentHeavy() {
        return RecommendationWeights.builder()
                .content(0.55)
                .collaborative(0.00)
                .popularity(0.20)
                .freshness(0.15)
                .sentiment(0.10)
                .strategy("CONTENT_HEAVY")
                .build();
    }

    public static RecommendationWeights personalized() {
        return RecommendationWeights.builder()
                .content(0.40)
                .collaborative(0.00)
                .popularity(0.25)
                .freshness(0.20)
                .sentiment(0.15)
                .strategy("PERSONALIZED_LEARNED_RETRIEVAL")
                .build();
    }
}