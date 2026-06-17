import axiosClient from './axios';
import { LoginRequest, RegisterRequest, AuthResponse } from '@/types/auth';
import Cookies from 'js-cookie';

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await axiosClient.post<AuthResponse>(
      '/auth/login',
      credentials
    );

    this.setAuthTokens(
      response.data.accessToken,
      response.data.refreshToken
    );

    localStorage.setItem('user_info', JSON.stringify({
      userPublicId: response.data.userPublicId,
      fullName: response.data.fullName,
      email: response.data.email,
      role: response.data.role,
    }));

    window.dispatchEvent(new Event('auth-change'));

    return response.data;
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await axiosClient.post<AuthResponse>(
      '/auth/register',
      data
    );

    this.setAuthTokens(
      response.data.accessToken,
      response.data.refreshToken
    );

    localStorage.setItem('user_info', JSON.stringify({
      userPublicId: response.data.userPublicId,
      fullName: response.data.fullName,
      email: response.data.email,
      role: response.data.role,
    }));

    window.dispatchEvent(new Event('auth-change'));

    return response.data;
  },

  async logout(): Promise<void> {
    try {
      const refreshToken = Cookies.get('refresh_token');

      if (refreshToken) {
        await axiosClient.post('/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearAllData();
    }
  },

  setAuthTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);

    Cookies.set('access_token', accessToken, { expires: 1, path: '/' });
    Cookies.set('refresh_token', refreshToken, { expires: 7, path: '/' });
  },

  getToken() {
    return Cookies.get('access_token') || localStorage.getItem('access_token');
  },

  getRefreshToken() {
    return Cookies.get('refresh_token') || localStorage.getItem('refresh_token');
  },

  clearAllData() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_info');

    Cookies.remove('access_token', { path: '/' });
    Cookies.remove('refresh_token', { path: '/' });

    window.dispatchEvent(new Event('auth-change'));
  },

  isAuthenticated() {
    return !!this.getToken();
  },
};