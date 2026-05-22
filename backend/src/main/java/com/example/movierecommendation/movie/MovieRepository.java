package com.example.movierecommendation.movie;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MovieRepository extends JpaRepository<Movie, Long> {

    Page<Movie> findByTitleContainingIgnoreCase(String keyword, Pageable pageable);

    Page<Movie> findByStatusAndTitleContainingIgnoreCase(
            String status,
            String keyword,
            Pageable pageable
    );

    Optional<Movie> findByPublicId(UUID publicId);

    List<Movie> findAllByPublicIdIn(List<UUID> publicIds);

    Optional<Movie> findBySlug(String slug);

    boolean existsBySlug(String slug);

    Page<Movie> findByStatus(String status, Pageable pageable);
    Page<Movie> findByStatusNot(String status, Pageable pageable);

    List<Movie> findByStatus(String status);

    List<Movie> findTop10ByOrderByAverageRatingDescRatingCountDesc();

    List<Movie> findByIdNotInOrderByAverageRatingDescRatingCountDesc(
            List<Long> movieIds,
            Pageable pageable
    );

    @Query("""
        SELECT m
        FROM Movie m
        WHERE m.status = 'PUBLISHED'
        ORDER BY
            m.viewCount DESC,
            m.averageRating DESC,
            m.ratingCount DESC
    """)
    List<Movie> findPopularPublishedMovies(Pageable pageable);

    @Query("""
        SELECT m
        FROM Movie m
        WHERE m.status = 'PUBLISHED'
        ORDER BY
            m.releaseYear DESC,
            m.createdAt DESC
    """)
    List<Movie> findFreshPublishedMovies(Pageable pageable);

    @Query("""
        SELECT m
        FROM Movie m
        WHERE m.status = 'PUBLISHED'
          AND m.id NOT IN :excludedMovieIds
        ORDER BY
            m.viewCount DESC,
            m.averageRating DESC,
            m.ratingCount DESC
    """)
    List<Movie> findPopularPublishedMoviesExcluding(
            List<Long> excludedMovieIds,
            Pageable pageable
    );

    @Modifying
    @Query("""
        UPDATE Movie m
        SET m.viewCount = COALESCE(m.viewCount, 0) + 1
        WHERE m.publicId = :publicId
          AND m.status = 'PUBLISHED'
    """)
    int incrementViewCountByPublicId(@Param("publicId") UUID publicId);
}