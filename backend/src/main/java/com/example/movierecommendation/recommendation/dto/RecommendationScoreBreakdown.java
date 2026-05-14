package com.example.movierecommendation.recommendation.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class RecommendationScoreBreakdown {

    private Double contentScore;
    private Double collaborativeScore;
    private Double popularityScore;
    private Double freshnessScore;
    private Double sentimentScore;

    private Double contentWeight;
    private Double collaborativeWeight;
    private Double popularityWeight;
    private Double freshnessWeight;
    private Double sentimentWeight;

    private String strategy;
}