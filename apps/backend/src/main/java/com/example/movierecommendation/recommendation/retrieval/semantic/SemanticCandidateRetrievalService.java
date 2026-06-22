package com.example.movierecommendation.recommendation.retrieval.semantic;

import com.example.movierecommendation.movie.Movie;
import com.example.movierecommendation.movie.MovieRepository;
import com.example.movierecommendation.rating.Rating;
import com.example.movierecommendation.rating.RatingRepository;
import com.example.movierecommendation.recommendation.dto.RecommendationCandidate;
import com.example.movierecommendation.recommendation.retrieval.CandidateRetrievalStrategy;
import com.example.movierecommendation.recommendation.retrieval.CandidateSource;
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
public class SemanticCandidateRetrievalService implements CandidateRetrievalStrategy {

    private final SemanticUserContentVectorService semanticUserContentVectorService;
    private final MovieContentEmbeddingRepository movieContentEmbeddingRepository;
    private final MovieRepository movieRepository;
    private final RatingRepository ratingRepository;

    public List<RecommendationCandidate> retrieveForUser(User user, int candidateLimit) {
        if (user == null || user.getId() == null || candidateLimit <= 0) {
            return List.of();
        }

        try {
            List<SemanticProfileMovie> profileMovies =
                    semanticUserContentVectorService.buildUserProfileMovies(user.getId());

            if (profileMovies.isEmpty()) {
                return List.of();
            }

            List<Long> excludedMovieIds = loadExcludedMovieIds(user);

            List<SemanticMovieRetrievalResult> retrievalResults =
                    retrieveMultiInterestCandidates(profileMovies, excludedMovieIds, candidateLimit);

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
    private List<SemanticMovieRetrievalResult> retrieveMultiInterestCandidates(
            List<SemanticProfileMovie> profileMovies,
            List<Long> excludedMovieIds,
            int candidateLimit
    ) {
        if (profileMovies == null || profileMovies.isEmpty() || candidateLimit <= 0) {
            return List.of();
        }

        List<Long> anchorMovieIds = profileMovies.stream()
                .map(SemanticProfileMovie::movieId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        if (anchorMovieIds.isEmpty()) {
            return List.of();
        }

        Map<Long, String> embeddingByMovieId =
                movieContentEmbeddingRepository.findEmbeddingTextsByMovieIds(anchorMovieIds);

        if (embeddingByMovieId == null || embeddingByMovieId.isEmpty()) {
            return List.of();
        }

        List<Long> safeExcludedMovieIds = new ArrayList<>();

        if (excludedMovieIds != null) {
            safeExcludedMovieIds.addAll(excludedMovieIds);
        }

        safeExcludedMovieIds.addAll(anchorMovieIds);

        safeExcludedMovieIds = safeExcludedMovieIds.stream()
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        int perAnchorLimit = Math.max(
                5,
                (int) Math.ceil(candidateLimit / (double) Math.max(1, profileMovies.size()))
        );

        perAnchorLimit = Math.min(candidateLimit, perAnchorLimit * 3);

        Map<Long, Double> bestScoreByMovieId = new java.util.LinkedHashMap<>();

        for (SemanticProfileMovie profileMovie : profileMovies) {
            if (profileMovie == null || profileMovie.movieId() == null) {
                continue;
            }

            String anchorEmbedding = embeddingByMovieId.get(profileMovie.movieId());

            if (anchorEmbedding == null || anchorEmbedding.isBlank()) {
                continue;
            }

            List<SemanticMovieRetrievalResult> nearestMovies =
                    movieContentEmbeddingRepository.findNearestPublishedMovies(
                            anchorEmbedding,
                            safeExcludedMovieIds,
                            perAnchorLimit
                    );

            for (SemanticMovieRetrievalResult result : nearestMovies) {
                if (result == null || result.movieId() == null) {
                    continue;
                }

                double similarity = result.semanticContentScore() == null
                        ? 0.0
                        : result.semanticContentScore();

                double weightedScore = clamp(similarity * profileMovie.weight());

                bestScoreByMovieId.merge(
                        result.movieId(),
                        weightedScore,
                        Math::max
                );
            }
        }

        return bestScoreByMovieId.entrySet()
                .stream()
                .sorted(Map.Entry.<Long, Double>comparingByValue().reversed())
                .limit(candidateLimit)
                .map(entry -> new SemanticMovieRetrievalResult(
                        entry.getKey(),
                        entry.getValue()
                ))
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
                    .source(CandidateSource.CONTENT_EMBEDDING_RETRIEVAL)
                    .build());
        }

        return candidates;
    }
    private double clamp(double value) {
        return Math.max(0.0, Math.min(1.0, value));
    }
    @Override
    public CandidateSource source() {
        return CandidateSource.CONTENT_EMBEDDING_RETRIEVAL;
    }

    @Override
    public double userCandidatePortion() {
        return 0.45;
    }
}
