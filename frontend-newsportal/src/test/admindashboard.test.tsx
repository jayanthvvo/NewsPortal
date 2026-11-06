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

        // Switch to Analytics
        fireEvent.click(screen.getByText('📊 Analytics'));
        expect(screen.getByText('Platform & Editorial Analytics')).toBeInTheDocument();
    });

    test('logs out successfully', () => {
        renderAdminDashboard();
        fireEvent.click(screen.getByRole('button', { name: 'Logout' }));
        expect(authService.logout).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    test('allows reviewing full pending article in modal and approving it', async () => {
        (articleService.getPendingReviews as ReturnType<typeof vi.fn>).mockResolvedValue([
            { id: 201, title: 'Quantum Breakthrough 2026', author: 'Dr. Alice', content: 'Full extensive quantum research paper content details...', categoryId: 1, status: 'PENDING_REVIEW' }
        ]);

        renderAdminDashboard();

        // Switch to Article Reviews tab
        fireEvent.click(screen.getByText('📰 Article Reviews'));

        await waitFor(() => {
            expect(screen.getByText('Quantum Breakthrough 2026')).toBeInTheDocument();
        });

        // Click "Review Full Story"
        const reviewBtn = screen.getByRole('button', { name: /Review Full Story/i });
        fireEvent.click(reviewBtn);

        // Modal should appear with full title and content
        expect(screen.getByText('⏳ Pending Review')).toBeInTheDocument();
        expect(screen.getAllByText('Full extensive quantum research paper content details...').length).toBe(2);

        // Click "Approve & Publish Story" inside modal
        const publishModalBtn = screen.getByRole('button', { name: /Approve & Publish Story/i });
        fireEvent.click(publishModalBtn);

        // Confirm dialog appears
        expect(screen.getByText('Publish Article')).toBeInTheDocument();
        const publishBtns = screen.getAllByRole('button', { name: 'Publish' });
        fireEvent.click(publishBtns[publishBtns.length - 1]);

        expect(articleService.updateArticleStatus).toHaveBeenCalledWith(201, 'PUBLISHED');
    });

    test('allows rejecting pending article with editorial feedback note', async () => {
        (articleService.getPendingReviews as ReturnType<typeof vi.fn>).mockResolvedValue([
            { id: 202, title: 'Draft Needs Work', author: 'Author Bob', content: 'Incomplete content', categoryId: 1, status: 'PENDING_REVIEW' }
        ]);

        renderAdminDashboard();

        // Switch to Article Reviews tab
        fireEvent.click(screen.getByText('📰 Article Reviews'));

        await waitFor(() => {
            expect(screen.getByText('Draft Needs Work')).toBeInTheDocument();
        });

        // Click "Reject to Draft"
        const rejectBtn = screen.getByRole('button', { name: /Reject to Draft/i });
        fireEvent.click(rejectBtn);

        // Rejection modal appears
        expect(screen.getByText('Reject Article to Draft')).toBeInTheDocument();
        const textarea = screen.getByPlaceholderText(/Explain why this article is being rejected/i);
        fireEvent.change(textarea, { target: { value: 'Please cite the research studies mentioned.' } });

        // Click "Confirm Rejection"
        const confirmRejectBtn = screen.getByRole('button', { name: /Confirm Rejection/i });
        fireEvent.click(confirmRejectBtn);

        await waitFor(() => {
            expect(articleService.updateArticleStatus).toHaveBeenCalledWith(202, 'DRAFT', 'Please cite the research studies mentioned.');
        });
    });

    test('paginates published articles in Read tab and changes page', async () => {
        (articleService.getAllPublishedArticles as ReturnType<typeof vi.fn>).mockImplementation((page = 0) => {
            return Promise.resolve({
                content: [
                    { id: 101 + page, title: `Admin Story Page ${page + 1}`, author: 'Alice', content: 'Story text', categoryId: 1, status: 'PUBLISHED' }
                ],
                number: page,
                totalPages: 2,
                totalElements: 20,
                size: 10,
                first: page === 0,
                last: page === 1
            });
        });

        renderAdminDashboard();

        // Switch to Read Articles tab
        fireEvent.click(screen.getByText(/Read Articles/i));

        await waitFor(() => {
            expect(screen.getByText('Admin Story Page 1')).toBeInTheDocument();
            expect(screen.getByText(/Showing page 1 of 2/i)).toBeInTheDocument();
        });

        // Click Next page button
        const nextBtn = screen.getByRole('button', { name: /Next/i });
        fireEvent.click(nextBtn);

        await waitFor(() => {
            expect(articleService.getAllPublishedArticles).toHaveBeenCalledWith(1, 10);
            expect(screen.getByText('Admin Story Page 2')).toBeInTheDocument();
        });
    });
});
