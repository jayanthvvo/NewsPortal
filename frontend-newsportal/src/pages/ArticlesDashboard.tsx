import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    Newspaper,
    Search,
    User as UserIcon,
    LogOut,
    Sparkles,
    PenTool,
    Calendar,
    Clock,
    BookOpen,
    Filter,
    ChevronLeft,
    ChevronRight,
    Bookmark,
    Eye,
    X,
    Settings,
    ChevronDown,
    Sun,
    Moon
} from 'lucide-react';

import {
    articleService,
    type Article,
    type PaginatedArticles
} from '../services/articleService';

import {
    categoryService,
    type Category
} from '../services/categoryService';

import { alertService, type BreakingAlert } from '../services/alertService';
import { authService } from '../services/authService';
import { bookmarkService } from '../services/bookmarkService';
import { useTheme } from '../context/ThemeContext';
import FullArticle from './FullArticle';
import HorizontalArticlesCarousel from '../components/HorizontalArticlesCarousel';

const ARTICLES_PER_PAGE = 10;

// Modern pastel pills in Light mode; sleek dark pills preserved in Dark mode
const getCategoryBadgeStyle = (categoryId: number) => {
    const palette = [
        'bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-zinc-900 dark:text-zinc-200 dark:border-zinc-700',
        'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700',
        'bg-purple-50 text-purple-700 border-purple-200/80 dark:bg-stone-900 dark:text-stone-200 dark:border-stone-800',
        'bg-amber-50 text-amber-800 border-amber-200/80 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700'
    ];
    return palette[categoryId % palette.length];
};

const getUsernameFromToken = (): string => {
    try {
        const token = localStorage.getItem('token');
        if (!token) return 'Reader';
        const parts = token.split('.');
        if (parts.length < 2) return 'Reader';
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        return payload.sub || 'Reader';
    } catch {
        return 'Reader';
    }
};

const getRoleDisplayName = (r: string | null): string => {
    if (r === 'ROLE_ADMIN') return 'Administrator';
    if (r === 'ROLE_EDITOR') return 'Editor';
    if (r === 'ROLE_AUTHOR') return 'Author';
    return 'Reader';
};

const ArticlesDashboard: React.FC = () => {
    // =========================
    // ARTICLES & CATEGORIES
    // =========================
    const [articles, setArticles] = useState<Article[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    // =========================
    // SEARCH & FILTER
    // =========================
    const [searchQuery, setSearchQuery] = useState('');
    const [authorSearch, setAuthorSearch] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

    // =========================
    // ARTICLE VIEW
    // =========================
    const [viewingArticleId, setViewingArticleId] = useState<number | null>(null);

    // =========================
    // PAGINATION
    // =========================
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [savedArticleIds, setSavedArticleIds] = useState<Set<number>>(new Set());

    // =========================
    // BREAKING NEWS LIVE TICKER
    // =========================
    const [latestAlert, setLatestAlert] = useState<BreakingAlert | null>(null);
    const [isAlertDismissed, setIsAlertDismissed] = useState(false);

    // =========================
    // SETTINGS DROPDOWN STATE
    // =========================
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const settingsRef = useRef<HTMLDivElement>(null);

    const navigate = useNavigate();
    const role = authService.getRole();
    const { theme, setTheme } = useTheme();

    const username = getUsernameFromToken();
    const roleLabel = getRoleDisplayName(role);
    const userInitial = username.charAt(0).toUpperCase();

    // Close settings dropdown on outside click or escape
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
                setIsSettingsOpen(false);
            }
        };
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsSettingsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    // =========================
    // SAVED BOOKMARKS SYNC
    // =========================
    useEffect(() => {
        const syncBookmarks = () => {
            const saved = bookmarkService.getSavedArticles();
            setSavedArticleIds(new Set(saved.map(a => a.id!).filter(Boolean)));
        };
        syncBookmarks();
        window.addEventListener('bookmarks-changed', syncBookmarks);
        return () => window.removeEventListener('bookmarks-changed', syncBookmarks);
    }, []);

    const handleToggleBookmark = (article: Article, e: React.MouseEvent) => {
        e.stopPropagation();
        const nowSaved = bookmarkService.toggleSave(article);
        if (nowSaved) {
            toast.success(`Saved "${article.title.substring(0, 24)}..." to bookmarks!`);
        } else {
            toast.success('Removed from bookmarks.');
        }
    };

    // =========================
    // AUTH + INITIAL DATA
    // =========================
    useEffect(() => {
        if (!authService.isAuthenticated()) {
            navigate('/login');
            return;
        }
        fetchData(0);
    }, [navigate]);

    // =========================
    // FETCH LATEST BREAKING ALERT
    // =========================
    useEffect(() => {
        let isMounted = true;
        const fetchBreakingAlert = async () => {
            try {
                const alert = await alertService.getLatestBreakingNews();
                if (isMounted && alert && (alert.headline || alert.message)) {
                    setLatestAlert(alert);
                }
            } catch {
                // Non-critical, feed proceeds smoothly
            }
        };
        fetchBreakingAlert();
        return () => {
            isMounted = false;
        };
    }, []);

    // =========================
    // FETCH ARTICLES
    // =========================
    const fetchData = async (
        page: number,
        categoryId: number | null = selectedCategoryId,
        author: string = authorSearch
    ) => {
        try {
            setLoading(true);

            const hasFilters = categoryId !== null || author.trim() !== '';

            const responseData: PaginatedArticles | Article[] = hasFilters
                ? await articleService.getFilteredArticles(
                      categoryId ?? undefined,
                      author.trim() || undefined,
                      page,
                      ARTICLES_PER_PAGE
                  )
                : await articleService.getAllPublishedArticles(
                      page,
                      ARTICLES_PER_PAGE
                  );

            // Resilient check: handle both Page<Article> and raw Article[]
            if (Array.isArray(responseData)) {
                setArticles(responseData);
                setCurrentPage(page);
                setTotalPages(Math.max(1, Math.ceil(responseData.length / ARTICLES_PER_PAGE)));
                setTotalElements(responseData.length);
            } else if (responseData && Array.isArray(responseData.content)) {
                setArticles(responseData.content);
                setCurrentPage(responseData.number ?? 0);
                setTotalPages(responseData.totalPages ?? 1);
                setTotalElements(responseData.totalElements ?? responseData.content.length);
            } else {
                setArticles([]);
                setTotalPages(0);
                setTotalElements(0);
            }

            // Load categories if not loaded
            if (categories.length === 0) {
                const categoriesData = await categoryService.getAllCategories();
                setCategories(categoriesData || []);
            }
        } catch (error) {
            console.error('Error fetching data', error);
            toast.error('Unable to load articles. Please try again.');
            setArticles([]);
        } finally {
            setLoading(false);
        }
    };

    // =========================
    // HANDLERS
    // =========================
    const handlePageChange = (page: number) => {
        if (page < 0 || page >= totalPages) return;
        setSearchQuery('');
        fetchData(page, selectedCategoryId, authorSearch);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCategoryChange = (categoryId: number | null) => {
        setSelectedCategoryId(categoryId);
        setCurrentPage(0);
        setSearchQuery('');
        fetchData(0, categoryId, authorSearch);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleAuthorSearch = async () => {
        setCurrentPage(0);
        setSearchQuery('');
        await fetchData(0, selectedCategoryId, authorSearch);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const clearFilters = () => {
        setSelectedCategoryId(null);
        setAuthorSearch('');
        setSearchQuery('');
        fetchData(0, null, '');
    };

    const getCategoryName = (id: number) => {
        const category = categories.find(c => c.id === id);
        return category ? category.name : 'Breaking News';
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    // Filter articles based on local query
    const filteredArticles = (articles || []).filter(article => {
        const lowerCaseQuery = searchQuery.toLowerCase();
        return (
            (article.title || '').toLowerCase().includes(lowerCaseQuery) ||
            (article.content || '').toLowerCase().includes(lowerCaseQuery) ||
            (article.author || '').toLowerCase().includes(lowerCaseQuery)
        );
    });

    const getPageNumbers = () => {
        const pages: number[] = [];
        for (let i = 0; i < totalPages; i++) {
            pages.push(i);
        }
        return pages;
    };

    const calculateReadTime = (content: string) => {
        const words = (content || '').trim().split(/\s+/).length;
        return `${Math.max(1, Math.ceil(words / 180))} min read`;
    };

    const todayDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
    });

    return (
        <div className="min-h-screen bg-[#f8f9fc] dark:bg-black text-slate-900 dark:text-neutral-100 font-sans transition-colors">
            {/* =========================
                MODERN TOP NAVBAR
            ========================= */}
            <header className="sticky top-0 z-30 backdrop-blur-md bg-white/85 dark:bg-black/90 border-b border-slate-200/80 dark:border-neutral-800 px-4 sm:px-8 py-3.5 transition-all shadow-[0_1px_3px_0_rgba(15,23,42,0.03)]">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                    {/* Brand */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-zinc-800 border border-slate-800 dark:border-zinc-700 flex items-center justify-center text-white shadow-xs">
                            <Newspaper className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="m-0 text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                                    NewsPortal
                                </h1>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                                    LIVE
                                </span>
                            </div>
                            <span className="hidden sm:block text-xs font-medium text-slate-500 dark:text-neutral-400">
                                Curated global perspectives & verified reporting
                            </span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2.5 sm:gap-3">
                        {/* Workspace CTA if Author or Editor */}
                        {(role === 'ROLE_AUTHOR' || role === 'ROLE_EDITOR') && (
                            <button
                                onClick={() =>
                                    navigate(
                                        role === 'ROLE_EDITOR'
                                            ? '/admin'
                                            : '/author'
                                    )
                                }
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-slate-800 dark:border-zinc-700 rounded-xl shadow-xs transition-all cursor-pointer"
                            >
                                <Sparkles className="w-4 h-4 text-amber-300" />
                                <span>My Workspace</span>
                            </button>
                        )}

                        {/* Unified Settings Dropdown (Contains Profile, Light/Dark Switcher, and Sign Out) */}
                        <div className="relative" ref={settingsRef}>
                            <button
                                onClick={() => setIsSettingsOpen(prev => !prev)}
                                aria-label="Settings"
                                aria-expanded={isSettingsOpen}
                                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-slate-300 dark:bg-[#121214] dark:hover:bg-zinc-800 dark:text-neutral-200 dark:border-zinc-800 rounded-xl transition-all shadow-2xs cursor-pointer select-none"
                            >
                                <Settings className={`w-4 h-4 text-slate-500 dark:text-neutral-400 transition-transform duration-300 ${isSettingsOpen ? 'rotate-90' : ''}`} />
                                <span>Settings</span>
                                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isSettingsOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isSettingsOpen && (
                                <div
                                    role="menu"
                                    className="absolute right-0 mt-2 w-72 bg-white dark:bg-[#121214] border border-slate-200/90 dark:border-zinc-800 rounded-2xl shadow-[0_12px_36px_-6px_rgba(15,23,42,0.12)] dark:shadow-[0_12px_36px_-6px_rgba(0,0,0,0.7)] p-2.5 z-50 animate-fade-in backdrop-blur-md"
                                >
                                    {/* User Identity Header */}
                                    <div className="px-3 py-2.5 mb-2 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800/80 flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-indigo-600 dark:bg-zinc-700 text-white font-black text-sm flex items-center justify-center shadow-xs">
                                            {userInitial}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate m-0">
                                                {username}
                                            </p>
                                            <span className="inline-flex items-center px-1.5 py-0.2 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 mt-0.5">
                                                {roleLabel}
                                            </span>
                                        </div>
                                    </div>

                                    {/* My Profile */}
                                    <button
                                        role="button"
                                        onClick={() => {
                                            setIsSettingsOpen(false);
                                            navigate('/profile');
                                        }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 dark:text-neutral-200 dark:hover:text-white dark:hover:bg-zinc-800/80 rounded-xl transition-all cursor-pointer text-left"
                                    >
                                        <UserIcon className="w-4 h-4 text-slate-500 dark:text-neutral-400" />
                                        <span className="flex-1">My Profile</span>
                                    </button>

                                    {/* Theme / Appearance Switcher */}
                                    <div className="px-3 py-2.5 my-1.5 bg-slate-50/70 dark:bg-zinc-900/40 rounded-xl border border-slate-100 dark:border-zinc-800/60">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                                                Appearance
                                            </span>
                                            <span className="text-[11px] font-semibold text-slate-600 dark:text-neutral-300 capitalize">
                                                {theme} Mode
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-200/60 dark:bg-zinc-900 rounded-lg">
                                            <button
                                                type="button"
                                                onClick={() => setTheme('light')}
                                                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                                                    theme === 'light'
                                                        ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                                                        : 'text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white'
                                                }`}
                                                title="Switch to Light Theme"
                                            >
                                                <Sun className={`w-3.5 h-3.5 ${theme === 'light' ? 'text-amber-500' : ''}`} />
                                                <span>Light</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setTheme('dark')}
                                                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                                                    theme === 'dark'
                                                        ? 'bg-[#18181b] text-white shadow-xs border border-zinc-700'
                                                        : 'text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white'
                                                }`}
                                                title="Switch to Dark Theme"
                                            >
                                                <Moon className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-indigo-400' : ''}`} />
                                                <span>Dark</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="my-1.5 border-t border-slate-200/80 dark:border-zinc-800/80" />

                                    {/* Sign Out */}
                                    <button
                                        role="button"
                                        onClick={() => {
                                            setIsSettingsOpen(false);
                                            handleLogout();
                                        }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs sm:text-sm font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:text-rose-300 dark:hover:bg-rose-950/25 rounded-xl transition-all cursor-pointer text-left"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        <span>Sign Out</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* =========================
                MAIN WRAPPER
            ========================= */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* =========================
                    LIVE BREAKING NEWS TICKER BANNER
                ========================= */}
                {latestAlert && !isAlertDismissed && (
                    <div className="mb-6 p-3 sm:p-4 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white rounded-2xl shadow-[0_10px_25px_-5px_rgba(220,38,38,0.35)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in border border-red-500/30">
                        <div className="flex items-start sm:items-center gap-3 min-w-0">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-white text-red-700 shadow-xs shrink-0">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                                </span>
                                {latestAlert.priority || 'BREAKING'}
                            </span>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    {latestAlert.category && (
                                        <span className="text-[11px] font-bold text-red-100 uppercase tracking-wider">
                                            [{latestAlert.category}]
                                        </span>
                                    )}
                                    <span className="text-sm sm:text-base font-extrabold truncate text-white tracking-tight">
                                        {latestAlert.headline || latestAlert.message}
                                    </span>
                                </div>
                                {latestAlert.headline && latestAlert.message && latestAlert.headline !== latestAlert.message && (
                                    <p className="text-xs text-red-100/90 truncate mt-0.5 font-sans">
                                        {latestAlert.message}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            {latestAlert.articleId && (
                                <button
                                    onClick={() => setViewingArticleId(latestAlert.articleId!)}
                                    className="px-3.5 py-1.5 bg-white text-red-700 hover:bg-red-50 text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1 active:scale-95"
                                >
                                    <span>Read Story</span>
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            )}
                            <button
                                onClick={() => setIsAlertDismissed(true)}
                                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors cursor-pointer text-white/80 hover:text-white"
                                title="Dismiss alert"
                                aria-label="Dismiss alert"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {viewingArticleId ? (
                    <div className="animate-fade-in">
                        <FullArticle
                            articleId={viewingArticleId}
                            onBack={() => setViewingArticleId(null)}
                        />
                    </div>
                ) : (
                    <>
                        {/* =========================
                            TOP HEADER & SEARCH CONTROLS
                        ========================= */}
                        <div className="mb-8">
                            {/* Date row */}
                            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 text-xs font-medium text-slate-500 dark:text-neutral-400">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-slate-500 dark:text-neutral-400" />
                                    <span>{todayDate}</span>
                                    <span className="text-slate-300 dark:text-neutral-700">•</span>
                                    <span className="font-semibold text-slate-800 dark:text-neutral-300">
                                        Curated Top Stories
                                    </span>
                                </div>
                                <div className="text-xs">
                                    Showing <span className="font-semibold text-slate-900 dark:text-white">{filteredArticles.length}</span> of{' '}
                                    <span className="font-semibold text-slate-900 dark:text-white">{totalElements}</span> articles
                                </div>
                            </div>

                            {/* Title & Discovery Bar */}
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200/80 dark:border-neutral-800">
                                <div>
                                    <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white m-0">
                                        Latest Headlines
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-500 dark:text-neutral-400 font-sans">
                                        Stay informed with verified journalism, investigative reporting, and global perspectives.
                                    </p>
                                </div>

                                {/* SEARCH & FILTERS CONTROLS */}
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                                    {/* Local Search Input */}
                                    <div className="relative min-w-[240px] sm:w-64">
                                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                        <input
                                            type="text"
                                            placeholder="🔍 Search titles & content..."
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            className="w-full pl-9 pr-8 py-2.5 text-sm bg-white dark:bg-[#121214] text-slate-900 dark:text-white rounded-xl border border-slate-200/90 dark:border-neutral-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 shadow-2xs transition-all placeholder:text-slate-400"
                                        />
                                        {searchQuery && (
                                            <button
                                                onClick={() => setSearchQuery('')}
                                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 cursor-pointer"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Author Filter Input */}
                                    <div className="flex gap-1.5">
                                        <div className="relative flex-1 sm:w-44">
                                            <PenTool className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                            <input
                                                type="text"
                                                placeholder="✍️ Filter by Author..."
                                                value={authorSearch}
                                                onChange={e => setAuthorSearch(e.target.value)}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') handleAuthorSearch();
                                                }}
                                                className="w-full pl-8 pr-3 py-2.5 text-sm bg-white dark:bg-[#121214] text-slate-900 dark:text-white rounded-xl border border-slate-200/90 dark:border-neutral-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 shadow-2xs transition-all placeholder:text-slate-400"
                                            />
                                        </div>
                                        <button
                                            onClick={handleAuthorSearch}
                                            className="px-3.5 py-2.5 bg-slate-900 hover:bg-black dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white text-sm font-semibold rounded-xl transition-all shadow-2xs cursor-pointer"
                                        >
                                            Filter
                                        </button>
                                    </div>

                                    {/* Category Select */}
                                    <div className="relative">
                                        <select
                                            value={selectedCategoryId !== null ? selectedCategoryId : ''}
                                            onChange={e => {
                                                const value = e.target.value;
                                                const catId = value === '' ? null : Number(value);
                                                handleCategoryChange(catId);
                                            }}
                                            className="w-full sm:w-44 py-2.5 px-3 pr-8 text-sm bg-white dark:bg-[#121214] text-slate-900 dark:text-white rounded-xl border border-slate-200/90 dark:border-neutral-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 shadow-2xs transition-all cursor-pointer appearance-none"
                                        >
                                            <option value="">All Categories</option>
                                            {categories.map(category => (
                                                <option key={category.id} value={category.id}>
                                                    📁 {category.name}
                                                </option>
                                            ))}
                                        </select>
                                        <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* =========================
                            MAIN STORIES GRID
                        ========================= */}
                        {loading ? (
                            <div className="py-20 text-center animate-fade-in">
                                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-100 dark:bg-zinc-900 text-slate-800 dark:text-neutral-200 mb-4 animate-bounce border border-slate-200 dark:border-zinc-800">
                                    <BookOpen className="w-7 h-7" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-800 dark:text-neutral-200">
                                    Loading today's stories...
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-neutral-400 mt-1">
                                    Fetching the freshest news and investigative reports
                                </p>
                            </div>
                        ) : articles.length === 0 ? (
                            <div className="bg-white dark:bg-[#111113] p-12 text-center rounded-2xl border border-slate-200/80 dark:border-neutral-800 shadow-xs max-w-lg mx-auto">
                                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4 text-slate-400">
                                    <Newspaper className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                                    No stories found.
                                </h3>
                                <p className="text-slate-500 dark:text-neutral-400 text-sm mb-6">
                                    We couldn't find any articles based on your current filters.
                                </p>
                                <button
                                    onClick={clearFilters}
                                    className="px-4 py-2 bg-slate-900 hover:bg-black dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
                                >
                                    Reset Filters
                                </button>
                            </div>
                        ) : filteredArticles.length === 0 ? (
                            <div className="bg-white dark:bg-[#111113] p-12 text-center rounded-2xl border border-slate-200/80 dark:border-neutral-800 shadow-xs max-w-lg mx-auto">
                                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4 text-slate-400">
                                    <Search className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                                    No results found.
                                </h3>
                                <p className="text-slate-500 dark:text-neutral-400 text-sm mb-6">
                                    We couldn't find any articles matching "{searchQuery}".
                                </p>
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="px-4 py-2 bg-slate-900 hover:bg-black dark:bg-zinc-800 text-white text-sm font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
                                >
                                    Clear Search Query
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* HORIZONTALLY SCROLLABLE HIGHLIGHTS (Most Viewed, Most Liked, Most Recent) */}
                                {!searchQuery.trim() && articles.length > 0 && (
                                    <HorizontalArticlesCarousel
                                        articles={articles}
                                        categories={categories}
                                        onSelectArticle={id => setViewingArticleId(id)}
                                        title="Curated Highlights"
                                        description="Horizontally scroll through most viewed, most liked, and recent stories"
                                    />
                                )}

                                {/* ALL ARTICLES GRID HEADER */}
                                {!searchQuery.trim() && articles.length > 0 && (
                                    <div className="flex items-center justify-between pb-3 mb-6 border-b border-slate-200/80 dark:border-neutral-800">
                                        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white m-0">
                                            All Stories
                                        </h3>
                                        <span className="text-xs text-slate-500 dark:text-neutral-400">
                                            Explore full news collection
                                        </span>
                                    </div>
                                )}

                                {/* ARTICLE CARDS GRID */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
                                    {filteredArticles.map(article => {
                                        const catName = getCategoryName(article.categoryId);
                                        const badgeStyle = getCategoryBadgeStyle(article.categoryId);
                                        const readTime = calculateReadTime(article.content);
                                        const authorInitial = (article.author || 'A').charAt(0).toUpperCase();

                                        return (
                                            <article
                                                key={article.id}
                                                className="group bg-white dark:bg-[#111113] rounded-2xl border border-slate-200/80 dark:border-neutral-800/90 overflow-hidden shadow-[0_2px_8px_-2px_rgba(15,23,42,0.05),0_1px_3px_-1px_rgba(15,23,42,0.03)] hover:shadow-[0_12px_28px_-6px_rgba(15,23,42,0.09)] hover:border-slate-300 dark:hover:border-zinc-700 hover:-translate-y-1 transition-all duration-300 flex flex-col"
                                            >
                                                {/* Card Header & Category Tag */}
                                                <div className="p-6 pb-4 flex-1 flex flex-col">
                                                    <div className="flex items-center justify-between gap-2 mb-3.5">
                                                        <span
                                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${badgeStyle}`}
                                                        >
                                                            {catName}
                                                        </span>
                                                        <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400 dark:text-neutral-500">
                                                            <Clock className="w-3 h-3" />
                                                            {readTime}
                                                        </span>
                                                    </div>

                                                    {/* Headline */}
                                                    <h3 className="text-xl font-bold leading-snug text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-zinc-200 transition-colors mb-3 line-clamp-2">
                                                        {article.title}
                                                    </h3>

                                                    {/* Author & Attribution */}
                                                    <div className="flex items-center gap-2 mb-3.5 text-xs text-slate-500 dark:text-neutral-400">
                                                        <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-zinc-800 text-slate-800 dark:text-neutral-200 border border-slate-300 dark:border-zinc-700 flex items-center justify-center font-bold text-[10px]">
                                                            {authorInitial}
                                                        </div>
                                                        <span>
                                                            By{' '}
                                                            <span className="font-semibold text-slate-800 dark:text-neutral-200">
                                                                {article.author}
                                                            </span>
                                                        </span>
                                                    </div>

                                                    {/* Excerpt */}
                                                    <p className="text-slate-600 dark:text-neutral-300 text-sm leading-relaxed line-clamp-3 mb-2">
                                                        {article.content && article.content.length > 150
                                                            ? article.content.substring(0, 150) + '...'
                                                            : article.content}
                                                    </p>
                                                </div>

                                                {/* Card Footer Action */}
                                                <div className="px-6 py-4 bg-slate-50/70 dark:bg-[#0c0c0e]/80 border-t border-slate-100 dark:border-neutral-800/80 flex items-center justify-between mt-auto">
                                                    <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-neutral-500">
                                                        {article.viewCount !== undefined && (
                                                            <span className="flex items-center gap-1">
                                                                <Eye className="w-3.5 h-3.5" />
                                                                {article.viewCount}
                                                            </span>
                                                        )}
                                                        <button
                                                            onClick={(e) => handleToggleBookmark(article, e)}
                                                            className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                                                            title={savedArticleIds.has(article.id!) ? 'Remove from bookmarks' : 'Save to bookmarks'}
                                                        >
                                                            <Bookmark className={`w-3.5 h-3.5 transition-colors ${
                                                                savedArticleIds.has(article.id!)
                                                                    ? 'fill-current text-amber-500'
                                                                    : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                                            }`} />
                                                        </button>
                                                    </div>

                                                    <button
                                                        onClick={() => setViewingArticleId(article.id!)}
                                                        className="inline-flex items-center gap-1 text-sm font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-zinc-300 group-hover:translate-x-0.5 transition-all cursor-pointer"
                                                    >
                                                        <span>Read Full Story →</span>
                                                    </button>
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>

                                {/* =========================
                                    PAGINATION BAR
                                ========================= */}
                                {totalPages > 1 && (
                                    <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-3">
                                        <button
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 0}
                                            className="inline-flex items-center gap-1 px-4 py-2 text-sm font-semibold rounded-xl border border-slate-200/90 dark:border-neutral-800 bg-white dark:bg-[#121214] text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                            <span>← Previous</span>
                                        </button>

                                        <div className="flex items-center gap-1.5">
                                            {getPageNumbers().map(pageNum => (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => handlePageChange(pageNum)}
                                                    className={`w-9 h-9 text-sm font-bold rounded-xl transition-all cursor-pointer ${
                                                        currentPage === pageNum
                                                            ? 'bg-slate-900 text-white dark:bg-zinc-100 dark:text-black shadow-xs'
                                                            : 'bg-white dark:bg-[#121214] text-slate-700 dark:text-neutral-300 border border-slate-200/90 dark:border-neutral-800 hover:bg-slate-100 dark:hover:bg-zinc-800'
                                                    }`}
                                                >
                                                    {pageNum + 1}
                                                </button>
                                            ))}
                                        </div>

                                        <button
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage === totalPages - 1}
                                            className="inline-flex items-center gap-1 px-4 py-2 text-sm font-semibold rounded-xl border border-slate-200/90 dark:border-neutral-800 bg-white dark:bg-[#121214] text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs"
                                        >
                                            <span>Next →</span>
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

export default ArticlesDashboard;
