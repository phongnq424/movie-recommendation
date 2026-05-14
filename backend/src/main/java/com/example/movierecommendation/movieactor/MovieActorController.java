package com.example.movierecommendation.movieactor;

import com.example.movierecommendation.movieactor.dto.MovieActorRequest;
import com.example.movierecommendation.movieactor.dto.MovieActorResponse;
import com.example.movierecommendation.movieactor.dto.SetMovieActorsRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/movie-actors")
@RequiredArgsConstructor
@CrossOrigin("*")
public class MovieActorController {

    private final MovieActorService movieActorService;

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public MovieActorResponse addActorToMovie(
            @Valid @RequestBody MovieActorRequest request
    ) {
        return movieActorService.addActorToMovie(request);
    }

    /**
     * Public API: lấy cast của một phim.
     */
    @GetMapping("/movie/{moviePublicId}")
    public List<MovieActorResponse> getActorsByMovie(
            @PathVariable UUID moviePublicId
    ) {
        return movieActorService.getActorsByMovie(moviePublicId);
    }

    /**
     * Public API: lấy danh sách phim của một actor.
     */
    @GetMapping("/actor/{actorPublicId}")
    public List<MovieActorResponse> getMoviesByActor(
            @PathVariable UUID actorPublicId
    ) {
        return movieActorService.getMoviesByActor(actorPublicId);
    }

    /**
     * Admin API: cập nhật thông tin vai diễn của actor trong movie.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping
    public MovieActorResponse updateMovieActor(
            @Valid @RequestBody MovieActorRequest request
    ) {
        return movieActorService.updateMovieActor(request);
    }

    /**
     * Admin API: remove một actor khỏi một movie.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/movie/{moviePublicId}/actor/{actorPublicId}")
    public String removeActorFromMovie(
            @PathVariable UUID moviePublicId,
            @PathVariable UUID actorPublicId
    ) {
        movieActorService.removeActorFromMovie(moviePublicId, actorPublicId);
        return "Actor removed from movie successfully";
    }

    /**
     * Admin API: bulk set cast cho một movie.
     */
    @PreAuthorize("hasRole('ADMIN')")
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