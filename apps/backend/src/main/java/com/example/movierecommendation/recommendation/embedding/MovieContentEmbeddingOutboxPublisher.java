package com.example.movierecommendation.recommendation.embedding;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class MovieContentEmbeddingOutboxPublisher {

    private final JdbcTemplate jdbcTemplate;
    private final TransactionTemplate transactionTemplate;
    private final RabbitTemplate rabbitTemplate;
    private final ObjectMapper objectMapper;
    private final MovieContentEmbeddingRabbitProperties rabbitProperties;

    @Scheduled(
            fixedDelayString = "${app.content-embedding.rabbit.outbox-fixed-delay-ms:5000}",
            initialDelayString = "${app.content-embedding.rabbit.outbox-initial-delay-ms:3000}"
    )
    public void publishPendingJobs() {
        List<EmbeddingOutboxJob> jobs = transactionTemplate.execute(status -> claimPendingJobs());

        if (jobs == null || jobs.isEmpty()) {
            return;
        }

        for (EmbeddingOutboxJob job : jobs) {
            publishSingleJob(job);
        }
    }

    private List<EmbeddingOutboxJob> claimPendingJobs() {
        return jdbcTemplate.query("""
                update movie_content_embedding_jobs j
                set status = 'PROCESSING',
                    attempts = attempts + 1,
                    updated_at = now()
                where j.id in (
                    select id
                    from movie_content_embedding_jobs
                    where status = 'PENDING'
                      and next_run_at <= now()
                      and attempts < ?
                    order by created_at asc
                    limit ?
                    for update skip locked
                )
                returning
                    j.id,
                    j.movie_id,
                    coalesce(j.reason, 'MOVIE_CONTENT_CHANGED') as reason,
                    j.attempts
                """,
                (rs, rowNum) -> new EmbeddingOutboxJob(
                        rs.getLong("id"),
                        rs.getLong("movie_id"),
                        rs.getString("reason"),
                        rs.getInt("attempts")
                ),
                rabbitProperties.getOutboxMaxAttempts(),
                rabbitProperties.getOutboxBatchSize()
        );
    }

    private void publishSingleJob(EmbeddingOutboxJob job) {
        try {
            MovieContentEmbeddingMessage message = new MovieContentEmbeddingMessage(
                    job.movieId(),
                    job.reason()
            );

            String payload = objectMapper.writeValueAsString(message);

            rabbitTemplate.convertAndSend(
                    rabbitProperties.getExchange(),
                    rabbitProperties.getRoutingKey(),
                    payload
            );

            markJobDone(job.id());

            log.info(
                    "Published content embedding outbox job. jobId={}, movieId={}, reason={}",
                    job.id(),
                    job.movieId(),
                    job.reason()
            );
        } catch (Exception exception) {
            markJobFailed(job, exception);

            log.error(
                    "Failed to publish content embedding outbox job. jobId={}, movieId={}, reason={}",
                    job.id(),
                    job.movieId(),
                    job.reason(),
                    exception
            );
        }
    }

    private void markJobDone(Long jobId) {
        jdbcTemplate.update("""
                update movie_content_embedding_jobs
                set status = 'DONE',
                    last_error = null,
                    updated_at = now()
                where id = ?
                """,
                jobId
        );
    }

    private void markJobFailed(EmbeddingOutboxJob job, Exception exception) {
        String safeError = exception.getMessage() == null || exception.getMessage().isBlank()
                ? "Unknown RabbitMQ publish error"
                : exception.getMessage();

        if (safeError.length() > 4000) {
            safeError = safeError.substring(0, 4000);
        }

        jdbcTemplate.update("""
                update movie_content_embedding_jobs
                set status = case
                        when attempts >= ? then 'FAILED'
                        else 'PENDING'
                    end,
                    last_error = ?,
                    next_run_at = case
                        when attempts >= ? then next_run_at
                        else now() + make_interval(secs => ?)
                    end,
                    updated_at = now()
                where id = ?
                """,
                rabbitProperties.getOutboxMaxAttempts(),
                safeError,
                rabbitProperties.getOutboxMaxAttempts(),
                rabbitProperties.getOutboxRetryDelaySeconds(),
                job.id()
        );
    }

    private record EmbeddingOutboxJob(
            Long id,
            Long movieId,
            String reason,
            int attempts
    ) {
    }
}