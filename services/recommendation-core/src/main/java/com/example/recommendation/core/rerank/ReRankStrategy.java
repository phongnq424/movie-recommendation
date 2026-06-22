package com.example.recommendation.core.rerank;

import com.example.recommendation.core.model.RecommendationItem;

import java.util.List;
import java.util.Map;

public interface ReRankStrategy {

    List<RecommendationItem> reRank(
            List<RecommendationItem> rankedResults,
            Map<String, Long> primaryGenreByItemKey,
            int limit);
}