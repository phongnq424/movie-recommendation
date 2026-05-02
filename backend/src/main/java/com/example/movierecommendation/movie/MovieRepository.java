package com.example.movierecommendation.movie;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MovieRepository extends JpaRepository<Movie, Long> {

    List<Movie> findByTitleContainingIgnoreCase(String keyword);

    Optional<Movie> findByPublicId(UUID publicId);

    List<Movie> findAllByPublicIdIn(List<UUID> publicIds);

    Optional<Movie> findBySlug(String slug);

    boolean existsBySlug(String slug);

    List<Movie> findByStatus(String status);

    List<Movie> findTop10ByOrderByAverageRatingDescRatingCountDesc();

    List<Movie> findByIdNotInOrderByAverageRatingDescRatingCountDesc(
            List<Long> movieIds,
            Pageable pageable
    );
}