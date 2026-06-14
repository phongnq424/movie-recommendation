package com.example.recommendation.core.weight;

public class RecommendationWeights {

    private final double content;
    private final double collaborative;
    private final double popularity;
    private final double freshness;
    private final double sentiment;
    private final String strategy;

    public RecommendationWeights(
            double content,
            double collaborative,
            double popularity,
            double freshness,
            double sentiment,
            String strategy
    ) {
        this.content = content;
        this.collaborative = collaborative;
        this.popularity = popularity;
        this.freshness = freshness;
        this.sentiment = sentiment;
        this.strategy = strategy;
    }

    public static RecommendationWeights anonymous() {
        return new RecommendationWeights(0.00, 0.00, 0.60, 0.25, 0.15, "ANONYMOUS");
    }

    public static RecommendationWeights newUser() {
        return new RecommendationWeights(0.00, 0.00, 0.55, 0.30, 0.15, "NEW_USER");
    }

    public static RecommendationWeights lightUser() {
        return new RecommendationWeights(0.40, 0.20, 0.25, 0.10, 0.05, "LIGHT_PERSONALIZATION_WITH_ALS");
    }

    public static RecommendationWeights contentHeavy() {
        return new RecommendationWeights(0.45, 0.20, 0.20, 0.10, 0.05, "CONTENT_HEAVY_WITH_ALS");
    }

    public static RecommendationWeights personalized() {
        return new RecommendationWeights(0.30, 0.35, 0.15, 0.10, 0.10, "PERSONALIZED_LEARNED_HYBRID");
    }

    public double getContent() {
        return content;
    }

    public double getCollaborative() {
        return collaborative;
    }

    public double getPopularity() {
        return popularity;
    }

    public double getFreshness() {
        return freshness;
    }

    public double getSentiment() {
        return sentiment;
    }

    public String getStrategy() {
        return strategy;
    }
}
