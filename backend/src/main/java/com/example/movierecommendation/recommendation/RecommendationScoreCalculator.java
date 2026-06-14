package com.example.movierecommendation.recommendation;

import com.example.recommendation.core.model.ScoringContext;
import com.example.movierecommendation.movie.Movie;
import com.example.movierecommendation.movie.MovieRepository;
import com.example.movierecommendation.movieactor.MovieActor;
import com.example.movierecommendation.movieactor.MovieActorRepository;
import com.example.movierecommendation.moviegenre.MovieGenre;
import com.example.movierecommendation.moviegenre.MovieGenreRepository;
import com.example.movierecommendation.rating.Rating;
import com.example.movierecommendation.rating.RatingRepository;
import com.example.movierecommendation.recommendation.dto.UserMovieInterestProfile;
import com.example.movierecommendation.reviewanalysis.ReviewAnalysisRepository;
import com.example.movierecommendation.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.Year;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class RecommendationScoreCalculator {

    private static final double MIN_SIMILARITY = 0.30;
    private static final String STATUS_PUBLISHED = "PUBLISHED";

    private final UserSimilarityCalculator userSimilarityCalculator;
    private final RatingRepository ratingRepository;
    private final MovieGenreRepository movieGenreRepository;
    private final MovieActorRepository movieActorRepository;
    private final ReviewAnalysisRepository reviewAnalysisRepository;
    private final UserMovieInterestService userMovieInterestService;
    private final MovieRepository movieRepository;

    public ScoringContext buildContext(
            User user,
            List<Movie> candidates
    ) {
        List<Rating> userRatings = ratingRepository.findByUserId(user.getId());

        List<Long> candidateMovieIds = candidates.stream()
                .filter(Objects::nonNull)
                .map(Movie::getId)
                .filter(Objects::nonNull)
                .toList();

        Map<Long, Set<Long>> candidateGenreIds = loadCandidateGenreIds(candidateMovieIds);
        Map<Long, Set<Long>> candidateActorIds = loadCandidateActorIds(candidateMovieIds);

        UserMovieInterestProfile interestProfile = userMovieInterestService.build(user.getId(), userRatings);
        CollaborativeResult collaborativeResult = calculateCollaborativeScores(user, userRatings, candidates);

        Map<Long, Double> genreIdfScores = loadGenreIdfScores();
        Map<Long, Double> actorIdfScores = loadActorIdfScores();

        Map<Long, Double> userGenreWeights = buildUserGenreWeights(
                interestProfile.getMovieInterestScores(),
                genreIdfScores
        );
        Map<Long, Double> userActorWeights = buildUserActorWeights(
                interestProfile.getMovieInterestScores(),
                actorIdfScores
        );

        Map<Long, Double> sentimentScores = loadSentimentScores(candidateMovieIds);

        int maxRatingCount = candidates.stream()
                .filter(Objects::nonNull)
                .map(Movie::getRatingCount)
                .filter(Objects::nonNull)
                .max(Integer::compareTo)
                .orElse(0);

        long maxViewCount = candidates.stream()
                .filter(Objects::nonNull)
                .map(Movie::getViewCount)
                .filter(Objects::nonNull)
                .max(Long::compareTo)
                .orElse(0L);

        return ScoringContext.builder()
                .userRatingCount(userRatings == null ? 0 : userRatings.size())
                .userGenreWeights(userGenreWeights)
                .userActorWeights(userActorWeights)
                .candidateGenreIds(candidateGenreIds)
                .candidateActorIds(candidateActorIds)
                .genreIdfScores(genreIdfScores)
                .actorIdfScores(actorIdfScores)
                .collaborativeScores(collaborativeResult.collaborativeScores())
                .similarUserCount(collaborativeResult.similarUserCount())
                .sentimentScores(sentimentScores)
                .interactionCount(interestProfile.getInteractionCount())
                .maxRatingCount(maxRatingCount)
                .maxViewCount(maxViewCount)
                .currentYear(Year.now().getValue())
                .build();
    }

    public ScoringContext buildAnonymousContext(List<Movie> candidates) {
        List<Long> candidateMovieIds = candidates.stream()
                .filter(Objects::nonNull)
                .map(Movie::getId)
                .filter(Objects::nonNull)
                .toList();

        int maxRatingCount = candidates.stream()
                .filter(Objects::nonNull)
                .map(Movie::getRatingCount)
                .filter(Objects::nonNull)
                .max(Integer::compareTo)
                .orElse(0);

        long maxViewCount = candidates.stream()
                .filter(Objects::nonNull)
                .map(Movie::getViewCount)
                .filter(Objects::nonNull)
                .max(Long::compareTo)
                .orElse(0L);

        return ScoringContext.builder()
                .userRatingCount(0)
                .userGenreWeights(Map.of())
                .userActorWeights(Map.of())
                .candidateGenreIds(loadCandidateGenreIds(candidateMovieIds))
                .candidateActorIds(loadCandidateActorIds(candidateMovieIds))
                .genreIdfScores(loadGenreIdfScores())
                .actorIdfScores(loadActorIdfScores())
                .collaborativeScores(Map.of())
                .sentimentScores(loadSentimentScores(candidateMovieIds))
                .similarUserCount(0)
                .interactionCount(0)
                .maxRatingCount(maxRatingCount)
                .maxViewCount(maxViewCount)
                .currentYear(Year.now().getValue())
                .build();
    }

    private Map<Long, Double> buildUserGenreWeights(
            Map<Long, Double> movieInterestScores,
            Map<Long, Double> genreIdfScores
    ) {
        if (movieInterestScores == null || movieInterestScores.isEmpty()) {
            return Map.of();
        }

        List<Long> movieIds = new ArrayList<>(movieInterestScores.keySet());
        Map<Long, Double> weights = new HashMap<>();

        for (MovieGenre movieGenre : movieGenreRepository.findByMovieIds(movieIds)) {
            if (movieGenre == null) {
                continue;
            }

            if (movieGenre.getMovie() == null || movieGenre.getMovie().getId() == null) {
                continue;
            }

            if (movieGenre.getGenre() == null || movieGenre.getGenre().getId() == null) {
                continue;
            }

            Long movieId = movieGenre.getMovie().getId();
            Long genreId = movieGenre.getGenre().getId();
            double interest = movieInterestScores.getOrDefault(movieId, 0.0);
            double idf = genreIdfScores.getOrDefault(genreId, 1.0);

            weights.merge(genreId, interest * idf, Double::sum);
        }

        return weights;
    }

    private Map<Long, Double> buildUserActorWeights(
            Map<Long, Double> movieInterestScores,
            Map<Long, Double> actorIdfScores
    ) {
        if (movieInterestScores == null || movieInterestScores.isEmpty()) {
            return Map.of();
        }

        List<Long> movieIds = new ArrayList<>(movieInterestScores.keySet());
        Map<Long, Double> weights = new HashMap<>();

        for (MovieActor movieActor : movieActorRepository.findByMovieIds(movieIds)) {
            if (movieActor == null) {
                continue;
            }

            if (!isImportantActor(movieActor)) {
                continue;
            }

            if (movieActor.getMovie() == null || movieActor.getMovie().getId() == null) {
                continue;
            }

            if (movieActor.getActor() == null || movieActor.getActor().getId() == null) {
                continue;
            }

            Long movieId = movieActor.getMovie().getId();
            Long actorId = movieActor.getActor().getId();
            double interest = movieInterestScores.getOrDefault(movieId, 0.0);
            double idf = actorIdfScores.getOrDefault(actorId, 1.0);
            double roleWeight = calculateActorRoleWeight(movieActor);

            weights.merge(actorId, interest * idf * roleWeight, Double::sum);
        }

        return weights;
    }

    private Map<Long, Set<Long>> loadCandidateGenreIds(List<Long> movieIds) {
        if (movieIds == null || movieIds.isEmpty()) {
            return Map.of();
        }

        Map<Long, Set<Long>> result = new HashMap<>();

        for (MovieGenre movieGenre : movieGenreRepository.findByMovieIds(movieIds)) {
            if (movieGenre.getMovie() == null || movieGenre.getGenre() == null) {
                continue;
            }

            result.computeIfAbsent(movieGenre.getMovie().getId(), key -> new HashSet<>())
                    .add(movieGenre.getGenre().getId());
        }

        return result;
    }

    private Map<Long, Set<Long>> loadCandidateActorIds(List<Long> movieIds) {
        if (movieIds == null || movieIds.isEmpty()) {
            return Map.of();
        }

        Map<Long, Set<Long>> result = new HashMap<>();

        for (MovieActor movieActor : movieActorRepository.findByMovieIds(movieIds)) {
            if (!isImportantActor(movieActor)) {
                continue;
            }

            if (movieActor.getMovie() == null || movieActor.getActor() == null) {
                continue;
            }

            result.computeIfAbsent(movieActor.getMovie().getId(), key -> new HashSet<>())
                    .add(movieActor.getActor().getId());
        }

        return result;
    }

    private Map<Long, Double> loadSentimentScores(List<Long> movieIds) {
        if (movieIds == null || movieIds.isEmpty()) {
            return Map.of();
        }

        Map<Long, Double> result = new HashMap<>();

        for (Object[] row : reviewAnalysisRepository.findAverageSentimentByMovieIds(movieIds)) {
            Long movieId = (Long) row[0];
            Double averageSentiment = (Double) row[1];

            result.put(movieId, normalizeSentiment(averageSentiment));
        }

        return result;
    }

    private CollaborativeResult calculateCollaborativeScores(
            User user,
            List<Rating> userRatings,
            List<Movie> candidates
    ) {
        if (userRatings == null || userRatings.isEmpty() || candidates == null || candidates.isEmpty()) {
            return new CollaborativeResult(Map.of(), 0);
        }

        Set<Long> candidateMovieIds = candidates.stream()
                .filter(Objects::nonNull)
                .map(Movie::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<Long, Double> currentUserRatingMap = userRatings.stream()
                .filter(Objects::nonNull)
                .filter(rating -> rating.getMovie() != null)
                .filter(rating -> rating.getMovie().getId() != null)
                .filter(rating -> rating.getRatingValue() != null)
                .collect(Collectors.toMap(
                        rating -> rating.getMovie().getId(),
                        rating -> safeDouble(rating.getRatingValue()),
                        Math::max
                ));

        if (currentUserRatingMap.isEmpty()) {
            return new CollaborativeResult(Map.of(), 0);
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
            return new CollaborativeResult(Map.of(), 0);
        }

        Map<Long, Double> numeratorByMovie = new HashMap<>();
        Map<Long, Double> denominatorByMovie = new HashMap<>();

        for (Rating rating : otherRatings) {
            if (rating == null || rating.getUser() == null || rating.getMovie() == null) {
                continue;
            }

            Long otherUserId = rating.getUser().getId();
            Long movieId = rating.getMovie().getId();

            if (!candidateMovieIds.contains(movieId)) {
                continue;
            }

            Double similarity = similarityByUser.get(otherUserId);

            if (similarity == null || similarity <= 0) {
                continue;
            }

            double normalizedRating = safeDouble(rating.getRatingValue()) / 5.0;

            numeratorByMovie.merge(movieId, similarity * normalizedRating, Double::sum);
            denominatorByMovie.merge(movieId, similarity, Double::sum);
        }

        Map<Long, Double> collaborativeScores = new HashMap<>();

        for (Long movieId : numeratorByMovie.keySet()) {
            double denominator = denominatorByMovie.getOrDefault(movieId, 0.0);

            if (denominator > 0) {
                collaborativeScores.put(movieId, clamp(numeratorByMovie.get(movieId) / denominator));
            }
        }

        return new CollaborativeResult(collaborativeScores, similarityByUser.size());
    }

    private boolean isImportantActor(MovieActor movieActor) {
        if (movieActor == null) {
            return false;
        }

        if (Boolean.TRUE.equals(movieActor.getMainCast())) {
            return true;
        }

        Integer castOrder = movieActor.getCastOrder();

        return castOrder != null && castOrder <= 5;
    }

    private double normalizeSentiment(Double value) {
        if (value == null) {
            return 0.5;
        }

        if (value >= -1.0 && value <= 1.0) {
            return clamp((value + 1.0) / 2.0);
        }

        return clamp(value);
    }

    private double safeDouble(Double value) {
        return value == null ? 0.0 : value;
    }

    private double clamp(double value) {
        return Math.max(0.0, Math.min(1.0, value));
    }

    private record CollaborativeResult(
            Map<Long, Double> collaborativeScores,
            int similarUserCount
    ) {
    }

    private Map<Long, Double> loadGenreIdfScores() {
        long totalMovies = movieRepository.countByStatus(STATUS_PUBLISHED);

        if (totalMovies <= 0) {
            return Map.of();
        }

        Map<Long, Double> idfScores = new HashMap<>();

        for (Object[] row : movieGenreRepository.countPublishedMoviesByGenre(STATUS_PUBLISHED)) {
            Long genreId = (Long) row[0];
            Long movieCount = (Long) row[1];

            idfScores.put(genreId, calculateIdf(totalMovies, movieCount));
        }

        return idfScores;
    }

    private Map<Long, Double> loadActorIdfScores() {
        long totalMovies = movieRepository.countByStatus(STATUS_PUBLISHED);

        if (totalMovies <= 0) {
            return Map.of();
        }

        Map<Long, Double> idfScores = new HashMap<>();

        for (Object[] row : movieActorRepository.countPublishedMoviesByActor(STATUS_PUBLISHED)) {
            Long actorId = (Long) row[0];
            Long movieCount = (Long) row[1];

            idfScores.put(actorId, calculateIdf(totalMovies, movieCount));
        }

        return idfScores;
    }

    private double calculateIdf(long totalMovies, long moviesWithFeature) {
        return Math.log((totalMovies + 1.0) / (moviesWithFeature + 1.0)) + 1.0;
    }

    private double calculateActorRoleWeight(MovieActor movieActor) {
        if (Boolean.TRUE.equals(movieActor.getMainCast())) {
            return 1.0;
        }

        Integer castOrder = movieActor.getCastOrder();

        if (castOrder == null) {
            return 0.5;
        }

        if (castOrder <= 1) {
            return 1.0;
        }

        if (castOrder == 2) {
            return 0.9;
        }

        if (castOrder == 3) {
            return 0.8;
        }

        if (castOrder == 4) {
            return 0.7;
        }

        if (castOrder == 5) {
            return 0.6;
        }

        return 0.5;
    }
}
