package com.example.movierecommendation.catalog.domain.exception;

public class CatalogMovieNotFoundException extends RuntimeException {

    public CatalogMovieNotFoundException(String message) {
        super(message);
    }
}