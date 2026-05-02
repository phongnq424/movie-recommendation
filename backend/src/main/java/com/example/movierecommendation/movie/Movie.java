package com.example.movierecommendation.movie;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
        name = "movies",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = "public_id"),
                @UniqueConstraint(columnNames = "slug")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Movie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "public_id", nullable = false, unique = true, updatable = false)
    private UUID publicId;

    @Column(nullable = false)
    private String title;

    private String originalTitle;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(length = 3000)
    private String description;

    private Integer releaseYear;

    private Integer durationMinutes;

    private String posterUrl;

    private String backdropUrl;

    private String trailerUrl;

    private String movieUrl;

    private String quality;

    private String ageRating;

    /**
     * DRAFT, PUBLISHED, HIDDEN
     */
    private String status;

    private Double averageRating;

    private Integer ratingCount;

    private Long viewCount;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    public void onCreate() {
        if (this.publicId == null) {
            this.publicId = UUID.randomUUID();
        }

        if (this.status == null) {
            this.status = "DRAFT";
        }

        if (this.averageRating == null) {
            this.averageRating = 0.0;
        }

        if (this.ratingCount == null) {
            this.ratingCount = 0;
        }

        if (this.viewCount == null) {
            this.viewCount = 0L;
        }

        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}