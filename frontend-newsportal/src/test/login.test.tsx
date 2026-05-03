import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Login from '../pages/Login';
import { authService } from '../services/authService';

// 1. Mock the react-router-dom module to track navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// 2. Mock the authService
vi.mock('../services/authService', () => ({
  authService: {
    login: vi.fn(),
  },
}));

describe('Login Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  // Helper function to render the component wrapped in a Router (required for <Link>)
  const renderLogin = () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
  };

  test('renders the login form correctly', () => {
    renderLogin();
    
    // Check if texts, inputs, and buttons are present
    expect(screen.getByText('NewsPortal')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  test('displays error message on failed login', async () => {
    // Mock the login function to reject (simulate API error)
    (authService.login as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Invalid credentials'));

    renderLogin();

    // Fill out the form
    fireEvent.change(screen.getByPlaceholderText('Enter your username'), { target: { value: 'wronguser' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'wrongpass' } });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Wait for the error message to appear in the DOM
    await waitFor(() => {
      expect(screen.getByText('Invalid username or password. Please try again.')).toBeInTheDocument();
    });
  });

  test('navigates to /admin on successful login with ROLE_ADMIN', async () => {
    // Mock the login function to resolve with the admin role
    (authService.login as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ role: 'ROLE_ADMIN' });

    renderLogin();

    fireEvent.change(screen.getByPlaceholderText('Enter your username'), { target: { value: 'adminUser' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      // Verify authService was called with correct payload
      expect(authService.login).toHaveBeenCalledWith({ username: 'adminUser', password: 'password123' });
      // Verify redirection
      expect(mockNavigate).toHaveBeenCalledWith('/admin');
    });
  });

  test('navigates to /author on successful login with ROLE_EDITOR', async () => {
    (authService.login as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ role: 'ROLE_EDITOR' });

    renderLogin();

    fireEvent.change(screen.getByPlaceholderText('Enter your username'), { target: { value: 'editorUser' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/author');
    });
  });

  test('navigates to /articles on successful login with regular user role', async () => {
    (authService.login as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ role: 'ROLE_USER' });

    renderLogin();

    fireEvent.change(screen.getByPlaceholderText('Enter your username'), { target: { value: 'normalUser' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/articles');
    });
  });

  test('disables the submit button while loading', async () => {
    // Mock the login promise so it doesn't resolve immediately
    let resolveLogin: (value: any) => void;
    const loginPromise = new Promise((resolve) => {
      resolveLogin = resolve;
    });
    (authService.login as ReturnType<typeof vi.fn>).mockReturnValueOnce(loginPromise);

    renderLogin();

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    fireEvent.change(screen.getByPlaceholderText('Enter your username'), { target: { value: 'user' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'pass' } });
    fireEvent.click(submitButton);

    // Button should be disabled and text changed to 'Signing In...'
    expect(submitButton).toBeDisabled();
    expect(screen.getByText('Signing In...')).toBeInTheDocument();

    // Resolve the promise to finish the test cleanly
    resolveLogin!({ role: 'ROLE_USER' });
    
    await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalled();
    });
  });
});