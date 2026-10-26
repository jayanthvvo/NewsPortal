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
    Trash2
} from 'lucide-react';

import { articleService, type Article } from '../services/articleService';
import { categoryService, type Category } from '../services/categoryService';
import { bookmarkService } from '../services/bookmarkService';
import { authService } from '../services/authService';
import { userService, type UserProfile } from '../services/userService';
import FullArticle from './FullArticle';
import HorizontalArticlesCarousel from '../components/HorizontalArticlesCarousel';

const AuthorWorkspace: React.FC = () => {
    // Shared State
    const [activeTab, setActiveTab] = useState<string>('read');
    const [loading, setLoading] = useState<boolean>(false);

    // View Article State
    const [viewingArticleId, setViewingArticleId] = useState<number | null>(null);

    // Modal State
    const [confirmSubmitId, setConfirmSubmitId] = useState<number | null>(null);

    const navigate = useNavigate();

    // Data States
    const [categories, setCategories] = useState<Category[]>([]);
    const [publishedArticles, setPublishedArticles] = useState<Article[]>([]);
    const [myArticles, setMyArticles] = useState<Article[]>([]);

    // Tab: Write Article State
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [categoryId, setCategoryId] = useState<number | ''>('');

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
            fetchPublishedArticles();
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

    // --- FETCH FUNCTIONS ---

    const fetchCategories = async () => {
        try {
            const data = await categoryService.getAllCategories();
            setCategories(data || []);
            if (data && data.length > 0 && categoryId === '') {
                setCategoryId(data[0].id);
            }
        } catch (error) {
            console.error("Error loading categories:", error);
            toast.error("Unable to load categories.");
        }
    };

    const fetchMyArticles = async () => {
        try {
            setLoading(true);
            const data = await articleService.getMyArticles();
            setMyArticles(data || []);
        } catch (error) {
            console.error("Error fetching my articles:", error);
            toast.error("Unable to load your articles.");
            setMyArticles([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchPublishedArticles = async () => {
        try {
            setLoading(true);
            const data = await articleService.getAllPublishedArticles();
            const contentList = Array.isArray(data) ? data : (data?.content || []);
            setPublishedArticles([...contentList].reverse());
        } catch (error) {
            console.error("Error fetching published articles:", error);
            toast.error("Unable to load published articles.");
            setPublishedArticles([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserProfile = async () => {
        const token = localStorage.getItem('token');

        if (!token) {
            toast.error("Authentication token not found.");
            return;
        }

        try {
            setLoading(true);
            const payload = JSON.parse(
                atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
            );
            const username = payload.sub;

            if (!username) {
                throw new Error("Username not found in authentication token.");
            }

            const data = await userService.getProfile(username);
            setProfile(data);
            setFirstName(data.firstName || '');
            setLastName(data.lastName || '');
            setBio(data.bio || '');
        } catch (error) {
            console.error("Failed to load profile:", error);
            toast.error("Unable to load your profile.");
        } finally {
            setLoading(false);
        }
    };

    const fetchLikedArticles = async () => {
        try {
            setLikedArticlesLoading(true);
            const data = await articleService.getLikedArticles();
            const contentList = Array.isArray(data) ? data : ((data as any)?.content || []);
            setLikedArticles(contentList);
        } catch (error) {
            console.error("Failed to load liked articles:", error);
            setLikedArticles([]);
        } finally {
            setLikedArticlesLoading(false);
        }
    };

    const refreshSavedArticles = () => {
        setSavedArticles(bookmarkService.getSavedArticles());
    };

    const handleRemoveBookmark = (e: React.MouseEvent, articleId: number) => {
        e.stopPropagation();
        bookmarkService.removeSave(articleId);
        setSavedArticles(prev => prev.filter(a => a.id !== articleId));
        toast.success("Article removed from saved bookmarks.");
    };

    // Helper to extract clear backend validation error messages
    const extractErrorMessage = (error: any, fallbackMessage: string): string => {
        if (error?.response?.data) {
            const data = error.response.data;
            if (typeof data === 'string' && data.trim()) {
                return data;
            }
            if (typeof data === 'object') {
                if (data.message && typeof data.message === 'string') {
                    return data.message;
                }
                // Handle Spring validation errors map: { fieldName: "Error message" }
                const fieldErrors = Object.values(data)
                    .filter((msg): msg is string => typeof msg === 'string' && msg.trim().length > 0);
                if (fieldErrors.length > 0) {
                    return fieldErrors.join(' • ');
                }
            }
        }
        if (error?.message && typeof error.message === 'string') {
            return error.message;
        }
        return fallbackMessage;
    };

    // --- ACTIONS ---

    const handleSaveDraft = async (e: React.FormEvent) => {
        e.preventDefault();

        const trimmedTitle = title.trim();
        const trimmedContent = content.trim();

        // Title validation
        if (!trimmedTitle) {
            toast.error("Title is required and cannot be empty.");
            return;
        }

        if (trimmedTitle.length < 5) {
            toast.error("Title must be at least 5 characters long.");
            return;
        }

        if (trimmedTitle.length > 200) {
            toast.error("Title cannot exceed 200 characters.");
            return;
        }

        // Category validation
        if (categoryId === '' || categoryId === undefined || categoryId === null) {
            toast.error("Please select a valid news category.");
            return;
        }

        // Content validation
        if (!trimmedContent) {
            toast.error("Article content cannot be empty.");
            return;
        }

        if (trimmedContent.length < 5) {
            toast.error("Content must be at least 5 characters long.");
            return;
        }

        setLoading(true);

        try {
            await articleService.createArticle({
                title: trimmedTitle,
                content: trimmedContent,
                categoryId: Number(categoryId)
            });

            toast.success("Article saved successfully as a DRAFT!");
            setTitle('');
            setContent('');
            setActiveTab('manage');
        } catch (error: any) {
            console.error("Failed to save draft:", error);
            const msg = extractErrorMessage(error, "Failed to save draft. Please check your article details.");
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const confirmSubmitForReview = async () => {
        if (!confirmSubmitId) return;

        try {
            await articleService.submitForReview(confirmSubmitId);
            toast.success("Submitted for review!");
            await fetchMyArticles();
        } catch (error: any) {
            console.error("Failed to submit article:", error);
            const msg = extractErrorMessage(error, "Failed to submit article for review.");
            toast.error(msg);
        } finally {
            setConfirmSubmitId(null);
        }
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingProfile(true);

        try {
            await userService.updateProfile({
                firstName,
                lastName,
                bio
            });
            toast.success("Profile updated successfully!");
        } catch (error) {
            console.error("Failed to update profile:", error);
            toast.error("Failed to update profile.");
        } finally {
            setSavingProfile(false);
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const getCategoryName = (id: number) => {
        const category = categories.find(c => c.id === id);
        return category ? category.name : 'Breaking News';
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PUBLISHED':
                return 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
            case 'REVIEW':
                return 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
            case 'REJECTED':
                return 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800';
            default:
                return 'bg-neutral-100 text-neutral-800 border-neutral-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700';
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
        <div className="flex h-screen font-sans bg-[#f8f8fa] dark:bg-black text-neutral-900 dark:text-neutral-100 relative overflow-hidden">
            <Toaster position="top-right" reverseOrder={false} />

            {/* =========================
                LIGHT BLACK / BLACK SIDEBAR
            ========================= */}
            <aside className="w-64 sm:w-72 bg-white dark:bg-[#0c0c0e] border-r border-neutral-200 dark:border-neutral-800 flex flex-col shrink-0 shadow-sm z-20">
                {/* Header */}
                <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-neutral-900 dark:bg-zinc-800 border border-neutral-800 dark:border-zinc-700 text-white flex items-center justify-center shadow-sm">
                            <PenSquare className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-neutral-900 dark:text-white m-0 tracking-tight">
                                Author Workspace
                            </h2>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="w-2 h-2 rounded-full bg-neutral-500 dark:bg-zinc-400 animate-pulse" />
                                <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
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
                                        ? 'bg-neutral-900 text-white dark:bg-zinc-800 dark:text-white shadow-xs'
                                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-zinc-900'
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
                                        ? 'bg-neutral-900 text-white dark:bg-zinc-800 dark:text-white shadow-xs'
                                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-zinc-900'
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
                                        ? 'bg-neutral-900 text-white dark:bg-zinc-800 dark:text-white shadow-xs'
                                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-zinc-900'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <FolderGit2 className="w-4 h-4" />
                                    <span>🗂️ My Content</span>
                                </div>
                                {myArticles.length > 0 && (
                                    <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-neutral-200 dark:bg-zinc-800 text-neutral-800 dark:text-neutral-200">
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
                                        ? 'bg-neutral-900 text-white dark:bg-zinc-800 dark:text-white shadow-xs'
                                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-zinc-900'
                                }`}
                            >
                                <UserIcon className="w-4 h-4" />
                                <span>👤 My Profile</span>
                            </button>
                        </li>
                    </ul>
                </nav>

                {/* Sidebar Footer */}
                <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
                    <button
                        onClick={handleLogout}
                        className="w-full py-2.5 px-4 bg-neutral-100 hover:bg-neutral-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-neutral-700 dark:text-neutral-200 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
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
                                    <div className="pb-4 mb-6 border-b border-neutral-200 dark:border-neutral-800">
                                        <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white m-0">
                                            Latest Headlines
                                        </h2>
                                        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                                            Stay up-to-date with published reports from your fellow journalists
                                        </p>
                                    </div>

                                    {loading ? (
                                        <div className="p-12 text-center animate-pulse text-neutral-500 font-medium">
                                            Loading today's stories...
                                        </div>
                                    ) : publishedArticles.length === 0 ? (
                                        <div className="p-8 bg-white dark:bg-[#111113] border border-neutral-200 dark:border-neutral-800 rounded-2xl text-neutral-600 dark:text-neutral-300 text-center shadow-xs">
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
                                                <div className="flex items-center justify-between pb-3 mb-6 border-b border-neutral-200 dark:border-neutral-800">
                                                    <h3 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white m-0">
                                                        All Published Stories
                                                    </h3>
                                                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                                        Read latest coverage
                                                    </span>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                            {publishedArticles.map(article => (
                                                <article
                                                    key={article.id}
                                                    className="bg-white dark:bg-[#111113] rounded-2xl border border-neutral-200 dark:border-neutral-800/90 overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col"
                                                >
                                                    <div className="p-6 flex-1 flex flex-col">
                                                        <div className="inline-flex items-center self-start px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-neutral-100 dark:bg-zinc-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-zinc-700 mb-3">
                                                            {getCategoryName(article.categoryId)}
                                                        </div>

                                                        <h3 className="m-0 mb-2 text-xl font-bold leading-snug text-black dark:text-white">
                                                            {article.title}
                                                        </h3>

                                                        <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-3 italic">
                                                            By{' '}
                                                            <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                                                                {article.author}
                                                            </span>
                                                        </div>

                                                        <p className="text-neutral-600 dark:text-neutral-300 text-sm leading-relaxed m-0 line-clamp-3">
                                                            {article.content && article.content.length > 150
                                                                ? article.content.substring(0, 150) + "..."
                                                                : article.content}
                                                        </p>
                                                    </div>

                                                    <div className="p-4 bg-neutral-50/80 dark:bg-[#0c0c0e]/80 border-t border-neutral-100 dark:border-neutral-800/80 text-right mt-auto">
                                                        <button
                                                            onClick={() => setViewingArticleId(article.id!)}
                                                            className="text-sm font-bold text-neutral-900 dark:text-white hover:opacity-80 cursor-pointer"
                                                        >
                                                            Read Full Story →
                                                        </button>
                                                    </div>
                                                </article>
                                            ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                    {/* =========================
                        TAB 2: WRITE ARTICLE
                    ========================= */}
                    {activeTab === 'write' && (
                        <div className="animate-fade-in max-w-4xl mx-auto">
                            <div className="pb-4 mb-6 border-b border-neutral-200 dark:border-neutral-800">
                                <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white m-0">
                                    Compose News Story
                                </h2>
                                <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                                    Draft compelling news pieces, investigative narratives, or breaking coverage
                                </p>
                            </div>

                            <div className="bg-white dark:bg-[#111113] border border-neutral-200 dark:border-neutral-800 p-6 sm:p-8 rounded-2xl shadow-xs">
                                <form onSubmit={handleSaveDraft} className="flex flex-col gap-6">
                                    {/* Headline */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-sm font-bold text-neutral-900 dark:text-white">
                                                Headline
                                            </label>
                                            <span className={`text-xs ${
                                                title.trim().length > 0 && title.trim().length < 5
                                                    ? 'text-rose-500 font-semibold'
                                                    : title.trim().length > 200
                                                    ? 'text-rose-500 font-semibold'
                                                    : 'text-neutral-400'
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
                                            className={`w-full px-4 py-3 bg-neutral-50 dark:bg-[#18181b] text-neutral-900 dark:text-white border ${
                                                title.trim().length > 0 && title.trim().length < 5
                                                    ? 'border-rose-400 dark:border-rose-500 focus:ring-rose-400/30'
                                                    : 'border-neutral-200 dark:border-neutral-800 focus:ring-neutral-400/30'
                                            } rounded-xl text-lg font-bold focus:outline-none focus:ring-2 focus:border-neutral-600 transition-all placeholder:text-neutral-400`}
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
                                        <label className="block text-sm font-bold text-neutral-900 dark:text-white mb-2">
                                            News Category
                                        </label>
                                        <select
                                            value={categoryId}
                                            onChange={e => setCategoryId(Number(e.target.value))}
                                            required
                                            className="w-full px-4 py-3 bg-neutral-50 dark:bg-[#18181b] text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-neutral-400/30 focus:border-neutral-600 transition-all cursor-pointer"
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
                                            <label className="text-sm font-bold text-neutral-900 dark:text-white">
                                                Article Content
                                            </label>
                                            <div className="flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400">
                                                <span className={
                                                    content.trim().length > 0 && content.trim().length < 5
                                                        ? 'text-rose-500 font-semibold'
                                                        : 'text-neutral-400'
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
                                            className={`w-full p-4 bg-neutral-50 dark:bg-[#18181b] text-neutral-900 dark:text-white border ${
                                                content.trim().length > 0 && content.trim().length < 5
                                                    ? 'border-rose-400 dark:border-rose-500 focus:ring-rose-400/30'
                                                    : 'border-neutral-200 dark:border-neutral-800 focus:ring-neutral-400/30'
                                            } rounded-xl text-sm leading-relaxed focus:outline-none focus:ring-2 focus:border-neutral-600 transition-all resize-y placeholder:text-neutral-400`}
                                            placeholder="Write your full story here..."
                                        />
                                        {content.trim().length > 0 && content.trim().length < 5 && (
                                            <p className="mt-1.5 text-xs text-rose-500 font-medium">
                                                Content must be at least 5 characters long.
                                            </p>
                                        )}
                                    </div>

                                    {/* Form Footer */}
                                    <div className="flex items-center justify-between pt-6 border-t border-neutral-200 dark:border-neutral-800">
                                        <div className="flex items-center gap-2 text-xs text-neutral-500">
                                            <Sparkles className="w-4 h-4 text-zinc-400" />
                                            <span>Drafts can be reviewed and edited in "My Content" before submission</span>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="px-6 py-3 bg-neutral-900 hover:bg-black dark:bg-zinc-800 dark:hover:bg-zinc-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2 shrink-0"
                                        >
                                            <Save className="w-4 h-4" />
                                            <span>{loading ? 'Saving...' : '💾 Save as Draft'}</span>
                                        </button>
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
                            <div className="pb-4 mb-6 border-b border-neutral-200 dark:border-neutral-800">
                                <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white m-0">
                                    My Content Portfolio
                                </h2>
                                <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                                    Track status, submit drafts for editorial review, and manage published articles
                                </p>
                            </div>

                            {/* EDITORIAL STATS STRIP (PORTFOLIO KPIs) */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                <div className="bg-white dark:bg-[#111113] p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs flex items-center gap-3.5">
                                    <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-zinc-900 text-neutral-800 dark:text-neutral-200 flex items-center justify-center shrink-0 border border-neutral-200 dark:border-zinc-800">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-xl font-black text-neutral-900 dark:text-white">
                                            {myArticles.length}
                                        </div>
                                        <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                                            Total Stories
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-[#111113] p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs flex items-center gap-3.5">
                                    <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-zinc-900 text-neutral-800 dark:text-neutral-200 flex items-center justify-center shrink-0 border border-neutral-200 dark:border-zinc-800">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                    </div>
                                    <div>
                                        <div className="text-xl font-black text-neutral-900 dark:text-white">
                                            {publishedCount}
                                        </div>
                                        <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                                            Published
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-[#111113] p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs flex items-center gap-3.5">
                                    <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-zinc-900 text-neutral-800 dark:text-neutral-200 flex items-center justify-center shrink-0 border border-neutral-200 dark:border-zinc-800">
                                        <Clock className="w-5 h-5 text-amber-500" />
                                    </div>
                                    <div>
                                        <div className="text-xl font-black text-neutral-900 dark:text-white">
                                            {reviewCount}
                                        </div>
                                        <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                                            In Review
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-[#111113] p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs flex items-center gap-3.5">
                                    <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-zinc-900 text-neutral-800 dark:text-neutral-200 flex items-center justify-center shrink-0 border border-neutral-200 dark:border-zinc-800">
                                        <Save className="w-5 h-5 text-zinc-400" />
                                    </div>
                                    <div>
                                        <div className="text-xl font-black text-neutral-900 dark:text-white">
                                            {draftCount}
                                        </div>
                                        <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                                            Drafts
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {loading ? (
                                <div className="p-12 text-center animate-pulse text-neutral-500 font-medium">
                                    Loading your articles...
                                </div>
                            ) : myArticles.length === 0 ? (
                                <div className="p-10 bg-white dark:bg-[#111113] border border-neutral-200 dark:border-neutral-800 rounded-2xl text-neutral-600 dark:text-neutral-300 text-center shadow-xs">
                                    <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-zinc-800 text-neutral-800 dark:text-neutral-200 flex items-center justify-center mx-auto mb-3">
                                        <PenSquare className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">
                                        No articles written yet
                                    </h3>
                                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                                        You haven't written any articles yet! Go to the "Write New Article" tab to start your first story.
                                    </p>
                                    <button
                                        onClick={() => setActiveTab('write')}
                                        className="px-4 py-2 bg-neutral-900 hover:bg-black dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white font-semibold text-sm rounded-xl transition-all cursor-pointer"
                                    >
                                        Write a Story
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-white dark:bg-[#111113] border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-xs">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead className="bg-neutral-50 dark:bg-[#0c0c0e] border-b border-neutral-200 dark:border-neutral-800 text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                                <tr>
                                                    <th className="p-4 pl-6">ID</th>
                                                    <th className="p-4">Headline</th>
                                                    <th className="p-4">Status</th>
                                                    <th className="p-4 pr-6 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/80 text-sm">
                                                {myArticles.map(article => {
                                                    const isPublished = article.status === 'PUBLISHED';
                                                    return (
                                                        <tr
                                                            key={article.id}
                                                            className={`transition-colors ${
                                                                isPublished
                                                                    ? 'hover:bg-neutral-100/70 dark:hover:bg-zinc-800/40 cursor-pointer'
                                                                    : 'hover:bg-neutral-50/70 dark:hover:bg-zinc-900/40'
                                                            }`}
                                                        >
                                                            <td className="p-4 pl-6 font-mono text-xs text-neutral-400">
                                                                #{article.id}
                                                            </td>
                                                            <td className="p-4 font-semibold text-black dark:text-white max-w-md">
                                                                {isPublished ? (
                                                                    <button
                                                                        onClick={() => setViewingArticleId(article.id!)}
                                                                        className="font-bold text-black dark:text-white hover:underline text-left inline-flex items-center gap-1.5 cursor-pointer group/link"
                                                                        title="Click to view published article"
                                                                    >
                                                                        <span>{article.title}</span>
                                                                        <ExternalLink className="w-3.5 h-3.5 text-neutral-400 group-hover/link:text-black dark:group-hover/link:text-white transition-colors shrink-0" />
                                                                    </button>
                                                                ) : (
                                                                    <span>{article.title}</span>
                                                                )}
                                                            </td>
                                                            <td className="p-4">
                                                                <span
                                                                    className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${getStatusBadge(
                                                                        article.status
                                                                    )}`}
                                                                >
                                                                    {article.status}
                                                                </span>
                                                            </td>
                                                            <td className="p-4 pr-6 text-right">
                                                                {isPublished ? (
                                                                    <button
                                                                        onClick={() => setViewingArticleId(article.id!)}
                                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-black dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-all cursor-pointer border border-neutral-800 dark:border-zinc-700 hover:translate-x-0.5"
                                                                        title="Read published article"
                                                                    >
                                                                        <Eye className="w-3.5 h-3.5 text-zinc-300" />
                                                                        <span>View Published Article →</span>
                                                                    </button>
                                                                ) : article.status === 'DRAFT' || article.status === 'REJECTED' ? (
                                                                    <button
                                                                        onClick={() => setConfirmSubmitId(article.id!)}
                                                                        className="px-3.5 py-1.5 bg-neutral-900 hover:bg-black dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer border border-neutral-700"
                                                                    >
                                                                        📤 Submit for Review
                                                                    </button>
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
                            <div className="pb-4 mb-6 border-b border-neutral-200 dark:border-neutral-800">
                                <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white m-0">
                                    My Profile Settings
                                </h2>
                                <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                                    Update your public author byline, biographical information, and credentials
                                </p>
                            </div>

                            {loading ? (
                                <div className="p-12 text-center animate-pulse text-neutral-500 font-medium">
                                    Loading profile...
                                </div>
                            ) : (
                                <>
                                <div className="bg-white dark:bg-[#111113] p-6 sm:p-8 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs">
                                    <div className="flex items-center gap-4 pb-6 mb-6 border-b border-neutral-200 dark:border-neutral-800">
                                        <div className="w-16 h-16 rounded-2xl bg-neutral-900 dark:bg-zinc-800 border border-neutral-700 text-white font-black text-2xl flex items-center justify-center shadow-sm">
                                            {(profile?.username || 'U').charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-neutral-900 dark:text-white m-0">
                                                {profile?.username || 'Unknown User'}
                                            </h3>
                                            <div className="text-sm text-neutral-500 dark:text-neutral-400">
                                                {profile?.email || 'No email associated'}
                                            </div>
                                        </div>
                                    </div>

                                    <form onSubmit={handleSaveProfile} className="flex flex-col gap-5">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider mb-2">
                                                    First Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={firstName}
                                                    onChange={e => setFirstName(e.target.value)}
                                                    className="w-full px-4 py-2.5 text-sm bg-neutral-50 dark:bg-[#18181b] text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-400/30 focus:border-neutral-600"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider mb-2">
                                                    Last Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={lastName}
                                                    onChange={e => setLastName(e.target.value)}
                                                    className="w-full px-4 py-2.5 text-sm bg-neutral-50 dark:bg-[#18181b] text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-400/30 focus:border-neutral-600"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider mb-2">
                                                About Me (Bio)
                                            </label>
                                            <textarea
                                                value={bio}
                                                onChange={e => setBio(e.target.value)}
                                                rows={4}
                                                placeholder="Tell the community about yourself..."
                                                className="w-full p-4 text-sm bg-neutral-50 dark:bg-[#18181b] text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-400/30 focus:border-neutral-600 resize-y"
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={savingProfile}
                                            className="w-full py-3 px-4 bg-neutral-900 hover:bg-black dark:bg-zinc-800 dark:hover:bg-zinc-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-xs transition-all cursor-pointer"
                                        >
                                            {savingProfile ? 'Saving...' : 'Save Profile Changes'}
                                        </button>
                                    </form>
                                </div>

                                {/* =========================
                                    READING ACTIVITY: LIKED & SAVED
                                ========================= */}
                                <div className="mt-8 pt-8 border-t border-neutral-200 dark:border-neutral-800">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                                        <div>
                                            <h3 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">
                                                Reading Activity
                                            </h3>
                                            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                                                Manage articles you have liked or saved for later
                                            </p>
                                        </div>

                                        {/* Sub-tabs for Liked vs Saved */}
                                        <div className="flex items-center gap-1.5 p-1 bg-neutral-100 dark:bg-[#18181b] rounded-xl border border-neutral-200 dark:border-neutral-800 self-start sm:self-auto">
                                            <button
                                                type="button"
                                                onClick={() => setProfileActiveTab('liked')}
                                                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                                    profileActiveTab === 'liked'
                                                        ? 'bg-white dark:bg-zinc-800 text-neutral-900 dark:text-white shadow-xs'
                                                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                                                }`}
                                            >
                                                <Heart className={`w-3.5 h-3.5 ${profileActiveTab === 'liked' ? 'fill-current text-rose-500' : 'text-neutral-500'}`} />
                                                <span>Liked Articles</span>
                                                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-neutral-200 dark:bg-zinc-700">
                                                    {likedArticles.length}
                                                </span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setProfileActiveTab('saved')}
                                                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                                    profileActiveTab === 'saved'
                                                        ? 'bg-white dark:bg-zinc-800 text-neutral-900 dark:text-white shadow-xs'
                                                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                                                }`}
                                            >
                                                <Bookmark className={`w-3.5 h-3.5 ${profileActiveTab === 'saved' ? 'fill-current text-amber-500' : 'text-neutral-500'}`} />
                                                <span>Saved Bookmarks</span>
                                                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-neutral-200 dark:bg-zinc-700">
                                                    {savedArticles.length}
                                                </span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Sub-tab content */}
                                    {profileActiveTab === 'liked' && (
                                        likedArticlesLoading ? (
                                            <div className="p-8 text-center text-neutral-500 font-medium animate-pulse">
                                                Loading liked articles...
                                            </div>
                                        ) : likedArticles.length === 0 ? (
                                            <div className="p-8 bg-white dark:bg-[#111113] border border-neutral-200 dark:border-neutral-800 rounded-2xl text-center shadow-xs">
                                                <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-zinc-800 text-rose-500 flex items-center justify-center mx-auto mb-2">
                                                    <Heart className="w-5 h-5" />
                                                </div>
                                                <h4 className="text-base font-bold text-neutral-900 dark:text-white mb-1">
                                                    No liked articles yet
                                                </h4>
                                                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
                                                    When you like an article across the portal, it will be listed here.
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveTab('read')}
                                                    className="px-4 py-2 bg-neutral-900 hover:bg-black dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer shadow-xs"
                                                >
                                                    Explore Articles
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {likedArticles.map(article => (
                                                    <div
                                                        key={`liked-${article.id}`}
                                                        className="bg-white dark:bg-[#111113] rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-xs hover:border-neutral-300 dark:hover:border-neutral-700 transition-all flex flex-col"
                                                    >
                                                        <div className="p-5 flex-1 flex flex-col">
                                                            <div className="flex items-center justify-between gap-2 mb-2">
                                                                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                                                                    Article #{article.id}
                                                                </span>
                                                                <Heart className="w-4 h-4 fill-current text-rose-500" />
                                                            </div>
                                                            <h4 className="text-base font-bold leading-snug text-black dark:text-white mb-1 line-clamp-2">
                                                                {article.title}
                                                            </h4>
                                                            <div className="text-xs text-neutral-500 dark:text-neutral-400 italic mb-2">
                                                                By <span className="font-semibold text-neutral-700 dark:text-neutral-300">{article.author || 'Journalist'}</span>
                                                            </div>
                                                            <p className="text-neutral-600 dark:text-neutral-300 text-xs leading-relaxed line-clamp-2">
                                                                {article.content && article.content.length > 120
                                                                    ? article.content.substring(0, 120) + '...'
                                                                    : article.content}
                                                            </p>
                                                        </div>
                                                        <div className="px-5 py-3 bg-neutral-50/80 dark:bg-[#0c0c0e]/80 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between mt-auto">
                                                            <span className="inline-flex items-center gap-1 text-[11px] text-neutral-500">
                                                                <Eye className="w-3.5 h-3.5" />
                                                                {article.viewCount || 0} views
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => setViewingArticleId(article.id!)}
                                                                className="text-xs font-bold text-neutral-900 dark:text-white hover:opacity-80 cursor-pointer flex items-center gap-1"
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
                                            <div className="p-8 bg-white dark:bg-[#111113] border border-neutral-200 dark:border-neutral-800 rounded-2xl text-center shadow-xs">
                                                <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-zinc-800 text-amber-500 flex items-center justify-center mx-auto mb-2">
                                                    <Bookmark className="w-5 h-5" />
                                                </div>
                                                <h4 className="text-base font-bold text-neutral-900 dark:text-white mb-1">
                                                    No saved bookmarks
                                                </h4>
                                                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
                                                    Click the bookmark icon on any article to save it for reading later.
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveTab('read')}
                                                    className="px-4 py-2 bg-neutral-900 hover:bg-black dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer shadow-xs"
                                                >
                                                    Browse Articles
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {savedArticles.map(article => (
                                                    <div
                                                        key={`saved-${article.id}`}
                                                        className="bg-white dark:bg-[#111113] rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-xs hover:border-neutral-300 dark:hover:border-neutral-700 transition-all flex flex-col"
                                                    >
                                                        <div className="p-5 flex-1 flex flex-col">
                                                            <div className="flex items-center justify-between gap-2 mb-2">
                                                                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                                                                    Saved Bookmark
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    title="Remove Bookmark"
                                                                    onClick={(e) => handleRemoveBookmark(e, article.id!)}
                                                                    className="p-1 rounded-md text-neutral-400 hover:text-rose-500 hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                            <h4 className="text-base font-bold leading-snug text-black dark:text-white mb-1 line-clamp-2">
                                                                {article.title}
                                                            </h4>
                                                            <div className="text-xs text-neutral-500 dark:text-neutral-400 italic mb-2">
                                                                By <span className="font-semibold text-neutral-700 dark:text-neutral-300">{article.author || 'Journalist'}</span>
                                                            </div>
                                                            <p className="text-neutral-600 dark:text-neutral-300 text-xs leading-relaxed line-clamp-2">
                                                                {article.content && article.content.length > 120
                                                                    ? article.content.substring(0, 120) + '...'
                                                                    : article.content}
                                                            </p>
                                                        </div>
                                                        <div className="px-5 py-3 bg-neutral-50/80 dark:bg-[#0c0c0e]/80 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between mt-auto">
                                                            <span className="inline-flex items-center gap-1 text-[11px] text-neutral-500">
                                                                <Eye className="w-3.5 h-3.5" />
                                                                {article.viewCount || 0} views
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => setViewingArticleId(article.id!)}
                                                                className="text-xs font-bold text-neutral-900 dark:text-white hover:opacity-80 cursor-pointer flex items-center gap-1"
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
                    <div className="bg-white dark:bg-[#141416] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                            Submit for Review?
                        </h3>
                        <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-6 leading-relaxed">
                            Are you sure you want to submit this article to the admin? Once submitted, it will be locked until reviewed.
                        </p>
                        <div className="flex items-center justify-end gap-3">
                            <button
                                onClick={() => setConfirmSubmitId(null)}
                                className="px-4 py-2 text-sm font-semibold rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmSubmitForReview}
                                className="px-4 py-2 text-sm font-semibold rounded-xl bg-neutral-900 hover:bg-black dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white shadow-xs transition-all cursor-pointer"
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
