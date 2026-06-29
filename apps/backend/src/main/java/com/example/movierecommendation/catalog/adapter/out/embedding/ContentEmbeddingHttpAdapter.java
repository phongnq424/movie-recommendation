package com.example.movierecommendation.catalog.adapter.out.embedding;

import com.example.movierecommendation.catalog.application.port.out.TextEmbeddingPort;
import com.example.movierecommendation.catalog.domain.exception.TextEmbeddingException;
import com.example.movierecommendation.catalog.domain.model.EmbeddingVector;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.List;

@Component
public class ContentEmbeddingHttpAdapter implements TextEmbeddingPort {

    private final ContentEmbeddingProperties properties;
    private final RestClient restClient;

    public ContentEmbeddingHttpAdapter(ContentEmbeddingProperties properties) {
        this.properties = properties;
        this.restClient = RestClient.builder()
                .baseUrl(properties.getBaseUrl())
                .build();
    }

    @Override
    public EmbeddingVector embed(String text) {
        if (text == null || text.isBlank()) {
            throw new TextEmbeddingException("Search text is required");
        }

        try {
            EmbeddingResponse response = restClient.post()
                    .uri("/api/embeddings/text")
                    .body(new EmbeddingRequest(text.trim()))
                    .retrieve()
                    .body(EmbeddingResponse.class);

            if (response == null || response.embedding() == null || response.embedding().isEmpty()) {
                throw new TextEmbeddingException("Embedding service returned empty vector");
            }

            EmbeddingVector vector = new EmbeddingVector(response.embedding());

            if (vector.dimension() != properties.getExpectedDimension()) {
                throw new TextEmbeddingException(
                        "Unexpected embedding dimension. Expected "
                                + properties.getExpectedDimension()
                                + ", got "
                                + vector.dimension()
                );
            }

            return vector;
        } catch (RestClientException exception) {
            throw new TextEmbeddingException("Failed to call content embedding service", exception);
        }
    }

    private record EmbeddingRequest(
            String text
    ) {
    }

    private record EmbeddingResponse(
            String modelName,
            Integer dimension,
            List<Double> embedding
    ) {
    }
}