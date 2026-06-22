package com.example.movierecommendation.rating;

import com.example.movierecommendation.rating.dto.RatingRequest;
import com.example.movierecommendation.rating.dto.RatingResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

import static com.example.movierecommendation.rbac.PermissionCode.RATING_READ_ADMIN;
import static com.example.movierecommendation.rbac.PermissionCode.RATING_WRITE;

@RestController
@RequestMapping("/api/ratings")
@RequiredArgsConstructor
public class RatingController {

    private final RatingService ratingService;

    @PreAuthorize("hasAuthority('" + RATING_WRITE + "')")
    @PostMapping
    public RatingResponse rateMovie(
            Authentication authentication,
            @Valid @RequestBody RatingRequest request
    ) {
        UUID currentUserPublicId = UUID.fromString(authentication.getName());
        return ratingService.rateMovie(currentUserPublicId, request);
    }

    /**
     * Admin API: xem rating theo user.
     */
    @PreAuthorize("hasAuthority('" + RATING_READ_ADMIN + "')")
    @GetMapping("/user/{userId}")
    public List<RatingResponse> getRatingsByUser(@PathVariable UUID userId) {
        return ratingService.getRatingsByUser(userId);
    }

    /**
     * Public API: xem rating của một phim.
     */
    @GetMapping("/movie/{movieId}")
    public List<RatingResponse> getRatingsByMovie(@PathVariable UUID movieId) {
        return ratingService.getRatingsByMovie(movieId);
    }
}