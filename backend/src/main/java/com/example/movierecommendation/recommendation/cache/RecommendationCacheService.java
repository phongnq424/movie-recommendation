package com.example.movierecommendation.recommendation.cache;

import com.example.movierecommendation.recommendation.config.RecommendationProperties;
import com.example.movierecommendation.recommendation.dto.RecommendationResponse;
import com.fasterxml.jackson.databind.JavaType;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class RecommendationCacheService {

    private static final String KEY_PREFIX = "movie-recommendation:recommendations:v1";
    private static final String DEFAULT_VERSION = "1";

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    private final RecommendationProperties properties;

    public List<RecommendationResponse> getUserRecommendations(UUID userPublicId, int limit) {
        if (!properties.isCacheEnabled() || userPublicId == null) {
            return List.of();
        }

        return get(buildUserKey(userPublicId, limit));
    }

    public void putUserRecommendations(
            UUID userPublicId,
            int limit,
            List<RecommendationResponse> responses
    ) {
        if (!properties.isCacheEnabled() || userPublicId == null) {
            return;
        }

        put(buildUserKey(userPublicId, limit), responses);
    }

    public void evictUserRecommendations(UUID userPublicId) {
        if (!properties.isCacheEnabled() || userPublicId == null) {
            return;
        }

        increaseVersion(buildUserVersionKey(userPublicId));
    }

    public List<RecommendationResponse> getPublicRecommendations(int limit) {
        if (!properties.isCacheEnabled()) {
            return List.of();
        }

        return get(buildPublicKey(limit));
    }

    public void putPublicRecommendations(
            int limit,
            List<RecommendationResponse> responses
    ) {
        if (!properties.isCacheEnabled()) {
            return;
        }

        put(buildPublicKey(limit), responses);
    }

    public void evictPublicRecommendations() {
        if (!properties.isCacheEnabled()) {
            return;
        }

        increaseVersion(buildPublicVersionKey());
    }

    private List<RecommendationResponse> get(String key) {
        try {
            String json = redisTemplate.opsForValue().get(key);

            if (json == null || json.isBlank()) {
                return List.of();
            }

            JavaType type = objectMapper.getTypeFactory()
                    .constructCollectionType(List.class, RecommendationResponse.class);

            List<RecommendationResponse> result = objectMapper.readValue(json, type);

            return result == null ? List.of() : result;
        } catch (RedisConnectionFailureException ex) {
            log.warn("Redis unavailable while reading recommendation cache. key={}, reason={}", key, ex.getMessage(), ex);
            return List.of();
        } catch (DataAccessException ex) {
            log.warn("Redis data access error while reading recommendation cache. key={}", key, ex);
            return List.of();
        } catch (Exception ex) {
            log.warn("Invalid recommendation cache payload. key={}", key, ex);
            return List.of();
        }
    }

    private void put(String key, List<RecommendationResponse> responses) {
        if (responses == null || responses.isEmpty()) {
            return;
        }

        try {
            String json = objectMapper.writeValueAsString(responses);

            redisTemplate.opsForValue().set(
                    key,
                    json,
                    Duration.ofMinutes(properties.safeCacheTtlMinutes())
            );
        } catch (RedisConnectionFailureException ex) {
            log.warn("Redis unavailable while writing recommendation cache. key={}", key);
        } catch (DataAccessException ex) {
            log.warn("Redis data access error while writing recommendation cache. key={}", key, ex);
        } catch (Exception ex) {
            log.warn("Failed to serialize recommendation cache. key={}", key, ex);
        }
    }

    private void increaseVersion(String versionKey) {
        try {
            redisTemplate.opsForValue().increment(versionKey);
        } catch (RedisConnectionFailureException ex) {
            log.warn("Redis unavailable while invalidating recommendation cache. key={}", versionKey);
        } catch (DataAccessException ex) {
            log.warn("Redis data access error while invalidating recommendation cache. key={}", versionKey, ex);
        } catch (Exception ex) {
            log.warn("Unexpected Redis error while invalidating recommendation cache. key={}", versionKey, ex);
        }
    }

    private String buildUserKey(UUID userPublicId, int limit) {
        String version = getVersion(buildUserVersionKey(userPublicId));

        return KEY_PREFIX
                + ":user:"
                + userPublicId
                + ":limit:"
                + properties.safeLimit(limit)
                + ":version:"
                + version;
    }

    private String buildPublicKey(int limit) {
        String version = getVersion(buildPublicVersionKey());

        return KEY_PREFIX
                + ":public"
                + ":limit:"
                + properties.safeLimit(limit)
                + ":version:"
                + version;
    }

    private String buildUserVersionKey(UUID userPublicId) {
        return KEY_PREFIX + ":user:" + userPublicId + ":version";
    }

    private String buildPublicVersionKey() {
        return KEY_PREFIX + ":public:version";
    }

    private String getVersion(String versionKey) {
        try {
            String version = redisTemplate.opsForValue().get(versionKey);

            if (version == null || version.isBlank()) {
                Boolean created = redisTemplate.opsForValue().setIfAbsent(
                        versionKey,
                        DEFAULT_VERSION
                );

                if (Boolean.TRUE.equals(created)) {
                    return DEFAULT_VERSION;
                }

                String retryVersion = redisTemplate.opsForValue().get(versionKey);
                return retryVersion == null || retryVersion.isBlank()
                        ? DEFAULT_VERSION
                        : retryVersion;
            }

            return version;
        } catch (Exception ex) {
            log.warn("Failed to read Redis cache version. key={}", versionKey);
            return DEFAULT_VERSION;
        }
    }
}