package com.example.movierecommendation.recommendation.retrieval;

import com.example.movierecommendation.movie.Movie;
import com.example.movierecommendation.recommendation.dto.RecommendationCandidate;
import com.example.movierecommendation.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class CandidateRetrievalOrchestrator {

    private final List<CandidateRetrievalStrategy> retrievalStrategies;

    public List<RecommendationCandidate> retrieveForUser(User user, int candidateLimit) {
        if (candidateLimit <= 0) {
            return List.of();
        }

        List<RecommendationCandidate> mergedCandidates = new ArrayList<>();

        for (CandidateRetrievalStrategy strategy : retrievalStrategies) {
            if (strategy == null || !strategy.supportsUser(user)) {
                continue;
            }

            int strategyLimit = calculateStrategyLimit(
                    candidateLimit,
                    strategy.userCandidatePortion()
            );

            List<RecommendationCandidate> candidates =
                    strategy.retrieveForUser(user, strategyLimit);

            if (candidates != null && !candidates.isEmpty()) {
                mergedCandidates.addAll(candidates);
            }
        }

        return deduplicate(mergedCandidates, candidateLimit);
    }

    public List<RecommendationCandidate> retrieveForAnonymous(int candidateLimit) {
        if (candidateLimit <= 0) {
            return List.of();
        }

        return retrievalStrategies.stream()
                .filter(CandidateRetrievalStrategy::supportsAnonymous)
                .findFirst()
                .map(strategy -> strategy.retrieveForAnonymous(candidateLimit))
                .orElseGet(List::of);
    }

    private int calculateStrategyLimit(int candidateLimit, double portion) {
        double safePortion = portion <= 0 ? 1.0 : portion;
        return Math.max(1, (int) Math.ceil(candidateLimit * safePortion));
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
        Movie movie = first.getMovie() != null
                ? first.getMovie()
                : second.getMovie();

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

        Set<CandidateSource> sources = new LinkedHashSet<>();
        sources.addAll(first.getSources());
        sources.addAll(second.getSources());

        return RecommendationCandidate.builder()
                .movie(movie)
                .retrievalScore(retrievalScore)
                .collaborativeScore(collaborativeScore)
                .semanticContentScore(semanticContentScore)
                .sources(sources)
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
}