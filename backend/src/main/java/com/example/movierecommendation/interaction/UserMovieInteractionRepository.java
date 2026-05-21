package com.example.movierecommendation.interaction;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserMovieInteractionRepository extends JpaRepository<UserMovieInteraction, Long> {

    List<UserMovieInteraction> findByUserId(Long userId);

    Optional<UserMovieInteraction> findByUserIdAndMovieId(Long userId, Long movieId);

    List<UserMovieInteraction> findByMovieId(Long movieId);

    @Query("""
            select interaction
            from UserMovieInteraction interaction
            join fetch interaction.movie movie
            where interaction.user.id = :userId
            """)
    List<UserMovieInteraction> findByUserIdWithMovie(@Param("userId") Long userId);
}