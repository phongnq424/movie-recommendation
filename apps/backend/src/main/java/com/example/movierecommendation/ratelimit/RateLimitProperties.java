package com.example.movierecommendation.ratelimit;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.rate-limit")
public class RateLimitProperties {

    private boolean enabled = true;

    private Policy auth = new Policy(5, 5, 60);

    private Policy recommendation = new Policy(30, 30, 60);

    private Policy write = new Policy(20, 20, 60);

    private Policy view = new Policy(60, 60, 60);

    private Policy defaultPolicy = new Policy(120, 120, 60);

    @Getter
    @Setter
    public static class Policy {
        private long capacity;
        private long refillTokens;
        private long refillDurationSeconds;

        public Policy() {
        }

        public Policy(long capacity, long refillTokens, long refillDurationSeconds) {
            this.capacity = capacity;
            this.refillTokens = refillTokens;
            this.refillDurationSeconds = refillDurationSeconds;
        }
    }
}