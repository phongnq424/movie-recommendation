package com.example.movierecommendation.recommendation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
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
    private Double negativePenalty;

    private String strategy;
}