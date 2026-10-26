import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import {
    Newspaper,
    Heart,
    Bookmark,
    Trash2,
    ArrowLeft,
    LogOut,
    Eye,
    Save,
    Sparkles
} from 'lucide-react';

import { userService, type UserProfile } from '../services/userService';
import { authService } from '../services/authService';
import { articleService, type Article } from '../services/articleService';
import { bookmarkService } from '../services/bookmarkService';

const UserProfilePage: React.FC = () => {
    const navigate = useNavigate();

    // =========================
    // PROFILE STATE
    // =========================
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // =========================
    // FORM STATE
    // =========================
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [bio, setBio] = useState('');

    // =========================
    // LIKED & SAVED ARTICLES
    // =========================
    const [likedArticles, setLikedArticles] = useState<Article[]>([]);
    const [likedArticlesLoading, setLikedArticlesLoading] = useState(true);
    const [savedArticles, setSavedArticles] = useState<Article[]>([]);
    const [activityTab, setActivityTab] = useState<'liked' | 'saved'>('liked');

    const refreshSavedArticles = () => {
        setSavedArticles(bookmarkService.getSavedArticles());
    };

    const handleRemoveBookmark = (e: React.MouseEvent, articleId: number) => {
        e.stopPropagation();
        bookmarkService.removeSave(articleId);
        setSavedArticles(prev => prev.filter(a => a.id !== articleId));
        toast.success("Bookmark removed");
    };

    // =========================
    // INITIAL LOAD
    // =========================
    useEffect(() => {
        refreshSavedArticles();
        const handleBookmarksChanged = () => {
            refreshSavedArticles();
        };
        window.addEventListener('bookmarks-changed', handleBookmarksChanged);
        return () => window.removeEventListener('bookmarks-changed', handleBookmarksChanged);
    }, []);
    useEffect(() => {
        if (!authService.isAuthenticated()) {
            navigate('/login');
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const payload = JSON.parse(
                atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
            );
            const username = payload.sub;

            if (!username) {
                throw new Error('Username not found in token.');
            }

            fetchProfile(username);
            fetchLikedArticles();
        } catch (error) {
            console.error('Error decoding token:', error);
            toast.error('Your session is invalid. Please log in again.');
            authService.logout();
            navigate('/login');
        }
    }, [navigate]);

    const fetchProfile = async (username: string) => {
        try {
            setLoading(true);
            const data = await userService.getProfile(username);
            setProfile(data);
            setFirstName(data.firstName || '');
            setLastName(data.lastName || '');
            setBio(data.bio || '');
        } catch (error) {
            console.error('Failed to fetch profile:', error);
            toast.error('Unable to load your profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const fetchLikedArticles = async () => {
        try {
            setLikedArticlesLoading(true);
            const articles = await articleService.getLikedArticles();
            const content = Array.isArray(articles) ? articles : [];
            setLikedArticles(content);
        } catch (error) {
            console.error('Failed to fetch liked articles:', error);
            toast.error('Unable to load liked articles.');
            setLikedArticles([]);
        } finally {
            setLikedArticlesLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const toastId = toast.loading('Saving profile...');

        try {
            await userService.updateProfile({
                firstName,
                lastName,
                bio
            });
            toast.success('Profile updated successfully!', { id: toastId });
        } catch (error) {
            console.error('Failed to update profile:', error);
            toast.error('Failed to update profile.', { id: toastId });
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f8fa] dark:bg-black">
                <div className="w-10 h-10 border-3 border-neutral-900 dark:border-white border-t-transparent rounded-full animate-spin mb-4" />
                <div className="text-base font-semibold text-neutral-600 dark:text-neutral-400">
                    Loading Profile...
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f8f8fa] dark:bg-black px-4">
                <div className="text-center p-8 bg-white dark:bg-[#111113] border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xs max-w-md w-full">
                    <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                        Profile could not be loaded
                    </h2>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
                        Please try again or return to the news feed.
                    </p>
                    <button
                        onClick={() => navigate('/articles')}
                        className="px-5 py-2.5 bg-neutral-900 hover:bg-black dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white font-semibold text-sm rounded-xl transition-all cursor-pointer shadow-xs"
                    >
                        Back to News
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8f8fa] dark:bg-black font-sans text-neutral-900 dark:text-neutral-100 pb-16">
            <Toaster position="top-right" reverseOrder={false} />

            {/* TOP HEADER */}
            <header className="sticky top-0 z-20 backdrop-blur-md bg-white/90 dark:bg-black/90 border-b border-neutral-200 dark:border-neutral-800 px-4 sm:px-8 py-3.5 shadow-xs mb-8">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div
                        onClick={() => navigate('/articles')}
                        className="flex items-center gap-2.5 cursor-pointer group"
                    >
                        <div className="w-9 h-9 rounded-xl bg-neutral-900 dark:bg-zinc-800 border border-neutral-800 dark:border-zinc-700 text-white flex items-center justify-center shadow-xs">
                            <Newspaper className="w-4 h-4" />
                        </div>
                        <span className="text-xl font-black tracking-tight text-neutral-900 dark:text-white group-hover:text-neutral-600 dark:group-hover:text-zinc-300 transition-colors">
                            NewsPortal
                        </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <button
                            onClick={() => navigate('/articles')}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#121214] text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-all cursor-pointer shadow-2xs"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Back to News</span>
                        </button>

                        <button
                            onClick={handleLogout}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all cursor-pointer"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>Sign Out</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* MAIN CONTENT */}
            <main className="max-w-5xl mx-auto px-4 sm:px-6">
                {/* PROFILE CARD */}
                <div className="bg-white dark:bg-[#111113] rounded-3xl border border-neutral-200 dark:border-neutral-800 p-6 sm:p-10 shadow-xs mb-10">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-8 mb-8 border-b border-neutral-200 dark:border-neutral-800 text-center sm:text-left">
                        <div className="w-20 h-20 rounded-3xl bg-neutral-900 dark:bg-zinc-800 border border-neutral-700 text-white font-black text-3xl flex items-center justify-center shadow-md shrink-0">
                            {(profile.username || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white m-0">
                                {profile.username}
                            </h1>
                            <div className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mt-1">
                                {profile.email}
                            </div>
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3 text-xs text-neutral-500">
                                <span className="inline-flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 text-neutral-600 dark:text-zinc-400" />
                                    Active Reader Account
                                </span>
                                <span>•</span>
                                <span className="inline-flex items-center gap-1">
                                    <Heart className="w-3.5 h-3.5 text-rose-500" />
                                    {likedArticles.length} Liked Articles
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* PROFILE FORM */}
                    <form onSubmit={handleSave} className="flex flex-col gap-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider mb-2">
                                    First Name
                                </label>
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={e => setFirstName(e.target.value)}
                                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-[#18181b] text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400/30 focus:border-neutral-600 transition-all"
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
                                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-[#18181b] text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400/30 focus:border-neutral-600 transition-all"
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
                                className="w-full p-4 bg-neutral-50 dark:bg-[#18181b] text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400/30 focus:border-neutral-600 transition-all resize-y"
                            />
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full py-3 px-6 bg-neutral-900 hover:bg-black dark:bg-zinc-800 dark:hover:bg-zinc-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
                            </button>
                        </div>
                    </form>
                </div>

                {/* READING ACTIVITY SECTION: LIKED & SAVED */}
                <section>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-3 border-b border-neutral-200 dark:border-neutral-800">
                        <div>
                            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white m-0">
                                Reading Activity
                            </h2>
                            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                                Articles you have saved or liked across the portal
                            </p>
                        </div>

                        {/* Sub-tabs */}
                        <div className="flex items-center gap-1.5 p-1 bg-neutral-100 dark:bg-[#18181b] rounded-xl border border-neutral-200 dark:border-neutral-800 self-start sm:self-auto">
                            <button
                                type="button"
                                onClick={() => setActivityTab('liked')}
                                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    activityTab === 'liked'
                                        ? 'bg-white dark:bg-zinc-800 text-neutral-900 dark:text-white shadow-xs'
                                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                                }`}
                            >
                                <Heart className={`w-3.5 h-3.5 ${activityTab === 'liked' ? 'fill-current text-rose-500' : 'text-neutral-500'}`} />
                                <span>Liked Articles</span>
                                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-neutral-200 dark:bg-zinc-700">
                                    {likedArticles.length}
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActivityTab('saved')}
                                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    activityTab === 'saved'
                                        ? 'bg-white dark:bg-zinc-800 text-neutral-900 dark:text-white shadow-xs'
                                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                                }`}
                            >
                                <Bookmark className={`w-3.5 h-3.5 ${activityTab === 'saved' ? 'fill-current text-amber-500' : 'text-neutral-500'}`} />
                                <span>Saved Bookmarks</span>
                                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-neutral-200 dark:bg-zinc-700">
                                    {savedArticles.length}
                                </span>
                            </button>
                        </div>
                    </div>

                    {activityTab === 'liked' && (
                        likedArticlesLoading ? (
                            <div className="p-12 text-center text-neutral-500 font-medium animate-pulse">
                                Loading liked articles...
                            </div>
                        ) : likedArticles.length === 0 ? (
                            <div className="p-10 bg-white dark:bg-[#111113] border border-neutral-200 dark:border-neutral-800 rounded-2xl text-center shadow-xs">
                                <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-zinc-800 text-rose-500 flex items-center justify-center mx-auto mb-3">
                                    <Heart className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">
                                    No liked articles yet
                                </h3>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-5">
                                    When you like an article, it will appear here.
                                </p>
                                <button
                                    onClick={() => navigate('/articles')}
                                    className="px-5 py-2.5 bg-neutral-900 hover:bg-black dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white font-semibold text-sm rounded-xl transition-all cursor-pointer shadow-xs"
                                >
                                    Browse News
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {likedArticles.map(article => (
                                    <article
                                        key={article.id}
                                        className="bg-white dark:bg-[#111113] rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col"
                                    >
                                        <div className="p-6 flex-1 flex flex-col">
                                            <div className="flex items-center justify-between gap-2 mb-3">
                                                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                                                    Article
                                                </span>
                                                <Heart className="w-4 h-4 fill-current text-rose-500" />
                                            </div>

                                            <h3 className="text-xl font-bold leading-snug text-black dark:text-white mb-2 line-clamp-2">
                                                {article.title}
                                            </h3>

                                            <div className="text-xs text-neutral-500 dark:text-neutral-400 italic mb-3">
                                                By <span className="font-semibold text-neutral-700 dark:text-neutral-300">{article.author}</span>
                                            </div>

                                            <p className="text-neutral-600 dark:text-neutral-300 text-sm leading-relaxed line-clamp-3 mb-2">
                                                {article.content && article.content.length > 160
                                                    ? article.content.substring(0, 160) + '...'
                                                    : article.content}
                                            </p>
                                        </div>

                                        <div className="px-6 py-4 bg-neutral-50/80 dark:bg-[#0c0c0e]/80 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between mt-auto">
                                            <span className="inline-flex items-center gap-1 text-xs text-neutral-500">
                                                <Eye className="w-3.5 h-3.5" />
                                                {article.viewCount || 0} views
                                            </span>

                                            <button
                                                onClick={() => navigate(`/article/${article.id}`)}
                                                className="text-sm font-bold text-neutral-900 dark:text-white hover:opacity-80 cursor-pointer"
                                            >
                                                Read Article →
                                            </button>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )
                    )}

                    {activityTab === 'saved' && (
                        savedArticles.length === 0 ? (
                            <div className="p-10 bg-white dark:bg-[#111113] border border-neutral-200 dark:border-neutral-800 rounded-2xl text-center shadow-xs">
                                <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-zinc-800 text-amber-500 flex items-center justify-center mx-auto mb-3">
                                    <Bookmark className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">
                                    No saved bookmarks
                                </h3>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-5">
                                    Click the bookmark icon on any article to save it for reading later.
                                </p>
                                <button
                                    onClick={() => navigate('/articles')}
                                    className="px-5 py-2.5 bg-neutral-900 hover:bg-black dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white font-semibold text-sm rounded-xl transition-all cursor-pointer shadow-xs"
                                >
                                    Browse News
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {savedArticles.map(article => (
                                    <article
                                        key={`saved-${article.id}`}
                                        className="bg-white dark:bg-[#111113] rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col"
                                    >
                                        <div className="p-6 flex-1 flex flex-col">
                                            <div className="flex items-center justify-between gap-2 mb-3">
                                                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                                                    Saved Bookmark
                                                </span>
                                                <button
                                                    type="button"
                                                    title="Remove Bookmark"
                                                    onClick={(e) => handleRemoveBookmark(e, article.id!)}
                                                    className="p-1 rounded-md text-neutral-400 hover:text-rose-500 hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <h3 className="text-xl font-bold leading-snug text-black dark:text-white mb-2 line-clamp-2">
                                                {article.title}
                                            </h3>

                                            <div className="text-xs text-neutral-500 dark:text-neutral-400 italic mb-3">
                                                By <span className="font-semibold text-neutral-700 dark:text-neutral-300">{article.author || 'Journalist'}</span>
                                            </div>

                                            <p className="text-neutral-600 dark:text-neutral-300 text-sm leading-relaxed line-clamp-3 mb-2">
                                                {article.content && article.content.length > 160
                                                    ? article.content.substring(0, 160) + '...'
                                                    : article.content}
                                            </p>
                                        </div>

                                        <div className="px-6 py-4 bg-neutral-50/80 dark:bg-[#0c0c0e]/80 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between mt-auto">
                                            <span className="inline-flex items-center gap-1 text-xs text-neutral-500">
                                                <Eye className="w-3.5 h-3.5" />
                                                {article.viewCount || 0} views
                                            </span>

                                            <button
                                                onClick={() => navigate(`/article/${article.id}`)}
                                                className="text-sm font-bold text-neutral-900 dark:text-white hover:opacity-80 cursor-pointer"
                                            >
                                                Read Article →
                                            </button>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )
                    )}
                </section>
            </main>
        </div>
    );
};

export default UserProfilePage;
