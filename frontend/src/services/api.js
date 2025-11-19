import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { auth } from '../config/firebase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor
api.interceptors.request.use(async (config) => {
    const user = auth.currentUser;
    if (user) {
        try {
            const token = await user.getIdToken();
            config.headers.Authorization = `Bearer ${token}`;
        } catch (error) {
            console.error('Failed to get token:', error);
            delete config.headers.Authorization;
        }
    } else {
        delete config.headers.Authorization;
    }
    return config;
});

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const status = error.response?.status;
        const message = error.response?.data?.error || error.response?.data?.message || '';

        if (!error.response) {
            console.error('Network error:', {
                message: error.message,
                code: error.code,
                config: originalRequest?.url,
            });
        }

        const isTokenExpired = status === 401 && (
            message.includes('id-token-expired') || 
            message.includes('expired') ||
            message.includes('invalid token')
        );

        if (isTokenExpired && !originalRequest._retry) {
            originalRequest._retry = true;
            
            const user = auth.currentUser;
            if (user) {
                try {
                    const freshToken = await user.getIdToken(true); 
                    originalRequest.headers.Authorization = `Bearer ${freshToken}`;
                    
                    return api(originalRequest);
                } catch (refreshError) {
                    console.error('Failed to refresh token:', refreshError);
                    return Promise.reject(error);
                }
            }
        }

        return Promise.reject(error);
    }
);

export default api;