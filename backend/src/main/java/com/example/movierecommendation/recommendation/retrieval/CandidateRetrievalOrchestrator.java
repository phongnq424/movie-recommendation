package com.example.movierecommendation.recommendation.retrieval;

import com.example.movierecommendation.movie.Movie;
import com.example.movierecommendation.recommendation.dto.RecommendationCandidate;
import com.example.movierecommendation.recommendation.retrieval.als.AlsCandidateRetrievalService;
import com.example.movierecommendation.recommendation.retrieval.semantic.SemanticCandidateRetrievalService;
import com.example.movierecommendation.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CandidateRetrievalOrchestrator {

    private static final double ALS_PORTION = 0.65;
    private static final double SEMANTIC_PORTION = 0.45;

    private final AlsCandidateRetrievalService alsCandidateRetrievalService;
    private final SemanticCandidateRetrievalService semanticCandidateRetrievalService;

    public List<RecommendationCandidate> retrieveForUser(User user, int candidateLimit) {
        if (candidateLimit <= 0) {
            return List.of();
        }

        int alsLimit = Math.max(1, (int) Math.ceil(candidateLimit * ALS_PORTION));
        int semanticLimit = Math.max(1, (int) Math.ceil(candidateLimit * SEMANTIC_PORTION));

        List<RecommendationCandidate> merged = new ArrayList<>();
        merged.addAll(alsCandidateRetrievalService.retrieveForUser(user, alsLimit));
        merged.addAll(semanticCandidateRetrievalService.retrieveForUser(user, semanticLimit));

        return deduplicate(merged, candidateLimit);
    }

    public List<RecommendationCandidate> retrieveForAnonymous(int candidateLimit) {
        return alsCandidateRetrievalService.retrieveForAnonymous(candidateLimit);
    }

    private List<RecommendationCandidate> deduplicate(
            List<RecommendationCandidate> candidates,
            int limit
    ) {
        if (candidates == null || candidates.isEmpty()) {
            return List.of();
        }

        Map<Long, RecommendationCandidate> mergedByMovieId = new LinkedHashMap<>();

        for (RecommendationCandidate candidate : candidates) {
            if (candidate == null
                    || candidate.getMovie() == null
                    || candidate.getMovie().getId() == null) {
                continue;
            }

            Long movieId = candidate.getMovie().getId();
            RecommendationCandidate existing = mergedByMovieId.get(movieId);

            if (existing == null) {
                mergedByMovieId.put(movieId, candidate);
            } else {
                mergedByMovieId.put(movieId, merge(existing, candidate));
            }
        }

        return mergedByMovieId.values()
                .stream()
                .sorted(Comparator
                        .comparingDouble(this::candidateOrderingScore)
                        .reversed())
                .limit(limit)
                .toList();
    }

    private RecommendationCandidate merge(
            RecommendationCandidate first,
            RecommendationCandidate second
    ) {
        Movie movie = first.getMovie() != null ? first.getMovie() : second.getMovie();

        double retrievalScore = Math.max(
                first.getRetrievalScore(),
                second.getRetrievalScore()
        );

        Double collaborativeScore = maxNullable(
                first.getCollaborativeScore(),
                second.getCollaborativeScore()
        );

        Double semanticContentScore = maxNullable(
                first.getSemanticContentScore(),
                second.getSemanticContentScore()
        );

        String source = mergeSource(first.getSource(), second.getSource());

        return RecommendationCandidate.builder()
                .movie(movie)
                .retrievalScore(retrievalScore)
                .collaborativeScore(collaborativeScore)
                .semanticContentScore(semanticContentScore)
                .source(source)
                .build();
    }

    private double candidateOrderingScore(RecommendationCandidate candidate) {
        if (candidate == null) {
            return 0.0;
        }

        double collaborativeScore = candidate.getCollaborativeScore() == null
                ? 0.0
                : candidate.getCollaborativeScore();

        double semanticScore = candidate.getSemanticContentScore() == null
                ? 0.0
                : candidate.getSemanticContentScore();

        return Math.max(
                candidate.getRetrievalScore(),
                Math.max(collaborativeScore, semanticScore)
        );
    }

    private Double maxNullable(Double first, Double second) {
        if (first == null) {
            return second;
        }

        if (second == null) {
            return first;
        }

        return Math.max(first, second);
    }

    private String mergeSource(String first, String second) {
        if (first == null || first.isBlank()) {
            return second;
        }

        if (second == null || second.isBlank()) {
            return first;
        }

        if (first.equals(second)) {
            return first;
        }

        return first + "+" + second;
    }
}