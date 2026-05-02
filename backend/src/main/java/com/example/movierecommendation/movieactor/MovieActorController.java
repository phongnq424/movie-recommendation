package com.example.movierecommendation.movieactor;

import com.example.movierecommendation.movieactor.dto.MovieActorRequest;
import com.example.movierecommendation.movieactor.dto.MovieActorResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/movie-actors")
@RequiredArgsConstructor
@CrossOrigin("*")
public class MovieActorController {

    private final MovieActorService movieActorService;

    @PostMapping
    public MovieActorResponse addActorToMovie(@RequestBody MovieActorRequest request) {
        return movieActorService.addActorToMovie(request);
    }

    @GetMapping("/movie/{movieId}")
    public List<MovieActorResponse> getActorsByMovie(@PathVariable Long movieId) {
        return movieActorService.getActorsByMovie(movieId);
    }

    @GetMapping("/actor/{actorId}")
    public List<MovieActorResponse> getMoviesByActor(@PathVariable Long actorId) {
        return movieActorService.getMoviesByActor(actorId);
    }

    @PutMapping("/{id}")
    public MovieActorResponse updateMovieActor(
            @PathVariable Long id,
            @RequestBody MovieActorRequest request
    ) {
        return movieActorService.updateMovieActor(id, request);
    }

    @DeleteMapping("/{id}")
    public String removeActorFromMovie(@PathVariable Long id) {
        movieActorService.removeActorFromMovie(id);
        return "Actor removed from movie successfully";
    }
}