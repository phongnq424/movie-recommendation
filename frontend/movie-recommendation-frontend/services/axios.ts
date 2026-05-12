import axios, { AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// 1. Tạo Instance
const axiosClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 2. Interceptor cho Request: Tự động thêm Access Token
axiosClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // Lấy token từ localStorage hoặc Cookies
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
        
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// 3. Interceptor cho Response: Xử lý lỗi tập trung (ví dụ: Token hết hạn)
axiosClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const message = error.response?.data?.message || 'Đã có lỗi xảy ra';
        
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
            
            if (refreshToken) {
                try {
                    const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
                    const { accessToken, refreshToken: newRefreshToken } = res.data;
                    
                    localStorage.setItem('access_token', accessToken);
                    localStorage.setItem('refresh_token', newRefreshToken);
                    
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                    return axiosClient(originalRequest);
                } catch (refreshError) {
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    localStorage.removeItem('user_info');
                    if (typeof window !== 'undefined') {
                        window.dispatchEvent(new Event('auth-change'));
                        window.location.href = '/auth/login';
                    }
                    return Promise.reject(refreshError);
                }
            }
        }
        
        return Promise.reject(new Error(message));
    }
);

export default axiosClient;