package com.example.movierecommendation.moviegenre;

import com.example.movierecommendation.genre.Genre;
import com.example.movierecommendation.genre.GenreRepository;
import com.example.movierecommendation.movie.Movie;
import com.example.movierecommendation.movie.MovieRepository;
import com.example.movierecommendation.moviegenre.dto.MovieGenreRequest;
import com.example.movierecommendation.moviegenre.dto.MovieGenreResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MovieGenreService {

    private static final String STATUS_ACTIVE = "ACTIVE";

    private final MovieGenreRepository movieGenreRepository;
    private final MovieRepository movieRepository;
    private final GenreRepository genreRepository;

    @Transactional
    public MovieGenreResponse addGenreToMovie(MovieGenreRequest request) {
        validateMovieGenreRequest(request);

        Movie movie = getMovieByPublicId(request.getMoviePublicId());
        Genre genre = getGenreByPublicId(request.getGenrePublicId());

        validateGenreAssignable(genre);

        if (movieGenreRepository.existsByMovieIdAndGenreId(
                movie.getId(),
                genre.getId()
        )) {
            throw new RuntimeException("Genre already exists in this movie");
        }

        MovieGenre movieGenre = MovieGenre.builder()
                .movie(movie)
                .genre(genre)
                .build();

        return MovieGenreResponse.from(movieGenreRepository.save(movieGenre));
    }

    @Transactional(readOnly = true)
    public List<MovieGenreResponse> getGenresByMovie(UUID moviePublicId) {
        Movie movie = getMovieByPublicId(moviePublicId);

        return movieGenreRepository.findByMovieId(movie.getId())
                .stream()
                .map(MovieGenreResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MovieGenreResponse> getMoviesByGenre(UUID genrePublicId) {
        Genre genre = getGenreByPublicId(genrePublicId);

        return movieGenreRepository.findByGenreId(genre.getId())
                .stream()
                .map(MovieGenreResponse::from)
                .toList();
    }

    @Transactional
    public void removeGenreFromMovie(UUID moviePublicId, UUID genrePublicId) {
        Movie movie = getMovieByPublicId(moviePublicId);
        Genre genre = getGenreByPublicId(genrePublicId);

        MovieGenre movieGenre = movieGenreRepository
                .findByMovieIdAndGenreId(movie.getId(), genre.getId())
                .orElseThrow(() -> new RuntimeException("Genre does not exist in this movie"));

        movieGenreRepository.delete(movieGenre);
    }

    @Transactional
    public List<MovieGenreResponse> setGenresForMovie(
            UUID moviePublicId,
            List<UUID> genrePublicIds
    ) {
        if (genrePublicIds == null) {
            throw new RuntimeException("Genre public IDs are required");
        }

        Movie movie = getMovieByPublicId(moviePublicId);

        validateDuplicateGenres(genrePublicIds);

        List<MovieGenre> existingMovieGenres = movieGenreRepository.findByMovieId(movie.getId());

        Set<UUID> requestedGenrePublicIds = new HashSet<>(genrePublicIds);

        List<MovieGenre> movieGenresToDelete = existingMovieGenres.stream()
                .filter(movieGenre -> !requestedGenrePublicIds.contains(
                        movieGenre.getGenre().getPublicId()
                ))
                .toList();

        if (!movieGenresToDelete.isEmpty()) {
            movieGenreRepository.deleteAll(movieGenresToDelete);
        }

        Set<UUID> existingGenrePublicIds = existingMovieGenres.stream()
                .map(movieGenre -> movieGenre.getGenre().getPublicId())
                .collect(HashSet::new, HashSet::add, HashSet::addAll);

        List<MovieGenre> movieGenresToCreate = genrePublicIds.stream()
                .filter(genrePublicId -> !existingGenrePublicIds.contains(genrePublicId))
                .map(genrePublicId -> {
                    Genre genre = getGenreByPublicId(genrePublicId);
                    validateGenreAssignable(genre);

                    return MovieGenre.builder()
                            .movie(movie)
                            .genre(genre)
                            .build();
                })
                .toList();

        if (!movieGenresToCreate.isEmpty()) {
            movieGenreRepository.saveAll(movieGenresToCreate);
        }

        return movieGenreRepository.findByMovieId(movie.getId())
                .stream()
                .map(MovieGenreResponse::from)
                .toList();
    }

    private Movie getMovieByPublicId(UUID moviePublicId) {
        if (moviePublicId == null) {
            throw new RuntimeException("Movie public ID is required");
        }

        return movieRepository.findByPublicId(moviePublicId)
                .orElseThrow(() -> new RuntimeException("Movie not found"));
    }

    private Genre getGenreByPublicId(UUID genrePublicId) {
        if (genrePublicId == null) {
            throw new RuntimeException("Genre public ID is required");
        }

        return genreRepository.findByPublicId(genrePublicId)
                .orElseThrow(() -> new RuntimeException("Genre not found"));
    }

    private void validateMovieGenreRequest(MovieGenreRequest request) {
        if (request == null) {
            throw new RuntimeException("Movie genre request is required");
        }

        if (request.getMoviePublicId() == null) {
            throw new RuntimeException("Movie public ID is required");
        }

        if (request.getGenrePublicId() == null) {
            throw new RuntimeException("Genre public ID is required");
        }
    }

    private void validateGenreAssignable(Genre genre) {
        if (!STATUS_ACTIVE.equals(genre.getStatus())) {
            throw new RuntimeException("Only ACTIVE genre can be assigned to movie");
        }
    }

    private void validateDuplicateGenres(List<UUID> genrePublicIds) {
        Set<UUID> uniqueGenreIds = new HashSet<>();

        for (UUID genrePublicId : genrePublicIds) {
            if (genrePublicId == null) {
                throw new RuntimeException("Genre public ID is required");
            }

            if (!uniqueGenreIds.add(genrePublicId)) {
                throw new RuntimeException("Duplicate genre in movie: " + genrePublicId);
            }
        }
    }
}