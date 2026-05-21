package com.example.movierecommendation.recommendation;

import com.example.movierecommendation.interaction.UserMovieInteraction;
import com.example.movierecommendation.interaction.UserMovieInteractionRepository;
import com.example.movierecommendation.rating.Rating;
import com.example.movierecommendation.recommendation.dto.UserMovieInterestProfile;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class UserMovieInterestService {

    private static final double LIKED_RATING_THRESHOLD = 4.0;

    private final UserMovieInteractionRepository interactionRepository;

    public UserMovieInterestProfile build(Long userId, List<Rating> userRatings) {
        Map<Long, Double> movieInterestScores = new HashMap<>();

        addRatingInterest(movieInterestScores, userRatings);

        List<UserMovieInteraction> interactions = interactionRepository.findByUserIdWithMovie(userId);
        addInteractionInterest(movieInterestScores, interactions);

        return UserMovieInterestProfile.builder()
                .movieInterestScores(movieInterestScores)
                .interactionCount(interactions.size())
                .build();
    }

    private void addRatingInterest(
            Map<Long, Double> movieInterestScores,
            List<Rating> userRatings
    ) {
        if (userRatings == null || userRatings.isEmpty()) {
            return;
        }

        for (Rating rating : userRatings) {
            if (rating.getMovie() == null) {
                continue;
            }

            double ratingValue = safeDouble(rating.getRatingValue());

            if (ratingValue < LIKED_RATING_THRESHOLD) {
                continue;
            }

            Long movieId = rating.getMovie().getId();
            double interest = clamp(ratingValue / 5.0);

            movieInterestScores.merge(movieId, interest, Math::max);
        }
    }

    private void addInteractionInterest(
            Map<Long, Double> movieInterestScores,
            List<UserMovieInteraction> interactions
    ) {
        if (interactions == null || interactions.isEmpty()) {
            return;
        }

        for (UserMovieInteraction interaction : interactions) {
            if (interaction.getMovie() == null) {
                continue;
            }

            Long movieId = interaction.getMovie().getId();
            double interest = calculateInteractionInterest(interaction);

            if (interest <= 0) {
                continue;
            }

            movieInterestScores.merge(movieId, interest, Math::max);
        }
    }

    private double calculateInteractionInterest(UserMovieInteraction interaction) {
        if (Boolean.TRUE.equals(interaction.getCompleted())) {
            return 1.0;
        }

        Double progressPercent = interaction.getProgressPercent();

        if (progressPercent != null) {
            if (progressPercent >= 95) {
                return 1.0;
            }

            if (progressPercent >= 75) {
                return 0.85;
            }

            if (progressPercent >= 50) {
                return 0.65;
            }

            if (progressPercent >= 25) {
                return 0.45;
            }
        }

        String type = interaction.getInteractionType();

        if (type == null || type.isBlank()) {
            return safeDouble(interaction.getValue());
        }

        return switch (type) {
            case "VIEW_DETAIL" -> 0.15;
            case "PLAY" -> 0.35;
            case "WATCH_25_PERCENT" -> 0.45;
            case "WATCH_50_PERCENT" -> 0.65;
            case "WATCH_75_PERCENT" -> 0.85;
            case "FINISH_WATCHING" -> 1.0;
            case "PAUSE" -> 0.10;
            default -> safeDouble(interaction.getValue());
        };
    }

    private double safeDouble(Double value) {
        return value == null ? 0.0 : value;
    }

    private double clamp(double value) {
        return Math.max(0.0, Math.min(1.0, value));
    }
}