import axiosClient from './axios';
import { LoginRequest, RegisterRequest, AuthResponse } from '@/types/auth';

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await axiosClient.post<AuthResponse>(
        '/auth/login',
        credentials
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await axiosClient.post<AuthResponse>(
        '/auth/register',
        data
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async logout(): Promise<void> {
    try {
      const refreshToken = typeof window !== 'undefined' 
        ? localStorage.getItem('refresh_token') 
        : null;
      
      if (refreshToken) {
        await axiosClient.post('/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearAllData();
    }
  },

  setToken(token: string) {
    localStorage.setItem('access_token', token);
  },

  getToken() {
    return typeof window !== 'undefined' 
      ? localStorage.getItem('access_token')
      : null;
  },

  clearToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
    }
  },

  clearAllData() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_info');
    }
  },

  isAuthenticated() {
    return !!this.getToken();
  },
};
