package com.example.movierecommendation.rating;

import com.example.movierecommendation.movie.Movie;
import com.example.movierecommendation.movie.MovieRepository;
import com.example.movierecommendation.rating.dto.RatingRequest;
import com.example.movierecommendation.rating.dto.RatingResponse;
import com.example.movierecommendation.user.User;
import com.example.movierecommendation.user.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RatingService {

    private final RatingRepository ratingRepository;
    private final MovieRepository movieRepository;
    private final UserRepository userRepository;

    @Transactional
    public RatingResponse rateMovie(RatingRequest request) {
        validateRatingRequest(request);

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Movie movie = movieRepository.findById(request.getMovieId())
                .orElseThrow(() -> new RuntimeException("Movie not found"));

        Rating rating = ratingRepository
                .findByUserIdAndMovieId(request.getUserId(), request.getMovieId())
                .orElse(null);

        if (rating == null) {
            rating = Rating.builder()
                    .user(user)
                    .movie(movie)
                    .ratingValue(request.getRatingValue())
                    .build();
        } else {
            rating.setRatingValue(request.getRatingValue());
        }

        Rating savedRating = ratingRepository.save(rating);

        updateMovieAverageRating(movie.getId());

        return RatingResponse.from(savedRating);
    }

    public List<RatingResponse> getRatingsByUser(Long userId) {
        return ratingRepository.findByUserId(userId)
                .stream()
                .map(RatingResponse::from)
                .toList();
    }

    public List<RatingResponse> getRatingsByMovie(Long movieId) {
        return ratingRepository.findByMovieId(movieId)
                .stream()
                .map(RatingResponse::from)
                .toList();
    }

    private void validateRatingRequest(RatingRequest request) {
        if (request.getUserId() == null) {
            throw new RuntimeException("User ID is required");
        }

        if (request.getMovieId() == null) {
            throw new RuntimeException("Movie ID is required");
        }

        if (request.getRatingValue() == null) {
            throw new RuntimeException("Rating value is required");
        }

        if (request.getRatingValue() < 1 || request.getRatingValue() > 5) {
            throw new RuntimeException("Rating value must be between 1 and 5");
        }
    }

    private void updateMovieAverageRating(Long movieId) {
        Movie movie = movieRepository.findById(movieId)
                .orElseThrow(() -> new RuntimeException("Movie not found"));

        List<Rating> ratings = ratingRepository.findByMovieId(movieId);

        double averageRating = ratings.stream()
                .mapToDouble(Rating::getRatingValue)
                .average()
                .orElse(0.0);

        movie.setAverageRating(averageRating);
        movie.setRatingCount(ratings.size());

        movieRepository.save(movie);
    }
}