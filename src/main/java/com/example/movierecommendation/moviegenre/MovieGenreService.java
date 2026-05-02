package com.example.movierecommendation.moviegenre;

import com.example.movierecommendation.genre.Genre;
import com.example.movierecommendation.genre.GenreRepository;
import com.example.movierecommendation.movie.Movie;
import com.example.movierecommendation.movie.MovieRepository;
import com.example.movierecommendation.moviegenre.dto.MovieGenreRequest;
import com.example.movierecommendation.moviegenre.dto.MovieGenreResponse;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MovieGenreService {

    private static final String STATUS_ACTIVE = "ACTIVE";

    private final MovieGenreRepository movieGenreRepository;
    private final MovieRepository movieRepository;
    private final GenreRepository genreRepository;

    public MovieGenreResponse addGenreToMovie(MovieGenreRequest request) {
        Movie movie = movieRepository.findById(request.getMovieId())
                .orElseThrow(() -> new RuntimeException("Movie not found"));

        Genre genre = genreRepository.findById(request.getGenreId())
                .orElseThrow(() -> new RuntimeException("Genre not found"));

        if (!STATUS_ACTIVE.equals(genre.getStatus())) {
            throw new RuntimeException("Only ACTIVE genre can be assigned to movie");
        }

        if (movieGenreRepository.existsByMovieIdAndGenreId(
                request.getMovieId(),
                request.getGenreId()
        )) {
            throw new RuntimeException("Genre already exists in this movie");
        }

        MovieGenre movieGenre = MovieGenre.builder()
                .movie(movie)
                .genre(genre)
                .build();

        return MovieGenreResponse.from(movieGenreRepository.save(movieGenre));
    }

    public List<MovieGenreResponse> getGenresByMovie(Long movieId) {
        return movieGenreRepository.findByMovieId(movieId)
                .stream()
                .map(MovieGenreResponse::from)
                .toList();
    }

    public List<MovieGenreResponse> getMoviesByGenre(Long genreId) {
        return movieGenreRepository.findByGenreId(genreId)
                .stream()
                .map(MovieGenreResponse::from)
                .toList();
    }

    public void removeGenreFromMovie(Long id) {
        MovieGenre movieGenre = movieGenreRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Movie genre not found"));

        movieGenreRepository.delete(movieGenre);
    }

    @Transactional
    public void removeGenreFromMovie(Long movieId, Long genreId) {
        if (!movieGenreRepository.existsByMovieIdAndGenreId(movieId, genreId)) {
            throw new RuntimeException("Genre does not exist in this movie");
        }

        movieGenreRepository.deleteByMovieIdAndGenreId(movieId, genreId);
    }
}