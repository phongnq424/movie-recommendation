package com.example.movierecommendation.movieactor;

import com.example.movierecommendation.movieactor.dto.MovieActorRequest;
import com.example.movierecommendation.movieactor.dto.MovieActorResponse;
import com.example.movierecommendation.movieactor.dto.SetMovieActorsRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/movie-actors")
@RequiredArgsConstructor
@CrossOrigin("*")
public class MovieActorController {

    private final MovieActorService movieActorService;

    @PostMapping
    public MovieActorResponse addActorToMovie(
            @Valid @RequestBody MovieActorRequest request
    ) {
        return movieActorService.addActorToMovie(request);
    }

    @GetMapping("/movie/{moviePublicId}")
    public List<MovieActorResponse> getActorsByMovie(
            @PathVariable UUID moviePublicId
    ) {
        return movieActorService.getActorsByMovie(moviePublicId);
    }

    @GetMapping("/actor/{actorPublicId}")
    public List<MovieActorResponse> getMoviesByActor(
            @PathVariable UUID actorPublicId
    ) {
        return movieActorService.getMoviesByActor(actorPublicId);
    }

    /**
     * Update thông tin vai diễn của một actor trong một movie.
     * Xác định record bằng moviePublicId + actorPublicId.
     */
    @PutMapping
    public MovieActorResponse updateMovieActor(
            @Valid @RequestBody MovieActorRequest request
    ) {
        return movieActorService.updateMovieActor(request);
    }

    /**
     * Remove một actor khỏi một movie.
     */
    @DeleteMapping("/movie/{moviePublicId}/actor/{actorPublicId}")
    public String removeActorFromMovie(
            @PathVariable UUID moviePublicId,
            @PathVariable UUID actorPublicId
    ) {
        movieActorService.removeActorFromMovie(moviePublicId, actorPublicId);
        return "Actor removed from movie successfully";
    }

    /**
     * Bulk set cast cho một movie.
     * Đây là API admin nên dùng khi save form movie cast.
     */
    @PutMapping("/movie/{moviePublicId}")
    public List<MovieActorResponse> setActorsForMovie(
            @PathVariable UUID moviePublicId,
            @Valid @RequestBody SetMovieActorsRequest request
    ) {
        return movieActorService.setActorsForMovie(
                moviePublicId,
                request.getActors()
        );
    }
}