package com.example.movierecommendation.review;

import com.example.movierecommendation.review.dto.ReviewRequest;
import com.example.movierecommendation.review.dto.ReviewResponse;
import com.example.movierecommendation.review.dto.ReviewStatusUpdateRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

import static com.example.movierecommendation.rbac.PermissionCode.*;

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
    @PreAuthorize("hasAuthority('" + REVIEW_UPDATE_OWN + "')")
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
    @PreAuthorize("hasAuthority('" + REVIEW_READ_ADMIN + "')")
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
    @PreAuthorize("hasAuthority('" + REVIEW_READ_OWN + "')")
    @GetMapping("/me")
    public List<ReviewResponse> getMyReviews(Authentication authentication) {
        UUID currentUserPublicId = UUID.fromString(authentication.getName());
        return reviewService.getMyReviews(currentUserPublicId);
    }

    /**
     * Admin API: lấy tất cả review của một user.
     */
    @PreAuthorize("hasAuthority('" + REVIEW_READ_ADMIN + "')")
    @GetMapping("/user/{userId}/all")
    public List<ReviewResponse> getAllReviewsByUser(
            @PathVariable UUID userId
    ) {
        return reviewService.getAllReviewsByUser(userId);
    }

    /**
     * User/Admin API:
     * Review PUBLISHED có thể xem, còn HIDDEN/DELETED do service kiểm tra owner/admin.
     */
    @PreAuthorize("hasAuthority('" + REVIEW_READ_OWN + "')")
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
     * User/Admin API:
     * User cập nhật review của chính mình.
     * Admin có thể cập nhật bất kỳ review nào.
     */
    @PreAuthorize("hasAuthority('" + REVIEW_WRITE + "')")
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
     * Admin API: cập nhật trạng thái review: PUBLISHED/HIDDEN/DELETED.
     */
    @PreAuthorize("hasAuthority('" + REVIEW_MODERATE + "')")
    @PutMapping("/{id}/status")
    public ReviewResponse updateReviewStatus(
            @PathVariable Long id,
            @Valid @RequestBody ReviewStatusUpdateRequest request
    ) {
        return reviewService.updateReviewStatus(id, request);
    }

    /**
     * User/Admin API:
     * User xóa mềm review của chính mình.
     * Admin có thể xóa mềm bất kỳ review nào.
     */
    @PreAuthorize("hasAuthority('" + REVIEW_DELETE_ANY + "')")
    @DeleteMapping("/{id}")
    public String softDeleteReview(
            Authentication authentication,
            @PathVariable Long id
    ) {
        UUID currentUserPublicId = UUID.fromString(authentication.getName());

        boolean canModerateReview = authentication.getAuthorities()
                .stream()
                .anyMatch(a -> a.getAuthority().equals(REVIEW_MODERATE));

        reviewService.softDeleteReview(id, currentUserPublicId, canModerateReview);
        return "Review deleted successfully";
    }
}