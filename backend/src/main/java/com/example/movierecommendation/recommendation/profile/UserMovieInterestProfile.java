package com.example.movierecommendation.recommendation.profile;

import lombok.Builder;
import lombok.Getter;

import java.util.Map;

@Getter
@Builder
public class UserMovieInterestProfile {

    private Map<Long, Double> movieInterestScores;
    private int interactionCount;
}