export type MovieStatus = "DRAFT" | "PUBLISHED" | "HIDDEN" | "DELETED";

export interface Movie {
    publicId: string;
    title: string;
    originalTitle?: string;
    slug: string;
    description?: string;
    releaseYear: number;
    durationMinutes?: number;
    posterUrl?: string;
    backdropUrl?: string;
    trailerUrl?: string;
    movieUrl?: string;
    quality?: string;
    ageRating?: string;
    status: MovieStatus;
    averageRating: number;
    ratingCount: number;
    viewCount: number;
}

export interface MovieRequest {
    title: string;
    originalTitle?: string;
    description?: string;
    releaseYear: number;
    durationMinutes?: number;
    posterUrl?: string;
    backdropUrl?: string;
    trailerUrl?: string;
    movieUrl?: string;
    quality?: string;
    ageRating?: string;
    status?: MovieStatus;
}

export type MovieActorResponse = {
    id: number;
    movieId: number;
    movieTitle: string;
    actorId: number;
    actorFullName: string;
    actorAvatarUrl: string | null;
    characterName: string | null;
    castOrder: number | null;
    mainCast: boolean | null;
};

export type MovieGenreResponse = {
    id: number;
    movieId: number;
    movieTitle: string;
    genreId: number;
    genreName: string;
    genreSlug: string;
};

export type MovieDetailResponse = MovieResponse & {
    actors: MovieActorResponse[];
    genres: MovieGenreResponse[];
};