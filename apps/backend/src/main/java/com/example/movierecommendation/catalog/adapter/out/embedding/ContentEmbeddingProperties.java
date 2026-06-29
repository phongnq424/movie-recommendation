package com.example.movierecommendation.catalog.adapter.out.embedding;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "app.catalog.embedding")
public class ContentEmbeddingProperties {

    private String baseUrl = "http://localhost:8081";

    private int expectedDimension = 384;
}