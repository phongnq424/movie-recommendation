package com.example.movierecommendation.reviewanalysis;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ReviewAnalysisRepository extends JpaRepository<ReviewAnalysis, Long> {

    Optional<ReviewAnalysis> findByReviewId(Long reviewId);
}