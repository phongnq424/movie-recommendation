package com.example.movierecommendation.recommendation.dto;

import com.example.movierecommendation.movie.Movie;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class RecommendationCandidate {

    private Movie movie;
    private double retrievalScore;
    private Double collaborativeScore;
    private Double semanticContentScore;
    private String source;
}