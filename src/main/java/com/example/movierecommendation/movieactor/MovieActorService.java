package com.example.movierecommendation.movieactor;

import com.example.movierecommendation.actor.Actor;
import com.example.movierecommendation.actor.ActorRepository;
import com.example.movierecommendation.movie.Movie;
import com.example.movierecommendation.movie.MovieRepository;
import com.example.movierecommendation.movieactor.dto.MovieActorRequest;
import com.example.movierecommendation.movieactor.dto.MovieActorResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MovieActorService {

    private final MovieActorRepository movieActorRepository;
    private final MovieRepository movieRepository;
    private final ActorRepository actorRepository;

    public MovieActorResponse addActorToMovie(MovieActorRequest request) {
        validateMovieActorRequest(request);

        if (movieActorRepository.existsByMovieIdAndActorId(
                request.getMovieId(),
                request.getActorId()
        )) {
            throw new RuntimeException("Actor already exists in this movie");
        }

        Movie movie = movieRepository.findById(request.getMovieId())
                .orElseThrow(() -> new RuntimeException("Movie not found"));

        Actor actor = actorRepository.findById(request.getActorId())
                .orElseThrow(() -> new RuntimeException("Actor not found"));

        MovieActor movieActor = MovieActor.builder()
                .movie(movie)
                .actor(actor)
                .characterName(request.getCharacterName())
                .castOrder(request.getCastOrder())
                .mainCast(request.getMainCast() != null ? request.getMainCast() : false)
                .build();

        return MovieActorResponse.from(movieActorRepository.save(movieActor));
    }

    public List<MovieActorResponse> getActorsByMovie(Long movieId) {
        return movieActorRepository.findByMovieIdOrderByCastOrderAsc(movieId)
                .stream()
                .map(MovieActorResponse::from)
                .toList();
    }

    public List<MovieActorResponse> getMoviesByActor(Long actorId) {
        return movieActorRepository.findByActorId(actorId)
                .stream()
                .map(MovieActorResponse::from)
                .toList();
    }

    public MovieActorResponse updateMovieActor(Long id, MovieActorRequest request) {
        MovieActor movieActor = movieActorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Movie actor not found"));

        movieActor.setCharacterName(request.getCharacterName());
        movieActor.setCastOrder(request.getCastOrder());
        movieActor.setMainCast(request.getMainCast() != null ? request.getMainCast() : false);

        return MovieActorResponse.from(movieActorRepository.save(movieActor));
    }

    public void removeActorFromMovie(Long id) {
        MovieActor movieActor = movieActorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Movie actor not found"));

        movieActorRepository.delete(movieActor);
    }

    private void validateMovieActorRequest(MovieActorRequest request) {
        if (request.getMovieId() == null) {
            throw new RuntimeException("Movie ID is required");
        }

        if (request.getActorId() == null) {
            throw new RuntimeException("Actor ID is required");
        }
    }
}