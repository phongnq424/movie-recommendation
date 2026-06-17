package com.example.movierecommendation.genre.dto;

import com.example.movierecommendation.genre.Genre;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
public class GenreResponse {

    private UUID publicId;

    private String name;
    private String slug;
    private String description;
    private String status;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static GenreResponse from(Genre genre) {
        return GenreResponse.builder()
                .publicId(genre.getPublicId())
                .name(genre.getName())
                .slug(genre.getSlug())
                .description(genre.getDescription())
                .status(genre.getStatus())
                .createdAt(genre.getCreatedAt())
                .updatedAt(genre.getUpdatedAt())
                .build();
    }
}