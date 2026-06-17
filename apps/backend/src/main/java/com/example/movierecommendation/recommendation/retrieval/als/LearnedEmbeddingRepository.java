package com.example.movierecommendation.recommendation.retrieval.als;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Repository
public class LearnedEmbeddingRepository {

    @PersistenceContext
    private EntityManager entityManager;

    public String findUserEmbeddingText(Long userId, String modelVersion) {
        Query query = entityManager.createNativeQuery("""
                select embedding::text
                from learned_user_embeddings
                where user_id = :userId
                  and model_version = :modelVersion
                order by updated_at desc
                limit 1
                """);

        query.setParameter("userId", userId);
        query.setParameter("modelVersion", modelVersion);

        List<?> rows = query.getResultList();

        if (rows.isEmpty()) {
            return null;
        }

        return (String) rows.get(0);
    }

    public String findActiveRetrievalModelVersion() {
        Query query = entityManager.createNativeQuery("""
                select model_version
                from recommendation_model_versions
                where model_type = 'ALS_RETRIEVAL'
                  and status = 'ACTIVE'
                order by trained_at desc
                limit 1
                """);

        List<?> rows = query.getResultList();

        if (rows.isEmpty()) {
            return null;
        }

        return (String) rows.get(0);
    }

    public List<LearnedMovieRetrievalResult> findNearestMoviesWithScores(
            String userEmbedding,
            List<Long> excludedMovieIds,
            int limit,
            String modelVersion
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
                            1.0 - (me.embedding <=> cast(:userEmbedding as vector))
                        )
                    ) as retrieval_score
                from learned_movie_embeddings me
                join movies m on m.id = me.movie_id
                where m.status = 'PUBLISHED'
                  and me.model_version = :modelVersion
                """ + excludedCondition + """
                order by me.embedding <=> cast(:userEmbedding as vector)
                limit :limit
                """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("userEmbedding", userEmbedding);
        query.setParameter("modelVersion", modelVersion);
        query.setParameter("limit", limit);

        if (excludedMovieIds != null && !excludedMovieIds.isEmpty()) {
            query.setParameter("excludedMovieIds", excludedMovieIds);
        }

        List<?> rows = query.getResultList();
        List<LearnedMovieRetrievalResult> result = new ArrayList<>();

        for (Object row : rows) {
            Object[] columns = (Object[]) row;

            Long movieId = ((Number) columns[0]).longValue();
            Double retrievalScore = ((Number) columns[1]).doubleValue();

            result.add(new LearnedMovieRetrievalResult(movieId, retrievalScore));
        }

        return result;
    }

    @Transactional
    public void upsertModelVersion(
            String modelVersion,
            String modelType,
            String description,
            int factors,
            String status
    ) {
        Query query = entityManager.createNativeQuery("""
                insert into recommendation_model_versions
                    (model_version, model_type, description, factors, trained_at, status)
                values
                    (:modelVersion, :modelType, :description, :factors, now(), :status)
                on conflict (model_version)
                do update set
                    description = excluded.description,
                    factors = excluded.factors,
                    trained_at = now(),
                    status = excluded.status
                """);

        query.setParameter("modelVersion", modelVersion);
        query.setParameter("modelType", modelType);
        query.setParameter("description", description);
        query.setParameter("factors", factors);
        query.setParameter("status", status);
        query.executeUpdate();
    }

    @Transactional
    public void deactivateOldRetrievalModels(String activeVersion) {
        Query query = entityManager.createNativeQuery("""
                update recommendation_model_versions
                set status = 'INACTIVE'
                where model_type = 'ALS_RETRIEVAL'
                  and model_version <> :activeVersion
                """);

        query.setParameter("activeVersion", activeVersion);
        query.executeUpdate();
    }

    @Transactional
    public void upsertUserEmbedding(Long userId, String embedding, String modelVersion) {
        Query query = entityManager.createNativeQuery("""
                insert into learned_user_embeddings
                    (user_id, embedding, model_version, updated_at)
                values
                    (:userId, cast(:embedding as vector), :modelVersion, now())
                on conflict (user_id)
                do update set
                    embedding = excluded.embedding,
                    model_version = excluded.model_version,
                    updated_at = now()
                """);

        query.setParameter("userId", userId);
        query.setParameter("embedding", embedding);
        query.setParameter("modelVersion", modelVersion);
        query.executeUpdate();
    }

    @Transactional
    public void upsertMovieEmbedding(Long movieId, String embedding, String modelVersion) {
        Query query = entityManager.createNativeQuery("""
                insert into learned_movie_embeddings
                    (movie_id, embedding, model_version, updated_at)
                values
                    (:movieId, cast(:embedding as vector), :modelVersion, now())
                on conflict (movie_id)
                do update set
                    embedding = excluded.embedding,
                    model_version = excluded.model_version,
                    updated_at = now()
                """);

        query.setParameter("movieId", movieId);
        query.setParameter("embedding", embedding);
        query.setParameter("modelVersion", modelVersion);
        query.executeUpdate();
    }
}