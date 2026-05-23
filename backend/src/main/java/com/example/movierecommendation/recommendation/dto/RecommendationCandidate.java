package com.example.movierecommendation.recommendation.dto;

import com.example.movierecommendation.movie.Movie;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class RecommendationCandidate {

    private Movie movie;
    private double retrievalScore;
}