package com.example.movierecommendation.recommendation;

import com.example.movierecommendation.movie.Movie;
import com.example.movierecommendation.recommendation.dto.RecommendationResponse;
import com.example.movierecommendation.user.User;
import com.example.movierecommendation.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RecommendationService {

    private final UserRepository userRepository;
    private final CandidateGenerationService candidateGenerationService;
    private final RecommendationRankingService rankingService;

    public List<RecommendationResponse> recommendForUser(UUID userPublicId, int limit) {
        User user = userRepository.findByPublicId(userPublicId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        int safeLimit = normalizeLimit(limit);

        List<Movie> candidates = candidateGenerationService.generateCandidates(user, 250);

        return rankingService.rankForUser(user, candidates, safeLimit);
    }

    public List<RecommendationResponse> recommendForAnonymous(int limit) {
        int safeLimit = normalizeLimit(limit);

        List<Movie> candidates = candidateGenerationService.generateAnonymousCandidates(200);

        return rankingService.rankForAnonymous(candidates, safeLimit);
    }

    private int normalizeLimit(int limit) {
        if (limit <= 0) {
            return 20;
        }

        return Math.min(limit, 50);
    }
}