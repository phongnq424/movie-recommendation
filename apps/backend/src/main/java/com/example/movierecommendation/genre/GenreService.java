package com.example.movierecommendation.genre;

import com.example.movierecommendation.genre.dto.GenreRequest;
import com.example.movierecommendation.genre.dto.GenreResponse;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GenreService {

    private static final String STATUS_ACTIVE = "ACTIVE";
    private static final String STATUS_INACTIVE = "INACTIVE";
    private static final String STATUS_DELETED = "DELETED";

    private final GenreRepository genreRepository;

    public List<GenreResponse> getAllGenres() {
        return genreRepository.findAll()
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

    public GenreResponse getGenreByPublicId(UUID publicId) {
        Genre genre = getGenreEntityByPublicId(publicId);
        return GenreResponse.from(genre);
    }

    public List<GenreResponse> searchGenres(String keyword) {
        return genreRepository.findByNameContainingIgnoreCase(keyword)
                .stream()
                .map(GenreResponse::from)
                .toList();
    }

    public GenreResponse createGenre(GenreRequest request) {
        return createGenres(List.of(request)).get(0);
    }

    @Transactional
    public List<GenreResponse> createGenres(List<GenreRequest> requests) {
        if (requests == null || requests.isEmpty()) {
            throw new RuntimeException("Genre list is required");
        }

        List<Genre> genres = requests.stream()
                .map(request -> {
                    validateGenreRequest(request);

                    String name = request.getName().trim();
                    String slug = generateSlug(name);

                    if (genreRepository.existsByNameIgnoreCase(name)) {
                        throw new RuntimeException("Genre name already exists: " + name);
                    }

                    if (genreRepository.existsBySlug(slug)) {
                        throw new RuntimeException("Genre slug already exists: " + slug);
                    }

                    return Genre.builder()
                            .name(name)
                            .slug(slug)
                            .description(request.getDescription())
                            .status(normalizeStatus(request.getStatus()))
                            .build();
                })
                .toList();

        return genreRepository.saveAll(genres)
                .stream()
                .map(GenreResponse::from)
                .toList();
    }

    public GenreResponse updateGenre(UUID publicId, GenreRequest request) {
        validateGenreRequest(request);

        Genre genre = getGenreEntityByPublicId(publicId);

        String name = request.getName().trim();
        String slug = generateSlug(name);

        genreRepository.findByNameIgnoreCase(name)
                .ifPresent(existingGenre -> {
                    if (!existingGenre.getPublicId().equals(publicId)) {
                        throw new RuntimeException("Genre name already exists");
                    }
                });

        genreRepository.findBySlug(slug)
                .ifPresent(existingGenre -> {
                    if (!existingGenre.getPublicId().equals(publicId)) {
                        throw new RuntimeException("Genre slug already exists");
                    }
                });

        genre.setName(name);
        genre.setSlug(slug);
        genre.setDescription(request.getDescription());

        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            genre.setStatus(normalizeStatus(request.getStatus()));
        }

        return GenreResponse.from(genreRepository.save(genre));
    }

    public GenreResponse updateGenreStatus(UUID publicId, String status) {
        Genre genre = getGenreEntityByPublicId(publicId);

        genre.setStatus(normalizeStatus(status));

        return GenreResponse.from(genreRepository.save(genre));
    }

    /**
     * Xóa mềm 1 genre.
     * Không hard delete để không làm vỡ MovieGenre.
     */
    public GenreResponse deleteGenre(UUID publicId) {
        Genre genre = getGenreEntityByPublicId(publicId);

        genre.setStatus(STATUS_DELETED);

        return GenreResponse.from(genreRepository.save(genre));
    }

    /**
     * Xóa mềm nhiều genre.
     * Nếu thiếu bất kỳ publicId nào thì rollback toàn bộ.
     */
    @Transactional
    public List<GenreResponse> deleteGenres(List<UUID> publicIds) {
        validatePublicIds(publicIds);

        List<Genre> genres = genreRepository.findAllByPublicIdIn(publicIds);

        if (genres.size() != publicIds.size()) {
            throw new RuntimeException("Some genres were not found");
        }

        genres.forEach(genre -> genre.setStatus(STATUS_DELETED));

        return genreRepository.saveAll(genres)
                .stream()
                .map(GenreResponse::from)
                .toList();
    }

    public Genre getGenreEntityByPublicId(UUID publicId) {
        if (publicId == null) {
            throw new RuntimeException("Genre public ID is required");
        }

        return genreRepository.findByPublicId(publicId)
                .orElseThrow(() -> new RuntimeException("Genre not found"));
    }

    private void validateGenreRequest(GenreRequest request) {
        if (request == null) {
            throw new RuntimeException("Genre request is required");
        }

        if (request.getName() == null || request.getName().isBlank()) {
            throw new RuntimeException("Genre name is required");
        }
    }

    private void validatePublicIds(List<UUID> publicIds) {
        if (publicIds == null || publicIds.isEmpty()) {
            throw new RuntimeException("Genre public IDs are required");
        }
    }

    private String normalizeStatus(String status) {
        if (status == null || status.isBlank()) {
            return STATUS_ACTIVE;
        }

        String normalizedStatus = status.trim().toUpperCase();

        if (!normalizedStatus.equals(STATUS_ACTIVE)
                && !normalizedStatus.equals(STATUS_INACTIVE)
                && !normalizedStatus.equals(STATUS_DELETED)) {
            throw new RuntimeException("Genre status must be ACTIVE, INACTIVE, or DELETED");
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