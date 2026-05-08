package com.example.movierecommendation.review;

import com.example.movierecommendation.review.dto.ReviewRequest;
import com.example.movierecommendation.review.dto.ReviewResponse;
import com.example.movierecommendation.review.dto.ReviewStatusUpdateRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
@CrossOrigin("*")
public class ReviewController {

    private final ReviewService reviewService;

    /**
     * User tạo review.
     * Nếu user đã review phim này rồi thì cập nhật review cũ.
     * User hiện tại được lấy từ JWT, không lấy từ request body.
     */
    @PostMapping
    public ReviewResponse createOrUpdateReview(
            Authentication authentication,
            @Valid @RequestBody ReviewRequest request
    ) {
        UUID currentUserPublicId = UUID.fromString(authentication.getName());
        return reviewService.createOrUpdateReview(currentUserPublicId, request);
    }

    /**
     * Public API: chỉ lấy review đang PUBLISHED của một phim.
     */
    @GetMapping("/movie/{movieId}")
    public List<ReviewResponse> getPublishedReviewsByMovie(
            @PathVariable UUID movieId
    ) {
        return reviewService.getPublishedReviewsByMovie(movieId);
    }

    /**
     * Admin API: lấy tất cả review của một phim, gồm PUBLISHED/HIDDEN/DELETED.
     */
    @GetMapping("/movie/{movieId}/all")
    public List<ReviewResponse> getAllReviewsByMovie(
            @PathVariable UUID movieId
    ) {
        return reviewService.getAllReviewsByMovie(movieId);
    }

    /**
     * Public API: lấy review đang PUBLISHED của một user.
     */
    @GetMapping("/user/{userId}")
    public List<ReviewResponse> getPublishedReviewsByUser(
            @PathVariable UUID userId
    ) {
        return reviewService.getPublishedReviewsByUser(userId);
    }

    /**
     * User API: lấy toàn bộ review của chính mình.
     */
    @GetMapping("/me")
    public List<ReviewResponse> getMyReviews(Authentication authentication) {
        UUID currentUserPublicId = UUID.fromString(authentication.getName());
        return reviewService.getMyReviews(currentUserPublicId);
    }

    /**
     * Admin API: lấy tất cả review của một user.
     */
    @GetMapping("/user/{userId}/all")
    public List<ReviewResponse> getAllReviewsByUser(
            @PathVariable UUID userId
    ) {
        return reviewService.getAllReviewsByUser(userId);
    }

    /**
     * Xem chi tiết review.
     * Review PUBLISHED có thể xem, còn HIDDEN/DELETED chỉ owner hoặc admin xem được.
     */
    @GetMapping("/{id}")
    public ReviewResponse getReviewById(
            Authentication authentication,
            @PathVariable Long id
    ) {
        UUID currentUserPublicId = UUID.fromString(authentication.getName());

        boolean isAdmin = authentication.getAuthorities()
                .stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        return reviewService.getReviewById(id, currentUserPublicId, isAdmin);
    }

    /**
     * User cập nhật review của chính mình.
     * Admin có thể cập nhật bất kỳ review nào.
     */
    @PutMapping("/{id}")
    public ReviewResponse updateReview(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody ReviewRequest request
    ) {
        UUID currentUserPublicId = UUID.fromString(authentication.getName());

        boolean isAdmin = authentication.getAuthorities()
                .stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        return reviewService.updateReview(id, currentUserPublicId, isAdmin, request);
    }

    /**
     * Admin cập nhật trạng thái review: PUBLISHED/HIDDEN/DELETED.
     */
    @PutMapping("/{id}/status")
    public ReviewResponse updateReviewStatus(
            @PathVariable Long id,
            @Valid @RequestBody ReviewStatusUpdateRequest request
    ) {
        return reviewService.updateReviewStatus(id, request);
    }

    /**
     * User xóa mềm review của chính mình.
     * Admin có thể xóa mềm bất kỳ review nào.
     */
    @DeleteMapping("/{id}")
    public String softDeleteReview(
            Authentication authentication,
            @PathVariable Long id
    ) {
        UUID currentUserPublicId = UUID.fromString(authentication.getName());

        boolean isAdmin = authentication.getAuthorities()
                .stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        reviewService.softDeleteReview(id, currentUserPublicId, isAdmin);
        return "Review deleted successfully";
    }
}