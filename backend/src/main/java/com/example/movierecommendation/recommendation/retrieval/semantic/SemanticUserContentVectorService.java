package com.example.movierecommendation.recommendation.retrieval.semantic;

import com.example.movierecommendation.rating.Rating;
import com.example.movierecommendation.rating.RatingRepository;
import com.example.movierecommendation.recommendation.profile.UserMovieInterestService;
import com.example.movierecommendation.recommendation.profile.UserMovieInterestProfile;
import com.example.movierecommendation.recommendation.vector.PgVectorUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SemanticUserContentVectorService {

    private static final int MAX_PROFILE_MOVIES = 50;

    private final RatingRepository ratingRepository;
    private final UserMovieInterestService userMovieInterestService;
    private final MovieContentEmbeddingRepository movieContentEmbeddingRepository;

    public String buildUserContentEmbeddingText(Long userId) {
        if (userId == null) {
            return null;
        }

        List<Rating> ratings = ratingRepository.findByUserId(userId);
        UserMovieInterestProfile profile = userMovieInterestService.build(userId, ratings);

        if (profile == null || profile.getMovieInterestScores() == null || profile.getMovieInterestScores().isEmpty()) {
            return null;
        }

        List<Long> profileMovieIds = profile.getMovieInterestScores()
                .entrySet()
                .stream()
                .filter(entry -> entry.getKey() != null)
                .filter(entry -> entry.getValue() != null && entry.getValue() > 0.0)
                .sorted((left, right) -> Double.compare(right.getValue(), left.getValue()))
                .limit(MAX_PROFILE_MOVIES)
                .map(Map.Entry::getKey)
                .toList();

        if (profileMovieIds.isEmpty()) {
            return null;
        }

        Map<Long, String> embeddingByMovieId = movieContentEmbeddingRepository.findEmbeddingTextsByMovieIds(profileMovieIds);

        if (embeddingByMovieId.isEmpty()) {
            return null;
        }

        double[] weightedSum = null;
        double totalWeight = 0.0;

        for (Long movieId : profileMovieIds) {
            String embeddingText = embeddingByMovieId.get(movieId);

            if (embeddingText == null || embeddingText.isBlank()) {
                continue;
            }

            double weight = profile.getMovieInterestScores().getOrDefault(movieId, 0.0);

            if (weight <= 0.0) {
                continue;
            }

            double[] movieVector = PgVectorUtils.parsePgVector(embeddingText);

            if (movieVector.length == 0) {
                continue;
            }

            if (weightedSum == null) {
                weightedSum = new double[movieVector.length];
            }

            if (weightedSum.length != movieVector.length) {
                continue;
            }

            for (int i = 0; i < movieVector.length; i++) {
                weightedSum[i] += movieVector[i] * weight;
            }

            totalWeight += weight;
        }

        if (weightedSum == null || totalWeight <= 0.0) {
            return null;
        }

        for (int i = 0; i < weightedSum.length; i++) {
            weightedSum[i] = weightedSum[i] / totalWeight;
        }

        return PgVectorUtils.toPgVector(normalize(weightedSum));
    }

    private double[] normalize(double[] vector) {
        double sum = 0.0;

        for (double value : vector) {
            sum += value * value;
        }

        if (sum <= 0.0) {
            return vector;
        }

        double norm = Math.sqrt(sum);
        double[] normalized = new double[vector.length];

        for (int i = 0; i < vector.length; i++) {
            normalized[i] = vector[i] / norm;
        }

        return normalized;
    }
}
