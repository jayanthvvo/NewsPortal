import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import AdminDashboard from '../pages/AdminDashboard';
import { authService } from '../services/authService';
import { adminService } from '../services/adminService';
import { categoryService } from '../services/categoryService';
import { articleService } from '../services/articleService';
import { alertService } from '../services/alertService';
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

vi.mock('../services/adminService', () => ({ adminService: { getAllUsers: vi.fn(), approveUser: vi.fn() } }));
vi.mock('../services/categoryService', () => ({ categoryService: { getAllCategories: vi.fn(), createCategory: vi.fn() } }));
vi.mock('../services/articleService', () => ({ articleService: { getAllPublishedArticles: vi.fn(), getPendingReviews: vi.fn(), updateArticleStatus: vi.fn() } }));
vi.mock('../services/alertService', () => ({ alertService: { sendBreakingNews: vi.fn() } }));

vi.mock('react-hot-toast', () => {
    const mockToast = Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn(), loading: vi.fn(() => 'toast-id') });
    return { default: mockToast, Toaster: () => <div /> };
});

// Mock the FullArticle sub-component so it doesn't try to fetch its own data
vi.mock('../pages/FullArticle', () => ({ default: () => <div data-testid="full-article-mock">Full Article View</div> }));

describe('AdminDashboard Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default to authenticated Admin
        (authService.isAuthenticated as ReturnType<typeof vi.fn>).mockReturnValue(true);
        (authService.getRole as ReturnType<typeof vi.fn>).mockReturnValue('ROLE_ADMIN');
        
        // Default empty responses for APIs
        (adminService.getAllUsers as ReturnType<typeof vi.fn>).mockResolvedValue([]);
        (categoryService.getAllCategories as ReturnType<typeof vi.fn>).mockResolvedValue([]);
        (articleService.getAllPublishedArticles as ReturnType<typeof vi.fn>).mockResolvedValue([]);
        (articleService.getPendingReviews as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    });

    const renderAdminDashboard = () => {
        render(
            <BrowserRouter>
                <AdminDashboard />
            </BrowserRouter>
        );
    };

    test('redirects to /login if not authenticated or not admin', () => {
        (authService.getRole as ReturnType<typeof vi.fn>).mockReturnValue('ROLE_USER');
        renderAdminDashboard();
        expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    test('renders sidebar and default tab (Approvals)', async () => {
        (adminService.getAllUsers as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: 1, username: 'testuser', email: 'test@test.com', role: 'ROLE_EDITOR' }]);
        
        renderAdminDashboard();
        
        expect(screen.getByText('Admin Console')).toBeInTheDocument();
        expect(screen.getByText('Review Account Requests')).toBeInTheDocument(); // Approvals tab header
        
        await waitFor(() => {
            expect(screen.getByText('testuser')).toBeInTheDocument();
        });
    });

    test('switches tabs correctly', async () => {
        renderAdminDashboard();

        // Switch to Categories
        fireEvent.click(screen.getByText('📁 Categories'));
        expect(screen.getByText('Manage News Categories')).toBeInTheDocument();

        // Switch to Alerts
        fireEvent.click(screen.getByText('🚨 Breaking News Alert'));
        expect(screen.getByText('Emergency Alert System')).toBeInTheDocument();
    });

    test('creates a category successfully', async () => {
        renderAdminDashboard();
        fireEvent.click(screen.getByText('📁 Categories'));

        const nameInput = screen.getByPlaceholderText('e.g. Technology');
        const descInput = screen.getByRole('textbox', { name: /description/i }); // matches textarea
        
        fireEvent.change(nameInput, { target: { value: 'Sports' } });
        fireEvent.change(descInput, { target: { value: 'Sports news' } });
        
        fireEvent.click(screen.getByRole('button', { name: '+ Add Category' }));

        await waitFor(() => {
            expect(categoryService.createCategory).toHaveBeenCalledWith({ name: 'Sports', description: 'Sports news' });
            expect(toast.success).toHaveBeenCalledWith('Category created successfully!', expect.anything());
        });
    });

    test('logs out successfully', () => {
        renderAdminDashboard();
        fireEvent.click(screen.getByRole('button', { name: 'Logout' }));
        expect(authService.logout).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
});