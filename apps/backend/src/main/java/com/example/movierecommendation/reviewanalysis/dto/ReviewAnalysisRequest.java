package com.example.movierecommendation.reviewanalysis.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReviewAnalysisRequest {
    private String text;
    private String language;
}