package com.example.movierecommendation.interaction;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserMovieInteractionRepository extends JpaRepository<UserMovieInteraction, Long> {

    List<UserMovieInteraction> findByUserId(Long userId);

    List<UserMovieInteraction> findByUserIdAndMovieId(Long userId, Long movieId);

    List<UserMovieInteraction> findByMovieId(Long movieId);
}