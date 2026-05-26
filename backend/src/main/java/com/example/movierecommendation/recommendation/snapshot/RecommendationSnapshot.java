package com.example.movierecommendation.recommendation.snapshot;

import com.example.movierecommendation.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
        name = "recommendation_snapshots",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_recommendation_snapshot_key",
                        columnNames = "snapshot_key"
                )
        },
        indexes = {
                @Index(name = "idx_recommendation_snapshot_key", columnList = "snapshot_key"),
                @Index(name = "idx_recommendation_snapshot_expires_at", columnList = "expires_at"),
                @Index(name = "idx_recommendation_snapshot_owner_type", columnList = "owner_type")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecommendationSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "snapshot_key", nullable = false, unique = true, length = 180)
    private String snapshotKey;

    @Column(name = "owner_type", nullable = false, length = 20)
    private String ownerType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false)
    private Integer itemCount;

    @Column(nullable = false)
    private LocalDateTime generatedAt;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(nullable = false, length = 20)
    private String status;

    @Builder.Default
    @OneToMany(
            mappedBy = "snapshot",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    @OrderBy("positionIndex ASC")
    private List<RecommendationSnapshotItem> items = new ArrayList<>();

    @PrePersist
    public void onCreate() {
        if (generatedAt == null) {
            generatedAt = LocalDateTime.now();
        }

        if (status == null || status.isBlank()) {
            status = "ACTIVE";
        }

        if (itemCount == null) {
            itemCount = 0;
        }
    }

    public void replaceItems(List<RecommendationSnapshotItem> newItems) {
        items.clear();

        if (newItems == null || newItems.isEmpty()) {
            itemCount = 0;
            return;
        }

        for (RecommendationSnapshotItem item : newItems) {
            if (item == null) {
                continue;
            }

            item.setSnapshot(this);
            items.add(item);
        }

        itemCount = items.size();
    }
}