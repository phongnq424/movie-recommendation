import axiosClient from "./axios";
import type { GenreResponse } from "@/types/genre";
import type { MovieGenreResponse } from "@/types/movie-genre";

export const genreService = {
    async getActiveGenres(): Promise<GenreResponse[]> {
        const response = await axiosClient.get<GenreResponse[]>("/genres/active");
        return response.data;
    },
    async getMoviesByGenre(genrePublicId: string): Promise<MovieGenreResponse[]> {
        const response = await axiosClient.get<MovieGenreResponse[]>(`/movie-genres/genre/${genrePublicId}`);
        return response.data;
    }
};
