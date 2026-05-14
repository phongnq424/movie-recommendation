package com.example.movierecommendation.moviegenre;

import com.example.movierecommendation.moviegenre.dto.MovieGenreRequest;
import com.example.movierecommendation.moviegenre.dto.MovieGenreResponse;
import com.example.movierecommendation.moviegenre.dto.SetMovieGenresRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/movie-genres")
@RequiredArgsConstructor
@CrossOrigin("*")
public class MovieGenreController {

    private final MovieGenreService movieGenreService;

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public MovieGenreResponse addGenreToMovie(
            @Valid @RequestBody MovieGenreRequest request
    ) {
        return movieGenreService.addGenreToMovie(request);
    }

    /**
     * Public API: lấy genres của một phim.
     */
    @GetMapping("/movie/{moviePublicId}")
    public List<MovieGenreResponse> getGenresByMovie(
            @PathVariable UUID moviePublicId
    ) {
        return movieGenreService.getGenresByMovie(moviePublicId);
    }

    /**
     * Public API: lấy phim theo genre.
     */
    @GetMapping("/genre/{genrePublicId}")
    public List<MovieGenreResponse> getMoviesByGenre(
            @PathVariable UUID genrePublicId
    ) {
        return movieGenreService.getMoviesByGenre(genrePublicId);
    }

    /**
     * Admin API: remove genre khỏi movie.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/movie/{moviePublicId}/genre/{genrePublicId}")
    public String removeGenreFromMovie(
            @PathVariable UUID moviePublicId,
            @PathVariable UUID genrePublicId
    ) {
        movieGenreService.removeGenreFromMovie(moviePublicId, genrePublicId);
        return "Genre removed from movie successfully";
    }

    /**
     * Admin API: bulk set genres cho một movie.
     */
    @PreAuthorize("hasRole('ADMIN')")
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