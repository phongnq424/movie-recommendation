package com.example.movierecommendation.review;

import com.example.movierecommendation.movie.Movie;
import com.example.movierecommendation.movie.MovieRepository;
import com.example.movierecommendation.review.dto.ReviewRequest;
import com.example.movierecommendation.review.dto.ReviewResponse;
import com.example.movierecommendation.review.dto.ReviewStatusUpdateRequest;
import com.example.movierecommendation.user.User;
import com.example.movierecommendation.user.UserRepository;
import com.example.movierecommendation.reviewanalysis.ReviewAnalysisAsyncService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private static final String STATUS_PUBLISHED = "PUBLISHED";
    private static final String STATUS_HIDDEN = "HIDDEN";
    private static final String STATUS_DELETED = "DELETED";

    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final MovieRepository movieRepository;
    private final ReviewAnalysisAsyncService reviewAnalysisAsyncService;

    @Transactional
    public ReviewResponse createOrUpdateReview(
            UUID currentUserPublicId,
            ReviewRequest request
    ) {
        User user = userRepository.findByPublicId(currentUserPublicId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Movie movie = movieRepository.findByPublicId(request.getMoviePublicId())
                .orElseThrow(() -> new RuntimeException("Movie not found"));

        Review review = reviewRepository
                .findByUserIdAndMovieId(user.getId(), movie.getId())
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
                throw new RuntimeException("Deleted review cannot be updated");
            }

            review.setContent(request.getContent().trim());
            review.setSpoiler(request.getSpoiler() != null ? request.getSpoiler() : false);
        }

        Review savedReview = reviewRepository.save(review);

        reviewAnalysisAsyncService.analyzeReviewAsync(savedReview);

        return ReviewResponse.from(savedReview);
    }

    public List<ReviewResponse> getPublishedReviewsByMovie(UUID movieId) {
        Movie movie = movieRepository.findByPublicId(movieId)
                .orElseThrow(() -> new RuntimeException("Movie not found"));

        return reviewRepository
                .findByMovieIdAndStatusOrderByCreatedAtDesc(movie.getId(), STATUS_PUBLISHED)
                .stream()
                .map(ReviewResponse::from)
                .toList();
    }

    public List<ReviewResponse> getAllReviewsByMovie(UUID movieId) {
        Movie movie = movieRepository.findByPublicId(movieId)
                .orElseThrow(() -> new RuntimeException("Movie not found"));

        return reviewRepository.findByMovieIdOrderByCreatedAtDesc(movie.getId())
                .stream()
                .map(ReviewResponse::from)
                .toList();
    }

    public List<ReviewResponse> getPublishedReviewsByUser(UUID userId) {
        User user = userRepository.findByPublicId(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return reviewRepository
                .findByUserIdAndStatusOrderByCreatedAtDesc(user.getId(), STATUS_PUBLISHED)
                .stream()
                .map(ReviewResponse::from)
                .toList();
    }

    public List<ReviewResponse> getMyReviews(UUID currentUserPublicId) {
        User user = userRepository.findByPublicId(currentUserPublicId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return reviewRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(ReviewResponse::from)
                .toList();
    }

    public List<ReviewResponse> getAllReviewsByUser(UUID userId) {
        User user = userRepository.findByPublicId(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return reviewRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(ReviewResponse::from)
                .toList();
    }

    public ReviewResponse getReviewById(
            Long id,
            UUID currentUserPublicId,
            boolean isAdmin
    ) {
        Review review = getReviewEntityById(id);

        boolean isOwner = review.getUser().getPublicId().equals(currentUserPublicId);

        if (STATUS_PUBLISHED.equals(review.getStatus())) {
            return ReviewResponse.from(review);
        }

        if (isAdmin || isOwner) {
            return ReviewResponse.from(review);
        }

        throw new RuntimeException("Review not found");
    }

    public ReviewResponse updateReview(
            Long id,
            UUID currentUserPublicId,
            boolean isAdmin,
            ReviewRequest request
    ) {
        Review review = getReviewEntityById(id);

        if (!isAdmin && !review.getUser().getPublicId().equals(currentUserPublicId)) {
            throw new RuntimeException("You can only update your own review");
        }

        if (STATUS_DELETED.equals(review.getStatus())) {
            throw new RuntimeException("Deleted review cannot be updated");
        }

        review.setContent(request.getContent().trim());
        review.setSpoiler(request.getSpoiler() != null ? request.getSpoiler() : false);

        Review savedReview = reviewRepository.save(review);

        reviewAnalysisAsyncService.analyzeReviewAsync(savedReview);

        return ReviewResponse.from(savedReview);
    }

    public ReviewResponse updateReviewStatus(
            Long id,
            ReviewStatusUpdateRequest request
    ) {
        Review review = getReviewEntityById(id);

        String status = normalizeStatus(request.getStatus());
        review.setStatus(status);

        return ReviewResponse.from(reviewRepository.save(review));
    }

    public void softDeleteReview(
            Long id,
            UUID currentUserPublicId,
            boolean isAdmin
    ) {
        Review review = getReviewEntityById(id);

        if (!isAdmin && !review.getUser().getPublicId().equals(currentUserPublicId)) {
            throw new RuntimeException("You can only delete your own review");
        }

        if (STATUS_DELETED.equals(review.getStatus())) {
            return;
        }

        review.setStatus(STATUS_DELETED);
        reviewRepository.save(review);
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