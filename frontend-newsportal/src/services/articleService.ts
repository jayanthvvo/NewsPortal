import api from '../api/axiosConfig';

export interface Article {
    id?: number;
    title: string;
    content: string;
    author: string;
    categoryId: number; 
    status: string;
}

export const articleService = {
    // --- ADMIN ENDPOINTS ---
    getPendingReviews: async (): Promise<Article[]> => {
        const response = await api.get('/articles/pending-review');
        return response.data;
    },
    // --- READER ENDPOINTS ---
    // Fetch all PUBLISHED articles for the main news feed
    // Fetch a single article by its ID
    getArticleById: async (id: number): Promise<Article> => {
        const response = await api.get(`/articles/${id}`);
        return response.data;
    },
    getAllPublishedArticles: async (): Promise<Article[]> => {
        const response = await api.get('/articles/all');
        return response.data;
    },
    updateArticleStatus: async (id: number, status: string): Promise<Article> => {
        const response = await api.post(`/articles/${id}/status`, null, { params: { status } });
        return response.data;
    },
    deleteArticle: async (id: number): Promise<void> => {
        await api.delete(`/articles/delete/${id}`);
    },

    // --- AUTHOR ENDPOINTS ---
    // Create a brand new article (Default status is usually DRAFT)
    createArticle: async (articleData: { title: string; content: string; categoryId: number }): Promise<Article> => {
        const response = await api.post('/articles/create', articleData);
        return response.data;
    },
    
    // Get all articles written by the currently logged-in author
    getMyArticles: async (): Promise<Article[]> => {
        // If your Java backend figures out the author via the JWT token:
        const response = await api.get('/articles/my-articles'); 
        return response.data;
    },

    // Submit an existing draft to the Admin for review
    submitForReview: async (id: number): Promise<Article> => {
        const response = await api.post(`/articles/${id}/status`, null, { params: { status: 'REVIEW' } });
        return response.data;
    }
    
};