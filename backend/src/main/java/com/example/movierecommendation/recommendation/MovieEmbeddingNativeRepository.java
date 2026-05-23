package com.example.movierecommendation.recommendation;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Repository
public class MovieEmbeddingNativeRepository {

    @PersistenceContext
    private EntityManager entityManager;

    @Transactional
    public void upsertMovieEmbedding(Long movieId, String embedding) {
        Query query = entityManager.createNativeQuery("""
                insert into movie_embeddings (movie_id, embedding, updated_at)
                values (:movieId, cast(:embedding as vector), now())
                on conflict (movie_id)
                do update set
                    embedding = excluded.embedding,
                    updated_at = now()
                """);

        query.setParameter("movieId", movieId);
        query.setParameter("embedding", embedding);
        query.executeUpdate();
    }

    public Map<Long, String> findEmbeddingTextByMovieIds(List<Long> movieIds) {
        if (movieIds == null || movieIds.isEmpty()) {
            return Map.of();
        }

        Query query = entityManager.createNativeQuery("""
                select movie_id, embedding::text
                from movie_embeddings
                where movie_id in (:movieIds)
                """);

        query.setParameter("movieIds", movieIds);

        List<Object[]> rows = query.getResultList();
        Map<Long, String> result = new HashMap<>();

        for (Object[] row : rows) {
            Long movieId = ((Number) row[0]).longValue();
            String embedding = (String) row[1];
            result.put(movieId, embedding);
        }

        return result;
    }

    public List<Long> findNearestMovieIds(
            String userEmbedding,
            List<Long> excludedMovieIds,
            int limit
    ) {
        String excludedCondition = "";

        if (excludedMovieIds != null && !excludedMovieIds.isEmpty()) {
            excludedCondition = " and m.id not in (:excludedMovieIds) ";
        }

        String sql = """
            select m.id
            from movie_embeddings me
            join movies m on m.id = me.movie_id
            where m.status = 'PUBLISHED'
            """ + excludedCondition + """
            order by me.embedding <=> cast(:userEmbedding as vector)
            limit :limit
            """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("userEmbedding", userEmbedding);
        query.setParameter("limit", limit);

        if (excludedMovieIds != null && !excludedMovieIds.isEmpty()) {
            query.setParameter("excludedMovieIds", excludedMovieIds);
        }

        List<Object> rows = query.getResultList();
        List<Long> movieIds = new ArrayList<>();

        for (Object row : rows) {
            movieIds.add(((Number) row).longValue());
        }

        return movieIds;
    }

    public record VectorMovieRow(Long movieId, Double retrievalScore) {
    }

    public boolean existsByMovieId(Long movieId) {
        Query query = entityManager.createNativeQuery("""
            select count(*)
            from movie_embeddings
            where movie_id = :movieId
            """);

        query.setParameter("movieId", movieId);

        Number count = (Number) query.getSingleResult();

        return count.longValue() > 0;
    }
}