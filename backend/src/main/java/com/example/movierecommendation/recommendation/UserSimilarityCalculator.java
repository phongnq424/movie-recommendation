package com.example.movierecommendation.recommendation;

import com.example.movierecommendation.rating.Rating;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class UserSimilarityCalculator {

    private static final int MIN_OVERLAP_RATINGS = 3;
    private static final double MAX_RATING_DIFFERENCE = 4.0;

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

        double totalDifference = 0.0;
        int overlap = 0;

        for (Rating otherRating : otherUserRatings) {
            if (otherRating.getMovie() == null) {
                continue;
            }

            Long movieId = otherRating.getMovie().getId();

            if (!currentUserRatingMap.containsKey(movieId)) {
                continue;
            }

            double currentRating = currentUserRatingMap.get(movieId);
            double otherRatingValue = safeDouble(otherRating.getRatingValue());

            totalDifference += Math.abs(currentRating - otherRatingValue);
            overlap++;
        }

        if (overlap < MIN_OVERLAP_RATINGS) {
            return 0.0;
        }

        double averageDifference = totalDifference / overlap;

        return clamp(1.0 - averageDifference / MAX_RATING_DIFFERENCE);
    }

    private double safeDouble(Double value) {
        return value == null ? 0.0 : value;
    }

    private double clamp(double value) {
        return Math.max(0.0, Math.min(1.0, value));
    }
}