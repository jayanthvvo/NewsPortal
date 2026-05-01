import api from '../api/axiosConfig';
import axiosInstance from '../api/axiosConfig';

export interface LoginCredentials {
    username?: string;
    password?: string;
}

export interface RegisterCredentials {
    username: string;
    email: string;
    password: string;
    rolerequest: string; // Changed to match request.getRolerequest() in Java
}

export const authService = {
    login: async (credentials: LoginCredentials) => {
        try {
            const response = await api.post('/auth/login', credentials);
            
            if (response.data && response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('role', response.data.role); 
            }
            return response.data;
        } catch (error) {
            console.error("Login request failed:", error);
            throw error; 
        }
    },

    register: async (data: RegisterCredentials) => {
        try {
            const response = await api.post('/auth/register', data);
            return response.data;
        } catch (error) {
            console.error("Registration request failed:", error);
            throw error;
        }
    },
    forgotPassword: async (email: string) => {
    const response = await axiosInstance.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (resetData: { email: string; otp: string; newPassword: string }) => {
    // Adjust the URL if your backend endpoint is named differently
    const response = await axiosInstance.post('/auth/reset-password', resetData);
    return response.data;
  },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
    },

    isAuthenticated: (): boolean => {
        return !!localStorage.getItem('token');
    },

    getRole: (): string | null => {
        return localStorage.getItem('role');
    }
};