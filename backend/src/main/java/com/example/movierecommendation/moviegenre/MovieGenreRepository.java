package com.example.movierecommendation.moviegenre;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MovieGenreRepository extends JpaRepository<MovieGenre, Long> {

    List<MovieGenre> findByMovieId(Long movieId);

    List<MovieGenre> findByGenreId(Long genreId);

    Optional<MovieGenre> findByMovieIdAndGenreId(Long movieId, Long genreId);

    boolean existsByMovieIdAndGenreId(Long movieId, Long genreId);

    void deleteByMovieIdAndGenreId(Long movieId, Long genreId);

    void deleteByMovieId(Long movieId);
}