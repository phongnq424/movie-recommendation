package com.example.movierecommendation.recommendation;

import com.example.movierecommendation.movie.Movie;
import com.example.movierecommendation.recommendation.dto.RecommendationCandidate;
import com.example.movierecommendation.recommendation.dto.RecommendationContext;
import com.example.movierecommendation.recommendation.dto.RecommendationResponse;
import com.example.movierecommendation.recommendation.dto.RecommendationWeights;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RecommendationRankingService {

    private final RecommendationScoreCalculator scoreCalculator;
    private final RecommendationWeightResolver weightResolver;

    public List<RecommendationResponse> rankForUser(
            com.example.movierecommendation.user.User user,
            List<RecommendationCandidate> candidates,
            int limit
    ) {
        List<Movie> movies = candidates.stream()
                .filter(candidate -> candidate != null && candidate.getMovie() != null)
                .map(RecommendationCandidate::getMovie)
                .toList();

        Map<Long, Double> collaborativeScores = candidates.stream()
                .filter(candidate -> candidate != null && candidate.getMovie() != null)
                .filter(candidate -> candidate.getMovie().getId() != null)
                .collect(Collectors.toMap(
                        candidate -> candidate.getMovie().getId(),
                        RecommendationCandidate::getRetrievalScore,
                        Math::max
                ));

        RecommendationContext context = scoreCalculator.buildContext(
                user,
                movies,
                collaborativeScores
        );

        RecommendationWeights weights = weightResolver.resolve(context);

        return movies.stream()
                .map(movie -> scoreCalculator.calculate(movie, context, weights))
                .sorted(Comparator.comparing(RecommendationResponse::getFinalScore).reversed())
                .limit(limit)
                .toList();
    }

    public List<RecommendationResponse> rankForAnonymous(
            List<RecommendationCandidate> candidates,
            int limit
    ) {
        List<Movie> movies = candidates.stream()
                .filter(candidate -> candidate != null && candidate.getMovie() != null)
                .map(RecommendationCandidate::getMovie)
                .toList();

        RecommendationContext context = scoreCalculator.buildAnonymousContext(movies);
        RecommendationWeights weights = weightResolver.anonymous();

        return movies.stream()
                .map(movie -> scoreCalculator.calculate(movie, context, weights))
                .sorted(Comparator.comparing(RecommendationResponse::getFinalScore).reversed())
                .limit(limit)
                .toList();
    }
}