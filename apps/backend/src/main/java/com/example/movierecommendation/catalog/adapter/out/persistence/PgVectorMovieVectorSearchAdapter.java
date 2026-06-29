package com.example.movierecommendation.catalog.adapter.out.persistence;

import com.example.movierecommendation.catalog.application.port.out.MovieVectorSearchPort;
import com.example.movierecommendation.catalog.domain.model.CatalogMovie;
import com.example.movierecommendation.catalog.domain.model.EmbeddingVector;
import com.example.movierecommendation.catalog.domain.model.MovieSemanticSearchResult;
import com.example.movierecommendation.catalog.domain.model.MovieStatus;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Repository
public class PgVectorMovieVectorSearchAdapter implements MovieVectorSearchPort {

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public List<MovieSemanticSearchResult> findSimilarMoviesByMovieId(Long movieId, int limit) {
        Query query = entityManager.createNativeQuery("""
            SELECT
                m.id,
                m.public_id,
                m.title,
                m.slug,
                m.poster_url,
                m.release_year,
                m.average_rating,
                m.rating_count,
                m.view_count,
                m.status,
                LEAST(
                    1.0,
                    GREATEST(
                        0.0,
                        1.0 - (candidate.embedding <=> target.embedding)
                    )
                ) AS similarity
            FROM movie_content_embeddings target
            JOIN movie_content_embeddings candidate
                ON candidate.movie_id <> target.movie_id
            JOIN movies m
                ON m.id = candidate.movie_id
            WHERE target.movie_id = :movieId
              AND m.status = 'PUBLISHED'
            ORDER BY candidate.embedding <=> target.embedding
        """);

        query.setParameter("movieId", movieId);
        query.setMaxResults(limit);

        return mapRows(query.getResultList());
    }

    @Override
    public List<MovieSemanticSearchResult> searchMoviesByVector(
            EmbeddingVector embeddingVector,
            int limit
    ) {
        String pgVector = PgVectorFormatter.format(embeddingVector);

        Query query = entityManager.createNativeQuery("""
            SELECT
                m.id,
                m.public_id,
                m.title,
                m.slug,
                m.poster_url,
                m.release_year,
                m.average_rating,
                m.rating_count,
                m.view_count,
                m.status,
                LEAST(
                    1.0,
                    GREATEST(
                        0.0,
                        1.0 - (mce.embedding <=> CAST(:queryVector AS vector))
                    )
                ) AS similarity
            FROM movie_content_embeddings mce
            JOIN movies m
                ON m.id = mce.movie_id
            WHERE m.status = 'PUBLISHED'
            ORDER BY mce.embedding <=> CAST(:queryVector AS vector)
        """);

        query.setParameter("queryVector", pgVector);
        query.setMaxResults(limit);

        return mapRows(query.getResultList());
    }

    private List<MovieSemanticSearchResult> mapRows(List<?> rows) {
        List<MovieSemanticSearchResult> results = new ArrayList<>();

        for (Object row : rows) {
            Object[] columns = (Object[]) row;

            CatalogMovie movie = new CatalogMovie(
                    toLong(columns[0]),
                    toUuid(columns[1]),
                    toStringOrNull(columns[2]),
                    toStringOrNull(columns[3]),
                    toStringOrNull(columns[4]),
                    toInteger(columns[5]),
                    toDouble(columns[6]),
                    toInteger(columns[7]),
                    toLong(columns[8]),
                    MovieStatus.from(toStringOrNull(columns[9]))
            );

            double similarity = toDouble(columns[10]) == null ? 0.0 : toDouble(columns[10]);

            results.add(new MovieSemanticSearchResult(movie, similarity));
        }

        return results;
    }

    private UUID toUuid(Object value) {
        if (value == null) {
            return null;
        }

        if (value instanceof UUID uuid) {
            return uuid;
        }

        return UUID.fromString(value.toString());
    }

    private Long toLong(Object value) {
        if (value == null) {
            return null;
        }

        return ((Number) value).longValue();
    }

    private Integer toInteger(Object value) {
        if (value == null) {
            return null;
        }

        return ((Number) value).intValue();
    }

    private Double toDouble(Object value) {
        if (value == null) {
            return null;
        }

        return ((Number) value).doubleValue();
    }

    private String toStringOrNull(Object value) {
        return value == null ? null : value.toString();
    }
}