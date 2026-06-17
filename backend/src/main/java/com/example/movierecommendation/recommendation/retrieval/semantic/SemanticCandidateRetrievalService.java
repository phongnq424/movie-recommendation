package com.example.movierecommendation.recommendation.retrieval.semantic;

import com.example.movierecommendation.movie.Movie;
import com.example.movierecommendation.movie.MovieRepository;
import com.example.movierecommendation.rating.Rating;
import com.example.movierecommendation.rating.RatingRepository;
import com.example.movierecommendation.recommendation.dto.RecommendationCandidate;
import com.example.movierecommendation.user.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SemanticCandidateRetrievalService {

    private final SemanticUserContentVectorService semanticUserContentVectorService;
    private final MovieContentEmbeddingRepository movieContentEmbeddingRepository;
    private final MovieRepository movieRepository;
    private final RatingRepository ratingRepository;

    public List<RecommendationCandidate> retrieveForUser(User user, int candidateLimit) {
        if (user == null || user.getId() == null || candidateLimit <= 0) {
            return List.of();
        }

        try {
            String userContentEmbedding = semanticUserContentVectorService.buildUserContentEmbeddingText(user.getId());

            if (userContentEmbedding == null || userContentEmbedding.isBlank()) {
                return List.of();
            }

            List<Long> excludedMovieIds = loadExcludedMovieIds(user);
            List<SemanticMovieRetrievalResult> retrievalResults = movieContentEmbeddingRepository.findNearestPublishedMovies(
                    userContentEmbedding,
                    excludedMovieIds,
                    candidateLimit
            );

            return mapRetrievalResultsToCandidates(retrievalResults);
        } catch (Exception ex) {
            log.warn("Semantic candidate retrieval failed. userId={}", user.getId(), ex);
            return List.of();
        }
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
            List<SemanticMovieRetrievalResult> retrievalResults
    ) {
        if (retrievalResults == null || retrievalResults.isEmpty()) {
            return List.of();
        }

        List<Long> movieIds = retrievalResults.stream()
                .filter(Objects::nonNull)
                .map(SemanticMovieRetrievalResult::movieId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        if (movieIds.isEmpty()) {
            return List.of();
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

        List<RecommendationCandidate> candidates = new ArrayList<>();

        for (SemanticMovieRetrievalResult result : retrievalResults) {
            if (result == null || result.movieId() == null) {
                continue;
            }

            Movie movie = movieById.get(result.movieId());

            if (movie == null) {
                continue;
            }

            double semanticScore = result.semanticContentScore() == null
                    ? 0.0
                    : result.semanticContentScore();

            candidates.add(RecommendationCandidate.builder()
                    .movie(movie)
                    .retrievalScore(semanticScore)
                    .semanticContentScore(semanticScore)
                    .source("CONTENT_EMBEDDING_RETRIEVAL")
                    .build());
        }

        return candidates;
    }
}
