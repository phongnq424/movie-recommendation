package com.example.movierecommendation.movieactor;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MovieActorRepository extends JpaRepository<MovieActor, Long> {

    List<MovieActor> findByMovieIdOrderByCastOrderAsc(Long movieId);

    List<MovieActor> findByActorId(Long actorId);

    Optional<MovieActor> findByMovieIdAndActorId(Long movieId, Long actorId);

    boolean existsByMovieIdAndActorId(Long movieId, Long actorId);

    void deleteByMovieId(Long movieId);
}