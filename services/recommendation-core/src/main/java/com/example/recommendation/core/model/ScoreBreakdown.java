package com.example.recommendation.core.model;

public class ScoreBreakdown {

    private final double contentScore;
    private final double collaborativeScore;
    private final double popularityScore;
    private final double freshnessScore;
    private final double sentimentScore;
    private final double negativePenalty;

    private final double contentWeight;
    private final double collaborativeWeight;
    private final double popularityWeight;
    private final double freshnessWeight;
    private final double sentimentWeight;

    private final String strategy;

    public ScoreBreakdown(
            double contentScore,
            double collaborativeScore,
            double popularityScore,
            double freshnessScore,
            double sentimentScore,
            double negativePenalty,
            double contentWeight,
            double collaborativeWeight,
            double popularityWeight,
            double freshnessWeight,
            double sentimentWeight,
            String strategy
    ) {
        this.contentScore = contentScore;
        this.collaborativeScore = collaborativeScore;
        this.popularityScore = popularityScore;
        this.freshnessScore = freshnessScore;
        this.sentimentScore = sentimentScore;
        this.negativePenalty = negativePenalty;
        this.contentWeight = contentWeight;
        this.collaborativeWeight = collaborativeWeight;
        this.popularityWeight = popularityWeight;
        this.freshnessWeight = freshnessWeight;
        this.sentimentWeight = sentimentWeight;
        this.strategy = strategy;
    }

    public double getContentScore() {
        return contentScore;
    }

    public double getCollaborativeScore() {
        return collaborativeScore;
    }

    public double getPopularityScore() {
        return popularityScore;
    }

    public double getFreshnessScore() {
        return freshnessScore;
    }

    public double getSentimentScore() {
        return sentimentScore;
    }

    public double getNegativePenalty() {
        return negativePenalty;
    }

    public double getContentWeight() {
        return contentWeight;
    }

    public double getCollaborativeWeight() {
        return collaborativeWeight;
    }

    public double getPopularityWeight() {
        return popularityWeight;
    }

    public double getFreshnessWeight() {
        return freshnessWeight;
    }

    public double getSentimentWeight() {
        return sentimentWeight;
    }

    public String getStrategy() {
        return strategy;
    }
}
