import axiosClient from "./axios";

export const reviewService = {
    async getAllReviewsByMovie(movieId: string): Promise<any[]> {
        const response = await axiosClient.get(`/reviews/movie/${movieId}/all`);
        return response.data;
    },
    async deleteReview(id: number): Promise<void> {
        await axiosClient.delete(`/reviews/${id}`);
    },
    async updateReviewStatus(id: number, status: string): Promise<any> {
        const response = await axiosClient.put(`/reviews/${id}/status`, { status });
        return response.data;
    },
    async getPublishedReviewsByMovie(movieId: string): Promise<any[]> {
        const response = await axiosClient.get(`/reviews/movie/${movieId}`);
        return response.data;
    },
    async createReview(data: { moviePublicId: string; content: string; spoiler: boolean }): Promise<any> {
        const response = await axiosClient.post('/reviews', data);
        return response.data;
    }
};
