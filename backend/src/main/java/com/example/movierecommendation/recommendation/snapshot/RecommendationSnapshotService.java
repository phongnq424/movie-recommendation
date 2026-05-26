package com.example.movierecommendation.recommendation.snapshot;

import com.example.movierecommendation.recommendation.config.RecommendationProperties;
import com.example.movierecommendation.recommendation.dto.RecommendationResponse;
import com.example.movierecommendation.user.User;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

@Slf4j
@Service
@RequiredArgsConstructor
public class RecommendationSnapshotService {

    private static final String STATUS_ACTIVE = "ACTIVE";
    private static final String OWNER_USER = "USER";
    private static final String OWNER_PUBLIC = "PUBLIC";

    private final RecommendationSnapshotRepository snapshotRepository;
    private final ObjectMapper objectMapper;
    private final RecommendationProperties properties;

    public List<RecommendationResponse> getValidSnapshot(String snapshotKey, int limit) {
        if (snapshotKey == null || snapshotKey.isBlank()) {
            return List.of();
        }

        int safeLimit = properties.safeLimit(limit);

        try {
            return snapshotRepository
                    .findBySnapshotKeyAndStatusAndExpiresAtAfter(
                            snapshotKey,
                            STATUS_ACTIVE,
                            LocalDateTime.now()
                    )
                    .map(snapshot -> toResponses(snapshot, safeLimit))
                    .orElse(List.of());
        } catch (Exception ex) {
            log.warn("Cannot read recommendation snapshot. snapshotKey={}", snapshotKey, ex);
            return List.of();
        }
    }

    @Transactional
    public void saveUserSnapshot(
            User user,
            String snapshotKey,
            List<RecommendationResponse> responses
    ) {
        if (user == null || user.getId() == null || user.getPublicId() == null) {
            log.warn("Skip user snapshot because user is invalid.");
            return;
        }

        saveSnapshot(user, OWNER_USER, snapshotKey, responses);
    }

    @Transactional
    public void savePublicSnapshot(
            String snapshotKey,
            List<RecommendationResponse> responses
    ) {
        saveSnapshot(null, OWNER_PUBLIC, snapshotKey, responses);
    }

    private void saveSnapshot(
            User user,
            String ownerType,
            String snapshotKey,
            List<RecommendationResponse> responses
    ) {
        if (snapshotKey == null || snapshotKey.isBlank()) {
            log.warn("Skip snapshot because snapshotKey is blank.");
            return;
        }

        List<RecommendationResponse> safeResponses = responses == null
                ? List.of()
                : responses.stream()
                .filter(Objects::nonNull)
                .filter(response -> response.getMoviePublicId() != null)
                .limit(properties.safeSnapshotSize())
                .toList();

        if (safeResponses.isEmpty()) {
            log.warn("Skip empty recommendation snapshot. snapshotKey={}", snapshotKey);
            return;
        }

        RecommendationSnapshot snapshot = snapshotRepository
                .findBySnapshotKey(snapshotKey)
                .orElseGet(() -> RecommendationSnapshot.builder()
                        .snapshotKey(snapshotKey)
                        .ownerType(ownerType)
                        .user(user)
                        .build());

        snapshot.setOwnerType(ownerType);
        snapshot.setUser(user);
        snapshot.setGeneratedAt(LocalDateTime.now());
        snapshot.setExpiresAt(LocalDateTime.now().plusHours(properties.safeSnapshotTtlHours()));
        snapshot.setStatus(STATUS_ACTIVE);

        List<RecommendationSnapshotItem> items = buildSnapshotItems(safeResponses);

        if (items.isEmpty()) {
            log.warn("Skip snapshot because all items failed serialization. snapshotKey={}", snapshotKey);
            return;
        }

        snapshot.replaceItems(items);
        snapshotRepository.save(snapshot);
    }

    private List<RecommendationSnapshotItem> buildSnapshotItems(
            List<RecommendationResponse> responses
    ) {
        List<RecommendationSnapshotItem> items = new ArrayList<>();

        for (int i = 0; i < responses.size(); i++) {
            RecommendationResponse response = responses.get(i);

            if (response == null || response.getMoviePublicId() == null) {
                continue;
            }

            try {
                items.add(RecommendationSnapshotItem.builder()
                        .positionIndex(i)
                        .moviePublicId(response.getMoviePublicId())
                        .finalScore(response.getFinalScore())
                        .responseJson(objectMapper.writeValueAsString(response))
                        .build());
            } catch (Exception ex) {
                log.warn(
                        "Skip one snapshot item because serialization failed. moviePublicId={}",
                        response.getMoviePublicId(),
                        ex
                );
            }
        }

        return items;
    }

    private List<RecommendationResponse> toResponses(
            RecommendationSnapshot snapshot,
            int limit
    ) {
        if (snapshot == null || snapshot.getItems() == null || snapshot.getItems().isEmpty()) {
            return List.of();
        }

        return snapshot.getItems()
                .stream()
                .filter(Objects::nonNull)
                .sorted(Comparator.comparing(RecommendationSnapshotItem::getPositionIndex))
                .limit(properties.safeLimit(limit))
                .map(this::toResponse)
                .filter(Objects::nonNull)
                .toList();
    }

    private RecommendationResponse toResponse(RecommendationSnapshotItem item) {
        try {
            if (item.getResponseJson() == null || item.getResponseJson().isBlank()) {
                return null;
            }

            return objectMapper.readValue(
                    item.getResponseJson(),
                    RecommendationResponse.class
            );
        } catch (Exception ex) {
            log.warn("Skip corrupted snapshot item. itemId={}", item.getId(), ex);
            return null;
        }
    }
}