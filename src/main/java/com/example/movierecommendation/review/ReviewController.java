package com.example.movierecommendation.review;

import com.example.movierecommendation.review.dto.ReviewRequest;
import com.example.movierecommendation.review.dto.ReviewResponse;
import com.example.movierecommendation.review.dto.ReviewStatusUpdateRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
@CrossOrigin("*")
public class ReviewController {

    private final ReviewService reviewService;

    /**
     * User tạo review.
     * Nếu user đã review phim này rồi thì cập nhật review cũ.
     */
    @PostMapping
    public ReviewResponse createOrUpdateReview(
            @Valid @RequestBody ReviewRequest request
    ) {
        return reviewService.createOrUpdateReview(request);
    }

    /**
     * Public API: chỉ lấy review đang PUBLISHED của một phim.
     */
    @GetMapping("/movie/{movieId}")
    public List<ReviewResponse> getPublishedReviewsByMovie(
            @PathVariable Long movieId
    ) {
        return reviewService.getPublishedReviewsByMovie(movieId);
    }

    /**
     * Admin API: lấy tất cả review của một phim, gồm PUBLISHED/HIDDEN/DELETED.
     */
    @GetMapping("/movie/{movieId}/all")
    public List<ReviewResponse> getAllReviewsByMovie(
            @PathVariable Long movieId
    ) {
        return reviewService.getAllReviewsByMovie(movieId);
    }

    /**
     * Public/user API: lấy review đang PUBLISHED của một user.
     */
    @GetMapping("/user/{userId}")
    public List<ReviewResponse> getPublishedReviewsByUser(
            @PathVariable Long userId
    ) {
        return reviewService.getPublishedReviewsByUser(userId);
    }

    /**
     * Admin API: lấy tất cả review của một user.
     */
    @GetMapping("/user/{userId}/all")
    public List<ReviewResponse> getAllReviewsByUser(
            @PathVariable Long userId
    ) {
        return reviewService.getAllReviewsByUser(userId);
    }

    @GetMapping("/{id}")
    public ReviewResponse getReviewById(@PathVariable Long id) {
        return reviewService.getReviewById(id);
    }

    @PutMapping("/{id}")
    public ReviewResponse updateReview(
            @PathVariable Long id,
            @Valid @RequestBody ReviewRequest request
    ) {
        return reviewService.updateReview(id, request);
    }

    /**
     * Admin dùng để ẩn/hiện/xóa mềm review.
     */
    @PutMapping("/{id}/status")
    public ReviewResponse updateReviewStatus(
            @PathVariable Long id,
            @Valid @RequestBody ReviewStatusUpdateRequest request
    ) {
        return reviewService.updateReviewStatus(id, request);
    }

    /**
     * Xóa mềm: không mất dữ liệu, chỉ set status = DELETED.
     */
    @DeleteMapping("/{id}")
    public String softDeleteReview(@PathVariable Long id) {
        reviewService.softDeleteReview(id);
        return "Review deleted successfully";
    }

    @DeleteMapping("/{id}/hard")
    public String hardDeleteReview(@PathVariable Long id) {
        reviewService.hardDeleteReview(id);
        return "Review permanently deleted successfully";
    }
}