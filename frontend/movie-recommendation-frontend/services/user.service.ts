import axiosClient from './axios';
import {User} from '@/types/auth';

export const userService = {
    async getCurrentUser(): Promise<User> {
        const response = await axiosClient.get<User>('/users/me');
        return response.data;
    },
}