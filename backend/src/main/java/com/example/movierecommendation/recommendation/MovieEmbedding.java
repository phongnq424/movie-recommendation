package com.example.movierecommendation.recommendation;

import com.example.movierecommendation.movie.Movie;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;

@Entity
@Table(name = "movie_embeddings")
@Getter
@Setter
public class MovieEmbedding {

    @Id
    @Column(name = "movie_id")
    private Long movieId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "movie_id")
    private Movie movie;

    @Column(name = "embedding", columnDefinition = "vector(128)", nullable = false)
    private String embedding;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();
}