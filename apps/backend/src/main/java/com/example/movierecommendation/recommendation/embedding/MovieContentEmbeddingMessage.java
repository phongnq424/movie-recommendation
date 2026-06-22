package com.example.movierecommendation.recommendation.embedding;

public record MovieContentEmbeddingMessage(
        Long movieId,
        String reason
) {
}