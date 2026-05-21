package com.example.movierecommendation.recommendation.dto;

import com.example.movierecommendation.rating.Rating;
import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.Map;
import java.util.Set;

@Getter
@Builder
public class RecommendationContext {

    private List<Rating> userRatings;

    private Map<Long, Double> userGenreWeights;
    private Map<Long, Double> userActorWeights;

    private Map<Long, Double> movieInterestScores;

    private Map<Long, Set<Long>> candidateGenreIds;
    private Map<Long, Set<Long>> candidateActorIds;

    private Map<Long, Double> collaborativeScores;
    private Map<Long, Double> sentimentScores;

    private int similarUserCount;
    private int interactionCount;

    private int maxRatingCount;
    private long maxViewCount;

    private int currentYear;
}