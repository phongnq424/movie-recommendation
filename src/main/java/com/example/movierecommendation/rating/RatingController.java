package com.example.movierecommendation.rating;

import com.example.movierecommendation.rating.dto.RatingRequest;
import com.example.movierecommendation.rating.dto.RatingResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ratings")
@RequiredArgsConstructor
@CrossOrigin("*")
public class RatingController {

    private final RatingService ratingService;

    @PostMapping
    public RatingResponse rateMovie(@RequestBody RatingRequest request) {
        return ratingService.rateMovie(request);
    }

    @GetMapping("/user/{userId}")
    public List<RatingResponse> getRatingsByUser(@PathVariable Long userId) {
        return ratingService.getRatingsByUser(userId);
    }

    @GetMapping("/movie/{movieId}")
    public List<RatingResponse> getRatingsByMovie(@PathVariable Long movieId) {
        return ratingService.getRatingsByMovie(movieId);
    }
}