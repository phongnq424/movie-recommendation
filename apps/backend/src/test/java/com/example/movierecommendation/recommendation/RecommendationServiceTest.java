package com.example.movierecommendation.recommendation;

import com.example.movierecommendation.recommendation.cache.RecommendationCacheService;
import com.example.movierecommendation.recommendation.config.RecommendationProperties;
import com.example.movierecommendation.recommendation.dto.RecommendationResponse;
import com.example.movierecommendation.recommendation.impression.RecommendationImpressionService;
import com.example.movierecommendation.recommendation.ranking.RecommendationRankingService;
import com.example.movierecommendation.recommendation.rerank.RecommendationReRankingService;
import com.example.movierecommendation.recommendation.retrieval.CandidateRetrievalOrchestrator;
import com.example.movierecommendation.recommendation.scheduler.RecommendationRefreshRequestedEvent;
import com.example.movierecommendation.recommendation.snapshot.RecommendationSnapshotService;
import com.example.movierecommendation.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RecommendationServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private CandidateRetrievalOrchestrator candidateRetrievalService;

    @Mock
    private RecommendationRankingService rankingService;

    @Mock
    private RecommendationReRankingService reRankingService;

    @Mock
    private RecommendationImpressionService impressionService;

    @Mock
    private RecommendationCacheService cacheService;

    @Mock
    private RecommendationSnapshotService snapshotService;

    @Mock
    private RecommendationProperties properties;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private RecommendationService recommendationService;

    @Test
    void recommendForUser_shouldReturnUserCache_whenCacheExists() {
        UUID userPublicId = UUID.randomUUID();
        List<RecommendationResponse> cached = List.of(mock(RecommendationResponse.class));

        when(properties.safeLimit(20)).thenReturn(20);
        when(cacheService.getUserRecommendations(userPublicId, 20)).thenReturn(cached);

        List<RecommendationResponse> result =
                recommendationService.recommendForUser(userPublicId, 20);

        assertSame(cached, result);

        verify(snapshotService, never()).getValidSnapshot(anyString(), anyInt());
        verify(eventPublisher, never()).publishEvent(any());
    }

    @Test
    void recommendForUser_shouldUseFreshSnapshot_whenCacheIsEmpty() {
        UUID userPublicId = UUID.randomUUID();
        List<RecommendationResponse> snapshot = List.of(mock(RecommendationResponse.class));

        when(properties.safeLimit(20)).thenReturn(20);
        when(cacheService.getUserRecommendations(userPublicId, 20)).thenReturn(List.of());
        when(snapshotService.getValidSnapshot("USER:" + userPublicId, 20)).thenReturn(snapshot);

        List<RecommendationResponse> result =
                recommendationService.recommendForUser(userPublicId, 20);

        assertSame(snapshot, result);

        verify(cacheService).putUserRecommendations(userPublicId, 20, snapshot);
    }

    @Test
    void recommendForUser_shouldUseStaleSnapshotAndPublishRefreshEvent_whenFreshSnapshotIsEmpty() {
        UUID userPublicId = UUID.randomUUID();
        List<RecommendationResponse> staleSnapshot = List.of(mock(RecommendationResponse.class));

        when(properties.safeLimit(20)).thenReturn(20);
        when(cacheService.getUserRecommendations(userPublicId, 20)).thenReturn(List.of());
        when(snapshotService.getValidSnapshot("USER:" + userPublicId, 20)).thenReturn(List.of());
        when(snapshotService.getAnyActiveSnapshot("USER:" + userPublicId, 20)).thenReturn(staleSnapshot);
        when(cacheService.tryAcquireUserRefreshLock(eq(userPublicId), any())).thenReturn(true);

        List<RecommendationResponse> result =
                recommendationService.recommendForUser(userPublicId, 20);

        assertSame(staleSnapshot, result);

        verify(cacheService).putUserRecommendations(userPublicId, 20, staleSnapshot);
        verify(eventPublisher).publishEvent(any(RecommendationRefreshRequestedEvent.class));
    }

    @Test
    void recommendForUser_shouldFallbackToAnonymous_whenUserPublicIdIsNull() {
        List<RecommendationResponse> publicCache = List.of(mock(RecommendationResponse.class));

        when(properties.safeLimit(20)).thenReturn(20);
        when(cacheService.getPublicRecommendations(20)).thenReturn(publicCache);

        List<RecommendationResponse> result =
                recommendationService.recommendForUser(null, 20);

        assertSame(publicCache, result);

        verify(cacheService, never()).getUserRecommendations(any(), anyInt());
    }

    @Test
    void recommendForAnonymous_shouldReturnPublicCache_whenCacheExists() {
        List<RecommendationResponse> publicCache = List.of(mock(RecommendationResponse.class));

        when(properties.safeLimit(20)).thenReturn(20);
        when(cacheService.getPublicRecommendations(20)).thenReturn(publicCache);

        List<RecommendationResponse> result =
                recommendationService.recommendForAnonymous(20);

        assertSame(publicCache, result);

        verify(snapshotService, never()).getValidSnapshot(anyString(), anyInt());
    }
}