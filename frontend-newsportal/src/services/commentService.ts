import api from '../api/axiosConfig';

export interface Comment {
    id?: number;
    articleId: number;
    authorUsername?: string; // Note: Your Java backend calls it authorUsername!
    content: string;         // Note: Changed from 'text' to 'content'!
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

    // CHANGED: We only need to send articleId and content!
    postComment: async (commentData: { articleId: number; content: string }): Promise<Comment> => {
        try {
            const response = await api.post('/comments/create', commentData);
            return response.data;
        } catch (error) {
            console.error("Failed to post comment", error);
            throw error;
        }
    }
};