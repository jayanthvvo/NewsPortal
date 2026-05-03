import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, test, expect, afterEach, vi } from 'vitest';
import App from '../App';

// 1. Mock all the page components using vi.mock
// We return simple <div> tags with test IDs so we can check if the Router mounted them properly.
vi.mock('../pages/Login', () => ({ default: () => <div data-testid="login-page">Login Page</div> }));
vi.mock('../pages/Register', () => ({ default: () => <div data-testid="register-page">Register Page</div> }));
vi.mock('../pages/ArticlesDashboard', () => ({ default: () => <div data-testid="articles-page">Articles Dashboard</div> }));
vi.mock('../pages/AdminDashboard', () => ({ default: () => <div data-testid="admin-page">Admin Dashboard</div> }));
vi.mock('../pages/AuthorWorkspace', () => ({ default: () => <div data-testid="author-page">Author Workspace</div> }));
vi.mock('../pages/FullArticle', () => ({ default: () => <div data-testid="full-article-page">Full Article</div> }));
vi.mock('../pages/UserProfilePage', () => ({ default: () => <div data-testid="profile-page">User Profile</div> }));
vi.mock('../pages/ForgotPassword', () => ({ default: () => <div data-testid="forgot-password-page">Forgot Password</div> }));

describe('App Routing', () => {
  // Helper function to push a specific route to the DOM history before rendering
  const renderWithRoute = (route: string) => {
    window.history.pushState({}, 'Test page', route);
    render(<App />);
  };

  afterEach(() => {
    // Clean up the URL and clear mocks after each test to prevent bleed-over
    window.history.pushState({}, 'Home page', '/');
    vi.clearAllMocks();
  });

  test('redirects from "/" to "/login"', () => {
    renderWithRoute('/');
    // The `<Navigate to="/login" replace />` should immediately trigger
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });

  test('renders Login page at "/login"', () => {
    renderWithRoute('/login');
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });

  test('renders Register page at "/register"', () => {
    renderWithRoute('/register');
    expect(screen.getByTestId('register-page')).toBeInTheDocument();
  });

  test('renders Articles Dashboard page at "/articles"', () => {
    renderWithRoute('/articles');
    expect(screen.getByTestId('articles-page')).toBeInTheDocument();
  });

  test('renders Full Article page at "/article/:id"', () => {
    // Simulating a dynamic parameter in the URL (e.g., ID: 99)
    renderWithRoute('/article/99'); 
    expect(screen.getByTestId('full-article-page')).toBeInTheDocument();
  });

  test('renders Admin Dashboard page at "/admin"', () => {
    renderWithRoute('/admin');
    expect(screen.getByTestId('admin-page')).toBeInTheDocument();
  });

  test('renders User Profile page at "/profile"', () => {
    renderWithRoute('/profile');
    expect(screen.getByTestId('profile-page')).toBeInTheDocument();
  });

  test('renders Author Workspace page at "/author"', () => {
    renderWithRoute('/author');
    expect(screen.getByTestId('author-page')).toBeInTheDocument();
  });

  test('renders Forgot Password page at "/forgot-password"', () => {
    renderWithRoute('/forgot-password');
    expect(screen.getByTestId('forgot-password-page')).toBeInTheDocument();
  });
});