package com.example.movierecommendation.genre;

import com.example.movierecommendation.genre.dto.GenreRequest;
import com.example.movierecommendation.genre.dto.GenreResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/genres")
@RequiredArgsConstructor
@CrossOrigin("*")
public class GenreController {

    private final GenreService genreService;

    @GetMapping
    public List<GenreResponse> getAllGenres() {
        return genreService.getAllGenres();
    }

    @GetMapping("/active")
    public List<GenreResponse> getActiveGenres() {
        return genreService.getActiveGenres();
    }

    @GetMapping("/{id}")
    public GenreResponse getGenreById(@PathVariable Long id) {
        return genreService.getGenreById(id);
    }

    @GetMapping("/search")
    public List<GenreResponse> searchGenres(@RequestParam String keyword) {
        return genreService.searchGenres(keyword);
    }

    @PostMapping
    public GenreResponse createGenre(@Valid @RequestBody GenreRequest request) {
        return genreService.createGenre(request);
    }

    @PutMapping("/{id}")
    public GenreResponse updateGenre(
            @PathVariable Long id,
            @Valid @RequestBody GenreRequest request
    ) {
        return genreService.updateGenre(id, request);
    }

    @PutMapping("/{id}/status")
    public GenreResponse updateGenreStatus(
            @PathVariable Long id,
            @RequestParam String status
    ) {
        return genreService.updateGenreStatus(id, status);
    }

    @DeleteMapping("/{id}")
    public String deleteGenre(@PathVariable Long id) {
        genreService.deleteGenre(id);
        return "Genre deleted successfully";
    }
}