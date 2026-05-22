package com.example.movierecommendation.reviewanalysis;

import com.example.movierecommendation.config.NlpProperties;
import com.example.movierecommendation.reviewanalysis.dto.ReviewAnalysisRequest;
import com.example.movierecommendation.reviewanalysis.dto.ReviewAnalysisResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
@RequiredArgsConstructor
public class NlpClient {

    private final RestTemplate restTemplate = new RestTemplate();
    private final NlpProperties nlpProperties;

    public ReviewAnalysisResponse analyze(String text) {
        ReviewAnalysisRequest request = new ReviewAnalysisRequest();
        request.setText(text);
        request.setLanguage("vi");

        return restTemplate.postForObject(
                nlpProperties.getBaseUrl() + "/review-analysis",
                request,
                ReviewAnalysisResponse.class
        );
    }
}