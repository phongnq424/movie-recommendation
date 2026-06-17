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
    moviePublicId: string;      // UUID
    movieTitle: string;
    movieSlug: string;

    actorPublicId: string;      // UUID
    actorFullName: string;
    actorAvatarUrl: string;

    characterName: string;
    castOrder: number;          // số thứ tự xuất hiện (billing order)
    mainCast: boolean;          // diễn viên chính hay phụ
};

export type MovieGenreResponse = {
    id: number;
    moviePublicId: string;
    movieTitle: string;
    genrePublicId: string;
    genreName: string;
    genreSlug: string;
    movieSlug: string;
};

export type MovieDetailResponse = Movie & {
    actors: MovieActorResponse[];
    genres: MovieGenreResponse[];
};

export interface PaginationResponse<T> {
    content: T[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
    empty: boolean;
    isLast?: boolean;
}

export type MoviePaginatedResponse = PaginationResponse<Movie>;

