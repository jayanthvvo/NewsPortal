import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import {
    PenSquare,
    BookOpen,
    FolderGit2,
    User as UserIcon,
    LogOut,
    Save,
    Clock,
    CheckCircle2,
    FileText,
    Sparkles,
    ExternalLink,
    Eye,
    Heart,
    Bookmark,
    Trash2,
    AlertTriangle,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';

import { articleService, type Article } from '../services/articleService';
import { categoryService, type Category } from '../services/categoryService';
import { bookmarkService } from '../services/bookmarkService';
import { authService } from '../services/authService';
import { userService, type UserProfile } from '../services/userService';
import FullArticle from './FullArticle';
import HorizontalArticlesCarousel from '../components/HorizontalArticlesCarousel';
import ThemeToggle from '../components/ThemeToggle';

const AuthorWorkspace: React.FC = () => {
    // Shared State
    const [activeTab, setActiveTab] = useState<string>('read');
    const [loading, setLoading] = useState<boolean>(false);

    // View Article State
    const [viewingArticleId, setViewingArticleId] = useState<number | null>(null);

    // Modal State
    const [confirmSubmitId, setConfirmSubmitId] = useState<number | null>(null);

    const navigate = useNavigate();

    // Data States & Pagination
    const ARTICLES_PER_PAGE = 10;
    const [categories, setCategories] = useState<Category[]>([]);
    const [publishedArticles, setPublishedArticles] = useState<Article[]>([]);
    const [myArticles, setMyArticles] = useState<Article[]>([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    // Tab: Write Article State
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [categoryId, setCategoryId] = useState<number | ''>('');

    // Tab: Edit Draft State
    const [editingArticleId, setEditingArticleId] = useState<number | null>(null);
    const [rejectionFeedback, setRejectionFeedback] = useState<string | null>(null);

    const handleStartEditArticle = (article: Article) => {
        setEditingArticleId(article.id!);
        setTitle(article.title);
        setContent(article.content);
        setCategoryId(article.categoryId);
        setRejectionFeedback(article.rejectionReason || null);
        setActiveTab('write');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingArticleId(null);
        setRejectionFeedback(null);
        setTitle('');
        setContent('');
        if (categories.length > 0) {
            setCategoryId(categories[0].id);
        }
    };

    // Tab: Profile State
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [bio, setBio] = useState('');
    const [savingProfile, setSavingProfile] = useState(false);

    // Reading Activity (Liked & Saved Articles for Author)
    const [likedArticles, setLikedArticles] = useState<Article[]>([]);
    const [likedArticlesLoading, setLikedArticlesLoading] = useState<boolean>(false);
    const [savedArticles, setSavedArticles] = useState<Article[]>([]);
    const [profileActiveTab, setProfileActiveTab] = useState<'liked' | 'saved'>('liked');

    useEffect(() => {
        const role = authService.getRole();

        if (
            !authService.isAuthenticated() ||
            (role !== 'ROLE_EDITOR' && role !== 'ROLE_AUTHOR')
        ) {
            navigate('/login');
            return;
        }

        fetchCategories();

        if (activeTab === 'manage') {
            fetchMyArticles();
        } else if (activeTab === 'read') {
            fetchPublishedArticles(0);
        } else if (activeTab === 'profile') {
            fetchUserProfile();
            fetchLikedArticles();
            refreshSavedArticles();
        }

        // Reset article view on tab change
        setViewingArticleId(null);
    }, [activeTab, navigate]);

    useEffect(() => {
        const handleBookmarksChanged = () => {
            refreshSavedArticles();
        };
        window.addEventListener('bookmarks-changed', handleBookmarksChanged);
        return () => window.removeEventListener('bookmarks-changed', handleBookmarksChanged);
    }, []);

    const refreshSavedArticles = () => {
        setSavedArticles(bookmarkService.getSavedArticles());
    };

    const handleRemoveBookmark = (e: React.MouseEvent, articleId: number) => {
        e.stopPropagation();
        bookmarkService.removeSave(articleId);
        setSavedArticles(prev => prev.filter(a => a.id !== articleId));
        toast.success("Bookmark removed");
    };

    const fetchCategories = async () => {
        try {
            const data = await categoryService.getAllCategories();
            setCategories(data || []);
            if (data && data.length > 0 && categoryId === '') {
                setCategoryId(data[0].id);
            }
        } catch (error) {
            console.error('Failed to load categories', error);
        }
    };

    const fetchPublishedArticles = async (page: number = 0) => {
        try {
            setLoading(true);
            const data = await articleService.getAllPublishedArticles(page, ARTICLES_PER_PAGE);

            if (Array.isArray(data)) {
                setPublishedArticles(data);
                setCurrentPage(page);
                setTotalPages(Math.max(1, Math.ceil(data.length / ARTICLES_PER_PAGE)));
                setTotalElements(data.length);
            } else if (data && Array.isArray(data.content)) {
                setPublishedArticles(data.content);
                setCurrentPage(data.number ?? page);
                setTotalPages(data.totalPages ?? 1);
                setTotalElements(data.totalElements ?? data.content.length);
            } else {
                setPublishedArticles([]);
                setCurrentPage(0);
                setTotalPages(0);
                setTotalElements(0);
            }
        } catch (error) {
            console.error('Failed to load published articles', error);
            setPublishedArticles([]);
            setTotalPages(0);
            setTotalElements(0);
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (page: number) => {
        if (page < 0 || page >= totalPages) return;
        fetchPublishedArticles(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const getPageNumbers = () => {
        const pages: number[] = [];
        for (let i = 0; i < totalPages; i++) {
            pages.push(i);
        }
        return pages;
    };

    const fetchMyArticles = async () => {
        try {
            setLoading(true);
            const data = await articleService.getMyArticles();
            setMyArticles(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to load your articles', error);
            toast.error('Failed to load your articles.');
            setMyArticles([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserProfile = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (!token) return;

            const payload = JSON.parse(
                atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
            );
            const username = payload.sub;

            if (username) {
                const data = await userService.getProfile(username);
                setProfile(data);
                setFirstName(data.firstName || '');
                setLastName(data.lastName || '');
                setBio(data.bio || '');
            }
        } catch (error) {
            console.error('Failed to load user profile', error);
            toast.error('Failed to load user profile.');
        } finally {
            setLoading(false);
        }
    };

    const fetchLikedArticles = async () => {
        try {
            setLikedArticlesLoading(true);
            const data = await articleService.getLikedArticles();
            setLikedArticles(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch liked articles:', error);
            setLikedArticles([]);
        } finally {
            setLikedArticlesLoading(false);
        }
    };

    const handleSaveDraft = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (title.trim().length < 5) {
            toast.error('Title must be at least 5 characters long.');
            return;
        }

        if (content.trim().length < 5) {
            toast.error('Content must be at least 5 characters long.');
            return;
        }

        if (!categoryId) {
            toast.error('Please select a news category.');
            return;
        }

        try {
            setLoading(true);
            if (editingArticleId) {
                await articleService.updateArticle(editingArticleId, {
                    title: title.trim(),
                    content: content.trim(),
                    categoryId: Number(categoryId)
                });
                toast.success('Draft updated successfully!');
            } else {
                await articleService.createArticle({
                    title: title.trim(),
                    content: content.trim(),
                    categoryId: Number(categoryId)
                });
                toast.success('Article saved successfully as a DRAFT!');
            }

            handleCancelEdit();
            setActiveTab('manage');
            fetchMyArticles();
        } catch (error) {
            console.error('Failed to save article', error);
            toast.error('Failed to save article.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateAndSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (title.trim().length < 5) {
            toast.error('Title must be at least 5 characters long.');
            return;
        }

        if (content.trim().length < 5) {
            toast.error('Content must be at least 5 characters long.');
            return;
        }

        if (!categoryId) {
            toast.error('Please select a news category.');
            return;
        }

        try {
            setLoading(true);
            if (editingArticleId) {
                await articleService.updateArticle(editingArticleId, {
                    title: title.trim(),
                    content: content.trim(),
                    categoryId: Number(categoryId)
                });
                await articleService.submitForReview(editingArticleId);
                toast.success('Draft updated and submitted for review!');
            } else {
                const created = await articleService.createArticle({
                    title: title.trim(),
                    content: content.trim(),
                    categoryId: Number(categoryId)
                });
                if (created.id) {
                    await articleService.submitForReview(created.id);
                }
                toast.success('Article created and submitted for review!');
            }

            handleCancelEdit();
            setActiveTab('manage');
            fetchMyArticles();
        } catch (error) {
            console.error('Failed to save and submit article', error);
            toast.error('Failed to submit article for review.');
        } finally {
            setLoading(false);
        }
    };

    const confirmSubmitForReview = async () => {
        if (!confirmSubmitId) return;

        try {
            await articleService.submitForReview(confirmSubmitId);
            toast.success('Article submitted for admin review!');
            setConfirmSubmitId(null);
            fetchMyArticles();
        } catch (error) {
            console.error('Failed to submit article for review', error);
            toast.error('Failed to submit article for review.');
        }
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setSavingProfile(true);
            await userService.updateProfile({
                firstName,
                lastName,
                bio
            });
            toast.success('Profile updated successfully!');
            fetchUserProfile();
        } catch (error) {
            console.error('Failed to update profile', error);
            toast.error('Failed to update profile.');
        } finally {
            setSavingProfile(false);
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const getCategoryName = (id: number) => {
        const cat = categories.find(c => c.id === id);
        return cat ? cat.name : 'Breaking News';
    };

    const getStatusBadge = (status: string, rejectionReason?: string) => {
        if (status === 'DRAFT' && rejectionReason) {
            return 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800';
        }
        switch (status) {
            case 'PUBLISHED':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800';
            case 'REVIEW':
                return 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800';
            case 'DRAFT':
                return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700';
            case 'REJECTED':
                return 'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800';
            default:
                return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700';
        }
    };

    const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
    const estReadingTime = Math.max(1, Math.ceil(wordCount / 180));

    const publishedCount = myArticles.filter(a => a.status === 'PUBLISHED').length;
    const reviewCount = myArticles.filter(a => a.status === 'REVIEW').length;
    const draftCount = myArticles.filter(a => a.status === 'DRAFT').length;

    const handleTabSwitch = (tab: string) => {
        setActiveTab(tab);
        setViewingArticleId(null);
    };

    return (
        <div className="flex h-screen font-sans bg-[#f8f9fc] dark:bg-black text-slate-900 dark:text-neutral-100 relative overflow-hidden">
            <Toaster position="top-right" reverseOrder={false} />

            {/* =========================
                MODERN SIDEBAR
            ========================= */}
            <aside className="w-64 sm:w-72 bg-white dark:bg-[#0c0c0e] border-r border-slate-200/80 dark:border-neutral-800 flex flex-col shrink-0 shadow-[1px_0_3px_0_rgba(15,23,42,0.02)] z-20">
                {/* Header */}
                <div className="p-6 border-b border-slate-200/80 dark:border-neutral-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-zinc-800 border border-slate-800 dark:border-zinc-700 text-white flex items-center justify-center shadow-xs">
                            <PenSquare className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white m-0 tracking-tight">
                                Author Workspace
                            </h2>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-xs font-semibold text-slate-500 dark:text-neutral-400">
                                    Journalist Desk
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 py-6 px-3.5 overflow-y-auto">
                    <ul className="flex flex-col gap-1.5 list-none p-0 m-0">
                        <li>
                            <button
                                onClick={() => handleTabSwitch('read')}
                                className={`w-full px-3.5 py-3 text-left rounded-xl font-semibold text-sm transition-all flex items-center gap-3 cursor-pointer ${
                                    activeTab === 'read'
                                        ? 'bg-slate-900 text-white dark:bg-zinc-800 dark:text-white shadow-xs'
                                        : 'text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-zinc-900'
                                }`}
                            >
                                <BookOpen className="w-4 h-4" />
                                <span>📰 Read Articles</span>
                            </button>
                        </li>

                        <li>
                            <button
                                onClick={() => handleTabSwitch('write')}
                                className={`w-full px-3.5 py-3 text-left rounded-xl font-semibold text-sm transition-all flex items-center gap-3 cursor-pointer ${
                                    activeTab === 'write'
                                        ? 'bg-slate-900 text-white dark:bg-zinc-800 dark:text-white shadow-xs'
                                        : 'text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-zinc-900'
                                }`}
                            >
                                <PenSquare className="w-4 h-4" />
                                <span>✍️ Write New Article</span>
                            </button>
                        </li>

                        <li>
                            <button
                                onClick={() => handleTabSwitch('manage')}
                                className={`w-full px-3.5 py-3 text-left rounded-xl font-semibold text-sm transition-all flex justify-between items-center cursor-pointer ${
                                    activeTab === 'manage'
                                        ? 'bg-slate-900 text-white dark:bg-zinc-800 dark:text-white shadow-xs'
                                        : 'text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-zinc-900'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <FolderGit2 className="w-4 h-4" />
                                    <span>🗂️ My Content</span>
                                </div>
                                {myArticles.length > 0 && (
                                    <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-slate-200 text-slate-800 dark:bg-zinc-800 dark:text-neutral-200">
                                        {myArticles.length}
                                    </span>
                                )}
                            </button>
                        </li>

                        <li>
                            <button
                                onClick={() => handleTabSwitch('profile')}
                                className={`w-full px-3.5 py-3 text-left rounded-xl font-semibold text-sm transition-all flex items-center gap-3 cursor-pointer ${
                                    activeTab === 'profile'
                                        ? 'bg-slate-900 text-white dark:bg-zinc-800 dark:text-white shadow-xs'
                                        : 'text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-zinc-900'
                                }`}
                            >
                                <UserIcon className="w-4 h-4" />
                                <span>👤 My Profile</span>
                            </button>
                        </li>
                    </ul>
                </nav>

                {/* Sidebar Footer */}
                <div className="p-4 border-t border-slate-200/80 dark:border-neutral-800 flex flex-col gap-2.5">
                    <ThemeToggle showLabel className="w-full justify-center" />
                    <button
                        onClick={handleLogout}
                        className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-neutral-200 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* =========================
                MAIN CONTENT AREA
            ========================= */}
            <main className="flex-1 p-6 sm:p-10 overflow-y-auto">
                <div className="max-w-6xl mx-auto">
                    {/* TOP-LEVEL VIEWING ARTICLE OR TABS */}
                    {viewingArticleId ? (
                        <div className="w-full animate-fade-in">
                            <FullArticle
                                articleId={viewingArticleId}
                                onBack={() => setViewingArticleId(null)}
                            />
                        </div>
                    ) : (
                        <>
                            {/* =========================
                                TAB 1: READ ARTICLES
                            ========================= */}
                            {activeTab === 'read' && (
                                <div className="animate-fade-in">
                                    <div className="pb-4 mb-6 border-b border-slate-200/80 dark:border-neutral-800">
                                        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white m-0">
                                            Latest Headlines
                                        </h2>
                                        <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-1">
                                            Stay up-to-date with published reports from your fellow journalists
                                        </p>
                                    </div>

                                    {loading ? (
                                        <div className="p-12 text-center animate-pulse text-slate-500 font-medium">
                                            Loading today's stories...
                                        </div>
                                    ) : publishedArticles.length === 0 ? (
                                        <div className="p-8 bg-white dark:bg-[#111113] border border-slate-200/80 dark:border-neutral-800 rounded-2xl text-slate-600 dark:text-neutral-300 text-center shadow-xs">
                                            No stories published yet. Check back later!
                                        </div>
                                    ) : (
                                        <>
                                            {/* HORIZONTALLY SCROLLABLE HIGHLIGHTS */}
                                            {publishedArticles.length > 0 && (
                                                <HorizontalArticlesCarousel
                                                    articles={publishedArticles}
                                                    categories={categories}
                                                    onSelectArticle={id => setViewingArticleId(id)}
                                                    title="Journalist Digest"
                                                    description="Horizontally scroll through most viewed, most liked, and recent stories"
                                                />
                                            )}

                                            {/* ALL STORIES GRID HEADER */}
                                            {publishedArticles.length > 0 && (
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-6 border-b border-slate-200/80 dark:border-neutral-800 gap-2">
                                                    <div>
                                                        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white m-0">
                                                            All Published Stories
                                                        </h3>
                                                        <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                                                            {totalElements > 0
                                                                ? `Showing page ${currentPage + 1} of ${totalPages} • (${totalElements} total stories)`
                                                                : 'Read latest coverage'}
                                                        </p>
                                                    </div>
                                                    {totalPages > 1 && (
                                                        <div className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-neutral-300">
                                                            Page {currentPage + 1} of {totalPages}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                            {publishedArticles.map(article => (
                                                <article
                                                    key={article.id}
                                                    className="bg-white dark:bg-[#111113] rounded-2xl border border-slate-200/80 dark:border-neutral-800/90 overflow-hidden shadow-[0_2px_8px_-2px_rgba(15,23,42,0.05),0_1px_3px_-1px_rgba(15,23,42,0.03)] hover:shadow-[0_12px_28px_-6px_rgba(15,23,42,0.08)] hover:border-slate-300 dark:hover:border-zinc-700 transition-all flex flex-col"
                                                >
                                                    <div className="p-6 flex-1 flex flex-col">
                                                        <div className="inline-flex items-center self-start px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/80 dark:bg-zinc-800 dark:text-neutral-200 dark:border-zinc-700 mb-3">
                                                            {getCategoryName(article.categoryId)}
                                                        </div>

                                                        <h3 className="m-0 mb-2 text-xl font-bold leading-snug text-slate-900 dark:text-white">
                                                            {article.title}
                                                        </h3>

                                                        <div className="text-xs text-slate-500 dark:text-neutral-400 mb-3 italic">
                                                            By{' '}
                                                            <span className="font-semibold text-slate-700 dark:text-neutral-300">
                                                                {article.author}
                                                            </span>
                                                        </div>

                                                        <p className="text-slate-600 dark:text-neutral-300 text-sm leading-relaxed m-0 line-clamp-3">
                                                            {article.content && article.content.length > 150
                                                                ? article.content.substring(0, 150) + "..."
                                                                : article.content}
                                                        </p>
                                                    </div>

                                                    <div className="p-4 bg-slate-50/70 dark:bg-[#0c0c0e]/80 border-t border-slate-100 dark:border-neutral-800/80 text-right mt-auto">
                                                        <button
                                                            onClick={() => setViewingArticleId(article.id!)}
                                                            className="text-sm font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-zinc-300 cursor-pointer"
                                                        >
                                                            Read Full Story →
                                                        </button>
                                                    </div>
                                                </article>
                                            ))}
                                            </div>

                                            {/* =========================
                                                PAGINATION BAR
                                            ========================= */}
                                            {totalPages > 1 && (
                                                <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
                                                    <button
                                                        onClick={() => handlePageChange(currentPage - 1)}
                                                        disabled={currentPage === 0}
                                                        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl border border-slate-200/90 dark:border-neutral-800 bg-white dark:bg-[#121214] text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
                                                    >
                                                        <ChevronLeft className="w-4 h-4" />
                                                        <span>Previous</span>
                                                    </button>

                                                    <div className="flex items-center gap-1.5 flex-wrap justify-center">
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
                                                        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl border border-slate-200/90 dark:border-neutral-800 bg-white dark:bg-[#121214] text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
                                                    >
                                                        <span>Next</span>
                                                        <ChevronRight className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}

                            {/* =========================
                                TAB 2: WRITE ARTICLE
                            ========================= */}
                            {activeTab === 'write' && (
                                <div className="animate-fade-in max-w-4xl mx-auto">
                                    <div className="pb-4 mb-6 border-b border-slate-200/80 dark:border-neutral-800">
                                        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white m-0">
                                            {editingArticleId ? 'Revise News Story' : 'Compose News Story'}
                                        </h2>
                                        <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-1">
                                            {editingArticleId
                                                ? 'Update and refine your draft in response to editorial feedback'
                                                : 'Draft compelling news pieces, investigative narratives, or breaking coverage'}
                                        </p>
                                    </div>

                                    {editingArticleId && (
                                        <div className="mb-6 p-5 rounded-2xl border border-indigo-200 dark:border-indigo-800/60 bg-gradient-to-r from-indigo-50/80 to-purple-50/50 dark:from-indigo-950/30 dark:to-purple-950/20 shadow-xs">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="px-2.5 py-0.5 text-[11px] font-black rounded-lg bg-indigo-600 text-white uppercase tracking-wider">
                                                            Draft Revision Mode
                                                        </span>
                                                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                                                            Editing Draft #{editingArticleId}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-600 dark:text-neutral-400 mt-1">
                                                        Make revisions to your draft below. You can save changes or re-submit directly for review.
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={handleCancelEdit}
                                                    className="px-3.5 py-1.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-neutral-700 text-slate-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-zinc-800 transition-colors shrink-0 cursor-pointer shadow-2xs"
                                                >
                                                    Cancel Edit
                                                </button>
                                            </div>

                                            {rejectionFeedback && (
                                                <div className="mt-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 text-amber-950 dark:text-amber-200 text-xs">
                                                    <div className="font-extrabold flex items-center gap-2 text-amber-800 dark:text-amber-300 mb-1.5 text-sm">
                                                        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                                                        <span>Admin Editorial Feedback:</span>
                                                    </div>
                                                    <blockquote className="italic border-l-2 border-amber-400 pl-3 my-1.5 text-slate-800 dark:text-neutral-200 leading-relaxed font-medium">
                                                        "{rejectionFeedback}"
                                                    </blockquote>
                                                    <p className="mt-2 text-[11px] text-amber-700 dark:text-amber-400 font-semibold">
                                                        💡 Please update your draft according to the admin's feedback above before re-submitting.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="bg-white dark:bg-[#111113] border border-slate-200/80 dark:border-neutral-800 p-6 sm:p-8 rounded-2xl shadow-xs">
                                        <form onSubmit={handleSaveDraft} className="flex flex-col gap-6">
                                            {/* Headline */}
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <label className="text-sm font-bold text-slate-900 dark:text-white">
                                                        Headline
                                                    </label>
                                                    <span className={`text-xs ${
                                                        title.trim().length > 0 && title.trim().length < 5
                                                            ? 'text-rose-500 font-semibold'
                                                            : title.trim().length > 200
                                                            ? 'text-rose-500 font-semibold'
                                                            : 'text-slate-400'
                                                    }`}>
                                                        {title.trim().length}/200 characters (min 5)
                                                    </span>
                                                </div>
                                                <input
                                                    type="text"
                                                    value={title}
                                                    onChange={e => setTitle(e.target.value)}
                                                    required
                                                    minLength={5}
                                                    maxLength={200}
                                                    className={`w-full px-4 py-3 bg-slate-50/70 dark:bg-[#18181b] text-slate-900 dark:text-white border ${
                                                        title.trim().length > 0 && title.trim().length < 5
                                                            ? 'border-rose-400 dark:border-rose-500 focus:ring-rose-400/20'
                                                            : 'border-slate-200/90 dark:border-neutral-800 focus:ring-indigo-500/10 focus:border-indigo-500'
                                                    } rounded-xl text-lg font-bold focus:outline-none focus:ring-4 transition-all placeholder:text-slate-400`}
                                                    placeholder="Breaking News..."
                                                />
                                                {title.trim().length > 0 && title.trim().length < 5 && (
                                                    <p className="mt-1.5 text-xs text-rose-500 font-medium">
                                                        Title must be at least 5 characters long.
                                                    </p>
                                                )}
                                            </div>

                                            {/* News Category */}
                                            <div>
                                                <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
                                                    News Category
                                                </label>
                                                <select
                                                    value={categoryId}
                                                    onChange={e => setCategoryId(Number(e.target.value))}
                                                    required
                                                    className="w-full px-4 py-3 bg-slate-50/70 dark:bg-[#18181b] text-slate-900 dark:text-white border border-slate-200/90 dark:border-neutral-800 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all cursor-pointer"
                                                >
                                                    <option value="" disabled>
                                                        Select a Category...
                                                    </option>
                                                    {categories.map(cat => (
                                                        <option key={cat.id} value={cat.id}>
                                                            {cat.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Content Editor */}
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <label className="text-sm font-bold text-slate-900 dark:text-white">
                                                        Article Content
                                                    </label>
                                                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-neutral-400">
                                                        <span className={
                                                            content.trim().length > 0 && content.trim().length < 5
                                                                ? 'text-rose-500 font-semibold'
                                                                : 'text-slate-400'
                                                        }>
                                                            {content.trim().length} characters (min 5)
                                                        </span>
                                                        <span>•</span>
                                                        <span>{wordCount} words</span>
                                                        <span>•</span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {estReadingTime} min read
                                                        </span>
                                                    </div>
                                                </div>
                                                <textarea
                                                    value={content}
                                                    onChange={e => setContent(e.target.value)}
                                                    required
                                                    minLength={5}
                                                    rows={12}
                                                    className={`w-full p-4 bg-slate-50/70 dark:bg-[#18181b] text-slate-900 dark:text-white border ${
                                                        content.trim().length > 0 && content.trim().length < 5
                                                            ? 'border-rose-400 dark:border-rose-500 focus:ring-rose-400/20'
                                                            : 'border-slate-200/90 dark:border-neutral-800 focus:ring-indigo-500/10 focus:border-indigo-500'
                                                    } rounded-xl text-sm leading-relaxed focus:outline-none focus:ring-4 transition-all resize-y placeholder:text-slate-400`}
                                                    placeholder="Write your full story here..."
                                                />
                                                {content.trim().length > 0 && content.trim().length < 5 && (
                                                    <p className="mt-1.5 text-xs text-rose-500 font-medium">
                                                        Content must be at least 5 characters long.
                                                    </p>
                                                )}
                                            </div>

                                            {/* Form Footer */}
                                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-6 border-t border-slate-200/80 dark:border-neutral-800">
                                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                                                    <span>{editingArticleId ? 'Changes update your existing draft portfolio entry' : 'Drafts can be reviewed and edited in "My Content" before submission'}</span>
                                                </div>

                                                <div className="flex items-center gap-2.5">
                                                    {editingArticleId && (
                                                        <button
                                                            type="button"
                                                            onClick={handleCancelEdit}
                                                            className="px-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                                                        >
                                                            Cancel
                                                        </button>
                                                    )}
                                                    <button
                                                        type="submit"
                                                        disabled={loading}
                                                        className="px-5 py-2.5 bg-slate-900 hover:bg-black dark:bg-zinc-800 dark:hover:bg-zinc-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2 shrink-0"
                                                    >
                                                        <Save className="w-4 h-4" />
                                                        <span>{loading ? 'Saving...' : editingArticleId ? '💾 Update Draft' : '💾 Save as Draft'}</span>
                                                    </button>
                                                    {editingArticleId && (
                                                        <button
                                                            type="button"
                                                            onClick={handleUpdateAndSubmit}
                                                            disabled={loading}
                                                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2 shrink-0"
                                                        >
                                                            <span>🚀 Update & Submit for Review</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}

                            {/* =========================
                                TAB 3: MY CONTENT
                            ========================= */}
                            {activeTab === 'manage' && (
                                <div className="animate-fade-in">
                                    <div className="pb-4 mb-6 border-b border-slate-200/80 dark:border-neutral-800">
                                        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white m-0">
                                            My Content Portfolio
                                        </h2>
                                        <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-1">
                                            Track status, submit drafts for editorial review, and manage published articles
                                        </p>
                                    </div>

                                    {/* EDITORIAL STATS STRIP (PORTFOLIO KPIs) */}
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                        <div className="bg-white dark:bg-[#111113] p-4 rounded-2xl border border-slate-200/80 dark:border-neutral-800 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.05)] flex items-center gap-3.5">
                                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/70 dark:bg-zinc-900 dark:text-neutral-200 dark:border-zinc-800 flex items-center justify-center shrink-0">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="text-xl font-black text-slate-900 dark:text-white">
                                                    {myArticles.length}
                                                </div>
                                                <div className="text-xs font-medium text-slate-500 dark:text-neutral-400">
                                                    Total Stories
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white dark:bg-[#111113] p-4 rounded-2xl border border-slate-200/80 dark:border-neutral-800 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.05)] flex items-center gap-3.5">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/70 dark:bg-zinc-900 dark:text-neutral-200 dark:border-zinc-800 flex items-center justify-center shrink-0">
                                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                            </div>
                                            <div>
                                                <div className="text-xl font-black text-slate-900 dark:text-white">
                                                    {publishedCount}
                                                </div>
                                                <div className="text-xs font-medium text-slate-500 dark:text-neutral-400">
                                                    Published
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white dark:bg-[#111113] p-4 rounded-2xl border border-slate-200/80 dark:border-neutral-800 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.05)] flex items-center gap-3.5">
                                            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/70 dark:bg-zinc-900 dark:text-neutral-200 dark:border-zinc-800 flex items-center justify-center shrink-0">
                                                <Clock className="w-5 h-5 text-amber-500" />
                                            </div>
                                            <div>
                                                <div className="text-xl font-black text-slate-900 dark:text-white">
                                                    {reviewCount}
                                                </div>
                                                <div className="text-xs font-medium text-slate-500 dark:text-neutral-400">
                                                    In Review
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white dark:bg-[#111113] p-4 rounded-2xl border border-slate-200/80 dark:border-neutral-800 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.05)] flex items-center gap-3.5">
                                            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-200/70 dark:bg-zinc-900 dark:text-neutral-200 dark:border-zinc-800 flex items-center justify-center shrink-0">
                                                <Save className="w-5 h-5 text-purple-500 dark:text-zinc-400" />
                                            </div>
                                            <div>
                                                <div className="text-xl font-black text-slate-900 dark:text-white">
                                                    {draftCount}
                                                </div>
                                                <div className="text-xs font-medium text-slate-500 dark:text-neutral-400">
                                                    Drafts
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {loading ? (
                                        <div className="p-12 text-center animate-pulse text-slate-500 font-medium">
                                            Loading your articles...
                                        </div>
                                    ) : myArticles.length === 0 ? (
                                        <div className="p-10 bg-white dark:bg-[#111113] border border-slate-200/80 dark:border-neutral-800 rounded-2xl text-slate-600 dark:text-neutral-300 text-center shadow-xs">
                                            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-neutral-200 flex items-center justify-center mx-auto mb-3">
                                                <PenSquare className="w-6 h-6" />
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                                                No articles written yet
                                            </h3>
                                            <p className="text-sm text-slate-500 dark:text-neutral-400 mb-4">
                                                You haven't written any articles yet! Go to the "Write New Article" tab to start your first story.
                                            </p>
                                            <button
                                                onClick={() => setActiveTab('write')}
                                                className="px-4 py-2 bg-slate-900 hover:bg-black dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white font-semibold text-sm rounded-xl transition-all cursor-pointer"
                                            >
                                                Write a Story
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="bg-white dark:bg-[#111113] border border-slate-200/80 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-xs">
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left border-collapse">
                                                    <thead className="bg-slate-50/90 dark:bg-[#0c0c0e] border-b border-slate-200 dark:border-neutral-800 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                                                        <tr>
                                                            <th className="p-4 pl-6">ID</th>
                                                            <th className="p-4">Headline</th>
                                                            <th className="p-4">Status</th>
                                                            <th className="p-4 pr-6 text-right">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100 dark:divide-neutral-800/80 text-sm">
                                                        {myArticles.map(article => {
                                                            const isPublished = article.status === 'PUBLISHED';
                                                            return (
                                                                <tr
                                                                    key={article.id}
                                                                    className={`transition-colors ${
                                                                        isPublished
                                                                            ? 'hover:bg-slate-50 dark:hover:bg-zinc-800/40 cursor-pointer'
                                                                            : 'hover:bg-slate-50/60 dark:hover:bg-zinc-900/40'
                                                                    }`}
                                                                >
                                                                    <td className="p-4 pl-6 font-mono text-xs text-slate-400">
                                                                        #{article.id}
                                                                    </td>
                                                                    <td className="p-4 font-semibold text-slate-900 dark:text-white max-w-md">
                                                                        {isPublished ? (
                                                                            <button
                                                                                onClick={() => setViewingArticleId(article.id!)}
                                                                                className="font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-zinc-200 hover:underline text-left inline-flex items-center gap-1.5 cursor-pointer group/link"
                                                                                title="Click to view published article"
                                                                            >
                                                                                <span>{article.title}</span>
                                                                                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover/link:text-indigo-600 dark:group-hover/link:text-white transition-colors shrink-0" />
                                                                            </button>
                                                                        ) : (
                                                                            <span>{article.title}</span>
                                                                        )}

                                                                        {article.rejectionReason && (article.status === 'DRAFT' || article.status === 'REJECTED') && (
                                                                            <div className="mt-2.5 p-3 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs font-normal">
                                                                                <div className="font-bold flex items-center gap-1.5 text-amber-700 dark:text-amber-400 mb-1">
                                                                                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                                                                    <span>Admin Rejection Feedback:</span>
                                                                                </div>
                                                                                <p className="italic text-slate-700 dark:text-neutral-300 pl-4 border-l-2 border-amber-400 dark:border-amber-500 my-1 leading-relaxed">
                                                                                    "{article.rejectionReason}"
                                                                                </p>
                                                                            </div>
                                                                        )}
                                                                    </td>
                                                                    <td className="p-4">
                                                                        <span
                                                                            className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${getStatusBadge(
                                                                                article.status,
                                                                                article.rejectionReason
                                                                            )}`}
                                                                        >
                                                                            {article.status === 'DRAFT' && article.rejectionReason ? 'Needs Revision' : article.status}
                                                                        </span>
                                                                    </td>
                                                                    <td className="p-4 pr-6 text-right">
                                                                        {isPublished ? (
                                                                            <button
                                                                                onClick={() => setViewingArticleId(article.id!)}
                                                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-black dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-all cursor-pointer border border-slate-800 dark:border-zinc-700 hover:translate-x-0.5"
                                                                                title="Read published article"
                                                                            >
                                                                                <Eye className="w-3.5 h-3.5 text-zinc-300" />
                                                                                <span>View Published Article →</span>
                                                                            </button>
                                                                        ) : article.status === 'DRAFT' || article.status === 'REJECTED' ? (
                                                                            <div className="inline-flex items-center gap-2 justify-end">
                                                                                <button
                                                                                    onClick={() => handleStartEditArticle(article)}
                                                                                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 dark:text-indigo-300 text-xs font-bold rounded-lg border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                                                                                    title="Edit and revise this draft"
                                                                                >
                                                                                    <PenSquare className="w-3.5 h-3.5" />
                                                                                    <span>{article.rejectionReason ? 'Revise Draft' : 'Edit Draft'}</span>
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => setConfirmSubmitId(article.id!)}
                                                                                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-black dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer border border-slate-700"
                                                                                >
                                                                                    📤 Submit for Review
                                                                                </button>
                                                                            </div>
                                                                        ) : (
                                                                            <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
                                                                                <Clock className="w-3 h-3" />
                                                                                <span>Under Review</span>
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* =========================
                                TAB 4: MY PROFILE
                            ========================= */}
                            {activeTab === 'profile' && (
                                <div className="animate-fade-in max-w-3xl mx-auto">
                                    <div className="pb-4 mb-6 border-b border-slate-200/80 dark:border-neutral-800">
                                        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white m-0">
                                            My Profile Settings
                                        </h2>
                                        <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-1">
                                            Update your public author byline, biographical information, and credentials
                                        </p>
                                    </div>

                                    {loading ? (
                                        <div className="p-12 text-center animate-pulse text-slate-500 font-medium">
                                            Loading profile...
                                        </div>
                                    ) : (
                                        <>
                                        <div className="bg-white dark:bg-[#111113] p-6 sm:p-8 rounded-2xl border border-slate-200/80 dark:border-neutral-800 shadow-xs">
                                            <div className="flex items-center gap-4 pb-6 mb-6 border-b border-slate-200/80 dark:border-neutral-800">
                                                <div className="w-16 h-16 rounded-2xl bg-indigo-600 dark:bg-zinc-800 border border-indigo-700 dark:border-neutral-700 text-white font-black text-2xl flex items-center justify-center shadow-xs">
                                                    {(profile?.username || 'U').charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white m-0">
                                                        {profile?.username || 'Unknown User'}
                                                    </h3>
                                                    <div className="text-sm text-slate-500 dark:text-neutral-400">
                                                        {profile?.email || 'No email associated'}
                                                    </div>
                                                </div>
                                            </div>

                                            <form onSubmit={handleSaveProfile} className="flex flex-col gap-5">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                                                            First Name
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={firstName}
                                                            onChange={e => setFirstName(e.target.value)}
                                                            className="w-full px-4 py-2.5 text-sm bg-slate-50/70 dark:bg-[#18181b] text-slate-900 dark:text-white border border-slate-200/90 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                                                            Last Name
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={lastName}
                                                            onChange={e => setLastName(e.target.value)}
                                                            className="w-full px-4 py-2.5 text-sm bg-slate-50/70 dark:bg-[#18181b] text-slate-900 dark:text-white border border-slate-200/90 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                                                        About Me (Bio)
                                                    </label>
                                                    <textarea
                                                        value={bio}
                                                        onChange={e => setBio(e.target.value)}
                                                        rows={4}
                                                        placeholder="Tell the community about yourself..."
                                                        className="w-full p-4 text-sm bg-slate-50/70 dark:bg-[#18181b] text-slate-900 dark:text-white border border-slate-200/90 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 resize-y"
                                                    />
                                                </div>

                                                <button
                                                    type="submit"
                                                    disabled={savingProfile}
                                                    className="w-full py-3 px-4 bg-slate-900 hover:bg-black dark:bg-zinc-800 dark:hover:bg-zinc-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-xs transition-all cursor-pointer"
                                                >
                                                    {savingProfile ? 'Saving...' : 'Save Profile Changes'}
                                                </button>
                                            </form>
                                        </div>

                                        {/* =========================
                                            READING ACTIVITY: LIKED & SAVED
                                        ========================= */}
                                        <div className="mt-8 pt-8 border-t border-slate-200/80 dark:border-neutral-800">
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                                                <div>
                                                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                                                        Reading Activity
                                                    </h3>
                                                    <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-1">
                                                        Manage articles you have liked or saved for later
                                                    </p>
                                                </div>

                                                {/* Sub-tabs for Liked vs Saved */}
                                                <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-[#18181b] rounded-xl border border-slate-200/80 dark:border-neutral-800 self-start sm:self-auto">
                                                    <button
                                                        type="button"
                                                        onClick={() => setProfileActiveTab('liked')}
                                                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                                            profileActiveTab === 'liked'
                                                                ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs'
                                                                : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                                                        }`}
                                                    >
                                                        <Heart className={`w-3.5 h-3.5 ${profileActiveTab === 'liked' ? 'fill-current text-rose-500' : 'text-slate-400'}`} />
                                                        <span>Liked Articles</span>
                                                        <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 dark:bg-zinc-700">
                                                            {likedArticles.length}
                                                        </span>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => setProfileActiveTab('saved')}
                                                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                                            profileActiveTab === 'saved'
                                                                ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs'
                                                                : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                                                        }`}
                                                    >
                                                        <Bookmark className={`w-3.5 h-3.5 ${profileActiveTab === 'saved' ? 'fill-current text-amber-500' : 'text-slate-400'}`} />
                                                        <span>Saved Bookmarks</span>
                                                        <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 dark:bg-zinc-700">
                                                            {savedArticles.length}
                                                        </span>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Sub-tab content */}
                                            {profileActiveTab === 'liked' && (
                                                likedArticlesLoading ? (
                                                    <div className="p-8 text-center text-slate-500 font-medium animate-pulse">
                                                        Loading liked articles...
                                                    </div>
                                                ) : likedArticles.length === 0 ? (
                                                    <div className="p-8 bg-white dark:bg-[#111113] border border-slate-200/80 dark:border-neutral-800 rounded-2xl text-center shadow-xs">
                                                        <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-zinc-800 text-rose-500 flex items-center justify-center mx-auto mb-2 border border-rose-200/60 dark:border-zinc-700">
                                                            <Heart className="w-5 h-5" />
                                                        </div>
                                                        <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                                                            No liked articles yet
                                                        </h4>
                                                        <p className="text-xs text-slate-500 dark:text-neutral-400 mb-4">
                                                            When you like an article across the portal, it will be listed here.
                                                        </p>
                                                        <button
                                                            type="button"
                                                            onClick={() => setActiveTab('read')}
                                                            className="px-4 py-2 bg-slate-900 hover:bg-black dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer shadow-xs"
                                                        >
                                                            Explore Articles
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {likedArticles.map(article => (
                                                            <div
                                                                key={`liked-${article.id}`}
                                                                className="bg-white dark:bg-[#111113] rounded-2xl border border-slate-200/80 dark:border-neutral-800 overflow-hidden shadow-[0_2px_8px_-2px_rgba(15,23,42,0.05)] hover:border-slate-300 dark:hover:border-neutral-700 transition-all flex flex-col"
                                                            >
                                                                <div className="p-5 flex-1 flex flex-col">
                                                                    <div className="flex items-center justify-between gap-2 mb-2">
                                                                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                                                                            Article #{article.id}
                                                                        </span>
                                                                        <Heart className="w-4 h-4 fill-current text-rose-500" />
                                                                    </div>
                                                                    <h4 className="text-base font-bold leading-snug text-slate-900 dark:text-white mb-1 line-clamp-2">
                                                                        {article.title}
                                                                    </h4>
                                                                    <div className="text-xs text-slate-500 dark:text-neutral-400 italic mb-2">
                                                                        By <span className="font-semibold text-slate-700 dark:text-neutral-300">{article.author || 'Journalist'}</span>
                                                                    </div>
                                                                    <p className="text-slate-600 dark:text-neutral-300 text-xs leading-relaxed line-clamp-2">
                                                                        {article.content && article.content.length > 120
                                                                            ? article.content.substring(0, 120) + '...'
                                                                            : article.content}
                                                                    </p>
                                                                </div>
                                                                <div className="px-5 py-3 bg-slate-50/70 dark:bg-[#0c0c0e]/80 border-t border-slate-100 dark:border-neutral-800/80 flex items-center justify-between mt-auto">
                                                                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                                                                        <Eye className="w-3.5 h-3.5" />
                                                                        {article.viewCount || 0} views
                                                                    </span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setViewingArticleId(article.id!)}
                                                                        className="text-xs font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-zinc-300 cursor-pointer flex items-center gap-1"
                                                                    >
                                                                        <span>Read Article</span>
                                                                        <span>→</span>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )
                                            )}

                                            {profileActiveTab === 'saved' && (
                                                savedArticles.length === 0 ? (
                                                    <div className="p-8 bg-white dark:bg-[#111113] border border-slate-200/80 dark:border-neutral-800 rounded-2xl text-center shadow-xs">
                                                        <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-zinc-800 text-amber-500 flex items-center justify-center mx-auto mb-2 border border-amber-200/60 dark:border-zinc-700">
                                                            <Bookmark className="w-5 h-5" />
                                                        </div>
                                                        <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                                                            No saved bookmarks
                                                        </h4>
                                                        <p className="text-xs text-slate-500 dark:text-neutral-400 mb-4">
                                                            Click the bookmark icon on any article to save it for reading later.
                                                        </p>
                                                        <button
                                                            type="button"
                                                            onClick={() => setActiveTab('read')}
                                                            className="px-4 py-2 bg-slate-900 hover:bg-black dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer shadow-xs"
                                                        >
                                                            Browse Articles
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {savedArticles.map(article => (
                                                            <div
                                                                key={`saved-${article.id}`}
                                                                className="bg-white dark:bg-[#111113] rounded-2xl border border-slate-200/80 dark:border-neutral-800 overflow-hidden shadow-[0_2px_8px_-2px_rgba(15,23,42,0.05)] hover:border-slate-300 dark:hover:border-neutral-700 transition-all flex flex-col"
                                                            >
                                                                <div className="p-5 flex-1 flex flex-col">
                                                                    <div className="flex items-center justify-between gap-2 mb-2">
                                                                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                                                                            Saved Bookmark
                                                                        </span>
                                                                        <button
                                                                            type="button"
                                                                            title="Remove Bookmark"
                                                                            onClick={(e) => handleRemoveBookmark(e, article.id!)}
                                                                            className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                                                                        >
                                                                            <Trash2 className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    </div>
                                                                    <h4 className="text-base font-bold leading-snug text-slate-900 dark:text-white mb-1 line-clamp-2">
                                                                        {article.title}
                                                                    </h4>
                                                                    <div className="text-xs text-slate-500 dark:text-neutral-400 italic mb-2">
                                                                        By <span className="font-semibold text-slate-700 dark:text-neutral-300">{article.author || 'Journalist'}</span>
                                                                    </div>
                                                                    <p className="text-slate-600 dark:text-neutral-300 text-xs leading-relaxed line-clamp-2">
                                                                        {article.content && article.content.length > 120
                                                                            ? article.content.substring(0, 120) + '...'
                                                                            : article.content}
                                                                    </p>
                                                                </div>
                                                                <div className="px-5 py-3 bg-slate-50/70 dark:bg-[#0c0c0e]/80 border-t border-slate-100 dark:border-neutral-800/80 flex items-center justify-between mt-auto">
                                                                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                                                                        <Eye className="w-3.5 h-3.5" />
                                                                        {article.viewCount || 0} views
                                                                    </span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setViewingArticleId(article.id!)}
                                                                        className="text-xs font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-zinc-300 cursor-pointer flex items-center gap-1"
                                                                    >
                                                                        <span>Read Article</span>
                                                                        <span>→</span>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )
                                            )}
                                        </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>

            {/* =========================
                CONFIRMATION MODAL
            ========================= */}
            {confirmSubmitId && (
                <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white dark:bg-[#141416] rounded-2xl border border-slate-200/90 dark:border-neutral-800 shadow-xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                            Submit for Review?
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-neutral-300 mb-6 leading-relaxed">
                            Are you sure you want to submit this article to the admin? Once submitted, it will be locked until reviewed.
                        </p>
                        <div className="flex items-center justify-end gap-3">
                            <button
                                onClick={() => setConfirmSubmitId(null)}
                                className="px-4 py-2 text-sm font-semibold rounded-xl border border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmSubmitForReview}
                                className="px-4 py-2 text-sm font-semibold rounded-xl bg-slate-900 hover:bg-black dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white shadow-xs transition-all cursor-pointer"
                            >
                                Confirm Submission
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuthorWorkspace;
