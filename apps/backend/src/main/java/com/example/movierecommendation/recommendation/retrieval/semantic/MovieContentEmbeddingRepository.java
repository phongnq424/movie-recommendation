package com.example.movierecommendation.recommendation.retrieval.semantic;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Repository
public class MovieContentEmbeddingRepository {

    @PersistenceContext
    private EntityManager entityManager;

    public Map<Long, String> findEmbeddingTextsByMovieIds(List<Long> movieIds) {
        if (movieIds == null || movieIds.isEmpty()) {
            return Map.of();
        }

        Query query = entityManager.createNativeQuery("""
                select movie_id, embedding::text
                from movie_content_embeddings
                where movie_id in (:movieIds)
                """);

        query.setParameter("movieIds", movieIds);

        List<?> rows = query.getResultList();
        Map<Long, String> result = new HashMap<>();

        for (Object row : rows) {
            Object[] columns = (Object[]) row;
            Long movieId = ((Number) columns[0]).longValue();
            String embedding = (String) columns[1];

            result.put(movieId, embedding);
        }

        return result;
    }

    public List<SemanticMovieRetrievalResult> findNearestPublishedMovies(
            String userContentEmbedding,
            List<Long> excludedMovieIds,
            int limit
    ) {
        String excludedCondition = "";

        if (excludedMovieIds != null && !excludedMovieIds.isEmpty()) {
            excludedCondition = " and m.id not in (:excludedMovieIds) ";
        }

        String sql = """
                select
                    m.id as movie_id,
                    least(
                        1.0,
                        greatest(
                            0.0,
                            1.0 - (mce.embedding <=> cast(:userContentEmbedding as vector))
                        )
                    ) as semantic_content_score
                from movie_content_embeddings mce
                join movies m on m.id = mce.movie_id
                where m.status = 'PUBLISHED'
                """ + excludedCondition + """
                order by mce.embedding <=> cast(:userContentEmbedding as vector)
                limit :limit
                """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("userContentEmbedding", userContentEmbedding);
        query.setParameter("limit", limit);

        if (excludedMovieIds != null && !excludedMovieIds.isEmpty()) {
            query.setParameter("excludedMovieIds", excludedMovieIds);
        }

        List<?> rows = query.getResultList();
        List<SemanticMovieRetrievalResult> result = new ArrayList<>();

        for (Object row : rows) {
            Object[] columns = (Object[]) row;
            Long movieId = ((Number) columns[0]).longValue();
            Double semanticContentScore = ((Number) columns[1]).doubleValue();

            result.add(new SemanticMovieRetrievalResult(movieId, semanticContentScore));
        }

        return result;
    }

    @Transactional
    public void upsertMovieContentEmbedding(
            Long movieId,
            String embedding,
            String modelName,
            String contentHash
    ) {
        Query query = entityManager.createNativeQuery("""
                insert into movie_content_embeddings
                    (movie_id, embedding, model_name, content_hash, updated_at)
                values
                    (:movieId, cast(:embedding as vector), :modelName, :contentHash, now())
                on conflict (movie_id)
                do update set
                    embedding = excluded.embedding,
                    model_name = excluded.model_name,
                    content_hash = excluded.content_hash,
                    updated_at = now()
                """);

        query.setParameter("movieId", movieId);
        query.setParameter("embedding", embedding);
        query.setParameter("modelName", modelName);
        query.setParameter("contentHash", contentHash);
        query.executeUpdate();
    }
}
