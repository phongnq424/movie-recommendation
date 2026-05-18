import axios, { InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const axiosClient = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
    refreshSubscribers.push(cb);
};

const onRefreshed = (token: string) => {
    refreshSubscribers.forEach((cb) => cb(token));
    refreshSubscribers = [];
};

const clearAuthAndRedirect = () => {
    Cookies.remove('access_token', { path: '/' });
    Cookies.remove('refresh_token', { path: '/' });
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_info');

    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth-change'));
        window.location.href = '/auth/login';
    }
};

axiosClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = Cookies.get('access_token');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const status = error.response?.status;

        if (status !== 401 || originalRequest._retry) {
            return Promise.reject(error);
        }

        const refreshToken = Cookies.get('refresh_token');
        if (!refreshToken) {
            clearAuthAndRedirect();
            return Promise.reject(error);
        }

        if (isRefreshing) {
            return new Promise((resolve) => {
                subscribeTokenRefresh((newToken: string) => {
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    resolve(axiosClient(originalRequest));
                });
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
            const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
            const { accessToken, refreshToken: newRefreshToken } = res.data;

            Cookies.set('access_token', accessToken, { expires: 1, path: '/' });
            Cookies.set('refresh_token', newRefreshToken, { expires: 7, path: '/' });

            axiosClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
            onRefreshed(accessToken);

            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return axiosClient(originalRequest);
        } catch (refreshError) {
            clearAuthAndRedirect();
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    }
);

export default axiosClient;