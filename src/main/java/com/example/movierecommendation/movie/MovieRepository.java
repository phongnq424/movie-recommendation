package com.example.movierecommendation.movie;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MovieRepository extends JpaRepository<Movie, Long> {

    List<Movie> findByTitleContainingIgnoreCase(String keyword);

    List<Movie> findTop10ByOrderByAverageRatingDescRatingCountDesc();

    List<Movie> findByIdNotInOrderByAverageRatingDescRatingCountDesc(
            List<Long> movieIds,
            Pageable pageable
    );
}