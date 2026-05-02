package com.example.movierecommendation.movie;

import com.example.movierecommendation.movie.dto.MovieDetailResponse;
import com.example.movierecommendation.movie.dto.MovieRequest;
import com.example.movierecommendation.movie.dto.MovieResponse;
import com.example.movierecommendation.movieactor.MovieActorRepository;
import com.example.movierecommendation.movieactor.dto.MovieActorResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MovieService {

    private final MovieRepository movieRepository;
    private final MovieActorRepository movieActorRepository;

    public List<MovieResponse> getAllMovies() {
        return movieRepository.findAll()
                .stream()
                .map(MovieResponse::from)
                .toList();
    }

    public MovieResponse getMovieById(Long id) {
        Movie movie = getMovieEntityById(id);
        return MovieResponse.from(movie);
    }

    public MovieDetailResponse getMovieDetailById(Long id) {
        Movie movie = getMovieEntityById(id);

        List<MovieActorResponse> actors = movieActorRepository
                .findByMovieIdOrderByCastOrderAsc(id)
                .stream()
                .map(MovieActorResponse::from)
                .toList();

        return MovieDetailResponse.from(movie, actors);
    }

    public List<MovieResponse> searchMovies(String keyword) {
        return movieRepository.findByTitleContainingIgnoreCase(keyword)
                .stream()
                .map(MovieResponse::from)
                .toList();
    }

    public MovieResponse createMovie(MovieRequest request) {
        validateMovieRequest(request);

        Movie movie = Movie.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .releaseYear(request.getReleaseYear())
                .posterUrl(request.getPosterUrl())
                .trailerUrl(request.getTrailerUrl())
                .movieUrl(request.getMovieUrl())
                .averageRating(0.0)
                .ratingCount(0)
                .build();

        return MovieResponse.from(movieRepository.save(movie));
    }

    public MovieResponse updateMovie(Long id, MovieRequest request) {
        validateMovieRequest(request);

        Movie movie = getMovieEntityById(id);

        movie.setTitle(request.getTitle());
        movie.setDescription(request.getDescription());
        movie.setReleaseYear(request.getReleaseYear());
        movie.setPosterUrl(request.getPosterUrl());
        movie.setTrailerUrl(request.getTrailerUrl());
        movie.setMovieUrl(request.getMovieUrl());

        return MovieResponse.from(movieRepository.save(movie));
    }

    public void deleteMovie(Long id) {
        Movie movie = getMovieEntityById(id);
        movieRepository.delete(movie);
    }

    public Movie getMovieEntityById(Long id) {
        return movieRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Movie not found"));
    }

    private void validateMovieRequest(MovieRequest request) {
        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new RuntimeException("Movie title is required");
        }

        if (request.getReleaseYear() == null) {
            throw new RuntimeException("Release year is required");
        }

        if (request.getReleaseYear() < 1888) {
            throw new RuntimeException("Release year is invalid");
        }
    }
}