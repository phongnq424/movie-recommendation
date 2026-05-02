package com.example.movierecommendation.movie.dto;

import com.example.movierecommendation.movie.Movie;
import com.example.movierecommendation.movieactor.dto.MovieActorResponse;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
public class MovieDetailResponse {

    private Long id;
    private String title;
    private String description;
    private Integer releaseYear;
    private String posterUrl;
    private String trailerUrl;
    private String movieUrl;
    private Double averageRating;
    private Integer ratingCount;

    private List<MovieActorResponse> actors;

    public static MovieDetailResponse from(Movie movie, List<MovieActorResponse> actors) {
        return MovieDetailResponse.builder()
                .id(movie.getId())
                .title(movie.getTitle())
                .description(movie.getDescription())
                .releaseYear(movie.getReleaseYear())
                .posterUrl(movie.getPosterUrl())
                .trailerUrl(movie.getTrailerUrl())
                .movieUrl(movie.getMovieUrl())
                .averageRating(movie.getAverageRating())
                .ratingCount(movie.getRatingCount())
                .actors(actors)
                .build();
    }
}