package com.example.recommendation.core.weight;

import com.example.recommendation.core.model.ScoringContext;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class RecommendationWeightResolverTest {

    private final RecommendationWeightResolver resolver = new RecommendationWeightResolver();

    @Test
    void anonymous_shouldReturnAnonymousWeights() {
        RecommendationWeights weights = resolver.anonymous();

        assertEquals("ANONYMOUS", weights.getStrategy());
        assertEquals(0.00, weights.getContent(), 0.0001);
        assertEquals(0.00, weights.getCollaborative(), 0.0001);
        assertEquals(0.60, weights.getPopularity(), 0.0001);
        assertEquals(0.25, weights.getFreshness(), 0.0001);
        assertEquals(0.15, weights.getSentiment(), 0.0001);
    }

    @Test
    void resolve_shouldReturnNewUserWeights_whenUserHasNoRatingAndNoInteraction() {
        ScoringContext context = ScoringContext.builder()
                .userRatingCount(0)
                .interactionCount(0)
                .build();

        RecommendationWeights weights = resolver.resolve(context);

        assertEquals("NEW_USER", weights.getStrategy());
    }

    @Test
    void resolve_shouldReturnLightPersonalizationWeights_whenUserHasLittleData() {
        ScoringContext context = ScoringContext.builder()
                .userRatingCount(2)
                .interactionCount(4)
                .build();

        RecommendationWeights weights = resolver.resolve(context);

        assertEquals("LIGHT_PERSONALIZATION_WITH_ALS", weights.getStrategy());
        assertEquals(0.40, weights.getContent(), 0.0001);
        assertEquals(0.20, weights.getCollaborative(), 0.0001);
    }

    @Test
    void resolve_shouldReturnContentHeavyWeights_whenRatingCountIsLessThanFive() {
        ScoringContext context = ScoringContext.builder()
                .userRatingCount(4)
                .interactionCount(10)
                .build();

        RecommendationWeights weights = resolver.resolve(context);

        assertEquals("CONTENT_HEAVY_WITH_ALS", weights.getStrategy());
    }

    @Test
    void resolve_shouldReturnPersonalizedWeights_whenUserHasEnoughData() {
        ScoringContext context = ScoringContext.builder()
                .userRatingCount(8)
                .interactionCount(20)
                .build();

        RecommendationWeights weights = resolver.resolve(context);

        assertEquals("PERSONALIZED_LEARNED_HYBRID", weights.getStrategy());
        assertEquals(0.30, weights.getContent(), 0.0001);
        assertEquals(0.35, weights.getCollaborative(), 0.0001);
    }

    @Test
    void resolve_shouldTreatNullContextAsNewUser() {
        RecommendationWeights weights = resolver.resolve(null);

        assertEquals("NEW_USER", weights.getStrategy());
    }
}