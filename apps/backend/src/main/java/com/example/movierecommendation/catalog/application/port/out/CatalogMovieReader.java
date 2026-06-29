package com.example.movierecommendation.catalog.application.port.out;

import com.example.movierecommendation.catalog.domain.model.CatalogMovie;

import java.util.Optional;
import java.util.UUID;

public interface CatalogMovieReader {

    Optional<CatalogMovie> findPublishedMovieByPublicId(UUID publicId);
}