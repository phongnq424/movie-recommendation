package com.example.movierecommendation.recommendation.embedding;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.content-embedding.rabbit")
public class MovieContentEmbeddingRabbitProperties {

    private String exchange = "movie.events";

    private String queue = "movie.content.embedding";

    private String routingKey = "movie.content.changed";

    private int outboxBatchSize = 20;

    private int outboxMaxAttempts = 5;

    private int outboxRetryDelaySeconds = 60;
}