package com.example.movierecommendation.rating;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RatingRepository extends JpaRepository<Rating, Long> {

    List<Rating> findByUserId(Long userId);

    List<Rating> findByMovieId(Long movieId);

    Optional<Rating> findByUserIdAndMovieId(Long userId, Long movieId);

    boolean existsByUserIdAndMovieId(Long userId, Long movieId);

    @Query("""
        SELECT r
        FROM Rating r
        WHERE r.user.id <> :userId
    """)
    List<Rating> findOtherUsersRatings(@Param("userId") Long userId);
}