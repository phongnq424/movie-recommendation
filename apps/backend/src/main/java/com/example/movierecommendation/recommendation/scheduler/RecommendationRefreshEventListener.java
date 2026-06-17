package com.example.movierecommendation.recommendation.scheduler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class RecommendationRefreshEventListener {

    private final RecommendationPrecomputeService precomputeService;

    @Async("recommendationRefreshExecutor")
    @EventListener
    public void handleRecommendationRefreshRequested(
            RecommendationRefreshRequestedEvent event
    ) {
        if (event == null || event.getUserPublicId() == null) {
            return;
        }

        try {
            log.info(
                    "Start async recommendation refresh. userPublicId={}, reason={}",
                    event.getUserPublicId(),
                    event.getReason()
            );

            precomputeService.refreshUserByPublicId(event.getUserPublicId());

            log.info(
                    "Finished async recommendation refresh. userPublicId={}",
                    event.getUserPublicId()
            );
        } catch (Exception ex) {
            log.warn(
                    "Failed async recommendation refresh. userPublicId={}, reason={}",
                    event.getUserPublicId(),
                    event.getReason(),
                    ex
            );
        }
    }
}