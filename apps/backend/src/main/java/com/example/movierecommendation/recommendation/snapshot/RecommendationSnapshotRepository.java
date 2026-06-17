package com.example.movierecommendation.recommendation.snapshot;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;

public interface RecommendationSnapshotRepository
        extends JpaRepository<RecommendationSnapshot, Long> {

    @EntityGraph(attributePaths = "items")
    Optional<RecommendationSnapshot> findBySnapshotKeyAndStatusAndExpiresAtAfter(
            String snapshotKey,
            String status,
            LocalDateTime now
    );

    @EntityGraph(attributePaths = "items")
    Optional<RecommendationSnapshot> findBySnapshotKeyAndStatus(
            String snapshotKey,
            String status
    );

    @EntityGraph(attributePaths = "items")
    Optional<RecommendationSnapshot> findBySnapshotKey(String snapshotKey);
}