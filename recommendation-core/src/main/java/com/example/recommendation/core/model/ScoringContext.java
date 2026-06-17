package com.example.recommendation.core.model;

import java.util.Map;
import java.util.Set;

public class ScoringContext {

    private final int userRatingCount;
    private final int similarUserCount;
    private final int interactionCount;
    private final int maxRatingCount;
    private final long maxViewCount;
    private final int currentYear;

    private final Map<Long, Double> userGenreWeights;
    private final Map<Long, Double> userActorWeights;
    private final Map<Long, Set<Long>> candidateGenreIds;
    private final Map<Long, Set<Long>> candidateActorIds;
    private final Map<Long, Double> genreIdfScores;
    private final Map<Long, Double> actorIdfScores;
    private final Map<Long, Double> collaborativeScores;
    private final Map<Long, Double> semanticContentScores;
    private final Map<Long, Double> sentimentScores;

    private ScoringContext(Builder builder) {
        this.userRatingCount = builder.userRatingCount;
        this.similarUserCount = builder.similarUserCount;
        this.interactionCount = builder.interactionCount;
        this.maxRatingCount = builder.maxRatingCount;
        this.maxViewCount = builder.maxViewCount;
        this.currentYear = builder.currentYear;
        this.userGenreWeights = safeMap(builder.userGenreWeights);
        this.userActorWeights = safeMap(builder.userActorWeights);
        this.candidateGenreIds = safeMap(builder.candidateGenreIds);
        this.candidateActorIds = safeMap(builder.candidateActorIds);
        this.genreIdfScores = safeMap(builder.genreIdfScores);
        this.actorIdfScores = safeMap(builder.actorIdfScores);
        this.collaborativeScores = safeMap(builder.collaborativeScores);
        this.semanticContentScores = safeMap(builder.semanticContentScores);
        this.sentimentScores = safeMap(builder.sentimentScores);
    }

    public static Builder builder() {
        return new Builder();
    }

    public int getUserRatingCount() {
        return userRatingCount;
    }

    public int getSimilarUserCount() {
        return similarUserCount;
    }

    public int getInteractionCount() {
        return interactionCount;
    }

    public int getMaxRatingCount() {
        return maxRatingCount;
    }

    public long getMaxViewCount() {
        return maxViewCount;
    }

    public int getCurrentYear() {
        return currentYear;
    }

    public Map<Long, Double> getUserGenreWeights() {
        return userGenreWeights;
    }

    public Map<Long, Double> getUserActorWeights() {
        return userActorWeights;
    }

    public Map<Long, Set<Long>> getCandidateGenreIds() {
        return candidateGenreIds;
    }

    public Map<Long, Set<Long>> getCandidateActorIds() {
        return candidateActorIds;
    }

    public Map<Long, Double> getGenreIdfScores() {
        return genreIdfScores;
    }

    public Map<Long, Double> getActorIdfScores() {
        return actorIdfScores;
    }

    public Map<Long, Double> getCollaborativeScores() {
        return collaborativeScores;
    }

    /**
     * Semantic content score produced from content embeddings.
     *
     * This is intentionally not a new top-level score beside contentScore.
     * In HybridScoreCalculator it replaces the structured genre/actor content score
     * when a semantic score is available for the candidate movie. Genre/actor remains
     * a fallback for movies without content embeddings.
     */
    public Map<Long, Double> getSemanticContentScores() {
        return semanticContentScores;
    }

    public Map<Long, Double> getSentimentScores() {
        return sentimentScores;
    }

    private static <K, V> Map<K, V> safeMap(Map<K, V> value) {
        return value == null ? Map.of() : value;
    }

    public static class Builder {
        private int userRatingCount;
        private int similarUserCount;
        private int interactionCount;
        private int maxRatingCount;
        private long maxViewCount;
        private int currentYear;
        private Map<Long, Double> userGenreWeights;
        private Map<Long, Double> userActorWeights;
        private Map<Long, Set<Long>> candidateGenreIds;
        private Map<Long, Set<Long>> candidateActorIds;
        private Map<Long, Double> genreIdfScores;
        private Map<Long, Double> actorIdfScores;
        private Map<Long, Double> collaborativeScores;
        private Map<Long, Double> semanticContentScores;
        private Map<Long, Double> sentimentScores;

        public Builder userRatingCount(int userRatingCount) {
            this.userRatingCount = userRatingCount;
            return this;
        }

        public Builder similarUserCount(int similarUserCount) {
            this.similarUserCount = similarUserCount;
            return this;
        }

        public Builder interactionCount(int interactionCount) {
            this.interactionCount = interactionCount;
            return this;
        }

        public Builder maxRatingCount(int maxRatingCount) {
            this.maxRatingCount = maxRatingCount;
            return this;
        }

        public Builder maxViewCount(long maxViewCount) {
            this.maxViewCount = maxViewCount;
            return this;
        }

        public Builder currentYear(int currentYear) {
            this.currentYear = currentYear;
            return this;
        }

        public Builder userGenreWeights(Map<Long, Double> userGenreWeights) {
            this.userGenreWeights = userGenreWeights;
            return this;
        }

        public Builder userActorWeights(Map<Long, Double> userActorWeights) {
            this.userActorWeights = userActorWeights;
            return this;
        }

        public Builder candidateGenreIds(Map<Long, Set<Long>> candidateGenreIds) {
            this.candidateGenreIds = candidateGenreIds;
            return this;
        }

        public Builder candidateActorIds(Map<Long, Set<Long>> candidateActorIds) {
            this.candidateActorIds = candidateActorIds;
            return this;
        }

        public Builder genreIdfScores(Map<Long, Double> genreIdfScores) {
            this.genreIdfScores = genreIdfScores;
            return this;
        }

        public Builder actorIdfScores(Map<Long, Double> actorIdfScores) {
            this.actorIdfScores = actorIdfScores;
            return this;
        }

        public Builder collaborativeScores(Map<Long, Double> collaborativeScores) {
            this.collaborativeScores = collaborativeScores;
            return this;
        }

        public Builder semanticContentScores(Map<Long, Double> semanticContentScores) {
            this.semanticContentScores = semanticContentScores;
            return this;
        }

        public Builder sentimentScores(Map<Long, Double> sentimentScores) {
            this.sentimentScores = sentimentScores;
            return this;
        }

        public ScoringContext build() {
            return new ScoringContext(this);
        }
    }
}
