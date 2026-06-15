import axiosClient from './axios';
import type {
    Actor,
    ActorPaginatedResponse,
    ActorRequest,
} from '@/types/actor';

export const actorService = {
    async getMoviesByActor(actorPublicId: string) {
        const response = await axiosClient.get(
            `/movie-actors/actor/${actorPublicId}`
        );
        return response.data;
    },

    async getAllActorsPaginated(
        page: number = 0,
        size: number = 20
    ): Promise<ActorPaginatedResponse> {
        const response = await axiosClient.get<ActorPaginatedResponse>(
            '/actors',
            {
                params: { page, size },
            }
        );

        return response.data;
    },

    async searchActorsPaginated(
        keyword: string,
        page: number = 0,
        size: number = 20
    ): Promise<ActorPaginatedResponse> {
        const response = await axiosClient.get<ActorPaginatedResponse>(
            '/actors/search',
            {
                params: { keyword, page, size },
            }
        );

        return response.data;
    },

    /**
     * Giữ lại để các chỗ cũ chưa phân trang không bị vỡ ngay.
     * Nhưng với admin list nên dùng getAllActorsPaginated().
     */
    async getAllActors(): Promise<Actor[]> {
        const response = await this.getAllActorsPaginated(0, 50);
        return response.content || [];
    },

    async searchActors(keyword: string): Promise<Actor[]> {
        const response = await this.searchActorsPaginated(keyword, 0, 50);
        return response.content || [];
    },

    async createActor(data: ActorRequest): Promise<Actor> {
        const response = await axiosClient.post<Actor>('/actors', data);
        return response.data;
    },

    async updateActor(publicId: string, data: ActorRequest): Promise<Actor> {
        const response = await axiosClient.put<Actor>(
            `/actors/${publicId}`,
            data
        );
        return response.data;
    },

    async updateActorStatus(publicId: string, status: string): Promise<Actor> {
        const response = await axiosClient.put<Actor>(
            `/actors/${publicId}/status`,
            null,
            {
                params: { status },
            }
        );

        return response.data;
    },

    async deleteActor(publicId: string): Promise<Actor> {
        const response = await axiosClient.delete<Actor>(
            `/actors/${publicId}`
        );
        return response.data;
    },

    async getAllActiveActors(): Promise<Actor[]> {
        const response = await axiosClient.get<Actor[]>('/actors/active');
        return response.data;
    },
};