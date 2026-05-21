export type InteractionType =
    | "PLAY"
    | "PAUSE"
    | "FINISH_WATCHING"
    | "WATCH_PROGRESS"
    | "WATCH_25_PERCENT"
    | "WATCH_50_PERCENT"
    | "WATCH_75_PERCENT"
    | "VIEW_DETAIL";

export interface TrackInteractionRequest {
    interactionType: InteractionType;
    value?: number;
    watchedSeconds?: number;
    durationSeconds?: number;
    progressPercent?: number;
}

export interface UserMovieInteractionResponse {
    id: number;
    moviePublicId: string;
    movieTitle: string;
    interactionType: InteractionType;
    value: number;
    watchedSeconds?: number;
    durationSeconds?: number;
    progressPercent?: number;
    createdAt: string;
}