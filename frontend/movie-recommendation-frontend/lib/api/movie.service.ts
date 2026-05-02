import { apiClient } from "./api-client";
import type { Movie, MovieRequest } from "@/lib/types/movie";

export const movieService = {
    getAllMovies() {
        return apiClient<Movie[]>("/movies");
    },

    getPublishedMovies() {
        return apiClient<Movie[]>("/movies/published");
    },

    getMovieByPublicId(publicId: string) {
        return apiClient<Movie>(`/movies/${publicId}`);
    },

    getMovieBySlug(slug: string) {
        return apiClient<Movie>(`/movies/slug/${slug}`);
    },

    searchMovies(keyword: string) {
        return apiClient<Movie[]>(
            `/movies/search?keyword=${encodeURIComponent(keyword)}`
        );
    },

    createMovie(payload: MovieRequest) {
        return apiClient<Movie>("/movies", {
            method: "POST",
            body: JSON.stringify(payload),
        });
    },

    createMovies(payload: MovieRequest[]) {
        return apiClient<Movie[]>("/movies/bulk", {
            method: "POST",
            body: JSON.stringify(payload),
        });
    },

    updateMovie(publicId: string, payload: MovieRequest) {
        return apiClient<Movie>(`/movies/${publicId}`, {
            method: "PUT",
            body: JSON.stringify(payload),
        });
    },

    softDeleteMovie(publicId: string) {
        return apiClient<Movie>(`/movies/${publicId}`, {
            method: "DELETE",
        });
    },

    bulkDeleteMovies(publicIds: string[]) {
        return apiClient<Movie[]>("/movies/bulk-delete", {
            method: "POST",
            body: JSON.stringify({ publicIds }),
        });
    },
};