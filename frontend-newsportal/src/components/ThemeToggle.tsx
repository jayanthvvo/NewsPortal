import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
    className?: string;
    showLabel?: boolean;
    variant?: 'button' | 'pill';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
    className = '',
    showLabel = false,
    variant = 'button'
}) => {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    if (variant === 'pill') {
        return (
            <button
                type="button"
                onClick={toggleTheme}
                aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
                title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                    isDark
                        ? 'bg-[#18181b] hover:bg-zinc-800 text-neutral-200 border-neutral-700/80 shadow-2xs'
                        : 'bg-white hover:bg-neutral-100 text-neutral-800 border-neutral-200 shadow-2xs'
                } ${className}`}
            >
                {isDark ? (
                    <>
                        <Sun className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
                        <span>Light Mode</span>
                    </>
                ) : (
                    <>
                        <Moon className="w-3.5 h-3.5 text-neutral-700" />
                        <span>Dark Mode</span>
                    </>
                )}
            </button>
        );
    }

    return (
        <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            className={`inline-flex items-center justify-center gap-2 p-2 sm:px-3 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all cursor-pointer select-none ${
                isDark
                    ? 'bg-[#121214] hover:bg-zinc-800 text-neutral-200 border-neutral-800 hover:border-neutral-700 shadow-2xs'
                    : 'bg-white hover:bg-neutral-100 text-neutral-800 border-neutral-200 hover:border-neutral-300 shadow-2xs'
            } active:scale-95 ${className}`}
        >
            {isDark ? (
                <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 rotate-0 hover:rotate-45" />
            ) : (
                <Moon className="w-4 h-4 text-neutral-700 transition-transform duration-300 rotate-0 hover:-rotate-12" />
            )}
            {showLabel && (
                <span className="hidden sm:inline">
                    {isDark ? 'Light' : 'Dark'}
                </span>
            )}
        </button>
    );
};

export default ThemeToggle;
