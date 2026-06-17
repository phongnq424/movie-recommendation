package com.example.movierecommendation.recommendation.rerank;

import com.example.recommendation.core.model.RecommendationItem;
import com.example.recommendation.core.model.ScoreBreakdown;
import com.example.recommendation.core.model.ScoringMovie;
import com.example.recommendation.core.rerank.GenreDiversityReRanker;
import com.example.movierecommendation.moviegenre.MovieGenreRepository;
import com.example.movierecommendation.recommendation.dto.RecommendationResponse;
import com.example.movierecommendation.recommendation.dto.RecommendationScoreBreakdown;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RecommendationReRankingService {

    private final MovieGenreRepository movieGenreRepository;
    private final GenreDiversityReRanker coreReRanker = new GenreDiversityReRanker();

    public List<RecommendationResponse> reRank(List<RecommendationResponse> rankedResults, int limit) {
        if (rankedResults == null || rankedResults.isEmpty()) {
            return List.of();
        }

        Map<String, Long> primaryGenreByItemKey = loadPrimaryGenreByItemKey(rankedResults);

        Map<String, RecommendationResponse> responseByItemKey = rankedResults.stream()
                .filter(Objects::nonNull)
                .filter(response -> response.getMoviePublicId() != null)
                .collect(Collectors.toMap(
                        response -> response.getMoviePublicId().toString(),
                        response -> response,
                        (first, ignored) -> first
                ));

        return coreReRanker.reRank(
                        rankedResults.stream()
                                .map(this::toCoreItem)
                                .filter(Objects::nonNull)
                                .toList(),
                        primaryGenreByItemKey,
                        limit
                )
                .stream()
                .map(item -> responseByItemKey.get(item.itemKey()))
                .filter(Objects::nonNull)
                .toList();
    }

    private Map<String, Long> loadPrimaryGenreByItemKey(List<RecommendationResponse> responses) {
        List<UUID> moviePublicIds = responses.stream()
                .filter(Objects::nonNull)
                .map(RecommendationResponse::getMoviePublicId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        if (moviePublicIds.isEmpty()) {
            return Map.of();
        }

        return movieGenreRepository.findPrimaryGenreIdsByMoviePublicIds(moviePublicIds)
                .stream()
                .filter(Objects::nonNull)
                .filter(row -> row.length >= 2)
                .collect(Collectors.toMap(
                        row -> String.valueOf((UUID) row[0]),
                        row -> ((Number) row[1]).longValue(),
                        Math::min
                ));
    }

    private RecommendationItem toCoreItem(RecommendationResponse response) {
        if (response == null || response.getMoviePublicId() == null) {
            return null;
        }

        ScoringMovie movie = ScoringMovie.of(
                null,
                response.getMoviePublicId().toString(),
                response.getReleaseYear(),
                response.getAverageRating(),
                response.getRatingCount(),
                response.getViewCount()
        );

        return new RecommendationItem(
                movie,
                safeDouble(response.getFinalScore()),
                toCoreBreakdown(response.getScoreBreakdown())
        );
    }

    private ScoreBreakdown toCoreBreakdown(RecommendationScoreBreakdown breakdown) {
        if (breakdown == null) {
            return null;
        }

        return new ScoreBreakdown(
                safeDouble(breakdown.getContentScore()),
                safeDouble(breakdown.getCollaborativeScore()),
                safeDouble(breakdown.getPopularityScore()),
                safeDouble(breakdown.getFreshnessScore()),
                safeDouble(breakdown.getSentimentScore()),
                safeDouble(breakdown.getNegativePenalty()),
                safeDouble(breakdown.getContentWeight()),
                safeDouble(breakdown.getCollaborativeWeight()),
                safeDouble(breakdown.getPopularityWeight()),
                safeDouble(breakdown.getFreshnessWeight()),
                safeDouble(breakdown.getSentimentWeight()),
                breakdown.getStrategy()
        );
    }

    private double safeDouble(Double value) {
        return value == null ? 0.0 : value;
    }
}
