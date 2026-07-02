package com.example.movierecommendation.ratelimit;

import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Service
public class RateLimitService {

    private final ConcurrentMap<String, Bucket> buckets = new ConcurrentHashMap<>();

    public ConsumptionProbe tryConsume(String key, RateLimitProperties.Policy policy) {
        Bucket bucket = buckets.computeIfAbsent(key, ignored -> createBucket(policy));
        return bucket.tryConsumeAndReturnRemaining(1);
    }

    private Bucket createBucket(RateLimitProperties.Policy policy) {
        return Bucket.builder()
                .addLimit(limit -> limit
                        .capacity(policy.getCapacity())
                        .refillGreedy(
                                policy.getRefillTokens(),
                                Duration.ofSeconds(policy.getRefillDurationSeconds())
                        )
                )
                .build();
    }
}