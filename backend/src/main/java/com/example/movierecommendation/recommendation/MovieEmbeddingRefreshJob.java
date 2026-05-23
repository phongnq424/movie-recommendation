package com.example.movierecommendation.recommendation;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class MovieEmbeddingRefreshJob implements ApplicationRunner {

    private final MovieEmbeddingService movieEmbeddingService;

    @Override
    public void run(ApplicationArguments args) {
        movieEmbeddingService.refreshMissingMovieEmbeddings();
    }

    @Scheduled(cron = "0 0 */6 * * *")
    public void refreshMovieEmbeddings() {
        movieEmbeddingService.refreshAllPublishedMovies();
    }
}