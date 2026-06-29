package com.example.movierecommendation.catalog.domain.exception;

public class TextEmbeddingException extends RuntimeException {

    public TextEmbeddingException(String message) {
        super(message);
    }

    public TextEmbeddingException(String message, Throwable cause) {
        super(message, cause);
    }
}