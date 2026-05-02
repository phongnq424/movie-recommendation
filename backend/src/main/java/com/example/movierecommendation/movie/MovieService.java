package com.example.movierecommendation.movie;

import com.example.movierecommendation.movie.dto.MovieDetailResponse;
import com.example.movierecommendation.movie.dto.MovieRequest;
import com.example.movierecommendation.movie.dto.MovieResponse;
import com.example.movierecommendation.movieactor.MovieActorRepository;
import com.example.movierecommendation.movieactor.dto.MovieActorResponse;
import com.example.movierecommendation.moviegenre.MovieGenreRepository;
import com.example.movierecommendation.moviegenre.dto.MovieGenreResponse;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MovieService {

    private static final String STATUS_DRAFT = "DRAFT";
    private static final String STATUS_PUBLISHED = "PUBLISHED";
    private static final String STATUS_HIDDEN = "HIDDEN";
    private static final String STATUS_DELETED = "DELETED";

    private final MovieRepository movieRepository;
    private final MovieActorRepository movieActorRepository;
    private final MovieGenreRepository movieGenreRepository;

    public List<MovieResponse> getAllMovies() {
        return movieRepository.findAll()
                .stream()
                .map(MovieResponse::from)
                .toList();
    }

    public List<MovieResponse> getPublishedMovies() {
        return movieRepository.findByStatus(STATUS_PUBLISHED)
                .stream()
                .map(MovieResponse::from)
                .toList();
    }

    public MovieResponse getMovieByPublicId(UUID publicId) {
        Movie movie = getMovieEntityByPublicId(publicId);
        return MovieResponse.from(movie);
    }

    public MovieDetailResponse getMovieDetailByPublicId(UUID publicId) {
        Movie movie = getMovieEntityByPublicId(publicId);
        Long movieId = movie.getId();

        List<MovieActorResponse> actors = movieActorRepository
                .findByMovieIdOrderByCastOrderAsc(movieId)
                .stream()
                .map(MovieActorResponse::from)
                .toList();

        List<MovieGenreResponse> genres = movieGenreRepository
                .findByMovieId(movieId)
                .stream()
                .map(MovieGenreResponse::from)
                .toList();

        return MovieDetailResponse.from(movie, actors, genres);
    }

    public MovieResponse getMovieBySlug(String slug) {
        Movie movie = movieRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Movie not found"));

        return MovieResponse.from(movie);
    }

    public MovieDetailResponse getMovieDetailBySlug(String slug) {
        Movie movie = movieRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Movie not found"));

        Long movieId = movie.getId();

        List<MovieActorResponse> actors = movieActorRepository
                .findByMovieIdOrderByCastOrderAsc(movieId)
                .stream()
                .map(MovieActorResponse::from)
                .toList();

        List<MovieGenreResponse> genres = movieGenreRepository
                .findByMovieId(movieId)
                .stream()
                .map(MovieGenreResponse::from)
                .toList();

        return MovieDetailResponse.from(movie, actors, genres);
    }

    public List<MovieResponse> searchMovies(String keyword) {
        return movieRepository.findByTitleContainingIgnoreCase(keyword)
                .stream()
                .map(MovieResponse::from)
                .toList();
    }

    public MovieResponse createMovie(MovieRequest request) {
        return createMovies(List.of(request)).get(0);
    }

    @Transactional
    public List<MovieResponse> createMovies(List<MovieRequest> requests) {
        if (requests == null || requests.isEmpty()) {
            throw new RuntimeException("Movie list is required");
        }

        List<Movie> movies = requests.stream()
                .map(request -> {
                    validateMovieRequest(request);

                    String slug = generateUniqueSlug(
                            request.getTitle(),
                            request.getReleaseYear()
                    );

                    return Movie.builder()
                            .title(request.getTitle().trim())
                            .originalTitle(request.getOriginalTitle())
                            .slug(slug)
                            .description(request.getDescription())
                            .releaseYear(request.getReleaseYear())
                            .durationMinutes(request.getDurationMinutes())
                            .posterUrl(request.getPosterUrl())
                            .backdropUrl(request.getBackdropUrl())
                            .trailerUrl(request.getTrailerUrl())
                            .movieUrl(request.getMovieUrl())
                            .quality(request.getQuality())
                            .ageRating(request.getAgeRating())
                            .status(normalizeStatus(request.getStatus()))
                            .build();
                })
                .toList();

        return movieRepository.saveAll(movies)
                .stream()
                .map(MovieResponse::from)
                .toList();
    }

    public MovieResponse updateMovie(UUID publicId, MovieRequest request) {
        validateMovieRequest(request);

        Movie movie = getMovieEntityByPublicId(publicId);

        String newTitle = request.getTitle().trim();
        Integer newReleaseYear = request.getReleaseYear();
        String newSlug = generateSlug(newTitle + "-" + newReleaseYear);

        movieRepository.findBySlug(newSlug)
                .ifPresent(existingMovie -> {
                    if (!existingMovie.getPublicId().equals(publicId)) {
                        throw new RuntimeException("Movie slug already exists");
                    }
                });

        movie.setTitle(newTitle);
        movie.setOriginalTitle(request.getOriginalTitle());
        movie.setSlug(newSlug);
        movie.setDescription(request.getDescription());
        movie.setReleaseYear(request.getReleaseYear());
        movie.setDurationMinutes(request.getDurationMinutes());
        movie.setPosterUrl(request.getPosterUrl());
        movie.setBackdropUrl(request.getBackdropUrl());
        movie.setTrailerUrl(request.getTrailerUrl());
        movie.setMovieUrl(request.getMovieUrl());
        movie.setQuality(request.getQuality());
        movie.setAgeRating(request.getAgeRating());

        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            movie.setStatus(normalizeStatus(request.getStatus()));
        }

        return MovieResponse.from(movieRepository.save(movie));
    }

    public MovieResponse updateMovieStatus(UUID publicId, String status) {
        Movie movie = getMovieEntityByPublicId(publicId);
        movie.setStatus(normalizeStatus(status));

        return MovieResponse.from(movieRepository.save(movie));
    }

    public MovieResponse deleteMovie(UUID publicId) {
        Movie movie = getMovieEntityByPublicId(publicId);
        movie.setStatus(STATUS_DELETED);

        return MovieResponse.from(movieRepository.save(movie));
    }

    @Transactional
    public List<MovieResponse> deleteMovies(List<UUID> publicIds) {
        validatePublicIds(publicIds);

        List<Movie> movies = movieRepository.findAllByPublicIdIn(publicIds);

        if (movies.size() != publicIds.size()) {
            throw new RuntimeException("Some movies were not found");
        }

        movies.forEach(movie -> movie.setStatus(STATUS_DELETED));

        return movieRepository.saveAll(movies)
                .stream()
                .map(MovieResponse::from)
                .toList();
    }

    public Movie getMovieEntityByPublicId(UUID publicId) {
        if (publicId == null) {
            throw new RuntimeException("Movie public ID is required");
        }

        return movieRepository.findByPublicId(publicId)
                .orElseThrow(() -> new RuntimeException("Movie not found"));
    }

    /**
     * Giữ lại cho các service nội bộ cũ nếu đang cần Long id.
     * Không expose ra controller public.
     */
    public Movie getMovieEntityById(Long id) {
        return movieRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Movie not found"));
    }

    private void validateMovieRequest(MovieRequest request) {
        if (request == null) {
            throw new RuntimeException("Movie request is required");
        }

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

    private void validatePublicIds(List<UUID> publicIds) {
        if (publicIds == null || publicIds.isEmpty()) {
            throw new RuntimeException("Movie public IDs are required");
        }
    }

    private String normalizeStatus(String status) {
        if (status == null || status.isBlank()) {
            return STATUS_DRAFT;
        }

        String normalizedStatus = status.trim().toUpperCase();

        if (!normalizedStatus.equals(STATUS_DRAFT)
                && !normalizedStatus.equals(STATUS_PUBLISHED)
                && !normalizedStatus.equals(STATUS_HIDDEN)
                && !normalizedStatus.equals(STATUS_DELETED)) {
            throw new RuntimeException("Movie status must be DRAFT, PUBLISHED, HIDDEN, or DELETED");
        }

        return normalizedStatus;
    }

    private String generateUniqueSlug(String title, Integer releaseYear) {
        String baseSlug = generateSlug(title + "-" + releaseYear);
        String slug = baseSlug;

        int counter = 1;
        while (movieRepository.existsBySlug(slug)) {
            slug = baseSlug + "-" + counter;
            counter++;
        }

        return slug;
    }

    private String generateSlug(String value) {
        String normalized = Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");

        return normalized
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9\\s-]", "")
                .trim()
                .replaceAll("\\s+", "-");
    }
}