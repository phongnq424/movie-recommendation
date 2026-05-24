package com.example.movierecommendation.recommendation;

import com.example.movierecommendation.recommendation.dto.RecommendationContext;
import com.example.movierecommendation.recommendation.dto.RecommendationWeights;
import org.springframework.stereotype.Component;

@Component
public class RecommendationWeightResolver {

    public RecommendationWeights resolve(RecommendationContext context) {
        int ratingCount = context.getUserRatings() == null
                ? 0
                : context.getUserRatings().size();

        int interactionCount = context.getInteractionCount();

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