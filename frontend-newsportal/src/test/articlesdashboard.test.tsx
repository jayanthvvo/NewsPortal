import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import ArticlesDashboard from '../pages/ArticlesDashboard';
import { authService } from '../services/authService';
import { articleService } from '../services/articleService';
import { categoryService } from '../services/categoryService';

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

vi.mock('../services/articleService', () => ({
    articleService: {
        getAllPublishedArticles: vi.fn(),
    }
}));

vi.mock('../services/categoryService', () => ({
    categoryService: {
        getAllCategories: vi.fn(),
    }
}));

// Mock the FullArticle component so it doesn't try to fetch its own data
vi.mock('../pages/FullArticle', () => ({
    default: ({ onBack }: { onBack: () => void }) => (
        <div data-testid="full-article-mock">
            Full Article View 
            <button onClick={onBack}>Go Back</button>
        </div>
    )
}));

describe('ArticlesDashboard Component', () => {
    
    // Setup dummy data for testing
    const mockCategories = [
        { id: 1, name: 'Technology', description: 'Tech news' },
        { id: 2, name: 'Sports', description: 'Sports news' }
    ];

    const mockArticles = [
        { id: 101, title: 'React 19 Released', author: 'Jane Doe', content: 'React 19 brings new features...', categoryId: 1 },
        { id: 102, title: 'Local Team Wins Championship', author: 'John Smith', content: 'What a game last night...', categoryId: 2 },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        
        // Default to a standard authenticated user
        (authService.isAuthenticated as ReturnType<typeof vi.fn>).mockReturnValue(true);
        (authService.getRole as ReturnType<typeof vi.fn>).mockReturnValue('ROLE_USER');
        
        // Default API responses
        (categoryService.getAllCategories as ReturnType<typeof vi.fn>).mockResolvedValue(mockCategories);
        (articleService.getAllPublishedArticles as ReturnType<typeof vi.fn>).mockResolvedValue(mockArticles);
    });

    const renderDashboard = () => {
        render(
            <BrowserRouter>
                <ArticlesDashboard />
            </BrowserRouter>
        );
    };

    test('redirects to /login if not authenticated', () => {
        (authService.isAuthenticated as ReturnType<typeof vi.fn>).mockReturnValue(false);
        renderDashboard();
        expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    test('renders layout, fetches data, and displays articles', async () => {
        renderDashboard();

        // Check header texts
        expect(screen.getByText('The Daily Chronicle')).toBeInTheDocument();
        expect(screen.getByText('Latest Headlines')).toBeInTheDocument();

        // Check if loading text appears initially
        expect(screen.getByText("Loading today's stories...")).toBeInTheDocument();

        // Wait for articles to load and verify they render correctly
        await waitFor(() => {
            expect(screen.getByText('React 19 Released')).toBeInTheDocument();
            expect(screen.getByText('Local Team Wins Championship')).toBeInTheDocument();
        });

        // Verify category mapping worked (ID 1 -> 'Technology')
        expect(screen.getByText('Technology')).toBeInTheDocument();
        expect(screen.getByText('Sports')).toBeInTheDocument();
    });

    test('conditionally renders "My Workspace" button for AUTHOR and EDITOR roles', async () => {
        // 1. Test standard USER (should NOT see it)
        renderDashboard();
        expect(screen.queryByRole('button', { name: 'My Workspace' })).not.toBeInTheDocument();

        // 2. Test AUTHOR role
        (authService.getRole as ReturnType<typeof vi.fn>).mockReturnValue('ROLE_AUTHOR');
        renderDashboard();
        
        const workspaceBtn = screen.getByRole('button', { name: 'My Workspace' });
        expect(workspaceBtn).toBeInTheDocument();
        fireEvent.click(workspaceBtn);
        expect(mockNavigate).toHaveBeenCalledWith('/author');

        // 3. Test EDITOR role (navigates to /admin)
        (authService.getRole as ReturnType<typeof vi.fn>).mockReturnValue('ROLE_EDITOR');
        renderDashboard();
        
        fireEvent.click(screen.getAllByRole('button', { name: 'My Workspace' })[1]); // Grab the newly rendered one
        expect(mockNavigate).toHaveBeenCalledWith('/admin');
    });

    test('logs out successfully', () => {
        renderDashboard();
        fireEvent.click(screen.getByRole('button', { name: 'Sign Out' }));
        expect(authService.logout).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    test('navigates to profile page', () => {
        renderDashboard();
        fireEvent.click(screen.getByRole('button', { name: 'My Profile' }));
        expect(mockNavigate).toHaveBeenCalledWith('/profile');
    });

    test('filters articles correctly using the search bar', async () => {
        renderDashboard();

        // Wait for data to load
        await waitFor(() => {
            expect(screen.getByText('React 19 Released')).toBeInTheDocument();
        });

        const searchInput = screen.getByPlaceholderText('🔍 Search stories, authors...');

        // Search for "React" (Title match)
        fireEvent.change(searchInput, { target: { value: 'react' } });
        expect(screen.getByText('React 19 Released')).toBeInTheDocument();
        expect(screen.queryByText('Local Team Wins Championship')).not.toBeInTheDocument();

        // Search for "John" (Author match)
        fireEvent.change(searchInput, { target: { value: 'john' } });
        expect(screen.queryByText('React 19 Released')).not.toBeInTheDocument();
        expect(screen.getByText('Local Team Wins Championship')).toBeInTheDocument();
    });

    test('displays empty search state when no articles match', async () => {
        renderDashboard();

        await waitFor(() => {
            expect(screen.getByText('React 19 Released')).toBeInTheDocument();
        });

        const searchInput = screen.getByPlaceholderText('🔍 Search stories, authors...');
        fireEvent.change(searchInput, { target: { value: 'xyz123nonsense' } });

        expect(screen.queryByText('React 19 Released')).not.toBeInTheDocument();
        expect(screen.getByText('No results found.')).toBeInTheDocument();
        expect(screen.getByText(/We couldn't find any articles matching "xyz123nonsense"/)).toBeInTheDocument();
    });

    test('opens the FullArticle component when "Read Full Story" is clicked', async () => {
        renderDashboard();

        await waitFor(() => {
            expect(screen.getAllByRole('button', { name: 'Read Full Story →' })[0]).toBeInTheDocument();
        });

        // Click the read full story button for the first article
        const readMoreBtns = screen.getAllByRole('button', { name: 'Read Full Story →' });
        fireEvent.click(readMoreBtns[0]);

        // Dashboard list should disappear, Mock Full Article should appear
        expect(screen.queryByText('Latest Headlines')).not.toBeInTheDocument();
        expect(screen.getByTestId('full-article-mock')).toBeInTheDocument();

        // Test the "Go Back" logic (setting viewingArticleId to null)
        fireEvent.click(screen.getByRole('button', { name: 'Go Back' }));
        expect(screen.queryByTestId('full-article-mock')).not.toBeInTheDocument();
        expect(screen.getByText('Latest Headlines')).toBeInTheDocument();
    });
});