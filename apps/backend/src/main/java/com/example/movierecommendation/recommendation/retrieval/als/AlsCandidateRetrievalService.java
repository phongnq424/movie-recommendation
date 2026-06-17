package com.example.movierecommendation.recommendation.retrieval.als;

import com.example.movierecommendation.movie.Movie;
import com.example.movierecommendation.movie.MovieRepository;
import com.example.movierecommendation.rating.Rating;
import com.example.movierecommendation.rating.RatingRepository;
import com.example.movierecommendation.recommendation.retrieval.rule.RuleBasedCandidateRetrievalService;
import com.example.movierecommendation.recommendation.dto.RecommendationCandidate;
import com.example.movierecommendation.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AlsCandidateRetrievalService {

    private final LearnedEmbeddingRepository learnedEmbeddingRepository;
    private final RuleBasedCandidateRetrievalService ruleBasedCandidateRetrievalService;
    private final MovieRepository movieRepository;
    private final RatingRepository ratingRepository;

    public List<RecommendationCandidate> retrieveForUser(User user, int candidateLimit) {
        String activeModelVersion = learnedEmbeddingRepository.findActiveRetrievalModelVersion();

        if (activeModelVersion == null || activeModelVersion.isBlank()) {
            return wrapFallbackCandidates(
                    ruleBasedCandidateRetrievalService.generateCandidates(user, candidateLimit),
                    "FALLBACK_RULE_CANDIDATE"
            );
        }

        String userEmbedding = learnedEmbeddingRepository.findUserEmbeddingText(
                user.getId(),
                activeModelVersion
        );

        if (userEmbedding == null || userEmbedding.isBlank()) {
            return wrapFallbackCandidates(
                    ruleBasedCandidateRetrievalService.generateCandidates(user, candidateLimit),
                    "FALLBACK_RULE_CANDIDATE"
            );
        }

        List<Long> excludedMovieIds = loadExcludedMovieIds(user);

        List<LearnedMovieRetrievalResult> retrievalResults =
                learnedEmbeddingRepository.findNearestMoviesWithScores(
                        userEmbedding,
                        excludedMovieIds,
                        candidateLimit,
                        activeModelVersion
                );

        List<RecommendationCandidate> candidates = mapRetrievalResultsToCandidates(retrievalResults);

        if (candidates.size() < candidateLimit) {
            addFallbackCandidates(user, candidates, candidateLimit);
        }

        return candidates.stream()
                .limit(candidateLimit)
                .toList();
    }

    public List<RecommendationCandidate> retrieveForAnonymous(int candidateLimit) {
        return wrapFallbackCandidates(
                ruleBasedCandidateRetrievalService.generateAnonymousCandidates(candidateLimit),
                "ANONYMOUS_FALLBACK"
        );
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

    private List<RecommendationCandidate> mapRetrievalResultsToCandidates(
            List<LearnedMovieRetrievalResult> retrievalResults
    ) {
        if (retrievalResults == null || retrievalResults.isEmpty()) {
            return new ArrayList<>();
        }

        List<Long> movieIds = retrievalResults.stream()
                .filter(Objects::nonNull)
                .map(LearnedMovieRetrievalResult::movieId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        List<Movie> movies = movieRepository.findByIdIn(movieIds);

        Map<Long, Movie> movieById = movies.stream()
                .filter(Objects::nonNull)
                .filter(movie -> movie.getId() != null)
                .collect(Collectors.toMap(
                        Movie::getId,
                        movie -> movie,
                        (first, second) -> first
                ));

        List<RecommendationCandidate> candidates = new ArrayList<>();

        for (LearnedMovieRetrievalResult result : retrievalResults) {
            if (result == null || result.movieId() == null) {
                continue;
            }

            Movie movie = movieById.get(result.movieId());

            if (movie == null) {
                continue;
            }

            double retrievalScore = result.retrievalScore() == null
                    ? 0.0
                    : result.retrievalScore();

            candidates.add(RecommendationCandidate.builder()
                    .movie(movie)
                    .retrievalScore(retrievalScore)
                    .collaborativeScore(retrievalScore)
                    .source("ALS_RETRIEVAL")
                    .build());
        }

        return candidates;
    }

    private List<RecommendationCandidate> wrapFallbackCandidates(
            List<Movie> movies,
            String source
    ) {
        if (movies == null || movies.isEmpty()) {
            return new ArrayList<>();
        }

        List<RecommendationCandidate> candidates = new ArrayList<>();

        for (Movie movie : movies) {
            if (movie == null) {
                continue;
            }

            candidates.add(RecommendationCandidate.builder()
                    .movie(movie)
                    .retrievalScore(0.0)
                    .source(source)
                    .build());
        }

        return candidates;
    }

    private void addFallbackCandidates(
            User user,
            List<RecommendationCandidate> candidates,
            int candidateLimit
    ) {
        Set<Long> existingIds = candidates.stream()
                .filter(Objects::nonNull)
                .map(RecommendationCandidate::getMovie)
                .filter(Objects::nonNull)
                .map(Movie::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        List<Movie> fallbackMovies = ruleBasedCandidateRetrievalService.generateCandidates(user, candidateLimit);

        for (Movie movie : fallbackMovies) {
            if (movie == null || movie.getId() == null) {
                continue;
            }

            if (existingIds.contains(movie.getId())) {
                continue;
            }

            candidates.add(RecommendationCandidate.builder()
                    .movie(movie)
                    .retrievalScore(0.0)
                    .source("FALLBACK_RULE_CANDIDATE")
                    .build());

            existingIds.add(movie.getId());

            if (candidates.size() >= candidateLimit) {
                return;
            }
        }
    }
}