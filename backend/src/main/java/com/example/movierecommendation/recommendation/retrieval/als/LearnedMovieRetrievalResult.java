package com.example.movierecommendation.recommendation.retrieval.als;

public record LearnedMovieRetrievalResult(
        Long movieId,
        Double retrievalScore
) {
}