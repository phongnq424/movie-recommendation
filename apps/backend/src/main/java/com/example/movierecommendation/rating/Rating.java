package com.example.movierecommendation.rating;

import com.example.movierecommendation.movie.Movie;
import com.example.movierecommendation.user.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "ratings",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_ratings_user_movie",
                        columnNames = {"user_id", "movie_id"}
                )
        },
        indexes = {
                @Index(
                        name = "idx_ratings_movie_id",
                        columnList = "movie_id"
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Rating {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Double ratingValue;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "movie_id", nullable = false)
    private Movie movie;
}