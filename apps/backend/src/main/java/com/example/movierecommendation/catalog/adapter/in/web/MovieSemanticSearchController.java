package com.example.movierecommendation.catalog.adapter.in.web;

import com.example.movierecommendation.catalog.adapter.in.web.dto.MovieSemanticSearchRequest;
import com.example.movierecommendation.catalog.adapter.in.web.dto.MovieSemanticSearchResponse;
import com.example.movierecommendation.catalog.adapter.in.web.mapper.MovieSemanticSearchWebMapper;
import com.example.movierecommendation.catalog.application.port.in.MovieSemanticSearchUseCase;
import com.example.movierecommendation.catalog.application.query.FindSimilarMoviesQuery;
import com.example.movierecommendation.catalog.application.query.SearchMoviesByTextQuery;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/movies")
@RequiredArgsConstructor
public class MovieSemanticSearchController {

    private final MovieSemanticSearchUseCase movieSemanticSearchUseCase;

    @GetMapping("/{publicId}/similar-vector")
    public List<MovieSemanticSearchResponse> findSimilarMovies(
            @PathVariable UUID publicId,
            @RequestParam(defaultValue = "20") int limit
    ) {
        return movieSemanticSearchUseCase.findSimilarMovies(
                        new FindSimilarMoviesQuery(publicId, limit)
                )
                .stream()
                .map(MovieSemanticSearchWebMapper::toResponse)
                .toList();
    }

    @PostMapping("/vector-search")
    public List<MovieSemanticSearchResponse> searchByText(
            @Valid @RequestBody MovieSemanticSearchRequest request
    ) {
        int limit = request.getLimit() == null ? 20 : request.getLimit();

        return movieSemanticSearchUseCase.searchByText(
                        new SearchMoviesByTextQuery(request.getQuery(), limit)
                )
                .stream()
                .map(MovieSemanticSearchWebMapper::toResponse)
                .toList();
    }
}