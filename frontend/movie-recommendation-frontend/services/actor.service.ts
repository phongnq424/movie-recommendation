import axiosClient from "./axios";

export const actorService = {
    async getMoviesByActor(actorPublicId: string) {
        const response = await axiosClient.get(`/movie-actors/actor/${actorPublicId}`);
        return response.data;
    }
};
