package com.example.movierecommendation.movie.dto;

import com.example.movierecommendation.movie.Movie;
import com.example.movierecommendation.movieactor.dto.MovieActorResponse;
import com.example.movierecommendation.moviegenre.dto.MovieGenreResponse;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
public class MovieDetailResponse {

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

    private List<MovieActorResponse> actors;
    private List<MovieGenreResponse> genres;

    public static MovieDetailResponse from(
            Movie movie,
            List<MovieActorResponse> actors,
            List<MovieGenreResponse> genres
    ) {
        return MovieDetailResponse.builder()
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
                .actors(actors)
                .genres(genres)
                .build();
    }
}