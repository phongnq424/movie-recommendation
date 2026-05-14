package com.example.movierecommendation.movieactor;

import com.example.movierecommendation.movie.Movie;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MovieActorRepository extends JpaRepository<MovieActor, Long> {

    List<MovieActor> findByMovieIdOrderByCastOrderAsc(Long movieId);

    List<MovieActor> findByActorId(Long actorId);

    Optional<MovieActor> findByMovieIdAndActorId(Long movieId, Long actorId);

    boolean existsByMovieIdAndActorId(Long movieId, Long actorId);

    void deleteByMovieId(Long movieId);

    @Query("""
        SELECT ma
        FROM MovieActor ma
        WHERE ma.movie.id IN :movieIds
    """)
    List<MovieActor> findByMovieIds(@Param("movieIds") List<Long> movieIds);

    @Query("""
        SELECT DISTINCT ma.movie
        FROM MovieActor ma
        WHERE ma.actor.id IN :actorIds
          AND ma.movie.status = 'PUBLISHED'
        ORDER BY
            COALESCE(ma.movie.averageRating, 0) DESC,
            COALESCE(ma.movie.ratingCount, 0) DESC
    """)
    List<Movie> findPublishedMoviesByActorIds(
            @Param("actorIds") List<Long> actorIds,
            Pageable pageable
    );
}