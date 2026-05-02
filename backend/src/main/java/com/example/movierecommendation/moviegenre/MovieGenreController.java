package com.example.movierecommendation.moviegenre;

import com.example.movierecommendation.moviegenre.dto.MovieGenreRequest;
import com.example.movierecommendation.moviegenre.dto.MovieGenreResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/movie-genres")
@RequiredArgsConstructor
@CrossOrigin("*")
public class MovieGenreController {

    private final MovieGenreService movieGenreService;

    @PostMapping
    public MovieGenreResponse addGenreToMovie(
            @Valid @RequestBody MovieGenreRequest request
    ) {
        return movieGenreService.addGenreToMovie(request);
    }

    @GetMapping("/movie/{movieId}")
    public List<MovieGenreResponse> getGenresByMovie(@PathVariable Long movieId) {
        return movieGenreService.getGenresByMovie(movieId);
    }

    @GetMapping("/genre/{genreId}")
    public List<MovieGenreResponse> getMoviesByGenre(@PathVariable Long genreId) {
        return movieGenreService.getMoviesByGenre(genreId);
    }

    @DeleteMapping("/{id}")
    public String removeGenreFromMovie(@PathVariable Long id) {
        movieGenreService.removeGenreFromMovie(id);
        return "Genre removed from movie successfully";
    }

    @DeleteMapping("/movie/{movieId}/genre/{genreId}")
    public String removeGenreFromMovie(
            @PathVariable Long movieId,
            @PathVariable Long genreId
    ) {
        movieGenreService.removeGenreFromMovie(movieId, genreId);
        return "Genre removed from movie successfully";
    }
}