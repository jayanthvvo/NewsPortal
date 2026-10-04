
// src/store/slices/authSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService, type LoginCredentials } from '../../services/authService';

interface AuthState {
    token: string | null;
    role: string | null;
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
}

const initialState: AuthState = {
    token: localStorage.getItem('token'),
    role: localStorage.getItem('role'),
    isAuthenticated: authService.isAuthenticated(),
    loading: false,
    error: null,
};

export const loginUser = createAsyncThunk(
    'auth/login',
    async (credentials: LoginCredentials, { rejectWithValue }) => {
        try {
            const response = await authService.login(credentials);
            return response;
        } catch (error: any) {
            const data = error.response?.data;

            const message =
                typeof data === 'string'
                    ? data
                    : data?.message ||
                      data?.error ||
                      'Login failed. Please check your credentials.';

            return rejectWithValue(message);
        }
    }
);

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout: (state) => {
            authService.logout();
            state.token = null;
            state.role = null;
            state.isAuthenticated = false;
            state.error = null;
        },

        clearError: (state) => {
            state.error = null;
        }
    },

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

export const { logout, clearError } = authSlice.actions;

export default authSlice.reducer;
