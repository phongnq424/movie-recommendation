package com.example.movierecommendation.recommendation.impression;

import com.example.movierecommendation.movie.Movie;
import com.example.movierecommendation.movie.MovieRepository;
import com.example.movierecommendation.recommendation.dto.RecommendationResponse;
import com.example.movierecommendation.recommendation.ml.LearnedEmbeddingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RecommendationImpressionService {

    private final RecommendationImpressionRepository impressionRepository;
    private final LearnedEmbeddingRepository learnedEmbeddingRepository;
    private final MovieRepository movieRepository;

    public void logShownRecommendations(
            Long userId,
            UUID requestId,
            List<RecommendationResponse> responses,
            String recommendationType
    ) {
        if (responses == null || responses.isEmpty()) {
            return;
        }

        Map<UUID, Long> movieIdByPublicId = loadMovieIdsByPublicId(responses);
        String retrievalModelVersion = learnedEmbeddingRepository.findActiveRetrievalModelVersion();

        List<RecommendationImpression> impressions = new ArrayList<>();

        for (int i = 0; i < responses.size(); i++) {
            RecommendationResponse response = responses.get(i);

            if (response == null || response.getMoviePublicId() == null) {
                continue;
            }

            Long movieId = movieIdByPublicId.get(response.getMoviePublicId());

            if (movieId == null) {
                continue;
            }

            RecommendationImpression impression = new RecommendationImpression();
            impression.setRequestId(requestId);
            impression.setUserId(userId);
            impression.setMovieId(movieId);
            impression.setPosition(i + 1);
            impression.setFinalScore(safeDouble(response.getFinalScore()));
            impression.setRecommendationType(recommendationType);
            impression.setRetrievalModelVersion(retrievalModelVersion);
            impression.setRankingModelVersion("RULE_RANKING_V1");

            impressions.add(impression);
        }

        if (!impressions.isEmpty()) {
            impressionRepository.saveAll(impressions);
        }
    }

    private Map<UUID, Long> loadMovieIdsByPublicId(List<RecommendationResponse> responses) {
        List<UUID> moviePublicIds = responses.stream()
                .filter(Objects::nonNull)
                .map(RecommendationResponse::getMoviePublicId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        if (moviePublicIds.isEmpty()) {
            return Map.of();
        }

        List<Movie> movies = movieRepository.findByPublicIdIn(moviePublicIds);

        return movies.stream()
                .filter(movie -> movie.getPublicId() != null)
                .filter(movie -> movie.getId() != null)
                .collect(Collectors.toMap(
                        Movie::getPublicId,
                        Movie::getId
                ));
    }

    private double safeDouble(Double value) {
        return value == null ? 0.0 : value;
    }
}