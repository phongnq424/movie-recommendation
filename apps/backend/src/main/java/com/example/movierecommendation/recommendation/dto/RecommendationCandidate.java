package com.example.movierecommendation.recommendation.dto;

import com.example.movierecommendation.movie.Movie;
import com.example.movierecommendation.recommendation.retrieval.CandidateSource;
import lombok.Builder;
import lombok.Getter;
import lombok.Singular;

import java.util.LinkedHashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Getter
@Builder
public class RecommendationCandidate {

    private Movie movie;

    private double retrievalScore;

    private Double collaborativeScore;

    private Double semanticContentScore;

    @Singular
    private Set<CandidateSource> sources;

    public Set<CandidateSource> getSources() {
        if (sources == null || sources.isEmpty()) {
            return Set.of();
        }

        return Set.copyOf(sources);
    }

    public String getSource() {
        if (sources == null || sources.isEmpty()) {
            return "";
        }

        return sources.stream()
                .map(Enum::name)
                .collect(Collectors.joining("+"));
    }

    public static Set<CandidateSource> mergeSources(
            RecommendationCandidate first,
            RecommendationCandidate second
    ) {
        LinkedHashSet<CandidateSource> merged = new LinkedHashSet<>();

        if (first != null && first.getSources() != null) {
            merged.addAll(first.getSources());
        }

        if (second != null && second.getSources() != null) {
            merged.addAll(second.getSources());
        }

        return merged;
    }
}