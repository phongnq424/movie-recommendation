package com.example.movierecommendation.recommendation.rerank;

import com.example.movierecommendation.moviegenre.MovieGenreRepository;
import com.example.movierecommendation.recommendation.dto.RecommendationResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class RecommendationReRankingService {

    private static final int MAX_SAME_PRIMARY_GENRE_IN_TOP = 3;

    private final MovieGenreRepository movieGenreRepository;

    public List<RecommendationResponse> reRank(List<RecommendationResponse> rankedResults, int limit) {
        if (rankedResults == null || rankedResults.isEmpty()) {
            return List.of();
        }

        int safeLimit = normalizeLimit(limit, rankedResults.size());

        List<RecommendationResponse> deduplicated = removeDuplicates(rankedResults);
        Map<UUID, Long> primaryGenreByMoviePublicId = loadPrimaryGenreByMoviePublicId(deduplicated);

        List<RecommendationResponse> finalList = new ArrayList<>();
        Map<Long, Integer> genreCount = new HashMap<>();

        for (RecommendationResponse response : deduplicated) {
            UUID moviePublicId = response.getMoviePublicId();

            if (moviePublicId == null) {
                continue;
            }

            Long genreId = primaryGenreByMoviePublicId.get(moviePublicId);

            if (genreId != null) {
                int count = genreCount.getOrDefault(genreId, 0);

                if (count >= MAX_SAME_PRIMARY_GENRE_IN_TOP && finalList.size() < safeLimit / 2) {
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

    private List<RecommendationResponse> removeDuplicates(List<RecommendationResponse> rankedResults) {
        Map<UUID, RecommendationResponse> map = new LinkedHashMap<>();

        for (RecommendationResponse response : rankedResults) {
            if (response == null || response.getMoviePublicId() == null) {
                continue;
            }

            map.putIfAbsent(response.getMoviePublicId(), response);
        }

        return new ArrayList<>(map.values());
    }

    private Map<UUID, Long> loadPrimaryGenreByMoviePublicId(List<RecommendationResponse> responses) {
        List<UUID> moviePublicIds = responses.stream()
                .filter(Objects::nonNull)
                .map(RecommendationResponse::getMoviePublicId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        if (moviePublicIds.isEmpty()) {
            return Map.of();
        }

        List<Object[]> rows = movieGenreRepository.findPrimaryGenreIdsByMoviePublicIds(moviePublicIds);
        Map<UUID, Long> result = new HashMap<>();

        for (Object[] row : rows) {
            UUID moviePublicId = (UUID) row[0];
            Long genreId = ((Number) row[1]).longValue();

            result.put(moviePublicId, genreId);
        }

        return result;
    }

    private void fillRemainingResults(
            List<RecommendationResponse> finalList,
            List<RecommendationResponse> deduplicated,
            int limit
    ) {
        Set<UUID> addedIds = new HashSet<>();

        for (RecommendationResponse item : finalList) {
            if (item.getMoviePublicId() != null) {
                addedIds.add(item.getMoviePublicId());
            }
        }

        for (RecommendationResponse response : deduplicated) {
            UUID moviePublicId = response.getMoviePublicId();

            if (moviePublicId == null) {
                continue;
            }

            if (addedIds.contains(moviePublicId)) {
                continue;
            }

            finalList.add(response);
            addedIds.add(moviePublicId);

            if (finalList.size() >= limit) {
                return;
            }
        }
    }
}