package com.example.movierecommendation.recommendation.retrieval.semantic;

import com.example.movierecommendation.rating.Rating;
import com.example.movierecommendation.rating.RatingRepository;
import com.example.movierecommendation.recommendation.profile.UserMovieInterestService;
import com.example.movierecommendation.recommendation.profile.UserMovieInterestProfile;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;


@Service
@RequiredArgsConstructor
public class SemanticUserContentVectorService {

    private static final int MAX_PROFILE_MOVIES = 50;

    private final RatingRepository ratingRepository;
    private final UserMovieInterestService userMovieInterestService;
    public List<SemanticProfileMovie> buildUserProfileMovies(Long userId) {
        if (userId == null) {
            return List.of();
        }

        List<Rating> ratings = ratingRepository.findByUserId(userId);
        UserMovieInterestProfile profile = userMovieInterestService.build(userId, ratings);

        if (profile == null
                || profile.getMovieInterestScores() == null
                || profile.getMovieInterestScores().isEmpty()) {
            return List.of();
        }

        return profile.getMovieInterestScores()
                .entrySet()
                .stream()
                .filter(entry -> entry.getKey() != null)
                .filter(entry -> entry.getValue() != null && entry.getValue() > 0.0)
                .sorted((left, right) -> Double.compare(right.getValue(), left.getValue()))
                .limit(MAX_PROFILE_MOVIES)
                .map(entry -> new SemanticProfileMovie(
                        entry.getKey(),
                        clamp(entry.getValue())
                ))
                .toList();
    }
    private double clamp(double value) {
        return Math.max(0.0, Math.min(1.0, value));
    }

}
