package com.example.movierecommendation.moviegenre.dto;

import com.example.movierecommendation.moviegenre.MovieGenre;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class MovieGenreResponse {

    private Long id;

    private Long movieId;
    private String movieTitle;

    private Long genreId;
    private String genreName;
    private String genreSlug;

    public static MovieGenreResponse from(MovieGenre movieGenre) {
        return MovieGenreResponse.builder()
                .id(movieGenre.getId())
                .movieId(movieGenre.getMovie().getId())
                .movieTitle(movieGenre.getMovie().getTitle())
                .genreId(movieGenre.getGenre().getId())
                .genreName(movieGenre.getGenre().getName())
                .genreSlug(movieGenre.getGenre().getSlug())
                .build();
    }
}