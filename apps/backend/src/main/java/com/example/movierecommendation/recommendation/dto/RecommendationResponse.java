package com.example.movierecommendation.recommendation.dto;

import com.example.movierecommendation.movie.Movie;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecommendationResponse {

    private UUID moviePublicId;
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

    private Double averageRating;
    private Integer ratingCount;
    private Long viewCount;

    private Double finalScore;
    private RecommendationScoreBreakdown scoreBreakdown;

    public static RecommendationResponse from(
            Movie movie,
            double finalScore,
            RecommendationScoreBreakdown breakdown
    ) {
        return RecommendationResponse.builder()
                .moviePublicId(movie.getPublicId())
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
                .averageRating(movie.getAverageRating())
                .ratingCount(movie.getRatingCount())
                .viewCount(movie.getViewCount())
                .finalScore(finalScore)
                .scoreBreakdown(breakdown)
                .build();
    }
}