package com.example.movierecommendation.catalog.application.port.out;

import com.example.movierecommendation.catalog.domain.model.EmbeddingVector;

public interface TextEmbeddingPort {

    EmbeddingVector embed(String text);
}