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
    },
    async getAllGenres(): Promise<GenreResponse[]> {
        const response = await axiosClient.get<GenreResponse[]>("/genres");
        return response.data;
    },
    async searchGenres(keyword: string): Promise<GenreResponse[]> {
        const response = await axiosClient.get<GenreResponse[]>("/genres/search", { params: { keyword } });
        return response.data;
    },
    async createGenre(data: { name: string; description?: string; status?: string }): Promise<GenreResponse> {
        const response = await axiosClient.post<GenreResponse>("/genres", data);
        return response.data;
    },
    async updateGenre(publicId: string, data: { name: string; description?: string; status?: string }): Promise<GenreResponse> {
        const response = await axiosClient.put<GenreResponse>(`/genres/${publicId}`, data);
        return response.data;
    },
    async deleteGenre(publicId: string): Promise<GenreResponse> {
        const response = await axiosClient.delete<GenreResponse>(`/genres/${publicId}`);
        return response.data;
    },
    async updateGenreStatus(publicId: string, status: string): Promise<GenreResponse> {
        const response = await axiosClient.put<GenreResponse>(`/genres/${publicId}/status?status=${status}`);
        return response.data;
    }
};
