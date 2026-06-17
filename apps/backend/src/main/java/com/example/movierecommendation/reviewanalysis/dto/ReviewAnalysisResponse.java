package com.example.movierecommendation.reviewanalysis.dto;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.Map;

@Getter
@Setter
public class ReviewAnalysisResponse {
    private Double sentimentScore;
    private String sentimentLabel;
    private List<String> keywords;
    private Map<String, Double> aspects;
}