package com.example.movierecommendation.recommendation.embedding;

import com.example.movierecommendation.movie.Movie;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Service
@RequiredArgsConstructor
public class MovieContentEmbeddingJobService {

    private static final String STATUS_PUBLISHED = "PUBLISHED";

    @PersistenceContext
    private EntityManager entityManager;

    public void requestRebuildAfterCommit(Movie movie, String reason) {
        if (movie == null || movie.getId() == null) {
            return;
        }

        if (!STATUS_PUBLISHED.equals(movie.getStatus())) {
            return;
        }

        Long movieId = movie.getId();

        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(
                    new TransactionSynchronization() {
                        @Override
                        public void afterCommit() {
                            requestRebuild(movieId, reason);
                        }
                    }
            );
            return;
        }

        requestRebuild(movieId, reason);
    }

    public void requestRebuild(Long movieId, String reason) {
        if (movieId == null) {
            return;
        }

        String safeReason = reason == null || reason.isBlank()
                ? "MOVIE_CONTENT_CHANGED"
                : reason.trim();

        Query query = entityManager.createNativeQuery("""
                insert into movie_content_embedding_jobs
                    (movie_id, reason, status, attempts, last_error, next_run_at, created_at, updated_at)
                values
                    (:movieId, :reason, 'PENDING', 0, null, now(), now(), now())
                on conflict (movie_id)
                do update set
                    reason = excluded.reason,
                    status = 'PENDING',
                    attempts = 0,
                    last_error = null,
                    next_run_at = now(),
                    updated_at = now()
                """);

        query.setParameter("movieId", movieId);
        query.setParameter("reason", safeReason);
        query.executeUpdate();
    }
}