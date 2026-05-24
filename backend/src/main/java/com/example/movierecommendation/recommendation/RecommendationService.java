package com.example.movierecommendation.recommendation;

import com.example.movierecommendation.movie.Movie;
import com.example.movierecommendation.recommendation.dto.RecommendationResponse;
import com.example.movierecommendation.recommendation.impression.RecommendationImpressionService;
import com.example.movierecommendation.recommendation.ml.LearnedCandidateRetrievalService;
import com.example.movierecommendation.recommendation.rerank.RecommendationReRankingService;
import com.example.movierecommendation.user.User;
import com.example.movierecommendation.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RecommendationService {

    private static final int USER_CANDIDATE_LIMIT = 250;
    private static final int ANONYMOUS_CANDIDATE_LIMIT = 200;

    private final UserRepository userRepository;
    private final LearnedCandidateRetrievalService learnedCandidateRetrievalService;
    private final RecommendationRankingService rankingService;
    private final RecommendationReRankingService reRankingService;
    private final RecommendationImpressionService impressionService;

    public List<RecommendationResponse> recommendForUser(UUID userPublicId, int limit) {
        User user = userRepository.findByPublicId(userPublicId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        int safeLimit = normalizeLimit(limit);
        UUID requestId = UUID.randomUUID();

        List<Movie> candidates = learnedCandidateRetrievalService.retrieveForUser(user, USER_CANDIDATE_LIMIT);

        if (candidates.isEmpty()) {
            return List.of();
        }

        List<RecommendationResponse> rankedResults = rankingService.rankForUser(
                user,
                candidates,
                candidates.size()
        );

        List<RecommendationResponse> finalResults = reRankingService.reRank(rankedResults, safeLimit);

        impressionService.logShownRecommendations(
                user.getId(),
                requestId,
                finalResults,
                "PERSONALIZED_LEARNED_HYBRID"
        );

        return finalResults;
    }

    public List<RecommendationResponse> recommendForAnonymous(int limit) {
        int safeLimit = normalizeLimit(limit);
        UUID requestId = UUID.randomUUID();

        List<Movie> candidates = learnedCandidateRetrievalService.retrieveForAnonymous(ANONYMOUS_CANDIDATE_LIMIT);

        if (candidates.isEmpty()) {
            return List.of();
        }

        List<RecommendationResponse> rankedResults = rankingService.rankForAnonymous(
                candidates,
                candidates.size()
        );

        List<RecommendationResponse> finalResults = reRankingService.reRank(rankedResults, safeLimit);

        impressionService.logShownRecommendations(
                null,
                requestId,
                finalResults,
                "ANONYMOUS_FALLBACK"
        );

        return finalResults;
    }

    private int normalizeLimit(int limit) {
        if (limit <= 0) {
            return 20;
        }

        return Math.min(limit, 50);
    }
}