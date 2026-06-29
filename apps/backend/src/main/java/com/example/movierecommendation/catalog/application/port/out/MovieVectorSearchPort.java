package com.example.movierecommendation.catalog.application.port.out;

import com.example.movierecommendation.catalog.domain.model.EmbeddingVector;
import com.example.movierecommendation.catalog.domain.model.MovieSemanticSearchResult;

import java.util.List;

public interface MovieVectorSearchPort {

    List<MovieSemanticSearchResult> findSimilarMoviesByMovieId(Long movieId, int limit);

    List<MovieSemanticSearchResult> searchMoviesByVector(EmbeddingVector embeddingVector, int limit);
}