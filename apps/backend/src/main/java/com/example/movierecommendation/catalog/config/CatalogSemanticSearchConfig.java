package com.example.movierecommendation.catalog.config;

import com.example.movierecommendation.catalog.adapter.out.embedding.ContentEmbeddingProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(ContentEmbeddingProperties.class)
public class CatalogSemanticSearchConfig {
}