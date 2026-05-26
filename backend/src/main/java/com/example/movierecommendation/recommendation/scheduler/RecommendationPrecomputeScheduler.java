package com.example.movierecommendation.recommendation.scheduler;

import com.example.movierecommendation.user.User;
import com.example.movierecommendation.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(
        name = "app.recommendation.scheduler-enabled",
        havingValue = "true"
)
public class RecommendationPrecomputeScheduler {

    private final UserRepository userRepository;
    private final RecommendationPrecomputeService precomputeService;

    @Scheduled(cron = "${app.recommendation.cron:0 0 */6 * * *}")
    public void refreshRecommendationSnapshots() {
        log.info("Start scheduled recommendation snapshot refresh.");

        precomputeService.refreshPublic();

        List<User> activeUsers;

        try {
            activeUsers = userRepository.findByStatus("ACTIVE");
        } catch (Exception ex) {
            log.warn("Cannot load active users for recommendation snapshot refresh.", ex);
            return;
        }

        if (activeUsers == null || activeUsers.isEmpty()) {
            log.info("No active users found for recommendation snapshot refresh.");
            return;
        }

        int successCount = 0;
        int failedCount = 0;

        for (User user : activeUsers) {
            try {
                precomputeService.refreshUser(user);
                successCount++;
            } catch (Exception ex) {
                failedCount++;
                log.warn(
                        "Unexpected error while refreshing recommendation snapshot. userId={}",
                        user == null ? null : user.getId(),
                        ex
                );
            }
        }

        log.info(
                "Finished recommendation snapshot refresh. successCount={}, failedCount={}",
                successCount,
                failedCount
        );
    }
}