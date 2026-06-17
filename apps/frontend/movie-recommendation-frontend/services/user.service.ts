import axiosClient from './axios';
import {User} from '@/types/auth';

export const userService = {
    async getCurrentUser(): Promise<User> {
        const response = await axiosClient.get<User>('/users/me');
        return response.data;
    },

    async getAllUsers(): Promise<User[]> {
        const response = await axiosClient.get<User[]>('/users');
        return response.data;
    },
    
    async searchUsers(keyword: string): Promise<User[]> {
        const response = await axiosClient.get<User[]>('/users/search', { params: { keyword } });
        return response.data;
    },
    
    async updateUserStatus(publicId: string, status: string): Promise<User> {
        const response = await axiosClient.put<User>(`/users/${publicId}/status`, { status });
        return response.data;
    },

    async deleteUser(publicId: string): Promise<void> {
        await axiosClient.delete(`/users/${publicId}`);
    }
}