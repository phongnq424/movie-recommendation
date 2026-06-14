import axiosClient from "@/services/axios";
import { RecommendationResponse } from "@/types/recommendation";

export const recommendationService = {
    async getPublicRecommendations(limit: number = 20): Promise<RecommendationResponse[]> {
        const response = await axiosClient.get<RecommendationResponse[]>("/recommendations/public", {
            params: { limit },
        });
        return response.data;
    },

    async getMyRecommendations(limit: number = 20): Promise<RecommendationResponse[]> {
        const response = await axiosClient.get<RecommendationResponse[]>("/recommendations/me", {
            params: { limit },
        });
        return response.data;
    },

    async refreshMyRecommendations(limit: number = 20): Promise<RecommendationResponse[]> {
        const response = await axiosClient.post<RecommendationResponse[]>("/recommendations/me/refresh", null, {
            params: { limit },
        });
        return response.data;
    },

    async refreshPublicRecommendations(limit: number = 20): Promise<RecommendationResponse[]> {
        const response = await axiosClient.post<RecommendationResponse[]>("/recommendations/admin/refresh-public", null, {
            params: { limit },
        });
        return response.data;
    },
};
