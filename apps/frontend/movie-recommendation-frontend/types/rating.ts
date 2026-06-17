export interface RatingRequest {
    moviePublicId: string;
    ratingValue: number;
}

export interface RatingResponse {
    id?: number;
    userPublicId?: string;
    moviePublicId?: string;
    userFullName?: string;
    movieTitle?: string;
    ratingValue?: number;
}
