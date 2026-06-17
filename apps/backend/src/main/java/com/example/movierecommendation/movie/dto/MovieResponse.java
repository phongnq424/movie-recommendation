package com.example.movierecommendation.movie.dto;

import com.example.movierecommendation.movie.Movie;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@Builder
public class MovieResponse {

    private UUID publicId;
    private String title;
    private String originalTitle;
    private String slug;
    private String description;
    private Integer releaseYear;
    private Integer durationMinutes;
    private String posterUrl;
    private String backdropUrl;
    private String trailerUrl;
    private String movieUrl;
    private String quality;
    private String ageRating;
    private String status;
    private Double averageRating;
    private Integer ratingCount;
    private Long viewCount;

    public static MovieResponse from(Movie movie) {
        return MovieResponse.builder()
                .publicId(movie.getPublicId())
                .title(movie.getTitle())
                .originalTitle(movie.getOriginalTitle())
                .slug(movie.getSlug())
                .description(movie.getDescription())
                .releaseYear(movie.getReleaseYear())
                .durationMinutes(movie.getDurationMinutes())
                .posterUrl(movie.getPosterUrl())
                .backdropUrl(movie.getBackdropUrl())
                .trailerUrl(movie.getTrailerUrl())
                .movieUrl(movie.getMovieUrl())
                .quality(movie.getQuality())
                .ageRating(movie.getAgeRating())
                .status(movie.getStatus())
                .averageRating(movie.getAverageRating())
                .ratingCount(movie.getRatingCount())
                .viewCount(movie.getViewCount())
                .build();
    }
}