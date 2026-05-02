package com.example.movierecommendation.movie;

import com.example.movierecommendation.movie.dto.BulkMovieDeleteRequest;
import com.example.movierecommendation.movie.dto.MovieDetailResponse;
import com.example.movierecommendation.movie.dto.MovieRequest;
import com.example.movierecommendation.movie.dto.MovieResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/movies")
@RequiredArgsConstructor
@CrossOrigin("*")
public class MovieController {

    private final MovieService movieService;

    @GetMapping
    public List<MovieResponse> getAllMovies() {
        return movieService.getAllMovies();
    }

    @GetMapping("/published")
    public List<MovieResponse> getPublishedMovies() {
        return movieService.getPublishedMovies();
    }

    @GetMapping("/search")
    public List<MovieResponse> searchMovies(@RequestParam String keyword) {
        return movieService.searchMovies(keyword);
    }

    @GetMapping("/slug/{slug}")
    public MovieResponse getMovieBySlug(@PathVariable String slug) {
        return movieService.getMovieBySlug(slug);
    }

    @GetMapping("/slug/{slug}/detail")
    public MovieDetailResponse getMovieDetailBySlug(@PathVariable String slug) {
        return movieService.getMovieDetailBySlug(slug);
    }

    @GetMapping("/{publicId}")
    public MovieResponse getMovieByPublicId(@PathVariable UUID publicId) {
        return movieService.getMovieByPublicId(publicId);
    }

    @GetMapping("/{publicId}/detail")
    public MovieDetailResponse getMovieDetailByPublicId(@PathVariable UUID publicId) {
        return movieService.getMovieDetailByPublicId(publicId);
    }

    @PostMapping
    public MovieResponse createMovie(@Valid @RequestBody MovieRequest request) {
        return movieService.createMovie(request);
    }

    @PostMapping("/bulk")
    public List<MovieResponse> createMovies(
            @Valid @RequestBody List<MovieRequest> requests
    ) {
        return movieService.createMovies(requests);
    }

    @PutMapping("/{publicId}")
    public MovieResponse updateMovie(
            @PathVariable UUID publicId,
            @Valid @RequestBody MovieRequest request
    ) {
        return movieService.updateMovie(publicId, request);
    }

    @PutMapping("/{publicId}/status")
    public MovieResponse updateMovieStatus(
            @PathVariable UUID publicId,
            @RequestParam String status
    ) {
        return movieService.updateMovieStatus(publicId, status);
    }

    @DeleteMapping("/{publicId}")
    public MovieResponse deleteMovie(@PathVariable UUID publicId) {
        return movieService.deleteMovie(publicId);
    }

    @PostMapping("/bulk-delete")
    public List<MovieResponse> deleteMovies(
            @Valid @RequestBody BulkMovieDeleteRequest request
    ) {
        return movieService.deleteMovies(request.getPublicIds());
    }
}