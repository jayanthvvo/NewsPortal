import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import AuthorWorkspace from '../pages/AuthorWorkspace';
import { authService } from '../services/authService';
import { articleService } from '../services/articleService';
import { categoryService } from '../services/categoryService';
import { userService } from '../services/userService';
import toast from 'react-hot-toast';

// --- Mocks ---
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../services/authService', () => ({
    authService: {
        isAuthenticated: vi.fn(),
        getRole: vi.fn(),
        logout: vi.fn(),
    }
}));

vi.mock('../services/articleService', () => ({ articleService: { getAllPublishedArticles: vi.fn(), getMyArticles: vi.fn(), createArticle: vi.fn(), submitForReview: vi.fn() } }));
vi.mock('../services/categoryService', () => ({ categoryService: { getAllCategories: vi.fn() } }));
vi.mock('../services/userService', () => ({ userService: { getProfile: vi.fn(), updateProfile: vi.fn() } }));

vi.mock('react-hot-toast', () => {
    const mockToast = Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn(), loading: vi.fn(() => 'toast-id') });
    return { default: mockToast, Toaster: () => <div /> };
});

vi.mock('../pages/FullArticle', () => ({ default: () => <div data-testid="full-article-mock">Full Article View</div> }));

// Mock localStorage for the profile parsing
const mockLocalStorage = {
    getItem: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

describe('AuthorWorkspace Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (authService.isAuthenticated as ReturnType<typeof vi.fn>).mockReturnValue(true);
        (authService.getRole as ReturnType<typeof vi.fn>).mockReturnValue('ROLE_EDITOR');
        
        (categoryService.getAllCategories as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: 1, name: 'Tech', description: '' }]);
        (articleService.getAllPublishedArticles as ReturnType<typeof vi.fn>).mockResolvedValue([]);
        (articleService.getMyArticles as ReturnType<typeof vi.fn>).mockResolvedValue([]);
        
        // Mock a valid JWT payload for the profile parsing
        const mockPayload = btoa(JSON.stringify({ sub: 'authorUser' }));
        mockLocalStorage.getItem.mockReturnValue(`header.${mockPayload}.signature`);
        (userService.getProfile as ReturnType<typeof vi.fn>).mockResolvedValue({ username: 'authorUser', firstName: 'John', lastName: 'Doe', bio: 'Hello' });
    });

    const renderWorkspace = () => {
        render(
            <BrowserRouter>
                <AuthorWorkspace />
            </BrowserRouter>
        );
    };

    test('redirects to /login if not authenticated or not editor/author', () => {
        (authService.getRole as ReturnType<typeof vi.fn>).mockReturnValue('ROLE_USER');
        renderWorkspace();
        expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    test('renders default tab (Read Articles)', async () => {
        (articleService.getAllPublishedArticles as ReturnType<typeof vi.fn>).mockResolvedValue([
            { id: 10, title: 'Test Article', author: 'Test Author', content: 'Content', categoryId: 1, status: 'PUBLISHED' }
        ]);
        
        renderWorkspace();
        expect(screen.getByText('Author Workspace')).toBeInTheDocument();
        expect(screen.getByText('Latest Headlines')).toBeInTheDocument();
        
        await waitFor(() => {
            expect(screen.getByText('Test Article')).toBeInTheDocument();
        });
    });

    test('writes and saves a draft article', async () => {
        renderWorkspace();
        
        // Switch to write tab
        fireEvent.click(screen.getByText('✍️ Write New Article'));
        expect(screen.getByText('Compose News Story')).toBeInTheDocument();

        // Fill out form
        fireEvent.change(screen.getByPlaceholderText('Breaking News...'), { target: { value: 'My New Story' } });
        
        // Wait for categories to load into the select box
        await waitFor(() => {
            fireEvent.change(screen.getByRole('combobox'), { target: { value: '1' } });
        });

        fireEvent.change(screen.getByPlaceholderText('Write your full story here...'), { target: { value: 'Story content goes here.' } });
        
        // Submit
        fireEvent.click(screen.getByRole('button', { name: '💾 Save as Draft' }));

        await waitFor(() => {
            expect(articleService.createArticle).toHaveBeenCalledWith({ title: 'My New Story', content: 'Story content goes here.', categoryId: 1 });
            expect(toast.success).toHaveBeenCalledWith('Article saved successfully as a DRAFT!');
        });
    });

    test('profile tab loads and saves data', async () => {
        renderWorkspace();
        fireEvent.click(screen.getByText('👤 My Profile'));
        
        expect(screen.getByText('My Profile Settings')).toBeInTheDocument();
        
        await waitFor(() => {
            // Profile data fetched and displayed
            expect(screen.getByDisplayValue('John')).toBeInTheDocument();
            expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
        });

        // Update name
        fireEvent.change(screen.getByDisplayValue('John'), { target: { value: 'Jane' } });
        fireEvent.click(screen.getByRole('button', { name: 'Save Profile Changes' }));

        await waitFor(() => {
            expect(userService.updateProfile).toHaveBeenCalledWith({ firstName: 'Jane', lastName: 'Doe', bio: 'Hello' });
            expect(toast.success).toHaveBeenCalledWith('Profile updated successfully!');
        });
    });
});