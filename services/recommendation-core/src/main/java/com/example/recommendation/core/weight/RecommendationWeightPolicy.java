package com.example.recommendation.core.weight;

import com.example.recommendation.core.model.ScoringContext;

public class RecommendationWeightPolicy {

    private final int lightUserRatingThreshold;
    private final int lightUserInteractionThreshold;
    private final int contentHeavyRatingThreshold;

    private final RecommendationWeights anonymousWeights;
    private final RecommendationWeights newUserWeights;
    private final RecommendationWeights lightUserWeights;
    private final RecommendationWeights contentHeavyWeights;
    private final RecommendationWeights personalizedWeights;

    public RecommendationWeightPolicy(
            int lightUserRatingThreshold,
            int lightUserInteractionThreshold,
            int contentHeavyRatingThreshold,
            RecommendationWeights anonymousWeights,
            RecommendationWeights newUserWeights,
            RecommendationWeights lightUserWeights,
            RecommendationWeights contentHeavyWeights,
            RecommendationWeights personalizedWeights) {
        this.lightUserRatingThreshold = lightUserRatingThreshold;
        this.lightUserInteractionThreshold = lightUserInteractionThreshold;
        this.contentHeavyRatingThreshold = contentHeavyRatingThreshold;
        this.anonymousWeights = anonymousWeights;
        this.newUserWeights = newUserWeights;
        this.lightUserWeights = lightUserWeights;
        this.contentHeavyWeights = contentHeavyWeights;
        this.personalizedWeights = personalizedWeights;
    }

    public static RecommendationWeightPolicy defaults() {
        return new RecommendationWeightPolicy(
                3,
                5,
                5,
                RecommendationWeights.anonymous(),
                RecommendationWeights.newUser(),
                RecommendationWeights.lightUser(),
                RecommendationWeights.contentHeavy(),
                RecommendationWeights.personalized());
    }

    public RecommendationWeights resolve(ScoringContext context) {
        int ratingCount = context == null ? 0 : context.getUserRatingCount();
        int interactionCount = context == null ? 0 : context.getInteractionCount();

        if (ratingCount == 0 && interactionCount == 0) {
            return newUserWeights;
        }

        if (ratingCount < lightUserRatingThreshold
                && interactionCount < lightUserInteractionThreshold) {
            return lightUserWeights;
        }

        if (ratingCount < contentHeavyRatingThreshold) {
            return contentHeavyWeights;
        }

        return personalizedWeights;
    }

    public RecommendationWeights anonymous() {
        return anonymousWeights;
    }
}