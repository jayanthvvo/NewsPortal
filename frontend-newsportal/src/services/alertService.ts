import api from '../api/axiosConfig';

export interface BreakingNewsPayload {
    headline?: string;
    message: string;
    articleId?: number | null;
    articleTitle?: string;
    priority?: 'CRITICAL' | 'BREAKING' | 'FLASH';
    category?: string;
}

export interface BreakingAlert {
    id?: number;
    headline?: string;
    message: string;
    articleId?: number;
    articleTitle?: string;
    priority?: string;
    category?: string;
    createdAt?: string;
}

export const alertService = {
    // Send a breaking news alert to all users (supports both raw string and rich structured payload)
    sendBreakingNews: async (payload: string | BreakingNewsPayload): Promise<string> => {
        try {
            const body = typeof payload === 'string' ? { message: payload } : payload;
            const response = await api.post('/alerts/breaking-news', body);
            return response.data;
        } catch (error) {
            console.error("Failed to send breaking news alert", error);
            throw error;
        }
    },

    // Fetch the most recent breaking news broadcast for the live ticker
    getLatestBreakingNews: async (): Promise<BreakingAlert | null> => {
        try {
            const response = await api.get('/alerts/latest-breaking');
            if (response.status === 204 || !response.data) {
                return null;
            }
            return response.data;
        } catch (error) {
            // Fail gracefully if service is unavailable so feed loads uninterrupted
            return null;
        }
    }
};
