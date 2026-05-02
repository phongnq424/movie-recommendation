package com.example.movierecommendation.genre;

import com.example.movierecommendation.genre.dto.BulkGenreDeleteRequest;
import com.example.movierecommendation.genre.dto.GenreRequest;
import com.example.movierecommendation.genre.dto.GenreResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

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

    @GetMapping("/search")
    public List<GenreResponse> searchGenres(@RequestParam String keyword) {
        return genreService.searchGenres(keyword);
    }

    @GetMapping("/{publicId}")
    public GenreResponse getGenreByPublicId(@PathVariable UUID publicId) {
        return genreService.getGenreByPublicId(publicId);
    }

    @PostMapping
    public GenreResponse createGenre(@Valid @RequestBody GenreRequest request) {
        return genreService.createGenre(request);
    }

    @PostMapping("/bulk")
    public List<GenreResponse> createGenres(
            @Valid @RequestBody List<GenreRequest> requests
    ) {
        return genreService.createGenres(requests);
    }

    @PutMapping("/{publicId}")
    public GenreResponse updateGenre(
            @PathVariable UUID publicId,
            @Valid @RequestBody GenreRequest request
    ) {
        return genreService.updateGenre(publicId, request);
    }

    @PutMapping("/{publicId}/status")
    public GenreResponse updateGenreStatus(
            @PathVariable UUID publicId,
            @RequestParam String status
    ) {
        return genreService.updateGenreStatus(publicId, status);
    }

    @DeleteMapping("/{publicId}")
    public GenreResponse deleteGenre(@PathVariable UUID publicId) {
        return genreService.deleteGenre(publicId);
    }

    @PostMapping("/bulk-delete")
    public List<GenreResponse> deleteGenres(
            @Valid @RequestBody BulkGenreDeleteRequest request
    ) {
        return genreService.deleteGenres(request.getPublicIds());
    }
}