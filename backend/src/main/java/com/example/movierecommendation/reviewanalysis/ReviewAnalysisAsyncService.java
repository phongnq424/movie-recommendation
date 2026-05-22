package com.example.movierecommendation.reviewanalysis;

import com.example.movierecommendation.review.Review;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ReviewAnalysisAsyncService {

    private final ReviewAnalysisService reviewAnalysisService;

    @Async
    public void analyzeReviewAsync(Review review) {
        reviewAnalysisService.analyzeAndSave(review);
    }
}