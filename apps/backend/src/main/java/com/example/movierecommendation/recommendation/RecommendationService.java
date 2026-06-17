package com.example.movierecommendation.recommendation;

import com.example.movierecommendation.recommendation.cache.RecommendationCacheService;
import com.example.movierecommendation.recommendation.config.RecommendationProperties;
import com.example.movierecommendation.recommendation.dto.RecommendationCandidate;
import com.example.movierecommendation.recommendation.dto.RecommendationResponse;
import com.example.movierecommendation.recommendation.impression.RecommendationImpressionService;
import com.example.movierecommendation.recommendation.ranking.RecommendationRankingService;
import com.example.movierecommendation.recommendation.retrieval.CandidateRetrievalOrchestrator;
import com.example.movierecommendation.recommendation.rerank.RecommendationReRankingService;
import com.example.movierecommendation.recommendation.scheduler.RecommendationRefreshRequestedEvent;
import com.example.movierecommendation.recommendation.snapshot.RecommendationSnapshotService;
import com.example.movierecommendation.user.User;
import com.example.movierecommendation.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class RecommendationService {

    private static final int USER_CANDIDATE_LIMIT = 250;
    private static final int ANONYMOUS_CANDIDATE_LIMIT = 200;
    private static final String PUBLIC_SNAPSHOT_KEY = "PUBLIC";

    private final UserRepository userRepository;
    private final CandidateRetrievalOrchestrator candidateRetrievalService;
    private final RecommendationRankingService rankingService;
    private final RecommendationReRankingService reRankingService;
    private final RecommendationImpressionService impressionService;
    private final RecommendationCacheService cacheService;
    private final RecommendationSnapshotService snapshotService;
    private final RecommendationProperties properties;
    private final ApplicationEventPublisher eventPublisher;

    public List<RecommendationResponse> recommendForUser(UUID userPublicId, int limit) {
        int safeLimit = properties.safeLimit(limit);

        if (userPublicId == null) {
            return recommendForAnonymous(safeLimit);
        }

        List<RecommendationResponse> cached = cacheService.getUserRecommendations(
                userPublicId,
                safeLimit
        );

        if (!cached.isEmpty()) {
            return cached;
        }

        String userSnapshotKey = buildUserSnapshotKey(userPublicId);

        List<RecommendationResponse> freshSnapshot = snapshotService.getValidSnapshot(
                userSnapshotKey,
                safeLimit
        );

        if (!freshSnapshot.isEmpty()) {
            cacheService.putUserRecommendations(userPublicId, safeLimit, freshSnapshot);
            safelyLogUserImpressions(userPublicId, freshSnapshot, "PERSONALIZED_SNAPSHOT");
            return freshSnapshot;
        }

        List<RecommendationResponse> staleSnapshot = snapshotService.getAnyActiveSnapshot(
                userSnapshotKey,
                safeLimit
        );

        if (!staleSnapshot.isEmpty()) {
            cacheService.putUserRecommendations(userPublicId, safeLimit, staleSnapshot);
            safelyLogUserImpressions(userPublicId, staleSnapshot, "PERSONALIZED_STALE_SNAPSHOT");

            requestUserRefresh(userPublicId, "STALE_SNAPSHOT_USED");

            return staleSnapshot;
        }

        requestUserRefresh(userPublicId, "NO_USER_SNAPSHOT");

        return recommendForAnonymous(safeLimit);
    }

    public List<RecommendationResponse> recommendForAnonymous(int limit) {
        int safeLimit = properties.safeLimit(limit);

        List<RecommendationResponse> cached = cacheService.getPublicRecommendations(safeLimit);

        if (!cached.isEmpty()) {
            return cached;
        }

        List<RecommendationResponse> snapshot = snapshotService.getValidSnapshot(
                PUBLIC_SNAPSHOT_KEY,
                safeLimit
        );

        if (!snapshot.isEmpty()) {
            cacheService.putPublicRecommendations(safeLimit, snapshot);
            safelyLogAnonymousImpressions(snapshot, "ANONYMOUS_SNAPSHOT");
            return snapshot;
        }

        List<RecommendationResponse> realtime = computeForAnonymousRealtime(
                safeLimit,
                true
        );

        if (!realtime.isEmpty()) {
            cacheService.putPublicRecommendations(safeLimit, realtime);
        }

        return realtime;
    }

    public List<RecommendationResponse> computeForUserRealtime(
            UUID userPublicId,
            int limit,
            boolean logImpression
    ) {
        int safeLimit = properties.safeLimit(limit);

        try {
            User user = userRepository.findByPublicId(userPublicId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            List<RecommendationCandidate> candidates = candidateRetrievalService.retrieveForUser(
                    user,
                    USER_CANDIDATE_LIMIT
            );

            if (candidates == null || candidates.isEmpty()) {
                return computeForAnonymousRealtime(safeLimit, logImpression);
            }

            List<RecommendationResponse> rankedResults = rankingService.rankForUser(
                    user,
                    candidates,
                    candidates.size()
            );

            if (rankedResults == null || rankedResults.isEmpty()) {
                return computeForAnonymousRealtime(safeLimit, logImpression);
            }

            List<RecommendationResponse> finalResults = reRankingService.reRank(
                    rankedResults,
                    safeLimit
            );

            if (finalResults == null || finalResults.isEmpty()) {
                return computeForAnonymousRealtime(safeLimit, logImpression);
            }

            if (logImpression) {
                safelyLogImpressions(
                        user.getId(),
                        finalResults,
                        "PERSONALIZED_LEARNED_HYBRID"
                );
            }

            return finalResults;
        } catch (Exception ex) {
            log.warn("Failed to compute user recommendations. userPublicId={}", userPublicId, ex);
            return computeForAnonymousRealtime(safeLimit, logImpression);
        }
    }

    public List<RecommendationResponse> computeForAnonymousRealtime(
            int limit,
            boolean logImpression
    ) {
        int safeLimit = properties.safeLimit(limit);

        try {
            List<RecommendationCandidate> candidates = candidateRetrievalService.retrieveForAnonymous(
                    ANONYMOUS_CANDIDATE_LIMIT
            );

            if (candidates == null || candidates.isEmpty()) {
                return List.of();
            }

            List<RecommendationResponse> rankedResults = rankingService.rankForAnonymous(
                    candidates,
                    candidates.size()
            );

            if (rankedResults == null || rankedResults.isEmpty()) {
                return List.of();
            }

            List<RecommendationResponse> finalResults = reRankingService.reRank(
                    rankedResults,
                    safeLimit
            );

            if (finalResults == null || finalResults.isEmpty()) {
                return List.of();
            }

            if (logImpression) {
                safelyLogImpressions(
                        null,
                        finalResults,
                        "ANONYMOUS_FALLBACK"
                );
            }

            return finalResults;
        } catch (Exception ex) {
            log.warn("Failed to compute anonymous recommendations.", ex);
            return List.of();
        }
    }

    public String buildUserSnapshotKey(UUID userPublicId) {
        return "USER:" + userPublicId;
    }

    public String publicSnapshotKey() {
        return PUBLIC_SNAPSHOT_KEY;
    }

    private void safelyLogUserImpressions(
            UUID userPublicId,
            List<RecommendationResponse> responses,
            String recommendationType
    ) {
        try {
            User user = userRepository.findByPublicId(userPublicId).orElse(null);
            Long userId = user == null ? null : user.getId();

            safelyLogImpressions(userId, responses, recommendationType);
        } catch (Exception ex) {
            log.warn("Failed to resolve user for recommendation impression. userPublicId={}", userPublicId, ex);
        }
    }

    private void safelyLogAnonymousImpressions(
            List<RecommendationResponse> responses,
            String recommendationType
    ) {
        safelyLogImpressions(null, responses, recommendationType);
    }

    private void safelyLogImpressions(
            Long userId,
            List<RecommendationResponse> responses,
            String recommendationType
    ) {
        try {
            if (responses == null || responses.isEmpty()) {
                return;
            }

            impressionService.logShownRecommendations(
                    userId,
                    UUID.randomUUID(),
                    responses,
                    recommendationType
            );
        } catch (Exception ex) {
            log.warn("Failed to log recommendation impressions.", ex);
        }
    }

    private void requestUserRefresh(UUID userPublicId, String reason) {
        boolean acquired = cacheService.tryAcquireUserRefreshLock(
                userPublicId,
                java.time.Duration.ofMinutes(10)
        );

        if (!acquired) {
            return;
        }

        eventPublisher.publishEvent(
                new RecommendationRefreshRequestedEvent(userPublicId, reason)
        );
    }
}