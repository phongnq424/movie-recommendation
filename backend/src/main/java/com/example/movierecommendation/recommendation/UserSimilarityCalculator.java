package com.example.movierecommendation.recommendation;

import com.example.movierecommendation.rating.Rating;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class UserSimilarityCalculator {

    private static final int MIN_OVERLAP_RATINGS = 3;
    private static final double SHRINKAGE = 5.0;

    public double calculate(
            Map<Long, Double> currentUserRatingMap,
            List<Rating> otherUserRatings
    ) {
        if (currentUserRatingMap == null || currentUserRatingMap.isEmpty()) {
            return 0.0;
        }

        if (otherUserRatings == null || otherUserRatings.isEmpty()) {
            return 0.0;
        }

        double currentUserTotal = 0.0;
        double otherUserTotal = 0.0;
        int overlap = 0;

        for (Rating otherRating : otherUserRatings) {
            if (otherRating == null) {
                continue;
            }

            if (otherRating.getMovie() == null) {
                continue;
            }

            if (otherRating.getRatingValue() == null) {
                continue;
            }

            Long movieId = otherRating.getMovie().getId();

            if (movieId == null) {
                continue;
            }

            if (!currentUserRatingMap.containsKey(movieId)) {
                continue;
            }

            Double currentRatingValue = currentUserRatingMap.get(movieId);

            if (currentRatingValue == null) {
                continue;
            }

            currentUserTotal += currentRatingValue;
            otherUserTotal += otherRating.getRatingValue();
            overlap++;
        }

        if (overlap < MIN_OVERLAP_RATINGS) {
            return 0.0;
        }

        double currentUserAverage = currentUserTotal / overlap;
        double otherUserAverage = otherUserTotal / overlap;

        double numerator = 0.0;
        double currentUserSquaredSum = 0.0;
        double otherUserSquaredSum = 0.0;

        for (Rating otherRating : otherUserRatings) {
            if (otherRating == null) {
                continue;
            }

            if (otherRating.getMovie() == null) {
                continue;
            }

            if (otherRating.getRatingValue() == null) {
                continue;
            }

            Long movieId = otherRating.getMovie().getId();

            if (movieId == null) {
                continue;
            }

            if (!currentUserRatingMap.containsKey(movieId)) {
                continue;
            }

            Double currentRatingValue = currentUserRatingMap.get(movieId);

            if (currentRatingValue == null) {
                continue;
            }

            double currentDeviation = currentRatingValue - currentUserAverage;
            double otherDeviation = otherRating.getRatingValue() - otherUserAverage;

            numerator += currentDeviation * otherDeviation;
            currentUserSquaredSum += currentDeviation * currentDeviation;
            otherUserSquaredSum += otherDeviation * otherDeviation;
        }

        if (currentUserSquaredSum == 0.0 || otherUserSquaredSum == 0.0) {
            return 0.0;
        }

        double denominator = Math.sqrt(currentUserSquaredSum) * Math.sqrt(otherUserSquaredSum);
        double pearson = numerator / denominator;

        if (pearson <= 0.0) {
            return 0.0;
        }

        double confidence = overlap / (overlap + SHRINKAGE);

        return clamp(pearson * confidence);
    }

    private double clamp(double value) {
        return Math.max(0.0, Math.min(1.0, value));
    }
}