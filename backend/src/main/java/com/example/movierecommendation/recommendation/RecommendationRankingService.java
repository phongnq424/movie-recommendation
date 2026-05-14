package com.example.movierecommendation.recommendation;

import com.example.movierecommendation.movie.Movie;
import com.example.movierecommendation.recommendation.dto.RecommendationContext;
import com.example.movierecommendation.recommendation.dto.RecommendationResponse;
import com.example.movierecommendation.recommendation.dto.RecommendationWeights;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RecommendationRankingService {

    private final RecommendationScoreCalculator scoreCalculator;
    private final RecommendationWeightResolver weightResolver;

    public List<RecommendationResponse> rankForUser(
            com.example.movierecommendation.user.User user,
            List<Movie> candidates,
            int limit
    ) {
        RecommendationContext context = scoreCalculator.buildContext(user, candidates);
        RecommendationWeights weights = weightResolver.resolve(context);

        return candidates.stream()
                .map(movie -> scoreCalculator.calculate(movie, context, weights))
                .sorted(Comparator.comparing(RecommendationResponse::getFinalScore).reversed())
                .limit(limit)
                .toList();
    }

    public List<RecommendationResponse> rankForAnonymous(
            List<Movie> candidates,
            int limit
    ) {
        RecommendationContext context = scoreCalculator.buildAnonymousContext(candidates);
        RecommendationWeights weights = weightResolver.anonymous();

        return candidates.stream()
                .map(movie -> scoreCalculator.calculate(movie, context, weights))
                .sorted(Comparator.comparing(RecommendationResponse::getFinalScore).reversed())
                .limit(limit)
                .toList();
    }
}