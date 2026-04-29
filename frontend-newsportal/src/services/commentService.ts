import api from '../api/axiosConfig';

export interface Comment {
    id?: number;
    articleId: number;
    author: string; // The person who wrote the comment
    text: string;
    createdAt?: string; 
}

export const commentService = {
    // Get all comments for a specific article
    getCommentsByArticle: async (articleId: number): Promise<Comment[]> => {
        try {
            // Note: If your backend uses just '/comments/{articleId}', change the string below!
            const response = await api.get(`/comments/article/${articleId}`);
            return response.data;
        } catch (error) {
            console.error("Failed to fetch comments", error);
            return []; // Return empty array if no comments exist yet
        }
    },

    // Post a new comment
    postComment: async (commentData: { articleId: number; text: string }): Promise<Comment> => {
        try {
            // Note: Update to '/comments/add' if your Java backend uses that instead of '/create'
            const response = await api.post('/comments/create', commentData);
            return response.data;
        } catch (error) {
            console.error("Failed to post comment", error);
            throw error;
        }
    }
};