package com.example.movierecommendation.genre;

import com.example.movierecommendation.genre.dto.BulkGenreDeleteRequest;
import com.example.movierecommendation.genre.dto.GenreRequest;
import com.example.movierecommendation.genre.dto.GenreResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

import static com.example.movierecommendation.rbac.PermissionCode.*;


@RestController
@RequestMapping("/api/genres")
@RequiredArgsConstructor
public class GenreController {

    private final GenreService genreService;

    @PreAuthorize("hasAuthority('" + GENRE_READ_ADMIN + "')")
    @GetMapping
    public List<GenreResponse> getAllGenres() {
        return genreService.getAllGenres();
    }

    /**
     * Public API for frontend movie browsing/filtering.
     */
    @GetMapping("/active")
    public List<GenreResponse> getActiveGenres() {
        return genreService.getActiveGenres();
    }

    @PreAuthorize("hasAuthority('" + GENRE_READ_ADMIN + "')")
    @GetMapping("/search")
    public List<GenreResponse> searchGenres(@RequestParam String keyword) {
        return genreService.searchGenres(keyword);
    }

    @PreAuthorize("hasAuthority('" + GENRE_READ_ADMIN + "')")
    @GetMapping("/{publicId}")
    public GenreResponse getGenreByPublicId(@PathVariable UUID publicId) {
        return genreService.getGenreByPublicId(publicId);
    }

    @PreAuthorize("hasAuthority('" + GENRE_CREATE + "')")
    @PostMapping
    public GenreResponse createGenre(@Valid @RequestBody GenreRequest request) {
        return genreService.createGenre(request);
    }

    @PreAuthorize("hasAuthority('" + GENRE_CREATE + "')")
    @PostMapping("/bulk")
    public List<GenreResponse> createGenres(
            @Valid @RequestBody List<GenreRequest> requests
    ) {
        return genreService.createGenres(requests);
    }

    @PreAuthorize("hasAuthority('" + GENRE_UPDATE + "')")
    @PutMapping("/{publicId}")
    public GenreResponse updateGenre(
            @PathVariable UUID publicId,
            @Valid @RequestBody GenreRequest request
    ) {
        return genreService.updateGenre(publicId, request);
    }

    @PreAuthorize("hasAuthority('" + GENRE_CHANGE_STATUS + "')")
    @PutMapping("/{publicId}/status")
    public GenreResponse updateGenreStatus(
            @PathVariable UUID publicId,
            @RequestParam String status
    ) {
        return genreService.updateGenreStatus(publicId, status);
    }

    @PreAuthorize("hasAuthority('" + GENRE_DELETE + "')")
    @DeleteMapping("/{publicId}")
    public GenreResponse deleteGenre(@PathVariable UUID publicId) {
        return genreService.deleteGenre(publicId);
    }

    @PreAuthorize("hasAuthority('" + GENRE_DELETE + "')")
    @PostMapping("/bulk-delete")
    public List<GenreResponse> deleteGenres(
            @Valid @RequestBody BulkGenreDeleteRequest request
    ) {
        return genreService.deleteGenres(request.getPublicIds());
    }
}