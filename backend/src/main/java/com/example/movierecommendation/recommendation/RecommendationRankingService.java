package com.example.movierecommendation.recommendation;

import com.example.recommendation.core.model.RecommendationItem;
import com.example.recommendation.core.model.ScoreBreakdown;
import com.example.recommendation.core.model.ScoringContext;
import com.example.recommendation.core.model.ScoringMovie;
import com.example.recommendation.core.ranking.RecommendationRanker;
import com.example.recommendation.core.weight.RecommendationWeightResolver;
import com.example.recommendation.core.weight.RecommendationWeights;
import com.example.movierecommendation.movie.Movie;
import com.example.movierecommendation.recommendation.dto.RecommendationCandidate;
import com.example.movierecommendation.recommendation.dto.RecommendationResponse;
import com.example.movierecommendation.recommendation.dto.RecommendationScoreBreakdown;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class RecommendationRankingService {

    private final RecommendationScoreCalculator scoreCalculator;

    private final RecommendationRanker coreRanker = new RecommendationRanker();
    private final RecommendationWeightResolver coreWeightResolver = new RecommendationWeightResolver();

    public List<RecommendationResponse> rankForUser(
            com.example.movierecommendation.user.User user,
            List<RecommendationCandidate> candidates,
            int limit
    ) {
        List<Movie> movies = extractMovies(candidates);

        ScoringContext context = scoreCalculator.buildContext(
                user,
                movies
        );

        RecommendationWeights weights = coreWeightResolver.resolve(context);

        return rankAndMapResponses(movies, context, weights, limit);
    }

    public List<RecommendationResponse> rankForAnonymous(
            List<RecommendationCandidate> candidates,
            int limit
    ) {
        List<Movie> movies = extractMovies(candidates);

        ScoringContext context = scoreCalculator.buildAnonymousContext(movies);
        RecommendationWeights weights = coreWeightResolver.anonymous();

        return rankAndMapResponses(movies, context, weights, limit);
    }

    private List<Movie> extractMovies(List<RecommendationCandidate> candidates) {
        if (candidates == null || candidates.isEmpty()) {
            return List.of();
        }

        return candidates.stream()
                .filter(candidate -> candidate != null && candidate.getMovie() != null)
                .map(RecommendationCandidate::getMovie)
                .toList();
    }

    private List<RecommendationResponse> rankAndMapResponses(
            List<Movie> movies,
            ScoringContext context,
            RecommendationWeights weights,
            int limit
    ) {
        Map<Long, Movie> movieById = movies.stream()
                .filter(Objects::nonNull)
                .filter(movie -> movie.getId() != null)
                .collect(
                        LinkedHashMap::new,
                        (map, movie) -> map.putIfAbsent(movie.getId(), movie),
                        LinkedHashMap::putAll
                );

        List<ScoringMovie> scoringMovies = movies.stream()
                .filter(Objects::nonNull)
                .filter(movie -> movie.getId() != null)
                .map(this::toScoringMovie)
                .toList();

        return coreRanker.rank(scoringMovies, context, weights, limit)
                .stream()
                .map(item -> toRecommendationResponse(item, movieById))
                .filter(Objects::nonNull)
                .toList();
    }

    private ScoringMovie toScoringMovie(Movie movie) {
        String itemKey = movie.getPublicId() == null
                ? String.valueOf(movie.getId())
                : movie.getPublicId().toString();

        return ScoringMovie.of(
                movie.getId(),
                itemKey,
                movie.getReleaseYear(),
                movie.getAverageRating(),
                movie.getRatingCount(),
                movie.getViewCount()
        );
    }

    private RecommendationResponse toRecommendationResponse(
            RecommendationItem item,
            Map<Long, Movie> movieById
    ) {
        if (item == null || item.getMovie() == null) {
            return null;
        }

        Movie movie = movieById.get(item.getMovie().getMovieId());

        if (movie == null) {
            return null;
        }

        return RecommendationResponse.from(
                movie,
                item.getFinalScore(),
                toBackendBreakdown(item.getScoreBreakdown())
        );
    }

    private RecommendationScoreBreakdown toBackendBreakdown(ScoreBreakdown breakdown) {
        if (breakdown == null) {
            return null;
        }

        return RecommendationScoreBreakdown.builder()
                .contentScore(breakdown.getContentScore())
                .collaborativeScore(breakdown.getCollaborativeScore())
                .popularityScore(breakdown.getPopularityScore())
                .freshnessScore(breakdown.getFreshnessScore())
                .sentimentScore(breakdown.getSentimentScore())
                .negativePenalty(breakdown.getNegativePenalty())
                .contentWeight(breakdown.getContentWeight())
                .collaborativeWeight(breakdown.getCollaborativeWeight())
                .popularityWeight(breakdown.getPopularityWeight())
                .freshnessWeight(breakdown.getFreshnessWeight())
                .sentimentWeight(breakdown.getSentimentWeight())
                .strategy(breakdown.getStrategy())
                .build();
    }
}
