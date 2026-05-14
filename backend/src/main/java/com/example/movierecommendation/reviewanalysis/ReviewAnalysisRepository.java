package com.example.movierecommendation.reviewanalysis;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ReviewAnalysisRepository extends JpaRepository<ReviewAnalysis, Long> {

    Optional<ReviewAnalysis> findByReviewId(Long reviewId);

    @Query("""
        SELECT ra.review.movie.id, AVG(ra.sentimentScore)
        FROM ReviewAnalysis ra
        WHERE ra.analyzed = true
          AND ra.review.movie.id IN :movieIds
        GROUP BY ra.review.movie.id
    """)
    List<Object[]> findAverageSentimentByMovieIds(
            @Param("movieIds") List<Long> movieIds
    );
}