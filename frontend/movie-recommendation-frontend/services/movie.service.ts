import axiosClient from "@/services/axios";
import type { Movie, MovieDetailResponse, MovieRequest } from "@/types/movie";

export const movieService = {
    async getAllMovies(): Promise<Movie[]> {
        const response = await axiosClient.get<Movie[]>("/movies");
        return response.data;
    },

    async getPublishedMovies(): Promise<Movie[]> {
        const response = await axiosClient.get<Movie[]>("/movies/published");
        return response.data;
    },

    async getMovieByPublicId(publicId: string): Promise<Movie> {
        const response = await axiosClient.get<Movie>(`/movies/${publicId}`);
        return response.data;
    },

    async getMovieBySlug(slug: string): Promise<MovieDetailResponse> {
        const response = await axiosClient.get<MovieDetailResponse>(`/movies/slug/${slug}/detail`);
        return response.data;
    },

    async searchMovies(keyword: string): Promise<Movie[]> {
        const response = await axiosClient.get<Movie[]>("/movies/search", {
            params: { keyword }
        });
        return response.data;
    },

    async createMovie(payload: MovieRequest): Promise<Movie> {
        const response = await axiosClient.post<Movie>("/movies", payload);
        return response.data;
    },

    async createMovies(payload: MovieRequest[]): Promise<Movie[]> {
        const response = await axiosClient.post<Movie[]>("/movies/bulk", payload);
        return response.data;
    },

    async updateMovie(publicId: string, payload: MovieRequest): Promise<Movie> {
        const response = await axiosClient.put<Movie>(`/movies/${publicId}`, payload);
        return response.data;
    },

    async softDeleteMovie(publicId: string): Promise<Movie> {
        const response = await axiosClient.delete<Movie>(`/movies/${publicId}`);
        return response.data;
    },

    async bulkDeleteMovies(publicIds: string[]): Promise<Movie[]> {
        const response = await axiosClient.post<Movie[]>("/movies/bulk-delete", { publicIds });
        return response.data;
    },

    getMovieDetailBySlug: async (slug: string): Promise<MovieDetailResponse> => {
        const response = await axiosClient.get(`/movies/slug/${slug}/detail`);
        return response.data;
    },
};