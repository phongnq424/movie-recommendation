package com.example.movierecommendation.rating;

import com.example.movierecommendation.genre.Genre;
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
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RatingService {

    private final RatingRepository ratingRepository;
    private final MovieRepository movieRepository;
    private final UserRepository userRepository;

    @Transactional
    public RatingResponse rateMovie(UUID currentUserPublicId, RatingRequest request) {
        validateRatingRequest(request);

        Movie movie = getMovieByPublicId(request.getMoviePublicId());
        User user = getUserByPublicId(currentUserPublicId);

        Rating rating = ratingRepository
                .findByUserIdAndMovieId(user.getId(), movie.getId())
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

    public List<RatingResponse> getRatingsByUser(UUID userPublicId) {
        User user = getUserByPublicId(userPublicId);
        return ratingRepository.findByUserId(user.getId())
                .stream()
                .map(RatingResponse::from)
                .toList();
    }

    public List<RatingResponse> getRatingsByMovie(UUID moviePublicId) {
        Movie movie = getMovieByPublicId(moviePublicId);
        return ratingRepository.findByMovieId(movie.getId())
                .stream()
                .map(RatingResponse::from)
                .toList();
    }

    private void validateRatingRequest(RatingRequest request) {
        if (request.getMoviePublicId() == null) {
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
    private Movie getMovieByPublicId(UUID moviePublicId) {
        if (moviePublicId == null) {
            throw new RuntimeException("Movie public ID is required");
        }

        return movieRepository.findByPublicId(moviePublicId)
                .orElseThrow(() -> new RuntimeException("Movie not found"));
    }
    private User getUserByPublicId(UUID userPublicId) {
        if (userPublicId == null) {
            throw new RuntimeException("User public ID is required");
        }

        return userRepository.findByPublicId(userPublicId)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}