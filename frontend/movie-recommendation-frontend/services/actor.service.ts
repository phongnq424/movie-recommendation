import axiosClient from "./axios";
import { Actor } from "../types/actor";

export const actorService = {
    async getMoviesByActor(actorPublicId: string) {
        const response = await axiosClient.get(`/movie-actors/actor/${actorPublicId}`);
        return response.data;
    },
    async getAllActors() {
        const response = await axiosClient.get("/actors");
        return response.data;
    },
    async searchActors(keyword: string) {
        const response = await axiosClient.get("/actors/search", { params: { keyword } });
        return response.data;
    },
    async createActor(data: { fullName: string; biography?: string; avatarUrl?: string; nationality?: string; birthYear?: number; featured?: boolean; status?: string }) {
        const response = await axiosClient.post("/actors", data);
        return response.data;
    },
    async updateActor(publicId: string, data: { fullName: string; biography?: string; avatarUrl?: string; nationality?: string; birthYear?: number; featured?: boolean; status?: string }) {
        const response = await axiosClient.put(`/actors/${publicId}`, data);
        return response.data;
    },
    async deleteActor(publicId: string) {
        const response = await axiosClient.delete(`/actors/${publicId}`);
        return response.data;
    },
    async getAllActiveActors(): Promise<Actor[]> {
        const response = await axiosClient.get<Actor[]>("/actors/active");
        return response.data;
    },
    async getFeaturedActors(): Promise<Actor[]> {
        const response = await axiosClient.get<Actor[]>("/actors/featured");
        return response.data;
    },
};

