package com.example.movierecommendation.interaction;

import com.example.movierecommendation.movie.Movie;
import com.example.movierecommendation.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "user_movie_interactions",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"user_id", "movie_id"})
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserMovieInteraction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String interactionType;

    private Double value;

    private Integer watchedSeconds;

    private Integer durationSeconds;

    private Double progressPercent;

    private Boolean completed;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne
    @JoinColumn(name = "movie_id", nullable = false)
    private Movie movie;

    @PrePersist
    public void onCreate() {
        if (this.value == null) {
            this.value = 0.0;
        }

        if (this.progressPercent == null) {
            this.progressPercent = 0.0;
        }

        if (this.completed == null) {
            this.completed = false;
        }

        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}