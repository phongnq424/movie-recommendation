package com.example.movierecommendation.recommendation.api;

import com.example.movierecommendation.recommendation.RecommendationService;
import com.example.movierecommendation.recommendation.dto.RecommendationResponse;
import com.example.movierecommendation.recommendation.scheduler.RecommendationPrecomputeService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

import static com.example.movierecommendation.rbac.PermissionCode.*;

@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
@CrossOrigin("*")
public class RecommendationController {

    private final RecommendationService recommendationService;
    private final RecommendationPrecomputeService precomputeService;

    @GetMapping("/public")
    public List<RecommendationResponse> getPublicRecommendations(
            @RequestParam(defaultValue = "20") int limit
    ) {
        return recommendationService.recommendForAnonymous(limit);
    }

    @PreAuthorize("hasAuthority('" + RECOMMENDATION_READ_OWN + "')")
    @GetMapping("/me")
    public List<RecommendationResponse> getMyRecommendations(
            Authentication authentication,
            @RequestParam(defaultValue = "20") int limit
    ) {
        UUID currentUserPublicId = UUID.fromString(authentication.getName());

        return recommendationService.recommendForUser(currentUserPublicId, limit);
    }

    @PreAuthorize("hasAuthority('" + RECOMMENDATION_REFRESH_OWN + "')")
    @PostMapping("/me/refresh")
    public List<RecommendationResponse> refreshMyRecommendations(
            Authentication authentication,
            @RequestParam(defaultValue = "20") int limit
    ) {
        UUID currentUserPublicId = UUID.fromString(authentication.getName());

        precomputeService.refreshUserByPublicId(currentUserPublicId);

        return recommendationService.recommendForUser(currentUserPublicId, limit);
    }

    @PreAuthorize("hasAuthority('" + RECOMMENDATION_REFRESH_PUBLIC + "')")
    @PostMapping("/admin/refresh-public")
    public List<RecommendationResponse> refreshPublicRecommendations(
            @RequestParam(defaultValue = "20") int limit
    ) {
        precomputeService.refreshPublic();

        return recommendationService.recommendForAnonymous(limit);
    }
}