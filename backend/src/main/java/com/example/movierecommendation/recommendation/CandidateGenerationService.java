package com.example.movierecommendation.recommendation;

import com.example.movierecommendation.movie.Movie;
import com.example.movierecommendation.movie.MovieRepository;
import com.example.movierecommendation.movieactor.MovieActor;
import com.example.movierecommendation.movieactor.MovieActorRepository;
import com.example.movierecommendation.moviegenre.MovieGenreRepository;
import com.example.movierecommendation.rating.Rating;
import com.example.movierecommendation.rating.RatingRepository;
import com.example.movierecommendation.recommendation.dto.UserMovieInterestProfile;
import com.example.movierecommendation.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CandidateGenerationService {

    private static final String STATUS_PUBLISHED = "PUBLISHED";
    private static final double LIKED_RATING_THRESHOLD = 4.0;
    private static final double MIN_SIMILARITY = 0.30;

    private static final int GENRE_CANDIDATE_LIMIT = 80;
    private static final int ACTOR_CANDIDATE_LIMIT = 50;
    private static final int COLLABORATIVE_CANDIDATE_LIMIT = 80;
    private static final int POPULAR_CANDIDATE_LIMIT = 50;
    private static final int FRESH_CANDIDATE_LIMIT = 40;

    private static final int ANONYMOUS_POPULAR_CANDIDATE_LIMIT = 120;
    private static final int ANONYMOUS_FRESH_CANDIDATE_LIMIT = 80;

    private final MovieRepository movieRepository;
    private final RatingRepository ratingRepository;
    private final MovieGenreRepository movieGenreRepository;
    private final MovieActorRepository movieActorRepository;
    private final UserSimilarityCalculator userSimilarityCalculator;
    private final UserMovieInterestService userMovieInterestService;

    public List<Movie> generateCandidates(User user, int candidateLimit) {
        List<Rating> userRatings = ratingRepository.findByUserId(user.getId());

        UserMovieInterestProfile interestProfile = userMovieInterestService.build(user.getId(), userRatings);
        Map<Long, Double> movieInterestScores = interestProfile.getMovieInterestScores();

        Set<Long> excludedMovieIds = new HashSet<>();

        excludedMovieIds.addAll(userRatings.stream()
                .filter(Objects::nonNull)
                .filter(rating -> rating.getMovie() != null)
                .filter(rating -> rating.getMovie().getId() != null)
                .map(rating -> rating.getMovie().getId())
                .collect(Collectors.toSet()));

        excludedMovieIds.addAll(movieInterestScores.entrySet()
                .stream()
                .filter(entry -> entry.getValue() >= 0.85)
                .map(Map.Entry::getKey)
                .collect(Collectors.toSet()));

        Map<Long, Movie> candidateMap = new LinkedHashMap<>();

        if (!movieInterestScores.isEmpty()) {
            addGenreCandidatesFromInterest(movieInterestScores, candidateMap);
            addActorCandidatesFromInterest(movieInterestScores, candidateMap);
        }

        addMovies(
                candidateMap,
                movieRepository.findPopularPublishedMovies(PageRequest.of(0, POPULAR_CANDIDATE_LIMIT))
        );

        addMovies(
                candidateMap,
                movieRepository.findFreshPublishedMovies(PageRequest.of(0, FRESH_CANDIDATE_LIMIT))
        );

        return candidateMap.values()
                .stream()
                .filter(movie -> STATUS_PUBLISHED.equals(movie.getStatus()))
                .filter(movie -> !excludedMovieIds.contains(movie.getId()))
                .limit(candidateLimit)
                .toList();
    }

    public List<Movie> generateAnonymousCandidates(int candidateLimit) {
        Map<Long, Movie> candidateMap = new LinkedHashMap<>();

        addMovies(
                candidateMap,
                movieRepository.findPopularPublishedMovies(PageRequest.of(0, ANONYMOUS_POPULAR_CANDIDATE_LIMIT))
        );

        addMovies(
                candidateMap,
                movieRepository.findFreshPublishedMovies(PageRequest.of(0, ANONYMOUS_FRESH_CANDIDATE_LIMIT))
        );

        return candidateMap.values()
                .stream()
                .filter(movie -> STATUS_PUBLISHED.equals(movie.getStatus()))
                .limit(candidateLimit)
                .toList();
    }

    private void addGenreCandidatesFromInterest(
            Map<Long, Double> movieInterestScores,
            Map<Long, Movie> candidateMap
    ) {
        List<Long> interestedMovieIds = movieInterestScores.entrySet()
                .stream()
                .filter(entry -> entry.getValue() >= 0.35)
                .map(Map.Entry::getKey)
                .toList();

        if (interestedMovieIds.isEmpty()) {
            return;
        }

        List<Long> interestedGenreIds = movieGenreRepository.findByMovieIds(interestedMovieIds)
                .stream()
                .map(movieGenre -> movieGenre.getGenre().getId())
                .distinct()
                .toList();

        if (interestedGenreIds.isEmpty()) {
            return;
        }

        List<Movie> movies = movieGenreRepository.findPublishedMoviesByGenreIds(
                interestedGenreIds,
                PageRequest.of(0, GENRE_CANDIDATE_LIMIT)
        );

        addMovies(candidateMap, movies);
    }

    private void addActorCandidatesFromInterest(
            Map<Long, Double> movieInterestScores,
            Map<Long, Movie> candidateMap
    ) {
        List<Long> interestedMovieIds = movieInterestScores.entrySet()
                .stream()
                .filter(entry -> entry.getValue() >= 0.35)
                .map(Map.Entry::getKey)
                .toList();

        if (interestedMovieIds.isEmpty()) {
            return;
        }

        List<Long> interestedActorIds = movieActorRepository.findByMovieIds(interestedMovieIds)
                .stream()
                .filter(this::isImportantActor)
                .map(movieActor -> movieActor.getActor().getId())
                .distinct()
                .toList();

        if (interestedActorIds.isEmpty()) {
            return;
        }

        List<Movie> movies = movieActorRepository.findPublishedMoviesByActorIds(
                interestedActorIds,
                PageRequest.of(0, ACTOR_CANDIDATE_LIMIT)
        );

        addMovies(candidateMap, movies);
    }

    private void addCollaborativeCandidates(
            User user,
            List<Rating> userRatings,
            Map<Long, Movie> candidateMap
    ) {
        Map<Long, Double> currentUserRatingMap = new HashMap<>();

        for (Rating rating : userRatings) {
            if (rating == null) {
                continue;
            }

            if (rating.getMovie() == null) {
                continue;
            }

            if (rating.getMovie().getId() == null) {
                continue;
            }

            if (rating.getRatingValue() == null) {
                continue;
            }

            currentUserRatingMap.merge(
                    rating.getMovie().getId(),
                    rating.getRatingValue(),
                    Math::max
            );
        }

        if (currentUserRatingMap.isEmpty()) {
            return;
        }

        List<Rating> otherRatings = ratingRepository.findOtherUsersRatings(user.getId());

        Map<Long, List<Rating>> ratingsByOtherUser = otherRatings.stream()
                .filter(Objects::nonNull)
                .filter(rating -> rating.getUser() != null)
                .filter(rating -> rating.getUser().getId() != null)
                .collect(Collectors.groupingBy(rating -> rating.getUser().getId()));

        Map<Long, Double> similarityByUser = new HashMap<>();

        for (Map.Entry<Long, List<Rating>> entry : ratingsByOtherUser.entrySet()) {
            double similarity = userSimilarityCalculator.calculate(currentUserRatingMap, entry.getValue());

            if (similarity >= MIN_SIMILARITY) {
                similarityByUser.put(entry.getKey(), similarity);
            }
        }

        if (similarityByUser.isEmpty()) {
            return;
        }

        List<Movie> collaborativeMovies = otherRatings.stream()
                .filter(Objects::nonNull)
                .filter(rating -> rating.getUser() != null)
                .filter(rating -> rating.getUser().getId() != null)
                .filter(rating -> similarityByUser.containsKey(rating.getUser().getId()))
                .filter(rating -> safeDouble(rating.getRatingValue()) >= LIKED_RATING_THRESHOLD)
                .map(Rating::getMovie)
                .filter(Objects::nonNull)
                .filter(movie -> STATUS_PUBLISHED.equals(movie.getStatus()))
                .sorted(Comparator
                        .comparing(Movie::getAverageRating, Comparator.nullsLast(Double::compareTo))
                        .reversed()
                )
                .limit(COLLABORATIVE_CANDIDATE_LIMIT)
                .toList();

        addMovies(candidateMap, collaborativeMovies);
    }

    private boolean isImportantActor(MovieActor movieActor) {
        if (Boolean.TRUE.equals(movieActor.getMainCast())) {
            return true;
        }

        Integer castOrder = movieActor.getCastOrder();

        return castOrder != null && castOrder <= 5;
    }

    private void addMovies(Map<Long, Movie> candidateMap, List<Movie> movies) {
        if (movies == null || movies.isEmpty()) {
            return;
        }

        for (Movie movie : movies) {
            if (movie == null || movie.getId() == null) {
                continue;
            }

            candidateMap.putIfAbsent(movie.getId(), movie);
        }
    }

    private double safeDouble(Double value) {
        return value == null ? 0.0 : value;
    }
}