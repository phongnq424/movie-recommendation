package com.example.recommendation.core.model;

public class RecommendationItem {

    private final ScoringMovie movie;
    private final double finalScore;
    private final ScoreBreakdown scoreBreakdown;

    public RecommendationItem(
            ScoringMovie movie,
            double finalScore,
            ScoreBreakdown scoreBreakdown
    ) {
        this.movie = movie;
        this.finalScore = finalScore;
        this.scoreBreakdown = scoreBreakdown;
    }

    public ScoringMovie getMovie() {
        return movie;
    }

    public double getFinalScore() {
        return finalScore;
    }

    public ScoreBreakdown getScoreBreakdown() {
        return scoreBreakdown;
    }

    public String itemKey() {
        return movie == null ? null : movie.stableItemKey();
    }
}
