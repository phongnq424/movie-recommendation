package com.example.movierecommendation.genre.dto;

import com.example.movierecommendation.genre.Genre;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class GenreResponse {

    private Long id;
    private String name;
    private String slug;
    private String description;
    private String status;

    public static GenreResponse from(Genre genre) {
        return GenreResponse.builder()
                .id(genre.getId())
                .name(genre.getName())
                .slug(genre.getSlug())
                .description(genre.getDescription())
                .status(genre.getStatus())
                .build();
    }
}