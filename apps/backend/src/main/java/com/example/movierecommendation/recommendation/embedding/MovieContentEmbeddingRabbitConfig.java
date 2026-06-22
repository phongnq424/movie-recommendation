package com.example.movierecommendation.recommendation.embedding;

import lombok.RequiredArgsConstructor;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@RequiredArgsConstructor
public class MovieContentEmbeddingRabbitConfig {

    private final MovieContentEmbeddingRabbitProperties rabbitProperties;

    @Bean
    public DirectExchange movieContentEmbeddingExchange() {
        return new DirectExchange(
                rabbitProperties.getExchange(),
                true,
                false
        );
    }

    @Bean
    public Queue movieContentEmbeddingQueue() {
        return QueueBuilder
                .durable(rabbitProperties.getQueue())
                .build();
    }

    @Bean
    public Binding movieContentEmbeddingBinding() {
        return BindingBuilder
                .bind(movieContentEmbeddingQueue())
                .to(movieContentEmbeddingExchange())
                .with(rabbitProperties.getRoutingKey());
    }
}