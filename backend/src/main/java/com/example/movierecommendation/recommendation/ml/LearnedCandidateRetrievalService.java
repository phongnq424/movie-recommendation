package com.example.movierecommendation.recommendation.ml;

import com.example.movierecommendation.movie.Movie;
import com.example.movierecommendation.movie.MovieRepository;
import com.example.movierecommendation.rating.Rating;
import com.example.movierecommendation.rating.RatingRepository;
import com.example.movierecommendation.recommendation.CandidateGenerationService;
import com.example.movierecommendation.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LearnedCandidateRetrievalService {

    private final LearnedEmbeddingRepository learnedEmbeddingRepository;
    private final CandidateGenerationService candidateGenerationService;
    private final MovieRepository movieRepository;
    private final RatingRepository ratingRepository;

    public List<Movie> retrieveForUser(User user, int candidateLimit) {
        String activeModelVersion = learnedEmbeddingRepository.findActiveRetrievalModelVersion();

        if (activeModelVersion == null || activeModelVersion.isBlank()) {
            return candidateGenerationService.generateCandidates(user, candidateLimit);
        }

        String userEmbedding = learnedEmbeddingRepository.findUserEmbeddingText(user.getId());

        if (userEmbedding == null || userEmbedding.isBlank()) {
            return candidateGenerationService.generateCandidates(user, candidateLimit);
        }

        List<Long> excludedMovieIds = loadExcludedMovieIds(user);

        List<Long> movieIds = learnedEmbeddingRepository.findNearestMovieIds(
                userEmbedding,
                excludedMovieIds,
                candidateLimit,
                activeModelVersion
        );

        List<Movie> movies = mapMovieIdsToMovies(movieIds);

        if (movies.size() < candidateLimit) {
            addFallbackMovies(user, movies, candidateLimit);
        }

        return movies.stream()
                .limit(candidateLimit)
                .toList();
    }

    public List<Movie> retrieveForAnonymous(int candidateLimit) {
        return candidateGenerationService.generateAnonymousCandidates(candidateLimit);
    }

    private List<Long> loadExcludedMovieIds(User user) {
        List<Rating> ratings = ratingRepository.findByUserId(user.getId());

        return ratings.stream()
                .filter(Objects::nonNull)
                .filter(rating -> rating.getMovie() != null)
                .filter(rating -> rating.getMovie().getId() != null)
                .map(rating -> rating.getMovie().getId())
                .distinct()
                .toList();
    }

    private List<Movie> mapMovieIdsToMovies(List<Long> movieIds) {
        if (movieIds == null || movieIds.isEmpty()) {
            return new ArrayList<>();
        }

        List<Movie> movies = movieRepository.findByIdIn(movieIds);

        Map<Long, Movie> movieById = movies.stream()
                .filter(Objects::nonNull)
                .filter(movie -> movie.getId() != null)
                .collect(Collectors.toMap(
                        Movie::getId,
                        movie -> movie,
                        (first, second) -> first
                ));

        List<Movie> orderedMovies = new ArrayList<>();

        for (Long movieId : movieIds) {
            Movie movie = movieById.get(movieId);

            if (movie != null) {
                orderedMovies.add(movie);
            }
        }

        return orderedMovies;
    }

    private void addFallbackMovies(User user, List<Movie> movies, int candidateLimit) {
        Set<Long> existingIds = movies.stream()
                .filter(Objects::nonNull)
                .map(Movie::getId)
                .collect(Collectors.toSet());

        List<Movie> fallbackMovies = candidateGenerationService.generateCandidates(user, candidateLimit);

        for (Movie movie : fallbackMovies) {
            if (movie == null || movie.getId() == null) {
                continue;
            }

            if (existingIds.contains(movie.getId())) {
                continue;
            }

            movies.add(movie);
            existingIds.add(movie.getId());

            if (movies.size() >= candidateLimit) {
                return;
            }
        }
    }
}