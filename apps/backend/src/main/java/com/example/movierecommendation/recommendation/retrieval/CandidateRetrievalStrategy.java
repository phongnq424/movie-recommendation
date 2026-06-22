package com.example.movierecommendation.recommendation.retrieval;

import com.example.movierecommendation.recommendation.dto.RecommendationCandidate;
import com.example.movierecommendation.user.User;

import java.util.List;

public interface CandidateRetrievalStrategy {

    CandidateSource source();

    double userCandidatePortion();

    default boolean supportsUser(User user) {
        return user != null && user.getId() != null;
    }

    default boolean supportsAnonymous() {
        return false;
    }

    List<RecommendationCandidate> retrieveForUser(User user, int candidateLimit);

    default List<RecommendationCandidate> retrieveForAnonymous(int candidateLimit) {
        return List.of();
    }
}