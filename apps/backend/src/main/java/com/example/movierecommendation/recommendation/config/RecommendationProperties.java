package com.example.movierecommendation.recommendation.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.recommendation")
public class RecommendationProperties {

    private boolean cacheEnabled = true;

    private long cacheTtlMinutes = 30;

    private int snapshotSize = 100;

    private long snapshotTtlHours = 12;

    private boolean schedulerEnabled = true;

    private String cron = "0 0 */6 * * *";

    public int safeLimit(int limit) {
        if (limit <= 0) {
            return 20;
        }

        return Math.min(limit, safeSnapshotSize());
    }

    public int safeSnapshotSize() {
        if (snapshotSize <= 0) {
            return 100;
        }

        return Math.min(snapshotSize, 300);
    }

    public long safeCacheTtlMinutes() {
        if (cacheTtlMinutes <= 0) {
            return 30;
        }

        return Math.min(cacheTtlMinutes, 24 * 60);
    }

    public long safeSnapshotTtlHours() {
        if (snapshotTtlHours <= 0) {
            return 12;
        }

        return Math.min(snapshotTtlHours, 7 * 24);
    }
}