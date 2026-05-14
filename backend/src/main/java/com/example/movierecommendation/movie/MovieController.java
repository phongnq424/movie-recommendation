package com.example.movierecommendation.movie;

import com.example.movierecommendation.movie.dto.BulkMovieDeleteRequest;
import com.example.movierecommendation.movie.dto.MovieDetailResponse;
import com.example.movierecommendation.movie.dto.MovieRequest;
import com.example.movierecommendation.movie.dto.MovieResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/movies")
@RequiredArgsConstructor
@CrossOrigin("*")
public class MovieController {

    private final MovieService movieService;

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public List<MovieResponse> getAllMovies() {
        return movieService.getAllMovies();
    }

    /**
     * Public API for homepage/movie listing.
     */
    @GetMapping("/published")
    public List<MovieResponse> getPublishedMovies() {
        return movieService.getPublishedMovies();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/search")
    public List<MovieResponse> searchMovies(@RequestParam String keyword) {
        return movieService.searchMovies(keyword);
    }

    /**
     * Public API for movie detail page.
     */
    @GetMapping("/slug/{slug}")
    public MovieResponse getMovieBySlug(@PathVariable String slug) {
        return movieService.getMovieBySlug(slug);
    }

    /**
     * Public API for movie detail page with cast/genres.
     */
    @GetMapping("/slug/{slug}/detail")
    public MovieDetailResponse getMovieDetailBySlug(@PathVariable String slug) {
        return movieService.getMovieDetailBySlug(slug);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{publicId}")
    public MovieResponse getMovieByPublicId(@PathVariable UUID publicId) {
        return movieService.getMovieByPublicId(publicId);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{publicId}/detail")
    public MovieDetailResponse getMovieDetailByPublicId(@PathVariable UUID publicId) {
        return movieService.getMovieDetailByPublicId(publicId);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public MovieResponse createMovie(@Valid @RequestBody MovieRequest request) {
        return movieService.createMovie(request);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/bulk")
    public List<MovieResponse> createMovies(
            @Valid @RequestBody List<MovieRequest> requests
    ) {
        return movieService.createMovies(requests);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{publicId}")
    public MovieResponse updateMovie(
            @PathVariable UUID publicId,
            @Valid @RequestBody MovieRequest request
    ) {
        return movieService.updateMovie(publicId, request);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{publicId}/status")
    public MovieResponse updateMovieStatus(
            @PathVariable UUID publicId,
            @RequestParam String status
    ) {
        return movieService.updateMovieStatus(publicId, status);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{publicId}")
    public MovieResponse deleteMovie(@PathVariable UUID publicId) {
        return movieService.deleteMovie(publicId);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/bulk-delete")
    public List<MovieResponse> deleteMovies(
            @Valid @RequestBody BulkMovieDeleteRequest request
    ) {
        return movieService.deleteMovies(request.getPublicIds());
    }
    @PostMapping("/{publicId}/view")
    public MovieResponse increaseViewCount(@PathVariable UUID publicId) {
        return movieService.increaseViewCount(publicId);
    }
}