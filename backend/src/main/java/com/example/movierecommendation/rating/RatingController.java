package com.example.movierecommendation.rating;

import com.example.movierecommendation.rating.dto.RatingRequest;
import com.example.movierecommendation.rating.dto.RatingResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/ratings")
@RequiredArgsConstructor
@CrossOrigin("*")
public class RatingController {

    private final RatingService ratingService;

    @PostMapping
    public RatingResponse rateMovie(
            Authentication authentication,
            @Valid @RequestBody RatingRequest request
    ) {
        UUID currentUserPublicId = UUID.fromString(authentication.getName());
        return ratingService.rateMovie(currentUserPublicId, request);
    }

    @GetMapping("/user/{userId}")
    public List<RatingResponse> getRatingsByUser(@PathVariable UUID userId) {
        return ratingService.getRatingsByUser(userId);
    }

    @GetMapping("/movie/{movieId}")
    public List<RatingResponse> getRatingsByMovie(@PathVariable UUID movieId) {
        return ratingService.getRatingsByMovie(movieId);
    }
}