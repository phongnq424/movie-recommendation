package com.example.movierecommendation.recommendation;

import com.example.movierecommendation.movie.Movie;
import com.example.movierecommendation.movie.MovieRepository;
import com.example.movierecommendation.movieactor.MovieActor;
import com.example.movierecommendation.movieactor.MovieActorRepository;
import com.example.movierecommendation.moviegenre.MovieGenre;
import com.example.movierecommendation.moviegenre.MovieGenreRepository;
import com.example.movierecommendation.reviewanalysis.ReviewAnalysisRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Year;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MovieEmbeddingService {

    private static final int VECTOR_DIMENSION = 128;
    private static final int GENRE_START = 0;
    private static final int GENRE_LENGTH = 80;
    private static final int ACTOR_START = 80;
    private static final int ACTOR_LENGTH = 40;
    private static final int AVG_RATING_INDEX = 120;
    private static final int RATING_COUNT_INDEX = 121;
    private static final int VIEW_COUNT_INDEX = 122;
    private static final int RELEASE_YEAR_INDEX = 123;
    private static final int SENTIMENT_INDEX = 124;
    private static final int DURATION_INDEX = 125;
    private static final int BIAS_INDEX = 126;

    private final MovieRepository movieRepository;
    private final MovieGenreRepository movieGenreRepository;
    private final MovieActorRepository movieActorRepository;
    private final ReviewAnalysisRepository reviewAnalysisRepository;
    private final MovieEmbeddingNativeRepository movieEmbeddingNativeRepository;

    public void refreshMovieEmbedding(Long movieId) {
        Movie movie = movieRepository.findById(movieId)
                .orElse(null);

        if (movie == null) {
            return;
        }

        double[] vector = buildMovieVector(movie);
        String embedding = VectorUtils.toPgVector(vector);

        movieEmbeddingNativeRepository.upsertMovieEmbedding(movie.getId(), embedding);
    }

    public void refreshAllPublishedMovies() {
        List<Movie> movies = movieRepository.findByStatus("PUBLISHED");

        for (Movie movie : movies) {
            refreshMovieEmbedding(movie.getId());
        }
    }

    private double[] buildMovieVector(Movie movie) {
        double[] vector = new double[VECTOR_DIMENSION];

        addGenreFeatures(vector, movie);
        addActorFeatures(vector, movie);
        addMetadataFeatures(vector, movie);

        VectorUtils.normalize(vector);

        return vector;
    }

    private void addGenreFeatures(double[] vector, Movie movie) {
        List<MovieGenre> movieGenres = movieGenreRepository.findByMovieIds(List.of(movie.getId()));

        for (MovieGenre movieGenre : movieGenres) {
            if (movieGenre == null || movieGenre.getGenre() == null || movieGenre.getGenre().getId() == null) {
                continue;
            }

            int index = VectorUtils.hashToIndex(movieGenre.getGenre().getId(), GENRE_START, GENRE_LENGTH);
            vector[index] += 1.0;
        }
    }

    private void addActorFeatures(double[] vector, Movie movie) {
        List<MovieActor> movieActors = movieActorRepository.findByMovieIds(List.of(movie.getId()));

        for (MovieActor movieActor : movieActors) {
            if (movieActor == null || movieActor.getActor() == null || movieActor.getActor().getId() == null) {
                continue;
            }

            if (!isImportantActor(movieActor)) {
                continue;
            }

            int index = VectorUtils.hashToIndex(movieActor.getActor().getId(), ACTOR_START, ACTOR_LENGTH);
            vector[index] += calculateActorRoleWeight(movieActor);
        }
    }

    private void addMetadataFeatures(double[] vector, Movie movie) {
        vector[AVG_RATING_INDEX] = safeDouble(movie.getAverageRating()) / 5.0;
        vector[RATING_COUNT_INDEX] = normalizeLog(safeInt(movie.getRatingCount()), 100.0);
        vector[VIEW_COUNT_INDEX] = normalizeLog(safeLong(movie.getViewCount()), 10000.0);
        vector[RELEASE_YEAR_INDEX] = calculateFreshness(movie.getReleaseYear());
        vector[SENTIMENT_INDEX] = loadSentiment(movie.getId());
        vector[DURATION_INDEX] = normalizeDuration(movie.getDurationMinutes());
        vector[BIAS_INDEX] = 1.0;
    }

    private double loadSentiment(Long movieId) {
        List<Object[]> rows = reviewAnalysisRepository.findAverageSentimentByMovieIds(List.of(movieId));

        if (rows == null || rows.isEmpty()) {
            return 0.5;
        }

        Object[] row = rows.get(0);
        Double value = (Double) row[1];

        if (value == null) {
            return 0.5;
        }

        if (value >= -1.0 && value <= 1.0) {
            return clamp((value + 1.0) / 2.0);
        }

        return clamp(value);
    }

    private boolean isImportantActor(MovieActor movieActor) {
        if (Boolean.TRUE.equals(movieActor.getMainCast())) {
            return true;
        }

        Integer castOrder = movieActor.getCastOrder();

        return castOrder != null && castOrder <= 5;
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

    private double calculateFreshness(Integer releaseYear) {
        if (releaseYear == null || releaseYear <= 0) {
            return 0.5;
        }

        int currentYear = Year.now().getValue();
        int age = Math.max(0, currentYear - releaseYear);

        return clamp(Math.exp(-age / 8.0));
    }

    private double normalizeDuration(Integer durationMinutes) {
        if (durationMinutes == null || durationMinutes <= 0) {
            return 0.5;
        }

        return clamp(durationMinutes / 180.0);
    }

    private double normalizeLog(long value, double target) {
        return clamp(Math.log1p(value) / Math.log1p(target));
    }

    private double safeDouble(Double value) {
        return value == null ? 0.0 : value;
    }

    private int safeInt(Integer value) {
        return value == null ? 0 : value;
    }

    private long safeLong(Long value) {
        return value == null ? 0L : value;
    }

    private double clamp(double value) {
        return Math.max(0.0, Math.min(1.0, value));
    }

    public void refreshMissingMovieEmbeddings() {
        List<Movie> movies = movieRepository.findByStatus("PUBLISHED");

        for (Movie movie : movies) {
            if (movie == null || movie.getId() == null) {
                continue;
            }

            boolean exists = movieEmbeddingNativeRepository.existsByMovieId(movie.getId());

            if (!exists) {
                refreshMovieEmbedding(movie.getId());
            }
        }
    }
}