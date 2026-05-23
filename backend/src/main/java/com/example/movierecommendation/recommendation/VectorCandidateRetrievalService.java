package com.example.movierecommendation.recommendation;

import com.example.movierecommendation.movie.Movie;
import com.example.movierecommendation.movie.MovieRepository;
import com.example.movierecommendation.rating.Rating;
import com.example.movierecommendation.rating.RatingRepository;
import com.example.movierecommendation.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VectorCandidateRetrievalService {

    private static final int POPULAR_FALLBACK_LIMIT = 80;
    private static final int FRESH_FALLBACK_LIMIT = 50;

    private final UserEmbeddingService userEmbeddingService;
    private final MovieEmbeddingNativeRepository movieEmbeddingNativeRepository;
    private final MovieRepository movieRepository;
    private final RatingRepository ratingRepository;

    public List<Movie> retrieveForUser(User user, int candidateLimit) {
        String userEmbedding = userEmbeddingService.buildUserEmbedding(user);

        if (userEmbedding == null) {
            return fallback(candidateLimit);
        }

        List<Long> excludedMovieIds = loadExcludedMovieIds(user);

        List<Long> movieIds = movieEmbeddingNativeRepository.findNearestMovieIds(
                userEmbedding,
                excludedMovieIds,
                candidateLimit
        );

        List<Movie> candidates = mapMovieIdsToMovies(movieIds);
        logVectorCandidates(candidates);
        if (candidates.size() < candidateLimit) {
            addFallbackMovies(candidates, candidateLimit);
        }

        return candidates.stream()
                .limit(candidateLimit)
                .toList();
    }

    public List<Movie> retrieveForAnonymous(int candidateLimit) {
        return fallback(candidateLimit);
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
                .collect(Collectors.toMap(Movie::getId, movie -> movie));

        List<Movie> orderedMovies = new ArrayList<>();

        for (Long movieId : movieIds) {
            Movie movie = movieById.get(movieId);

            if (movie != null) {
                orderedMovies.add(movie);
            }
        }

        return orderedMovies;
    }

    private void addFallbackMovies(List<Movie> candidates, int candidateLimit) {
        Set<Long> existingIds = candidates.stream()
                .filter(Objects::nonNull)
                .map(Movie::getId)
                .collect(Collectors.toSet());

        List<Movie> fallbackMovies = fallback(candidateLimit);

        for (Movie movie : fallbackMovies) {
            if (movie == null || movie.getId() == null) {
                continue;
            }

            if (existingIds.contains(movie.getId())) {
                continue;
            }

            candidates.add(movie);
            existingIds.add(movie.getId());

            if (candidates.size() >= candidateLimit) {
                return;
            }
        }
    }

    private List<Movie> fallback(int candidateLimit) {
        List<Movie> movies = new ArrayList<>();

        movies.addAll(movieRepository.findPopularPublishedMovies(PageRequest.of(0, POPULAR_FALLBACK_LIMIT)));
        movies.addAll(movieRepository.findFreshPublishedMovies(PageRequest.of(0, FRESH_FALLBACK_LIMIT)));

        Map<Long, Movie> result = new LinkedHashMap<>();

        for (Movie movie : movies) {
            if (movie == null || movie.getId() == null) {
                continue;
            }

            result.putIfAbsent(movie.getId(), movie);

            if (result.size() >= candidateLimit) {
                break;
            }
        }

        return new ArrayList<>(result.values());
    }
    private void logVectorCandidates(List<Movie> candidates) {
        System.out.println("========== VECTOR RETRIEVAL CANDIDATES ==========");

        for (int i = 0; i < candidates.size(); i++) {
            Movie movie = candidates.get(i);

            System.out.println(
                    "VECTOR_RANK=" + (i + 1)
                            + " | movieId=" + movie.getId()
                            + " | title=" + movie.getTitle()
                            + " | averageRating=" + movie.getAverageRating()
                            + " | ratingCount=" + movie.getRatingCount()
                            + " | viewCount=" + movie.getViewCount()
                            + " | releaseYear=" + movie.getReleaseYear()
            );
        }

        System.out.println("=================================================");
    }
}