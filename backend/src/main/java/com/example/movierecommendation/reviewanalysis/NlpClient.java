package com.example.movierecommendation.reviewanalysis;

import com.example.movierecommendation.reviewanalysis.dto.ReviewAnalysisResponse;
import com.example.movierecommendation.reviewanalysis.dto.ReviewAnalysisRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
@RequiredArgsConstructor
public class NlpClient {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${app.nlp.base-url:http://localhost:8001}")
    private String nlpBaseUrl;

    public ReviewAnalysisResponse analyze(String text) {
        ReviewAnalysisRequest request = new ReviewAnalysisRequest();
        request.setText(text);
        request.setLanguage("vi");

        return restTemplate.postForObject(
                nlpBaseUrl + "/review-analysis",
                request,
                ReviewAnalysisResponse.class
        );
    }
}