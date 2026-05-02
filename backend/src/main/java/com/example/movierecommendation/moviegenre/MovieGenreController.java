package com.example.movierecommendation.moviegenre;

import com.example.movierecommendation.moviegenre.dto.MovieGenreRequest;
import com.example.movierecommendation.moviegenre.dto.MovieGenreResponse;
import com.example.movierecommendation.moviegenre.dto.SetMovieGenresRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

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

    @GetMapping("/movie/{moviePublicId}")
    public List<MovieGenreResponse> getGenresByMovie(
            @PathVariable UUID moviePublicId
    ) {
        return movieGenreService.getGenresByMovie(moviePublicId);
    }

    @GetMapping("/genre/{genrePublicId}")
    public List<MovieGenreResponse> getMoviesByGenre(
            @PathVariable UUID genrePublicId
    ) {
        return movieGenreService.getMoviesByGenre(genrePublicId);
    }

    @DeleteMapping("/movie/{moviePublicId}/genre/{genrePublicId}")
    public String removeGenreFromMovie(
            @PathVariable UUID moviePublicId,
            @PathVariable UUID genrePublicId
    ) {
        movieGenreService.removeGenreFromMovie(moviePublicId, genrePublicId);
        return "Genre removed from movie successfully";
    }

    /**
     * Bulk set genres cho một movie.
     * Đây là API admin nên dùng khi save form movie genres.
     */
    @PutMapping("/movie/{moviePublicId}")
    public List<MovieGenreResponse> setGenresForMovie(
            @PathVariable UUID moviePublicId,
            @Valid @RequestBody SetMovieGenresRequest request
    ) {
        return movieGenreService.setGenresForMovie(
                moviePublicId,
                request.getGenrePublicIds()
        );
    }
}