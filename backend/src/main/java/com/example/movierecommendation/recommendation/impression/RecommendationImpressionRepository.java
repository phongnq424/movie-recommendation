package com.example.movierecommendation.recommendation.impression;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface RecommendationImpressionRepository extends JpaRepository<RecommendationImpression, Long> {

    List<RecommendationImpression> findByRequestId(UUID requestId);
}