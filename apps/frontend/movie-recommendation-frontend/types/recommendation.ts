export interface RecommendationScoreBreakdown {
    contentScore?: number;
    collaborativeScore?: number;
    popularityScore?: number;
    freshnessScore?: number;
    sentimentScore?: number;
    contentWeight?: number;
    collaborativeWeight?: number;
    popularityWeight?: number;
    freshnessWeight?: number;
    sentimentWeight?: number;
    negativePenalty?: number;
    strategy?: string;
}

export interface RecommendationResponse {
    moviePublicId: string;
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
    averageRating: number;
    ratingCount: number;
    viewCount: number;
    finalScore: number;
    scoreBreakdown?: RecommendationScoreBreakdown;
}
