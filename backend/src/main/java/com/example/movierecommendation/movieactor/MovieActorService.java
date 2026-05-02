package com.example.movierecommendation.movieactor;

import com.example.movierecommendation.actor.Actor;
import com.example.movierecommendation.actor.ActorRepository;
import com.example.movierecommendation.movie.Movie;
import com.example.movierecommendation.movie.MovieRepository;
import com.example.movierecommendation.movieactor.dto.MovieActorItemRequest;
import com.example.movierecommendation.movieactor.dto.MovieActorRequest;
import com.example.movierecommendation.movieactor.dto.MovieActorResponse;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MovieActorService {

    private final MovieActorRepository movieActorRepository;
    private final MovieRepository movieRepository;
    private final ActorRepository actorRepository;

    public MovieActorResponse addActorToMovie(MovieActorRequest request) {
        validateMovieActorRequest(request);

        Movie movie = getMovieByPublicId(request.getMoviePublicId());
        Actor actor = getActorByPublicId(request.getActorPublicId());

        if (movieActorRepository.existsByMovieIdAndActorId(
                movie.getId(),
                actor.getId()
        )) {
            throw new RuntimeException("Actor already exists in this movie");
        }

        MovieActor movieActor = MovieActor.builder()
                .movie(movie)
                .actor(actor)
                .characterName(request.getCharacterName())
                .castOrder(request.getCastOrder())
                .mainCast(request.getMainCast() != null ? request.getMainCast() : false)
                .build();

        return MovieActorResponse.from(movieActorRepository.save(movieActor));
    }

    public List<MovieActorResponse> getActorsByMovie(UUID moviePublicId) {
        Movie movie = getMovieByPublicId(moviePublicId);

        return movieActorRepository.findByMovieIdOrderByCastOrderAsc(movie.getId())
                .stream()
                .map(MovieActorResponse::from)
                .toList();
    }

    public List<MovieActorResponse> getMoviesByActor(UUID actorPublicId) {
        Actor actor = getActorByPublicId(actorPublicId);

        return movieActorRepository.findByActorId(actor.getId())
                .stream()
                .map(MovieActorResponse::from)
                .toList();
    }

    public MovieActorResponse updateMovieActor(MovieActorRequest request) {
        validateMovieActorRequest(request);

        Movie movie = getMovieByPublicId(request.getMoviePublicId());
        Actor actor = getActorByPublicId(request.getActorPublicId());

        MovieActor movieActor = movieActorRepository
                .findByMovieIdAndActorId(movie.getId(), actor.getId())
                .orElseThrow(() -> new RuntimeException("Movie actor not found"));

        movieActor.setCharacterName(request.getCharacterName());
        movieActor.setCastOrder(request.getCastOrder());
        movieActor.setMainCast(request.getMainCast() != null ? request.getMainCast() : false);

        return MovieActorResponse.from(movieActorRepository.save(movieActor));
    }

    public void removeActorFromMovie(UUID moviePublicId, UUID actorPublicId) {
        Movie movie = getMovieByPublicId(moviePublicId);
        Actor actor = getActorByPublicId(actorPublicId);

        MovieActor movieActor = movieActorRepository
                .findByMovieIdAndActorId(movie.getId(), actor.getId())
                .orElseThrow(() -> new RuntimeException("Movie actor not found"));

        movieActorRepository.delete(movieActor);
    }

    /**
     * Bulk set cast cho một phim.
     * Ý nghĩa: danh sách cast hiện tại của phim = request.actors.
     * Cast cũ bị xóa khỏi bảng liên kết, sau đó tạo lại cast mới.
     */
    @Transactional
    public List<MovieActorResponse> setActorsForMovie(
            UUID moviePublicId,
            List<MovieActorItemRequest> actorRequests
    ) {
        if (actorRequests == null) {
            throw new RuntimeException("Actor list is required");
        }

        Movie movie = getMovieByPublicId(moviePublicId);

        validateDuplicateActors(actorRequests);

        movieActorRepository.deleteByMovieId(movie.getId());

        List<MovieActor> movieActors = actorRequests.stream()
                .map(request -> {
                    validateMovieActorItemRequest(request);

                    Actor actor = getActorByPublicId(request.getActorPublicId());

                    return MovieActor.builder()
                            .movie(movie)
                            .actor(actor)
                            .characterName(request.getCharacterName())
                            .castOrder(request.getCastOrder())
                            .mainCast(request.getMainCast() != null ? request.getMainCast() : false)
                            .build();
                })
                .sorted(Comparator.comparing(
                        MovieActor::getCastOrder,
                        Comparator.nullsLast(Integer::compareTo)
                ))
                .toList();

        return movieActorRepository.saveAll(movieActors)
                .stream()
                .map(MovieActorResponse::from)
                .toList();
    }

    private Movie getMovieByPublicId(UUID moviePublicId) {
        if (moviePublicId == null) {
            throw new RuntimeException("Movie public ID is required");
        }

        return movieRepository.findByPublicId(moviePublicId)
                .orElseThrow(() -> new RuntimeException("Movie not found"));
    }

    private Actor getActorByPublicId(UUID actorPublicId) {
        if (actorPublicId == null) {
            throw new RuntimeException("Actor public ID is required");
        }

        return actorRepository.findByPublicId(actorPublicId)
                .orElseThrow(() -> new RuntimeException("Actor not found"));
    }

    private void validateMovieActorRequest(MovieActorRequest request) {
        if (request == null) {
            throw new RuntimeException("Movie actor request is required");
        }

        if (request.getMoviePublicId() == null) {
            throw new RuntimeException("Movie public ID is required");
        }

        if (request.getActorPublicId() == null) {
            throw new RuntimeException("Actor public ID is required");
        }
    }

    private void validateMovieActorItemRequest(MovieActorItemRequest request) {
        if (request == null) {
            throw new RuntimeException("Movie actor item is required");
        }

        if (request.getActorPublicId() == null) {
            throw new RuntimeException("Actor public ID is required");
        }
    }

    private void validateDuplicateActors(List<MovieActorItemRequest> actorRequests) {
        Set<UUID> uniqueActorIds = new HashSet<>();

        for (MovieActorItemRequest request : actorRequests) {
            validateMovieActorItemRequest(request);

            if (!uniqueActorIds.add(request.getActorPublicId())) {
                throw new RuntimeException("Duplicate actor in movie cast: " + request.getActorPublicId());
            }
        }
    }
}