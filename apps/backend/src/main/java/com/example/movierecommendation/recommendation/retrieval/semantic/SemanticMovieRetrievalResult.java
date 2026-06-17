package com.example.movierecommendation.recommendation.retrieval.semantic;

public record SemanticMovieRetrievalResult(
        Long movieId,
        Double semanticContentScore
) {
}
