package com.example.movierecommendation.interaction;

import com.example.movierecommendation.interaction.dto.TrackInteractionRequest;
import com.example.movierecommendation.interaction.dto.UserMovieInteractionResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

import static com.example.movierecommendation.rbac.PermissionCode.GENRE_DELETE;
import static com.example.movierecommendation.rbac.PermissionCode.INTERACTION_READ_OWN;

@RestController
@RequestMapping("/api/interactions")
@RequiredArgsConstructor
@CrossOrigin("*")
public class UserMovieInteractionController {

    private final UserMovieInteractionService interactionService;

    @PostMapping("/movies/{moviePublicId}")
    public UserMovieInteractionResponse trackMovieInteraction(
            @PathVariable UUID moviePublicId,
            @RequestBody TrackInteractionRequest request,
            Authentication authentication
    ) {
        return interactionService.track(moviePublicId, request, authentication);
    }

    @PreAuthorize("hasAuthority('" + INTERACTION_READ_OWN + "')")
    @GetMapping("/me")
    public List<UserMovieInteractionResponse> getMyInteractions(Authentication authentication) {
        return interactionService.getMyInteractions(authentication);
    }

    @PreAuthorize("hasAuthority('" + INTERACTION_READ_OWN + "')")
    @GetMapping("/me/movies/{moviePublicId}")
    public ResponseEntity<UserMovieInteractionResponse> getMyMovieInteractions(
            @PathVariable UUID moviePublicId,
            Authentication authentication
    ) {
        return interactionService.getMyMovieInteractions(moviePublicId, authentication)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}