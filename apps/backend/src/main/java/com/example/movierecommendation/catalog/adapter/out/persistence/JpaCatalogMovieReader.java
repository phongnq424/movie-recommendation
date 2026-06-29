package com.example.movierecommendation.catalog.adapter.out.persistence;

import com.example.movierecommendation.catalog.application.port.out.CatalogMovieReader;
import com.example.movierecommendation.catalog.domain.model.CatalogMovie;
import com.example.movierecommendation.catalog.domain.model.MovieStatus;
import com.example.movierecommendation.movie.Movie;
import com.example.movierecommendation.movie.MovieRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class JpaCatalogMovieReader implements CatalogMovieReader {

    private static final String STATUS_PUBLISHED = "PUBLISHED";

    private final MovieRepository movieRepository;

    @Override
    public Optional<CatalogMovie> findPublishedMovieByPublicId(UUID publicId) {
        return movieRepository.findByPublicId(publicId)
                .filter(movie -> STATUS_PUBLISHED.equals(movie.getStatus()))
                .map(this::toCatalogMovie);
    }

    private CatalogMovie toCatalogMovie(Movie movie) {
        return new CatalogMovie(
                movie.getId(),
                movie.getPublicId(),
                movie.getTitle(),
                movie.getSlug(),
                movie.getPosterUrl(),
                movie.getReleaseYear(),
                movie.getAverageRating(),
                movie.getRatingCount(),
                movie.getViewCount(),
                MovieStatus.from(movie.getStatus())
        );
    }
}