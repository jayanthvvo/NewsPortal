import api from '../api/axiosConfig';

export interface User {
    id: number;
    username: string;
    email: string;
    role: string;
    status: string; 
}

export const adminService = {
    // MATCHES POSTMAN EXACTLY: Removed '/auth' from the beginning
    getAllUsers: async (): Promise<User[]> => {
        try {
            const response = await api.get('/admin/pending-requests'); 
            return response.data;
        } catch (error) {
            console.error("Failed to fetch users:", error);
            throw error;
        }
    },

    // MATCHES BACKEND: Removed '/auth' from the beginning
    approveUser: async (userId: number): Promise<string> => {
        try {
            const response = await api.post(`/admin/approve/${userId}`);
            return response.data; 
        } catch (error) {
            console.error("Failed to approve user:", error);
            throw error;
        }
    }
};