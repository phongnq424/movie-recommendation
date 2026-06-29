package com.example.movierecommendation.catalog.adapter.in.web;

import com.example.movierecommendation.catalog.domain.exception.CatalogMovieNotFoundException;
import com.example.movierecommendation.catalog.domain.exception.TextEmbeddingException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.client.RestClientException;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice(basePackages = "com.example.movierecommendation.catalog")
public class CatalogExceptionHandler {

    @ExceptionHandler(CatalogMovieNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleMovieNotFound(CatalogMovieNotFoundException exception) {
        return error(HttpStatus.NOT_FOUND, exception.getMessage());
    }

    @ExceptionHandler({
            IllegalArgumentException.class,
            MethodArgumentNotValidException.class
    })
    public ResponseEntity<Map<String, Object>> handleBadRequest(Exception exception) {
        return error(HttpStatus.BAD_REQUEST, resolveValidationMessage(exception));
    }

    @ExceptionHandler({
            TextEmbeddingException.class,
            RestClientException.class
    })
    public ResponseEntity<Map<String, Object>> handleEmbeddingError(Exception exception) {
        return error(HttpStatus.BAD_GATEWAY, exception.getMessage());
    }

    private ResponseEntity<Map<String, Object>> error(HttpStatus status, String message) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", status.value());
        body.put("error", status.getReasonPhrase());
        body.put("message", message);

        return ResponseEntity.status(status).body(body);
    }

    private String resolveValidationMessage(Exception exception) {
        if (exception instanceof MethodArgumentNotValidException validationException) {
            return validationException.getBindingResult()
                    .getFieldErrors()
                    .stream()
                    .findFirst()
                    .map(error -> error.getField() + ": " + error.getDefaultMessage())
                    .orElse("Invalid request");
        }

        return exception.getMessage() == null ? "Invalid request" : exception.getMessage();
    }
}