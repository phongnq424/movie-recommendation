package com.example.movierecommendation.genre;

import com.example.movierecommendation.genre.dto.GenreRequest;
import com.example.movierecommendation.genre.dto.GenreResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class GenreService {

    private static final String STATUS_ACTIVE = "ACTIVE";
    private static final String STATUS_INACTIVE = "INACTIVE";

    private final GenreRepository genreRepository;

    public List<GenreResponse> getAllGenres() {
        return genreRepository.findAll()
                .stream()
                .map(GenreResponse::from)
                .toList();
    }

    public GenreResponse getGenreById(Long id) {
        Genre genre = getGenreEntityById(id);
        return GenreResponse.from(genre);
    }

    public List<GenreResponse> searchGenres(String keyword) {
        return genreRepository.findByNameContainingIgnoreCase(keyword)
                .stream()
                .map(GenreResponse::from)
                .toList();
    }

    public List<GenreResponse> getActiveGenres() {
        return genreRepository.findByStatus(STATUS_ACTIVE)
                .stream()
                .map(GenreResponse::from)
                .toList();
    }

    public GenreResponse createGenre(GenreRequest request) {
        validateGenreRequest(request);

        String name = request.getName().trim();
        String slug = generateSlug(name);

        if (genreRepository.existsByNameIgnoreCase(name)) {
            throw new RuntimeException("Genre name already exists");
        }

        if (genreRepository.existsBySlug(slug)) {
            throw new RuntimeException("Genre slug already exists");
        }

        String status = normalizeStatus(request.getStatus());

        Genre genre = Genre.builder()
                .name(name)
                .slug(slug)
                .description(request.getDescription())
                .status(status)
                .build();

        return GenreResponse.from(genreRepository.save(genre));
    }

    public GenreResponse updateGenre(Long id, GenreRequest request) {
        validateGenreRequest(request);

        Genre genre = getGenreEntityById(id);

        String name = request.getName().trim();
        String slug = generateSlug(name);

        genreRepository.findByNameIgnoreCase(name)
                .ifPresent(existingGenre -> {
                    if (!existingGenre.getId().equals(id)) {
                        throw new RuntimeException("Genre name already exists");
                    }
                });

        genreRepository.findBySlug(slug)
                .ifPresent(existingGenre -> {
                    if (!existingGenre.getId().equals(id)) {
                        throw new RuntimeException("Genre slug already exists");
                    }
                });

        genre.setName(name);
        genre.setSlug(slug);
        genre.setDescription(request.getDescription());
        genre.setStatus(normalizeStatus(request.getStatus()));

        return GenreResponse.from(genreRepository.save(genre));
    }

    public GenreResponse updateGenreStatus(Long id, String status) {
        Genre genre = getGenreEntityById(id);

        genre.setStatus(normalizeStatus(status));

        return GenreResponse.from(genreRepository.save(genre));
    }

    public void deleteGenre(Long id) {
        Genre genre = getGenreEntityById(id);
        genreRepository.delete(genre);
    }

    public Genre getGenreEntityById(Long id) {
        return genreRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Genre not found"));
    }

    private void validateGenreRequest(GenreRequest request) {
        if (request.getName() == null || request.getName().isBlank()) {
            throw new RuntimeException("Genre name is required");
        }
    }

    private String normalizeStatus(String status) {
        if (status == null || status.isBlank()) {
            return STATUS_ACTIVE;
        }

        String normalizedStatus = status.trim().toUpperCase();

        if (!normalizedStatus.equals(STATUS_ACTIVE)
                && !normalizedStatus.equals(STATUS_INACTIVE)) {
            throw new RuntimeException("Genre status must be ACTIVE or INACTIVE");
        }

        return normalizedStatus;
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