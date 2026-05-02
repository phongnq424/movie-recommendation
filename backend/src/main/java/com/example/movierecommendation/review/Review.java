package com.example.movierecommendation.review;

import com.example.movierecommendation.movie.Movie;
import com.example.movierecommendation.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "reviews",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"user_id", "movie_id"})
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Nội dung review của user về phim.
     */
    @Column(nullable = false, length = 3000)
    private String content;

    /**
     * true = review có spoil nội dung phim.
     */
    private Boolean spoiler;

    /**
     * PUBLISHED = hiển thị công khai.
     * HIDDEN = admin ẩn review.
     * DELETED = user/admin xóa mềm review.
     */
    private String status;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "movie_id", nullable = false)
    private Movie movie;

    @PrePersist
    public void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();

        if (this.spoiler == null) {
            this.spoiler = false;
        }

        if (this.status == null) {
            this.status = "PUBLISHED";
        }
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}