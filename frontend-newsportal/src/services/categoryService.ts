import api from '../api/axiosConfig';

export interface Category {
    id: number;
    name: string;
    description: string;
}

export const categoryService = {
    // 1. UPDATED URL: Match your Postman test exactly!
    getAllCategories: async (): Promise<Category[]> => {
        try {
            const response = await api.get('/categories/all'); 
            return response.data;
        } catch (error) {
            console.error("Failed to fetch categories:", error);
            throw error;
        }
    },

    // 2. UPDATED URL: Assuming your backend uses /create (or /add)
    createCategory: async (categoryData: { name: string; description: string }): Promise<Category> => {
        try {
            // NOTE: If your Java backend uses @PostMapping("/add"), change this to '/categories/add'
            const response = await api.post('/categories/create', categoryData);
            return response.data;
        } catch (error) {
            console.error("Failed to create category:", error);
            throw error;
        }
    },

    // 3. UPDATED URL (Just in case!)
    deleteCategory: async (categoryId: number): Promise<void> => {
        try {
            await api.delete(`/categories/delete/${categoryId}`);
        } catch (error) {
            console.error("Failed to delete category:", error);
            throw error;
        }
    }
};