package com.example.movierecommendation.moviegenre;

import com.example.movierecommendation.movie.Movie;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Pageable;


import java.util.List;
import java.util.Optional;

public interface MovieGenreRepository extends JpaRepository<MovieGenre, Long> {

    List<MovieGenre> findByMovieId(Long movieId);

    List<MovieGenre> findByGenreId(Long genreId);

    Optional<MovieGenre> findByMovieIdAndGenreId(Long movieId, Long genreId);

    boolean existsByMovieIdAndGenreId(Long movieId, Long genreId);

    void deleteByMovieIdAndGenreId(Long movieId, Long genreId);

    void deleteByMovieId(Long movieId);
    @Query("""
        SELECT mg
        FROM MovieGenre mg
        WHERE mg.movie.id IN :movieIds
    """)
    List<MovieGenre> findByMovieIds(@Param("movieIds") List<Long> movieIds);

    @Query("""
        SELECT DISTINCT mg.movie
        FROM MovieGenre mg
        WHERE mg.genre.id IN :genreIds
          AND mg.movie.status = 'PUBLISHED'
        ORDER BY
            mg.movie.averageRating DESC,
            mg.movie.ratingCount DESC
    """)
    List<Movie> findPublishedMoviesByGenreIds(
            @Param("genreIds") List<Long> genreIds,
            Pageable pageable
    );
    @Query("""
        select movieGenre.genre.id, count(distinct movieGenre.movie.id)
        from MovieGenre movieGenre
        where movieGenre.movie.status = :status
        group by movieGenre.genre.id
        """)
    List<Object[]> countPublishedMoviesByGenre(@Param("status") String status);
}