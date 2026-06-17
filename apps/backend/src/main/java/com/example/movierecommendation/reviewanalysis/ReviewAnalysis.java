package com.example.movierecommendation.reviewanalysis;

import com.example.movierecommendation.review.Review;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "review_analysis")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "review_id", nullable = false, unique = true)
    private Review review;

    @Column(nullable = false)
    private Double sentimentScore;

    @Column(nullable = false)
    private String sentimentLabel;

    @Column(columnDefinition = "TEXT")
    private String keywordsJson;

    @Column(columnDefinition = "TEXT")
    private String aspectsJson;

    @Column(nullable = false)
    private Boolean analyzed;

    private LocalDateTime analyzedAt;

    @PrePersist
    public void onCreate() {
        if (this.analyzed == null) {
            this.analyzed = true;
        }

        if (this.analyzedAt == null) {
            this.analyzedAt = LocalDateTime.now();
        }
    }
}