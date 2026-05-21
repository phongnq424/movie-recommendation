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
import java.util.Optional;
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

        User user = resolveRequiredUser(authentication);

        UserMovieInteraction interaction = interactionRepository
                .findByUserIdAndMovieId(user.getId(), movie.getId())
                .orElseGet(() -> UserMovieInteraction.builder()
                        .movie(movie)
                        .user(user)
                        .interactionType("VIEW_DETAIL")
                        .value(0.0)
                        .watchedSeconds(0)
                        .durationSeconds(null)
                        .progressPercent(0.0)
                        .completed(false)
                        .build());

        updateInteraction(interaction, request);

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

    public Optional<UserMovieInteractionResponse> getMyMovieInteractions(
            UUID moviePublicId,
            Authentication authentication
    ) {
        User user = resolveRequiredUser(authentication);

        Movie movie = movieRepository.findByPublicId(moviePublicId)
                .orElseThrow(() -> new ResourceNotFoundException("Movie not found"));

        return interactionRepository.findByUserIdAndMovieId(user.getId(), movie.getId())
                .map(UserMovieInteractionResponse::from);
    }

    private void updateInteraction(
            UserMovieInteraction interaction,
            TrackInteractionRequest request
    ) {
        String newType = request.getInteractionType();

        if (newType != null && shouldUpdateInteractionType(interaction, newType)) {
            interaction.setInteractionType(newType);
        }

        if (request.getValue() != null) {
            Double oldValue = interaction.getValue();

            if (oldValue == null || request.getValue() > oldValue) {
                interaction.setValue(request.getValue());
            }
        }

        if (request.getDurationSeconds() != null) {
            interaction.setDurationSeconds(request.getDurationSeconds());
        }

        if (request.getWatchedSeconds() != null) {
            Integer oldWatchedSeconds = interaction.getWatchedSeconds();

            if (oldWatchedSeconds == null || request.getWatchedSeconds() > oldWatchedSeconds) {
                interaction.setWatchedSeconds(request.getWatchedSeconds());
            }
        }

        if (request.getProgressPercent() != null) {
            Double oldProgress = interaction.getProgressPercent();

            if (oldProgress == null || request.getProgressPercent() > oldProgress) {
                interaction.setProgressPercent(request.getProgressPercent());
            }
        }

        if ("FINISH_WATCHING".equals(newType)) {
            interaction.setCompleted(true);
            interaction.setProgressPercent(100.0);
            interaction.setValue(1.0);
            interaction.setInteractionType("FINISH_WATCHING");
            return;
        }

        if (interaction.getProgressPercent() != null && interaction.getProgressPercent() >= 95) {
            interaction.setCompleted(true);
            interaction.setProgressPercent(100.0);
            interaction.setValue(1.0);
            interaction.setInteractionType("FINISH_WATCHING");
        }
    }

    private boolean shouldUpdateInteractionType(
            UserMovieInteraction interaction,
            String newType
    ) {
        if ("FINISH_WATCHING".equals(interaction.getInteractionType())) {
            return false;
        }

        if (Boolean.TRUE.equals(interaction.getCompleted())) {
            return false;
        }

        if ("FINISH_WATCHING".equals(newType)) {
            return true;
        }

        if ("WATCH_75_PERCENT".equals(newType)) {
            return true;
        }

        if ("WATCH_50_PERCENT".equals(newType)) {
            return !"WATCH_75_PERCENT".equals(interaction.getInteractionType());
        }

        if ("WATCH_25_PERCENT".equals(newType)) {
            return interaction.getInteractionType() == null
                    || "VIEW_DETAIL".equals(interaction.getInteractionType())
                    || "PLAY".equals(interaction.getInteractionType())
                    || "PAUSE".equals(interaction.getInteractionType());
        }

        if ("PAUSE".equals(newType)) {
            return interaction.getInteractionType() == null
                    || "VIEW_DETAIL".equals(interaction.getInteractionType())
                    || "PLAY".equals(interaction.getInteractionType());
        }

        if ("PLAY".equals(newType)) {
            return interaction.getInteractionType() == null
                    || "VIEW_DETAIL".equals(interaction.getInteractionType());
        }

        if ("VIEW_DETAIL".equals(newType)) {
            return interaction.getInteractionType() == null;
        }

        return interaction.getInteractionType() == null;
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