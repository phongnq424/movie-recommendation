package com.example.movierecommendation.catalog.application.service;

import com.example.movierecommendation.catalog.application.port.in.MovieSemanticSearchUseCase;
import com.example.movierecommendation.catalog.application.port.out.CatalogMovieReader;
import com.example.movierecommendation.catalog.application.port.out.MovieVectorSearchPort;
import com.example.movierecommendation.catalog.application.port.out.TextEmbeddingPort;
import com.example.movierecommendation.catalog.application.query.FindSimilarMoviesQuery;
import com.example.movierecommendation.catalog.application.query.SearchMoviesByTextQuery;
import com.example.movierecommendation.catalog.application.result.MovieSemanticSearchItem;
import com.example.movierecommendation.catalog.domain.exception.CatalogMovieNotFoundException;
import com.example.movierecommendation.catalog.domain.model.CatalogMovie;
import com.example.movierecommendation.catalog.domain.model.EmbeddingVector;
import com.example.movierecommendation.catalog.domain.model.MovieSemanticSearchResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MovieSemanticSearchService implements MovieSemanticSearchUseCase {

    private final CatalogMovieReader catalogMovieReader;
    private final MovieVectorSearchPort movieVectorSearchPort;
    private final TextEmbeddingPort textEmbeddingPort;

    @Override
    public List<MovieSemanticSearchItem> findSimilarMovies(FindSimilarMoviesQuery query) {
        CatalogMovie movie = catalogMovieReader.findPublishedMovieByPublicId(query.moviePublicId())
                .orElseThrow(() -> new CatalogMovieNotFoundException("Movie not found"));

        return movieVectorSearchPort.findSimilarMoviesByMovieId(movie.id(), query.limit())
                .stream()
                .map(this::toItem)
                .toList();
    }

    @Override
    public List<MovieSemanticSearchItem> searchByText(SearchMoviesByTextQuery query) {
        EmbeddingVector embeddingVector = textEmbeddingPort.embed(query.text());

        return movieVectorSearchPort.searchMoviesByVector(embeddingVector, query.limit())
                .stream()
                .map(this::toItem)
                .toList();
    }

    private MovieSemanticSearchItem toItem(MovieSemanticSearchResult result) {
        CatalogMovie movie = result.movie();

        return new MovieSemanticSearchItem(
                movie.publicId(),
                movie.title(),
                movie.slug(),
                movie.posterUrl(),
                movie.releaseYear(),
                movie.averageRating(),
                movie.ratingCount(),
                movie.viewCount(),
                result.similarity()
        );
    }
}