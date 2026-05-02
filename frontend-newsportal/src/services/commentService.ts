import api from '../api/axiosConfig';

export interface Comment {
    id?: number;
    articleId: number;
    authorUsername?: string; 
    content: string;         
    createdAt?: string; 
}

export const commentService = {
    getCommentsByArticle: async (articleId: number): Promise<Comment[]> => {
        try {
            const response = await api.get(`/comments/article/${articleId}`);
            return response.data;
        } catch (error) {
            console.error("Failed to fetch comments", error);
            return []; 
        }
    },

    postComment: async (commentData: { articleId: number; content: string }): Promise<Comment> => {
        try {
            const response = await api.post('/comments/create', commentData);
            return response.data;
        } catch (error) {
            console.error("Failed to post comment", error);
            throw error;
        }
    },

    // --- NEW: Add Delete Comment functionality ---
    deleteComment: async (id: number): Promise<void> => {
        try {
            await api.delete(`/comments/delete/${id}`);
        } catch (error) {
            console.error("Failed to delete comment", error);
            throw error;
        }
    }
};