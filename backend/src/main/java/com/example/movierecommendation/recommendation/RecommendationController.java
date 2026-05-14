package com.example.movierecommendation.recommendation;

import com.example.movierecommendation.recommendation.dto.RecommendationResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
@CrossOrigin("*")
public class RecommendationController {

    private final RecommendationService recommendationService;

    @GetMapping("/public")
    public List<RecommendationResponse> getPublicRecommendations(
            @RequestParam(defaultValue = "20") int limit
    ) {
        return recommendationService.recommendForAnonymous(limit);
    }

    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @GetMapping("/me")
    public List<RecommendationResponse> getMyRecommendations(
            Authentication authentication,
            @RequestParam(defaultValue = "20") int limit
    ) {
        UUID currentUserPublicId = UUID.fromString(authentication.getName());

        return recommendationService.recommendForUser(currentUserPublicId, limit);
    }
}