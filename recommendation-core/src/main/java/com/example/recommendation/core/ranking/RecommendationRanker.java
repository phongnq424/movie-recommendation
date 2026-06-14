package com.example.recommendation.core.ranking;

import com.example.recommendation.core.model.RecommendationItem;
import com.example.recommendation.core.model.ScoringContext;
import com.example.recommendation.core.model.ScoringMovie;
import com.example.recommendation.core.scoring.HybridScoreCalculator;
import com.example.recommendation.core.weight.RecommendationWeights;

import java.util.Comparator;
import java.util.List;

public class RecommendationRanker {

    private final HybridScoreCalculator scoreCalculator;

    public RecommendationRanker() {
        this(new HybridScoreCalculator());
    }

    public RecommendationRanker(HybridScoreCalculator scoreCalculator) {
        this.scoreCalculator = scoreCalculator;
    }

    public List<RecommendationItem> rank(
            List<ScoringMovie> movies,
            ScoringContext context,
            RecommendationWeights weights,
            int limit
    ) {
        if (movies == null || movies.isEmpty()) {
            return List.of();
        }

        int safeLimit = normalizeLimit(limit, movies.size());

        return movies.stream()
                .filter(movie -> movie != null && movie.getMovieId() != null)
                .map(movie -> scoreCalculator.calculate(movie, context, weights))
                .sorted(Comparator.comparing(RecommendationItem::getFinalScore).reversed())
                .limit(safeLimit)
                .toList();
    }

    private int normalizeLimit(int limit, int availableSize) {
        if (limit <= 0) {
            return availableSize;
        }

        return Math.min(limit, availableSize);
    }
}
