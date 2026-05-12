import axiosClient from './axios';
import { RatingRequest, RatingResponse } from '@/types/rating';

export const ratingService = {
    async rateMovie(payload: RatingRequest): Promise<RatingResponse> {
        const response = await axiosClient.post<RatingResponse>('/ratings', payload);
        return response.data;
    },
    async getRatingsByMovie(moviePublicId: string): Promise<RatingResponse[]> {
        const response = await axiosClient.get<RatingResponse[]>(`/ratings/movie/${moviePublicId}`);
        return response.data;
    }
};
