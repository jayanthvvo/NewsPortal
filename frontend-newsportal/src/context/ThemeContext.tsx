import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

const THEME_STORAGE_KEY = 'newsportal_theme';

const getInitialTheme = (): Theme => {
    if (typeof window === 'undefined') return 'dark';
    try {
        const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
        if (storedTheme === 'light' || storedTheme === 'dark') {
            return storedTheme;
        }
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
    } catch {
        // fallback
    }
    return 'dark'; // Default to modern dark/charcoal theme
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setThemeState] = useState<Theme>(getInitialTheme);

    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
            root.classList.remove('light');
        } else {
            root.classList.add('light');
            root.classList.remove('dark');
        }
        root.style.colorScheme = theme;

        try {
            localStorage.setItem(THEME_STORAGE_KEY, theme);
        } catch {
            // ignore storage errors
        }

        // Notify any non-React listeners
        window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme } }));
    }, [theme]);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
    };

    const toggleTheme = () => {
        setThemeState(prev => (prev === 'dark' ? 'light' : 'dark'));
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (!context) {
        // Safe fallback in case a component is rendered without ThemeProvider (e.g. in standalone tests)
        const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
        return {
            theme: isDark ? 'dark' : 'light',
            toggleTheme: () => {},
            setTheme: () => {}
        };
    }
    return context;
};
