import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, beforeEach } from 'vitest';
import { ThemeProvider } from '../context/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';

describe('ThemeToggle & ThemeContext', () => {
    beforeEach(() => {
        localStorage.clear();
        document.documentElement.className = '';
    });

    test('renders toggle button and switches theme on click', () => {
        render(
            <ThemeProvider>
                <ThemeToggle />
            </ThemeProvider>
        );

        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();

        // Initial default theme is dark
        expect(document.documentElement.classList.contains('dark')).toBe(true);

        // Click to toggle to light mode
        fireEvent.click(button);
        expect(document.documentElement.classList.contains('light')).toBe(true);
        expect(document.documentElement.classList.contains('dark')).toBe(false);
        expect(localStorage.getItem('newsportal_theme')).toBe('light');

        // Click again to toggle back to dark mode
        fireEvent.click(button);
        expect(document.documentElement.classList.contains('dark')).toBe(true);
        expect(document.documentElement.classList.contains('light')).toBe(false);
        expect(localStorage.getItem('newsportal_theme')).toBe('dark');
    });

    test('renders pill variant with label', () => {
        render(
            <ThemeProvider>
                <ThemeToggle variant="pill" />
            </ThemeProvider>
        );

        // In dark mode, pill suggests switching to Light Mode
        expect(screen.getByText('Light Mode')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button'));
        // In light mode, pill suggests switching to Dark Mode
        expect(screen.getByText('Dark Mode')).toBeInTheDocument();
    });
});
