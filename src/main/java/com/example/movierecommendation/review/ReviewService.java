package com.example.movierecommendation.review;

import com.example.movierecommendation.movie.Movie;
import com.example.movierecommendation.movie.MovieRepository;
import com.example.movierecommendation.review.dto.ReviewRequest;
import com.example.movierecommendation.review.dto.ReviewResponse;
import com.example.movierecommendation.review.dto.ReviewStatusUpdateRequest;
import com.example.movierecommendation.user.User;
import com.example.movierecommendation.user.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private static final String STATUS_PUBLISHED = "PUBLISHED";
    private static final String STATUS_HIDDEN = "HIDDEN";
    private static final String STATUS_DELETED = "DELETED";

    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final MovieRepository movieRepository;

    @Transactional
    public ReviewResponse createOrUpdateReview(ReviewRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Movie movie = movieRepository.findById(request.getMovieId())
                .orElseThrow(() -> new RuntimeException("Movie not found"));

        Review review = reviewRepository
                .findByUserIdAndMovieId(request.getUserId(), request.getMovieId())
                .orElse(null);

        if (review == null) {
            review = Review.builder()
                    .user(user)
                    .movie(movie)
                    .content(request.getContent().trim())
                    .spoiler(request.getSpoiler() != null ? request.getSpoiler() : false)
                    .status(STATUS_PUBLISHED)
                    .build();
        } else {
            if (STATUS_DELETED.equals(review.getStatus())) {
                review.setStatus(STATUS_PUBLISHED);
            }

            review.setContent(request.getContent().trim());
            review.setSpoiler(request.getSpoiler() != null ? request.getSpoiler() : false);
        }

        return ReviewResponse.from(reviewRepository.save(review));
    }

    public List<ReviewResponse> getPublishedReviewsByMovie(Long movieId) {
        return reviewRepository.findByMovieIdAndStatusOrderByCreatedAtDesc(movieId, STATUS_PUBLISHED)
                .stream()
                .map(ReviewResponse::from)
                .toList();
    }

    public List<ReviewResponse> getAllReviewsByMovie(Long movieId) {
        return reviewRepository.findByMovieIdOrderByCreatedAtDesc(movieId)
                .stream()
                .map(ReviewResponse::from)
                .toList();
    }

    public List<ReviewResponse> getPublishedReviewsByUser(Long userId) {
        return reviewRepository.findByUserIdAndStatusOrderByCreatedAtDesc(userId, STATUS_PUBLISHED)
                .stream()
                .map(ReviewResponse::from)
                .toList();
    }

    public List<ReviewResponse> getAllReviewsByUser(Long userId) {
        return reviewRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(ReviewResponse::from)
                .toList();
    }

    public ReviewResponse getReviewById(Long id) {
        Review review = getReviewEntityById(id);
        return ReviewResponse.from(review);
    }

    public ReviewResponse updateReview(Long id, ReviewRequest request) {
        Review review = getReviewEntityById(id);

        review.setContent(request.getContent().trim());
        review.setSpoiler(request.getSpoiler() != null ? request.getSpoiler() : false);

        if (STATUS_DELETED.equals(review.getStatus())) {
            review.setStatus(STATUS_PUBLISHED);
        }

        return ReviewResponse.from(reviewRepository.save(review));
    }

    public ReviewResponse updateReviewStatus(Long id, ReviewStatusUpdateRequest request) {
        Review review = getReviewEntityById(id);

        String status = normalizeStatus(request.getStatus());
        review.setStatus(status);

        return ReviewResponse.from(reviewRepository.save(review));
    }

    public void softDeleteReview(Long id) {
        Review review = getReviewEntityById(id);

        review.setStatus(STATUS_DELETED);

        reviewRepository.save(review);
    }

    public void hardDeleteReview(Long id) {
        Review review = getReviewEntityById(id);

        reviewRepository.delete(review);
    }

    private Review getReviewEntityById(Long id) {
        return reviewRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Review not found"));
    }

    private String normalizeStatus(String status) {
        if (status == null || status.isBlank()) {
            throw new RuntimeException("Review status is required");
        }

        String normalizedStatus = status.trim().toUpperCase();

        if (!normalizedStatus.equals(STATUS_PUBLISHED)
                && !normalizedStatus.equals(STATUS_HIDDEN)
                && !normalizedStatus.equals(STATUS_DELETED)) {
            throw new RuntimeException("Review status must be PUBLISHED, HIDDEN, or DELETED");
        }

        return normalizedStatus;
    }
}