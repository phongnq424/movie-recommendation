package com.example.movierecommendation.interaction;

import com.example.movierecommendation.common.exception.ResourceNotFoundException;
import com.example.movierecommendation.interaction.dto.TrackInteractionRequest;
import com.example.movierecommendation.interaction.dto.UserMovieInteractionResponse;
import com.example.movierecommendation.movie.Movie;
import com.example.movierecommendation.movie.MovieRepository;
import com.example.movierecommendation.user.User;
import com.example.movierecommendation.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserMovieInteractionService {

    private final UserMovieInteractionRepository interactionRepository;
    private final MovieRepository movieRepository;
    private final UserRepository userRepository;

    public UserMovieInteractionResponse track(
            UUID moviePublicId,
            TrackInteractionRequest request,
            Authentication authentication
    ) {
        Movie movie = movieRepository.findByPublicId(moviePublicId)
                .orElseThrow(() -> new ResourceNotFoundException("Movie not found"));

        User user = resolveUser(authentication);

        UserMovieInteraction interaction = UserMovieInteraction.builder()
                .movie(movie)
                .user(user)
                .interactionType(request.getInteractionType())
                .value(request.getValue())
                .watchedSeconds(request.getWatchedSeconds())
                .durationSeconds(request.getDurationSeconds())
                .progressPercent(request.getProgressPercent())
                .build();

        UserMovieInteraction savedInteraction = interactionRepository.save(interaction);

        return UserMovieInteractionResponse.from(savedInteraction);
    }

    public List<UserMovieInteractionResponse> getMyInteractions(Authentication authentication) {
        User user = resolveRequiredUser(authentication);

        return interactionRepository.findByUserId(user.getId())
                .stream()
                .map(UserMovieInteractionResponse::from)
                .toList();
    }

    public List<UserMovieInteractionResponse> getMyMovieInteractions(
            UUID moviePublicId,
            Authentication authentication
    ) {
        User user = resolveRequiredUser(authentication);

        Movie movie = movieRepository.findByPublicId(moviePublicId)
                .orElseThrow(() -> new ResourceNotFoundException("Movie not found"));

        return interactionRepository.findByUserIdAndMovieId(user.getId(), movie.getId())
                .stream()
                .map(UserMovieInteractionResponse::from)
                .toList();
    }

    private User resolveUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return null;
        }

        UUID userPublicId = UUID.fromString(authentication.getName());

        return userRepository.findByPublicId(userPublicId).orElse(null);
    }

    private User resolveRequiredUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new ResourceNotFoundException("User not found");
        }

        UUID userPublicId = UUID.fromString(authentication.getName());

        return userRepository.findByPublicId(userPublicId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}