package com.example.movierecommendation.genre;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GenreRepository extends JpaRepository<Genre, Long> {

    List<Genre> findByNameContainingIgnoreCase(String keyword);

    List<Genre> findByStatus(String status);

    Optional<Genre> findByNameIgnoreCase(String name);

    Optional<Genre> findBySlug(String slug);

    boolean existsByNameIgnoreCase(String name);

    boolean existsBySlug(String slug);
}