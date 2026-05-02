package com.example.movierecommendation.movie.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MovieRequest {

    private String title;
    private String description;
    private Integer releaseYear;
    private String posterUrl;
    private String trailerUrl;
    private String movieUrl;
}