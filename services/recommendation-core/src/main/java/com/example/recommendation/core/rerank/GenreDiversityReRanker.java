package com.example.recommendation.core.rerank;

import com.example.recommendation.core.model.RecommendationItem;

import com.example.recommendation.core.rerank.ReRankStrategy;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class GenreDiversityReRanker implements ReRankStrategy {

    public static final int DEFAULT_MAX_SAME_PRIMARY_GENRE_IN_TOP = 3;

    private final int maxSamePrimaryGenreInTop;

    public GenreDiversityReRanker() {
        this(DEFAULT_MAX_SAME_PRIMARY_GENRE_IN_TOP);
    }

    public GenreDiversityReRanker(int maxSamePrimaryGenreInTop) {
        this.maxSamePrimaryGenreInTop = maxSamePrimaryGenreInTop;
    }

    @Override
    public List<RecommendationItem> reRank(
            List<RecommendationItem> rankedResults,
            Map<String, Long> primaryGenreByItemKey,
            int limit) {
        if (rankedResults == null || rankedResults.isEmpty()) {
            return List.of();
        }

        int safeLimit = normalizeLimit(limit, rankedResults.size());
        List<RecommendationItem> deduplicated = removeDuplicates(rankedResults);

        List<RecommendationItem> finalList = new ArrayList<>();
        Map<Long, Integer> genreCount = new HashMap<>();

        for (RecommendationItem response : deduplicated) {
            String itemKey = response.itemKey();

            if (itemKey == null || itemKey.isBlank()) {
                continue;
            }

            Long genreId = primaryGenreByItemKey == null
                    ? null
                    : primaryGenreByItemKey.get(itemKey);

            if (genreId != null) {
                int count = genreCount.getOrDefault(genreId, 0);

                if (count >= maxSamePrimaryGenreInTop && finalList.size() < safeLimit / 2) {
                    continue;
                }

                genreCount.put(genreId, count + 1);
            }

            finalList.add(response);

            if (finalList.size() >= safeLimit) {
                return finalList;
            }
        }

        if (finalList.size() < safeLimit) {
            fillRemainingResults(finalList, deduplicated, safeLimit);
        }

        return finalList;
    }

    private int normalizeLimit(int limit, int availableSize) {
        if (limit <= 0) {
            return Math.min(20, availableSize);
        }

        return Math.min(limit, availableSize);
    }

    private List<RecommendationItem> removeDuplicates(List<RecommendationItem> rankedResults) {
        Map<String, RecommendationItem> map = new LinkedHashMap<>();

        for (RecommendationItem item : rankedResults) {
            if (item == null || item.itemKey() == null || item.itemKey().isBlank()) {
                continue;
            }

            map.putIfAbsent(item.itemKey(), item);
        }

        return new ArrayList<>(map.values());
    }

    private void fillRemainingResults(
            List<RecommendationItem> finalList,
            List<RecommendationItem> deduplicated,
            int limit) {
        Set<String> addedIds = new HashSet<>();

        for (RecommendationItem item : finalList) {
            if (item.itemKey() != null) {
                addedIds.add(item.itemKey());
            }
        }

        for (RecommendationItem response : deduplicated) {
            String itemKey = response.itemKey();

            if (itemKey == null || itemKey.isBlank()) {
                continue;
            }

            if (addedIds.contains(itemKey)) {
                continue;
            }

            finalList.add(response);
            addedIds.add(itemKey);

            if (finalList.size() >= limit) {
                return;
            }
        }
    }
}
