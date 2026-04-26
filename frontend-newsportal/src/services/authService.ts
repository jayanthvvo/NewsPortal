import api from '../api/axiosConfig';

export interface LoginCredentials {
    username?: string;
    password?: string;
}

export const authService = {
    login: async (credentials: LoginCredentials) => {
        try {
            // Sends request to http://localhost:8080/auth/login
            const response = await api.post('/auth/login', credentials);
            
            if (response.data && response.data.token) {
                localStorage.setItem('token', response.data.token);
            }
            return response.data;
        } catch (error) {
            console.error("Login request failed:", error);
            throw error; 
        }
    },

    logout: () => {
        localStorage.removeItem('token');
    },

    isAuthenticated: (): boolean => {
        return !!localStorage.getItem('token');
    }
};