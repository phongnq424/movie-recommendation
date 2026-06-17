package com.example.movierecommendation.interaction;

import com.example.movierecommendation.common.exception.ResourceNotFoundException;
import com.example.movierecommendation.interaction.dto.TrackInteractionRequest;
import com.example.movierecommendation.interaction.dto.UserMovieInteractionResponse;
import com.example.movierecommendation.movie.Movie;
import com.example.movierecommendation.movie.MovieRepository;
import com.example.movierecommendation.recommendation.cache.RecommendationCacheService;
import com.example.movierecommendation.user.User;
import com.example.movierecommendation.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserMovieInteractionService {

    private final UserMovieInteractionRepository interactionRepository;
    private final MovieRepository movieRepository;
    private final UserRepository userRepository;
    private final RecommendationCacheService recommendationCacheService;

    public UserMovieInteractionResponse track(
            UUID moviePublicId,
            TrackInteractionRequest request,
            Authentication authentication
    ) {
        if (moviePublicId == null) {
            throw new ResourceNotFoundException("Movie not found");
        }

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

        safelyEvictRecommendationCache(user);

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
        if (moviePublicId == null) {
            throw new ResourceNotFoundException("Movie not found");
        }

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
        if (request == null) {
            return;
        }

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

        if (request.getDurationSeconds() != null && request.getDurationSeconds() >= 0) {
            interaction.setDurationSeconds(request.getDurationSeconds());
        }

        if (request.getWatchedSeconds() != null && request.getWatchedSeconds() >= 0) {
            Integer oldWatchedSeconds = interaction.getWatchedSeconds();

            if (oldWatchedSeconds == null || request.getWatchedSeconds() > oldWatchedSeconds) {
                interaction.setWatchedSeconds(request.getWatchedSeconds());
            }
        }

        if (request.getProgressPercent() != null) {
            double safeProgress = Math.max(0.0, Math.min(100.0, request.getProgressPercent()));
            Double oldProgress = interaction.getProgressPercent();

            if (oldProgress == null || safeProgress > oldProgress) {
                interaction.setProgressPercent(safeProgress);
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
        if (interaction == null || newType == null || newType.isBlank()) {
            return false;
        }

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

        UUID userPublicId;

        try {
            userPublicId = UUID.fromString(authentication.getName());
        } catch (Exception ex) {
            throw new ResourceNotFoundException("User not found");
        }

        return userRepository.findByPublicId(userPublicId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private void safelyEvictRecommendationCache(User user) {
        try {
            if (user == null || user.getPublicId() == null) {
                return;
            }

            recommendationCacheService.evictUserRecommendations(user.getPublicId());
        } catch (Exception ex) {
            log.warn(
                    "Failed to evict recommendation cache after interaction. userId={}",
                    user == null ? null : user.getId(),
                    ex
            );
        }
    }
}