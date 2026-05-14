package com.example.movierecommendation.reviewanalysis;

import com.example.movierecommendation.review.Review;
import com.example.movierecommendation.reviewanalysis.dto.ReviewAnalysisResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ReviewAnalysisService {

    private final ReviewAnalysisRepository reviewAnalysisRepository;
    private final NlpClient nlpClient;
    private final ObjectMapper objectMapper;

    @Transactional
    public ReviewAnalysis analyzeAndSave(Review review) {
        try {
            ReviewAnalysisResponse response = nlpClient.analyze(review.getContent());

            String keywordsJson = objectMapper.writeValueAsString(response.getKeywords());
            String aspectsJson = objectMapper.writeValueAsString(response.getAspects());

            ReviewAnalysis analysis = reviewAnalysisRepository
                    .findByReviewId(review.getId())
                    .orElseGet(() -> ReviewAnalysis.builder()
                            .review(review)
                            .build());

            analysis.setSentimentScore(response.getSentimentScore());
            analysis.setSentimentLabel(response.getSentimentLabel());
            analysis.setKeywordsJson(keywordsJson);
            analysis.setAspectsJson(aspectsJson);
            analysis.setAnalyzed(true);
            analysis.setAnalyzedAt(java.time.LocalDateTime.now());

            return reviewAnalysisRepository.save(analysis);
        } catch (Exception ex) {
            ReviewAnalysis analysis = reviewAnalysisRepository
                    .findByReviewId(review.getId())
                    .orElseGet(() -> ReviewAnalysis.builder()
                            .review(review)
                            .build());

            analysis.setSentimentScore(0.0);
            analysis.setSentimentLabel("NEUTRAL");
            analysis.setKeywordsJson("[]");
            analysis.setAspectsJson("{}");
            analysis.setAnalyzed(false);
            analysis.setAnalyzedAt(java.time.LocalDateTime.now());

            return reviewAnalysisRepository.save(analysis);
        }
    }
}