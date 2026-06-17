package com.example.recommendation.core.weight;

import com.example.recommendation.core.model.ScoringContext;

public class RecommendationWeightResolver {

    public RecommendationWeights resolve(ScoringContext context) {
        int ratingCount = context == null ? 0 : context.getUserRatingCount();
        int interactionCount = context == null ? 0 : context.getInteractionCount();

        if (ratingCount == 0 && interactionCount == 0) {
            return RecommendationWeights.newUser();
        }

        if (ratingCount < 3 && interactionCount < 5) {
            return RecommendationWeights.lightUser();
        }

        if (ratingCount < 5) {
            return RecommendationWeights.contentHeavy();
        }

        return RecommendationWeights.personalized();
    }

    public RecommendationWeights anonymous() {
        return RecommendationWeights.anonymous();
    }
}
