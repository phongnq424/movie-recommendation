package com.example.movierecommendation.recommendation.ml;

public record LearnedMovieRetrievalResult(
        Long movieId,
        Double retrievalScore
) {
}