package com.example.movierecommendation.recommendation;

import com.example.movierecommendation.rating.Rating;
import com.example.movierecommendation.rating.RatingRepository;
import com.example.movierecommendation.recommendation.dto.UserMovieInterestProfile;
import com.example.movierecommendation.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class UserEmbeddingService {

    private static final int VECTOR_DIMENSION = 128;

    private final RatingRepository ratingRepository;
    private final UserMovieInterestService userMovieInterestService;
    private final MovieEmbeddingNativeRepository movieEmbeddingNativeRepository;

    public String buildUserEmbedding(User user) {
        List<Rating> ratings = ratingRepository.findByUserId(user.getId());
        UserMovieInterestProfile profile = userMovieInterestService.build(user.getId(), ratings);

        Map<Long, Double> movieInterestScores = profile.getMovieInterestScores();

        if (movieInterestScores == null || movieInterestScores.isEmpty()) {
            return null;
        }

        List<Long> movieIds = new ArrayList<>(movieInterestScores.keySet());
        Map<Long, String> embeddingTextByMovieId = movieEmbeddingNativeRepository.findEmbeddingTextByMovieIds(movieIds);

        if (embeddingTextByMovieId.isEmpty()) {
            return null;
        }

        double[] userVector = new double[VECTOR_DIMENSION];
        double totalWeight = 0.0;

        for (Map.Entry<Long, Double> entry : movieInterestScores.entrySet()) {
            Long movieId = entry.getKey();
            Double weight = entry.getValue();

            if (weight == null || weight <= 0.0) {
                continue;
            }

            String movieEmbeddingText = embeddingTextByMovieId.get(movieId);

            if (movieEmbeddingText == null || movieEmbeddingText.isBlank()) {
                continue;
            }

            double[] movieVector = VectorUtils.parsePgVector(movieEmbeddingText);

            if (movieVector.length != VECTOR_DIMENSION) {
                continue;
            }

            for (int i = 0; i < VECTOR_DIMENSION; i++) {
                userVector[i] += movieVector[i] * weight;
            }

            totalWeight += weight;
        }

        if (totalWeight <= 0.0) {
            return null;
        }

        for (int i = 0; i < VECTOR_DIMENSION; i++) {
            userVector[i] = userVector[i] / totalWeight;
        }

        VectorUtils.normalize(userVector);

        return VectorUtils.toPgVector(userVector);
    }
}