
import api from '../api/axiosConfig';

export interface Article {
    id?: number;
    title: string;
    content: string;
    author: string;
    categoryId: number;
    status: string;
    viewCount?: number;
}

export interface ArticleLikeResponse {
    articleId: number;
    liked: boolean;
    likeCount: number;
}

export const articleService = {

    // =========================
    // ADMIN ENDPOINTS
    // =========================

    getPendingReviews: async (): Promise<Article[]> => {
        const response = await api.get('/articles/pending-review');
        return response.data;
    },


    // =========================
    // READER ENDPOINTS
    // =========================

    getArticleById: async (id: number): Promise<Article> => {
        const response = await api.get(`/articles/${id}`);
        return response.data;
    },

    getAllPublishedArticles: async (): Promise<Article[]> => {
        const response = await api.get('/articles/all');
        return response.data;
    },

    // Increment article view count
    incrementView: async (id: number): Promise<Article> => {
        const response = await api.post(`/articles/${id}/view`);
        return response.data;
    },

    // Like article
    likeArticle: async (
        id: number
    ): Promise<ArticleLikeResponse> => {
        const response = await api.post(`/articles/${id}/like`);

        return {
            articleId: id,
            liked: true,
            likeCount: response.data
        };
    },

    // Unlike article
    unlikeArticle: async (
        id: number
    ): Promise<ArticleLikeResponse> => {
        const response = await api.delete(`/articles/${id}/like`);

        return {
            articleId: id,
            liked: false,
            likeCount: response.data
        };
    },

    // Check whether current user liked article
    getLikeStatus: async (
        id: number
    ): Promise<ArticleLikeResponse> => {
        const response = await api.get(
            `/articles/${id}/like-status`
        );

        return response.data;
    },

    // Get all articles liked by current user
    getLikedArticles: async (): Promise<Article[]> => {
        const response = await api.get('/articles/liked');
        return response.data;
    },


    // =========================
    // ARTICLE STATUS
    // =========================

    updateArticleStatus: async (
        id: number,
        status: string
    ): Promise<Article> => {
        const response = await api.post(
            `/articles/${id}/status`,
            null,
            {
                params: { status }
            }
        );

        return response.data;
    },

    deleteArticle: async (id: number): Promise<void> => {
        await api.delete(`/articles/delete/${id}`);
    },


    // =========================
    // AUTHOR ENDPOINTS
    // =========================

    createArticle: async (
        articleData: {
            title: string;
            content: string;
            categoryId: number;
        }
    ): Promise<Article> => {
        const response = await api.post(
            '/articles/create',
            articleData
        );

        return response.data;
    },

    getMyArticles: async (): Promise<Article[]> => {
        const response = await api.get('/articles/my-articles');
        return response.data;
    },

    getArticlesByAuthor: async (
        authorName: string
    ): Promise<Article[]> => {
        const response = await api.get(
            `/articles/author/${authorName}`
        );

        return response.data;
    },

    submitForReview: async (
        id: number
    ): Promise<Article> => {
        const response = await api.post(
            `/articles/${id}/status`,
            null,
            {
                params: {
                    status: 'REVIEW'
                }
            }
        );

        return response.data;
    }
};
