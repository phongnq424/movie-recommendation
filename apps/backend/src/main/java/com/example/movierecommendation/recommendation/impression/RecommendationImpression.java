package com.example.movierecommendation.recommendation.impression;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "recommendation_impressions")
@Getter
@Setter
public class RecommendationImpression {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "request_id", nullable = false)
    private UUID requestId;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "movie_id", nullable = false)
    private Long movieId;

    @Column(name = "position", nullable = false)
    private Integer position;

    @Column(name = "final_score", nullable = false)
    private Double finalScore;

    @Column(name = "recommendation_type", nullable = false)
    private String recommendationType;

    @Column(name = "retrieval_model_version")
    private String retrievalModelVersion;

    @Column(name = "ranking_model_version")
    private String rankingModelVersion;

    @Column(name = "shown_at", nullable = false)
    private OffsetDateTime shownAt = OffsetDateTime.now();

    @Column(name = "clicked")
    private Boolean clicked = false;

    @Column(name = "watched_percent")
    private Double watchedPercent;

    @Column(name = "completed")
    private Boolean completed = false;

    @Column(name = "rating_value")
    private Double ratingValue;
}