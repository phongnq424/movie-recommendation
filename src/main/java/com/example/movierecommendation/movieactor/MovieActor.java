package com.example.movierecommendation.movieactor;

import com.example.movierecommendation.actor.Actor;
import com.example.movierecommendation.movie.Movie;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "movie_actors",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"movie_id", "actor_id"})
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MovieActor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "movie_id", nullable = false)
    private Movie movie;

    @ManyToOne
    @JoinColumn(name = "actor_id", nullable = false)
    private Actor actor;

    private String characterName;

    private Integer castOrder;

    private Boolean mainCast = false;
}