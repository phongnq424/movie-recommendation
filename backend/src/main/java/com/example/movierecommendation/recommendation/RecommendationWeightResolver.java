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

        if (ratingCount == 0) {
            return RecommendationWeights.newUser();
        }

        if (ratingCount < 5) {
            return RecommendationWeights.lightUser();
        }

        if (context.getSimilarUserCount() < 3) {
            return RecommendationWeights.contentHeavy();
        }

        return RecommendationWeights.personalized();
    }

    public RecommendationWeights anonymous() {
        return RecommendationWeights.anonymous();
    }
}