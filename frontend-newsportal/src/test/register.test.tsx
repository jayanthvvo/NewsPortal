import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Register from '../pages/Register';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';

// 1. Mock react-router-dom for navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// 2. Mock authService
vi.mock('../services/authService', () => ({
    authService: {
        register: vi.fn(),
    },
}));

// 3. Mock react-hot-toast
vi.mock('react-hot-toast', () => {
    const toastMock = {
        error: vi.fn(),
        success: vi.fn(),
        loading: vi.fn(() => 'test-toast-id'),
    };
    // toast acts as both a function and an object with methods
    const mockToastFunction = Object.assign(vi.fn(), toastMock);
    return {
        default: mockToastFunction,
        Toaster: () => <div data-testid="toaster-mock" />, // Mock the Toaster component
    };
});

describe('Register Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderRegister = () => {
        render(
            <BrowserRouter>
                <Register />
            </BrowserRouter>
        );
    };

    test('renders the registration form correctly', () => {
        renderRegister();

        expect(screen.getByText('Create an Account')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Choose a username')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('At least 6 characters')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Confirm your password')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
    });

    test('shows an error and toast if passwords do not match', async () => {
        renderRegister();

        fireEvent.change(screen.getByPlaceholderText('Choose a username'), { target: { value: 'testuser' } });
        fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByPlaceholderText('At least 6 characters'), { target: { value: 'password123' } });
        fireEvent.change(screen.getByPlaceholderText('Confirm your password'), { target: { value: 'password456' } }); // Mismatch

        fireEvent.click(screen.getByRole('button', { name: /register/i }));

        expect(screen.getByText('Passwords do not match!')).toBeInTheDocument();
        expect(toast.error).toHaveBeenCalledWith('Passwords do not match!');
        expect(authService.register).not.toHaveBeenCalled();
    });

    test('shows a warning message when selecting a role other than ROLE_USER', () => {
        renderRegister();

        const roleSelect = screen.getByLabelText('Account Type');
        
        // Default shouldn't show warning
        expect(screen.queryByText(/Note: This role requires manual approval/i)).not.toBeInTheDocument();

        // Change to Editor
        fireEvent.change(roleSelect, { target: { value: 'ROLE_EDITOR' } });
        expect(screen.getByText(/Note: This role requires manual approval/i)).toBeInTheDocument();

        // Change to Admin
        fireEvent.change(roleSelect, { target: { value: 'ROLE_ADMIN' } });
        expect(screen.getByText(/Note: This role requires manual approval/i)).toBeInTheDocument();
    });

    test('submits successfully, shows toast, and navigates to /login', async () => {
        const mockSuccessMessage = 'Registration successful!';
        (authService.register as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockSuccessMessage);

        renderRegister();

        fireEvent.change(screen.getByPlaceholderText('Choose a username'), { target: { value: 'newuser' } });
        fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'newuser@example.com' } });
        fireEvent.change(screen.getByPlaceholderText('At least 6 characters'), { target: { value: 'securepass' } });
        fireEvent.change(screen.getByPlaceholderText('Confirm your password'), { target: { value: 'securepass' } });
        
        fireEvent.click(screen.getByRole('button', { name: /register/i }));

        await waitFor(() => {
            // Check API was called with correct payload
            expect(authService.register).toHaveBeenCalledWith({
                username: 'newuser',
                email: 'newuser@example.com',
                password: 'securepass',
                rolerequest: 'ROLE_USER',
            });

            // Check if loading toast and success toast triggered
            expect(toast.loading).toHaveBeenCalledWith('Creating your account...');
            expect(toast.success).toHaveBeenCalledWith(mockSuccessMessage, { id: 'test-toast-id' });

            // Check navigation
            expect(mockNavigate).toHaveBeenCalledWith('/login');
        });
    });

    test('displays API error message on failed registration', async () => {
        // Simulate an Axios error format
        const mockError = { response: { data: 'Username already exists' } };
        (authService.register as ReturnType<typeof vi.fn>).mockRejectedValueOnce(mockError);

        renderRegister();

        fireEvent.change(screen.getByPlaceholderText('Choose a username'), { target: { value: 'existinguser' } });
        fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'user@example.com' } });
        fireEvent.change(screen.getByPlaceholderText('At least 6 characters'), { target: { value: 'password123' } });
        fireEvent.change(screen.getByPlaceholderText('Confirm your password'), { target: { value: 'password123' } });
        
        fireEvent.click(screen.getByRole('button', { name: /register/i }));

        await waitFor(() => {
            expect(screen.getByText('Username already exists')).toBeInTheDocument();
            expect(toast.error).toHaveBeenCalledWith('Username already exists', { id: 'test-toast-id' });
            expect(mockNavigate).not.toHaveBeenCalled();
        });
    });

    test('disables the submit button while loading', async () => {
        let resolveRegister: (value: any) => void;
        const registerPromise = new Promise((resolve) => {
            resolveRegister = resolve;
        });
        (authService.register as ReturnType<typeof vi.fn>).mockReturnValueOnce(registerPromise);

        renderRegister();

        fireEvent.change(screen.getByPlaceholderText('Choose a username'), { target: { value: 'user' } });
        fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'email@example.com' } });
        fireEvent.change(screen.getByPlaceholderText('At least 6 characters'), { target: { value: 'pass123' } });
        fireEvent.change(screen.getByPlaceholderText('Confirm your password'), { target: { value: 'pass123' } });
        
        const submitButton = screen.getByRole('button', { name: /register/i });
        fireEvent.click(submitButton);

        // Check loading state
        expect(submitButton).toBeDisabled();
        expect(screen.getByText('Processing...')).toBeInTheDocument();

        // Resolve to clean up
        resolveRegister!('Success');

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalled();
        });
    });
});