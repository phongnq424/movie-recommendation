package com.example.movierecommendation.moviegenre.dto;

import com.example.movierecommendation.moviegenre.MovieGenre;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@Builder
public class MovieGenreResponse {

    private UUID moviePublicId;
    private String movieTitle;
    private String movieSlug;

    private UUID genrePublicId;
    private String genreName;
    private String genreSlug;

    public static MovieGenreResponse from(MovieGenre movieGenre) {
        return MovieGenreResponse.builder()
                .moviePublicId(movieGenre.getMovie().getPublicId())
                .movieTitle(movieGenre.getMovie().getTitle())
                .movieSlug(movieGenre.getMovie().getSlug())
                .genrePublicId(movieGenre.getGenre().getPublicId())
                .genreName(movieGenre.getGenre().getName())
                .genreSlug(movieGenre.getGenre().getSlug())
                .build();
    }
}