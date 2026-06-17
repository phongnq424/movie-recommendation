package com.example.movierecommendation.recommendation.scheduler;

import com.example.movierecommendation.recommendation.RecommendationService;
import com.example.movierecommendation.recommendation.cache.RecommendationCacheService;
import com.example.movierecommendation.recommendation.config.RecommendationProperties;
import com.example.movierecommendation.recommendation.dto.RecommendationResponse;
import com.example.movierecommendation.recommendation.snapshot.RecommendationSnapshotService;
import com.example.movierecommendation.user.User;
import com.example.movierecommendation.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class RecommendationPrecomputeService {

    private final RecommendationService recommendationService;
    private final RecommendationSnapshotService snapshotService;
    private final RecommendationCacheService cacheService;
    private final RecommendationProperties properties;
    private final UserRepository userRepository;

    public void refreshPublic() {
        int snapshotSize = properties.safeSnapshotSize();

        try {
            List<RecommendationResponse> responses =
                    recommendationService.computeForAnonymousRealtime(
                            snapshotSize,
                            false
                    );

            if (responses == null || responses.isEmpty()) {
                log.warn("Skip public snapshot because computed recommendation is empty.");
                return;
            }

            snapshotService.savePublicSnapshot(
                    recommendationService.publicSnapshotKey(),
                    responses
            );

            cacheService.evictPublicRecommendations();
            cacheService.putPublicRecommendations(
                    20,
                    responses.stream().limit(20).toList()
            );
        } catch (Exception ex) {
            log.warn("Failed to refresh public recommendation snapshot.", ex);
        }
    }

    public void refreshUser(User user) {
        if (user == null || user.getPublicId() == null) {
            return;
        }

        int snapshotSize = properties.safeSnapshotSize();

        try {
            List<RecommendationResponse> responses =
                    recommendationService.computeForUserRealtime(
                            user.getPublicId(),
                            snapshotSize,
                            false
                    );

            if (responses == null || responses.isEmpty()) {
                log.warn("Skip user snapshot because computed recommendation is empty. userPublicId={}", user.getPublicId());
                return;
            }

            snapshotService.saveUserSnapshot(
                    user,
                    recommendationService.buildUserSnapshotKey(user.getPublicId()),
                    responses
            );

            cacheService.evictUserRecommendations(user.getPublicId());
            cacheService.putUserRecommendations(
                    user.getPublicId(),
                    20,
                    responses.stream().limit(20).toList()
            );
        } catch (Exception ex) {
            log.warn("Failed to refresh user recommendation snapshot. userPublicId={}", user.getPublicId(), ex);
        }
    }

    public void refreshUserByPublicId(UUID userPublicId) {
        if (userPublicId == null) {
            return;
        }

        userRepository.findByPublicId(userPublicId)
                .ifPresentOrElse(
                        this::refreshUser,
                        () -> log.warn("Cannot refresh user snapshot because user was not found. userPublicId={}", userPublicId)
                );
    }
}