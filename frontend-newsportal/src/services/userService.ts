import api from '../api/axiosConfig';

export interface UserProfile {
    id?: number;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    bio?: string;
    avatarUrl?: string;
    createdAt?: string;
    updatedAt?: string;
}

export const userService = {

    // Get the profile for a specific username
    getProfile: async (username: string): Promise<UserProfile> => {
        try {
            const response = await api.get(`/users/${username}`);
            return response.data;
        } catch (error) {
            console.error("Failed to fetch profile", error);
            throw error;
        }
    },

    // Update the currently logged-in user's profile
    updateProfile: async (
        profileData: Partial<UserProfile>
    ): Promise<UserProfile> => {
        try {
            const response = await api.put(
                '/users/profile',
                profileData
            );

            return response.data;
        } catch (error) {
            console.error("Failed to update profile", error);
            throw error;
        }
    }
};