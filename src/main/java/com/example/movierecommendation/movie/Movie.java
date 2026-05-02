package com.example.movierecommendation.movie;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "movies")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Movie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(length = 2000)
    private String description;

    private Integer releaseYear;

    private String posterUrl;

    private String trailerUrl;

    private String movieUrl;

    private Double averageRating = 0.0;

    private Integer ratingCount = 0;
}