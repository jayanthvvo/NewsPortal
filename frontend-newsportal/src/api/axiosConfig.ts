import axios, { type InternalAxiosRequestConfig } from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8080',
});

api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('token');

        if (token && config.headers) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        return config;
    },
    (error: any) => {
        return Promise.reject(error);
    }
);

// Handle expired/invalid JWT
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('role');

            window.location.href = '/login';
        }

        return Promise.reject(error);
    }
);

export default api;