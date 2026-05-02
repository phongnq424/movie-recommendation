package com.example.movierecommendation.movie;

import com.example.movierecommendation.movie.dto.MovieDetailResponse;
import com.example.movierecommendation.movie.dto.MovieRequest;
import com.example.movierecommendation.movie.dto.MovieResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    @GetMapping("/{id}")
    public MovieResponse getMovieById(@PathVariable Long id) {
        return movieService.getMovieById(id);
    }

    @GetMapping("/{id}/detail")
    public MovieDetailResponse getMovieDetailById(@PathVariable Long id) {
        return movieService.getMovieDetailById(id);
    }

    @GetMapping("/search")
    public List<MovieResponse> searchMovies(@RequestParam String keyword) {
        return movieService.searchMovies(keyword);
    }

    @PostMapping
    public MovieResponse createMovie(@RequestBody MovieRequest request) {
        return movieService.createMovie(request);
    }

    @PutMapping("/{id}")
    public MovieResponse updateMovie(
            @PathVariable Long id,
            @RequestBody MovieRequest request
    ) {
        return movieService.updateMovie(id, request);
    }

    @DeleteMapping("/{id}")
    public String deleteMovie(@PathVariable Long id) {
        movieService.deleteMovie(id);
        return "Movie deleted successfully";
    }
}