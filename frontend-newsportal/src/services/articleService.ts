import api from '../api/axiosConfig';

export interface Article {
    id: number;
    title: string;
    content: string;
    author: string;
    status: string;
}

export const articleService = {
    // 1. Fetch articles waiting for Admin approval
    getPendingReviews: async (): Promise<Article[]> => {
        try {
            const response = await api.get('/articles/pending-review');
            return response.data;
        } catch (error) {
            console.error("Failed to fetch pending articles:", error);
            throw error;
        }
    },

    // 2. Change the status (e.g., to PUBLISHED or back to DRAFT)
    updateArticleStatus: async (id: number, status: string): Promise<Article> => {
        try {
            // Your Java backend expects @RequestParam String status
            const response = await api.post(`/articles/${id}/status`, null, {
                params: { status }
            });
            return response.data;
        } catch (error) {
            console.error(`Failed to update article status to ${status}:`, error);
            throw error;
        }
    },

    // 3. Completely delete an article
    deleteArticle: async (id: number): Promise<void> => {
        try {
            await api.delete(`/articles/delete/${id}`);
        } catch (error) {
            console.error("Failed to delete article:", error);
            throw error;
        }
    }
};