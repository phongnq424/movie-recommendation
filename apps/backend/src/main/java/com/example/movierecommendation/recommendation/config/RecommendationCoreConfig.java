package com.example.movierecommendation.recommendation.config;

import com.example.recommendation.core.ranking.RecommendationRanker;
import com.example.recommendation.core.rerank.GenreDiversityReRanker;
import com.example.recommendation.core.rerank.ReRankStrategy;
import com.example.recommendation.core.weight.RecommendationWeightPolicy;
import com.example.recommendation.core.weight.RecommendationWeightResolver;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RecommendationCoreConfig {

    @Bean
    public RecommendationRanker recommendationRanker() {
        return new RecommendationRanker();
    }

    @Bean
    public RecommendationWeightPolicy recommendationWeightPolicy() {
        return RecommendationWeightPolicy.defaults();
    }

    @Bean
    public RecommendationWeightResolver recommendationWeightResolver(
            RecommendationWeightPolicy recommendationWeightPolicy
    ) {
        return new RecommendationWeightResolver(recommendationWeightPolicy);
    }

    @Bean
    public ReRankStrategy genreDiversityReRankStrategy() {
        return new GenreDiversityReRanker();
    }
}