import api from '../api/axiosConfig';

export const alertService = {
    // Send a breaking news alert to all users
    sendBreakingNews: async (message: string): Promise<string> => {
        try {
            const response = await api.post('/alerts/breaking-news', { message });
            return response.data;
        } catch (error) {
            console.error("Failed to send breaking news alert", error);
            throw error;
        }
    }
};