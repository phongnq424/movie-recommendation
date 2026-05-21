package com.example.movierecommendation.interaction;

import com.example.movierecommendation.interaction.dto.TrackInteractionRequest;
import com.example.movierecommendation.interaction.dto.UserMovieInteractionResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

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

    @GetMapping("/me")
    public List<UserMovieInteractionResponse> getMyInteractions(Authentication authentication) {
        return interactionService.getMyInteractions(authentication);
    }

    @GetMapping("/me/movies/{moviePublicId}")
    public List<UserMovieInteractionResponse> getMyMovieInteractions(
            @PathVariable UUID moviePublicId,
            Authentication authentication
    ) {
        return interactionService.getMyMovieInteractions(moviePublicId, authentication);
    }
}