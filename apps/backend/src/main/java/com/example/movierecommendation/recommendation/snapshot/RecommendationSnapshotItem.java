package com.example.movierecommendation.recommendation.snapshot;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(
        name = "recommendation_snapshot_items",
        indexes = {
                @Index(name = "idx_recommendation_snapshot_item_snapshot", columnList = "snapshot_id"),
                @Index(name = "idx_recommendation_snapshot_item_movie_public_id", columnList = "movie_public_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecommendationSnapshotItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Integer positionIndex;

    @Column(name = "movie_public_id", nullable = false)
    private UUID moviePublicId;

    private Double finalScore;

    @Column(name = "response_json", nullable = false, columnDefinition = "TEXT")
    private String responseJson;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "snapshot_id", nullable = false)
    private RecommendationSnapshot snapshot;
}