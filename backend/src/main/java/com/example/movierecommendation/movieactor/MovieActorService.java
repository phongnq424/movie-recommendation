package com.example.movierecommendation.movieactor;

import com.example.movierecommendation.actor.Actor;
import com.example.movierecommendation.actor.ActorRepository;
import com.example.movierecommendation.movie.Movie;
import com.example.movierecommendation.movie.MovieRepository;
import com.example.movierecommendation.movieactor.dto.MovieActorItemRequest;
import com.example.movierecommendation.movieactor.dto.MovieActorRequest;
import com.example.movierecommendation.movieactor.dto.MovieActorResponse;
import com.example.movierecommendation.recommendation.embedding.MovieContentEmbeddingJobService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MovieActorService {

    private final MovieActorRepository movieActorRepository;
    private final MovieRepository movieRepository;
    private final ActorRepository actorRepository;
    private final MovieContentEmbeddingJobService contentEmbeddingJobService;

    @Transactional
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

        MovieActor savedMovieActor = movieActorRepository.save(movieActor);

        contentEmbeddingJobService.requestRebuildAfterCommit(
                movie,
                "MOVIE_CAST_CHANGED"
        );

        return MovieActorResponse.from(savedMovieActor);
    }

    @Transactional(readOnly = true)
    public List<MovieActorResponse> getActorsByMovie(UUID moviePublicId) {
        Movie movie = getMovieByPublicId(moviePublicId);

        return movieActorRepository.findByMovieIdOrderByCastOrderAsc(movie.getId())
                .stream()
                .map(MovieActorResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MovieActorResponse> getMoviesByActor(UUID actorPublicId) {
        Actor actor = getActorByPublicId(actorPublicId);

        return movieActorRepository.findByActorId(actor.getId())
                .stream()
                .map(MovieActorResponse::from)
                .toList();
    }

    @Transactional
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

    @Transactional
    public void removeActorFromMovie(UUID moviePublicId, UUID actorPublicId) {
        Movie movie = getMovieByPublicId(moviePublicId);
        Actor actor = getActorByPublicId(actorPublicId);

        MovieActor movieActor = movieActorRepository
                .findByMovieIdAndActorId(movie.getId(), actor.getId())
                .orElseThrow(() -> new RuntimeException("Movie actor not found"));

        movieActorRepository.delete(movieActor);

        contentEmbeddingJobService.requestRebuildAfterCommit(
                movie,
                "MOVIE_CAST_CHANGED"
        );
    }

    /**
     * Bulk set cast cho một phim.
     * Ý nghĩa: danh sách cast hiện tại của phim = request.actors.
     *
     * Cách làm production:
     * - Không delete toàn bộ rồi insert lại.
     * - Actor đã có thì update characterName, castOrder, mainCast.
     * - Actor không còn trong request thì xóa.
     * - Actor mới thì insert.
     *
     * Lý do:
     * Nếu delete all rồi insert lại trong cùng transaction, Hibernate có thể insert trước khi flush delete,
     * gây lỗi unique constraint: Key (movie_id, actor_id) already exists.
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

        List<MovieActor> existingMovieActors =
                movieActorRepository.findByMovieIdOrderByCastOrderAsc(movie.getId());

        Map<UUID, MovieActor> existingMovieActorByActorPublicId = new HashMap<>();

        for (MovieActor movieActor : existingMovieActors) {
            existingMovieActorByActorPublicId.put(
                    movieActor.getActor().getPublicId(),
                    movieActor
            );
        }

        Set<UUID> requestedActorPublicIds = new HashSet<>();

        for (MovieActorItemRequest request : actorRequests) {
            validateMovieActorItemRequest(request);
            requestedActorPublicIds.add(request.getActorPublicId());
        }

        List<MovieActor> movieActorsToDelete = existingMovieActors.stream()
                .filter(movieActor -> !requestedActorPublicIds.contains(
                        movieActor.getActor().getPublicId()
                ))
                .toList();

        if (!movieActorsToDelete.isEmpty()) {
            movieActorRepository.deleteAll(movieActorsToDelete);
        }

        List<MovieActor> movieActorsToSave = actorRequests.stream()
                .map(request -> {
                    validateMovieActorItemRequest(request);

                    MovieActor existingMovieActor =
                            existingMovieActorByActorPublicId.get(request.getActorPublicId());

                    if (existingMovieActor != null) {
                        existingMovieActor.setCharacterName(request.getCharacterName());
                        existingMovieActor.setCastOrder(request.getCastOrder());
                        existingMovieActor.setMainCast(
                                request.getMainCast() != null ? request.getMainCast() : false
                        );

                        return existingMovieActor;
                    }

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

        movieActorRepository.saveAll(movieActorsToSave);

        return movieActorRepository.findByMovieIdOrderByCastOrderAsc(movie.getId())
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