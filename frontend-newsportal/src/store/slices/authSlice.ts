// src/store/slices/authSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService, type LoginCredentials } from '../../services/authService';

// 1. Define how our Auth state looks
interface AuthState {
    token: string | null;
    role: string | null;
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
}

// 2. Set the initial state (checking localStorage so users stay logged in on refresh)
const initialState: AuthState = {
    token: localStorage.getItem('token'),
    role: localStorage.getItem('role'),
    isAuthenticated: authService.isAuthenticated(),
    loading: false,
    error: null,
};

// 3. Create an async action to handle the login API call
export const loginUser = createAsyncThunk(
    'auth/login',
    async (credentials: LoginCredentials, { rejectWithValue }) => {
        try {
            // This calls your existing axios setup in authService
            const response = await authService.login(credentials);
            return response; // Expected to contain { token, role }
        } catch (error: any) {
            // Pass the error message to the Redux state if it fails
            return rejectWithValue(error.response?.data?.message || 'Login failed. Please check your credentials.');
        }
    }
);

// 4. Create the actual slice
const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        // Synchronous action for logging out
        logout: (state) => {
            authService.logout(); // Clears localStorage
            state.token = null;
            state.role = null;
            state.isAuthenticated = false;
            state.error = null;
        },
        clearError: (state) => {
            state.error = null;
        }
    },
    // extraReducers handle the different stages of our async loginUser thunk
    extraReducers: (builder) => {
        builder
            .addCase(loginUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false;
                state.isAuthenticated = true;
                state.token = action.payload.token;
                state.role = action.payload.role;
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

// Export the standard actions
export const { logout, clearError } = authSlice.actions;

// Export the reducer to be used in the store
export default authSlice.reducer;