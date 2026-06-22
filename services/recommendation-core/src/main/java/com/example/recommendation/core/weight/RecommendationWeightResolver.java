package com.example.recommendation.core.weight;

import com.example.recommendation.core.model.ScoringContext;

public class RecommendationWeightResolver {

    private final RecommendationWeightPolicy policy;

    public RecommendationWeightResolver() {
        this(RecommendationWeightPolicy.defaults());
    }

    public RecommendationWeightResolver(RecommendationWeightPolicy policy) {
        this.policy = policy == null
                ? RecommendationWeightPolicy.defaults()
                : policy;
    }

    public RecommendationWeights resolve(ScoringContext context) {
        return policy.resolve(context);
    }

    public RecommendationWeights anonymous() {
        return policy.anonymous();
    }
}