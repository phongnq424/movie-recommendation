package com.example.movierecommendation.recommendation.retrieval;

public enum CandidateSource {
    ALS_RETRIEVAL,
    CONTENT_EMBEDDING_RETRIEVAL,
    FALLBACK_RULE_CANDIDATE,
    ANONYMOUS_FALLBACK
}