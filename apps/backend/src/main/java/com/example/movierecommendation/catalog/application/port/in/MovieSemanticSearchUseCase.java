package com.example.movierecommendation.catalog.application.port.in;

import com.example.movierecommendation.catalog.application.query.FindSimilarMoviesQuery;
import com.example.movierecommendation.catalog.application.query.SearchMoviesByTextQuery;
import com.example.movierecommendation.catalog.application.result.MovieSemanticSearchItem;

import java.util.List;

public interface MovieSemanticSearchUseCase {

    List<MovieSemanticSearchItem> findSimilarMovies(FindSimilarMoviesQuery query);

    List<MovieSemanticSearchItem> searchByText(SearchMoviesByTextQuery query);
}