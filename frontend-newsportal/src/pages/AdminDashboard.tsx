import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import {
    ShieldCheck,
    Users,
    FolderPlus,
    FileCheck2,
    Megaphone,
    BookOpen,
    Trash2,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    LogOut,
    Send,
    Plus
} from 'lucide-react';

import { adminService, type User } from '../services/adminService';
import { categoryService, type Category } from '../services/categoryService';
import { articleService, type Article } from '../services/articleService';
import { alertService } from '../services/alertService';
import { authService } from '../services/authService';
import FullArticle from './FullArticle';
import HorizontalArticlesCarousel from '../components/HorizontalArticlesCarousel';

const AdminDashboard: React.FC = () => {
    // Shared State
    const [activeTab, setActiveTab] = useState<string>('approvals');
    const [loading, setLoading] = useState<boolean>(true);
    const navigate = useNavigate();

    // Reusable Custom Confirmation Modal State
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        confirmText: string;
        confirmColor: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        confirmText: 'Confirm',
        confirmColor: 'bg-neutral-900 dark:bg-zinc-800',
        onConfirm: () => {}
    });

    const closeConfirm = () =>
        setConfirmDialog(prev => ({
            ...prev,
            isOpen: false
        }));

    // Tab: Read Articles State
    const [publishedArticles, setPublishedArticles] = useState<Article[]>([]);
    const [viewingArticleId, setViewingArticleId] = useState<number | null>(null);

    // Tab: Approvals State
    const [users, setUsers] = useState<User[]>([]);

    // Tab: Categories State
    const [categories, setCategories] = useState<Category[]>([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryDesc, setNewCategoryDesc] = useState('');

    // Tab: Articles Review State
    const [pendingArticles, setPendingArticles] = useState<Article[]>([]);

    // Tab: Breaking News Alerts State
    const [alertMessage, setAlertMessage] = useState('');
    const [sendingAlert, setSendingAlert] = useState(false);

    useEffect(() => {
        const role = authService.getRole();

        if (!authService.isAuthenticated() || role !== 'ROLE_ADMIN') {
            navigate('/login');
            return;
        }

        fetchCategories();

        if (activeTab === 'approvals') {
            fetchPendingUsers();
        } else if (activeTab === 'articles') {
            fetchPendingArticles();
        } else if (activeTab === 'read') {
            fetchPublishedArticles();
        }

        setViewingArticleId(null);
    }, [activeTab, navigate]);

    // --- FETCH FUNCTIONS ---

    const fetchPublishedArticles = async () => {
        try {
            setLoading(true);
            const data = await articleService.getAllPublishedArticles();
            const content = Array.isArray(data) ? data : (data?.content || []);
            setPublishedArticles([...content].reverse());
        } catch (error) {
            console.error("Error fetching published articles:", error);
            toast.error("Unable to load published articles.");
            setPublishedArticles([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchPendingUsers = async () => {
        try {
            setLoading(true);
            const data = await adminService.getAllUsers();
            setUsers(data || []);
        } catch (error) {
            console.error("Error fetching pending requests:", error);
            toast.error("Unable to load approval requests.");
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const data = await categoryService.getAllCategories();
            setCategories(data || []);
        } catch (error) {
            console.error("Error loading categories:", error);
            toast.error("Unable to load categories.");
        }
    };

    const fetchPendingArticles = async () => {
        try {
            setLoading(true);
            const data = await articleService.getPendingReviews();
            setPendingArticles(data || []);
        } catch (error) {
            console.error("Error fetching pending articles:", error);
            toast.error("Unable to load pending articles.");
            setPendingArticles([]);
        } finally {
            setLoading(false);
        }
    };

    const getCategoryName = (id: number) => {
        const category = categories.find(c => c.id === id);
        return category ? category.name : 'Unknown Category';
    };

    // --- ACTIONS ---

    const confirmApproveUser = (userId: number, username: string) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Approve User',
            message: `Are you sure you want to approve ${username}?`,
            confirmText: 'Approve User',
            confirmColor: 'bg-emerald-600 hover:bg-emerald-700',
            onConfirm: async () => {
                closeConfirm();
                const toastId = toast.loading(`Approving ${username}...`);
                try {
                    await adminService.approveUser(userId);
                    toast.success(`${username} has been approved!`, { id: toastId });
                    await fetchPendingUsers();
                } catch (error) {
                    console.error("Failed to approve user:", error);
                    toast.error("Failed to approve user.", { id: toastId });
                }
            }
        });
    };

    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        const toastId = toast.loading("Creating category...");
        try {
            await categoryService.createCategory({
                name: newCategoryName,
                description: newCategoryDesc
            });
            setNewCategoryName('');
            setNewCategoryDesc('');
            await fetchCategories();
            toast.success("Category created successfully!", { id: toastId });
        } catch (error) {
            console.error("Failed to create category:", error);
            toast.error("Failed to create category.", { id: toastId });
        }
    };

    const confirmDeleteCategory = (id: number, name: string) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Delete Category',
            message: `Are you sure you want to delete the category "${name}"?`,
            confirmText: 'Delete Category',
            confirmColor: 'bg-red-600 hover:bg-red-700',
            onConfirm: async () => {
                closeConfirm();
                const toastId = toast.loading("Deleting category...");
                try {
                    await categoryService.deleteCategory(id);
                    toast.success("Category deleted successfully!", { id: toastId });
                    await fetchCategories();
                } catch (error) {
                    console.error("Failed to delete category:", error);
                    toast.error("Failed to delete category.", { id: toastId });
                }
            }
        });
    };

    const confirmPublishArticle = (id: number) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Publish Article',
            message: 'Approve this article for public viewing?',
            confirmText: 'Publish',
            confirmColor: 'bg-emerald-600 hover:bg-emerald-700',
            onConfirm: async () => {
                closeConfirm();
                const toastId = toast.loading("Publishing article...");
                try {
                    await articleService.updateArticleStatus(id, "PUBLISHED");
                    toast.success("Article is now live!", { id: toastId });
                    await fetchPendingArticles();
                } catch (error) {
                    console.error("Failed to publish article:", error);
                    toast.error("Failed to publish article.", { id: toastId });
                }
            }
        });
    };

    const confirmRejectArticle = (id: number) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Reject Article',
            message: 'Send this article back to the author as a Draft?',
            confirmText: 'Reject to Draft',
            confirmColor: 'bg-amber-600 hover:bg-amber-700',
            onConfirm: async () => {
                closeConfirm();
                const toastId = toast.loading("Rejecting article...");
                try {
                    await articleService.updateArticleStatus(id, "DRAFT");
                    toast.success("Article sent back to drafts.", { id: toastId });
                    await fetchPendingArticles();
                } catch (error) {
                    console.error("Failed to reject article:", error);
                    toast.error("Failed to reject article.", { id: toastId });
                }
            }
        });
    };

    const confirmDeleteArticle = (id: number) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Delete Story',
            message: 'Are you sure you want to permanently delete this published story?',
            confirmText: 'Delete Permanently',
            confirmColor: 'bg-red-600 hover:bg-red-700',
            onConfirm: async () => {
                closeConfirm();
                const toastId = toast.loading("Deleting article...");
                try {
                    await articleService.deleteArticle(id);
                    toast.success("Article deleted successfully!", { id: toastId });
                    await fetchPublishedArticles();
                } catch (error) {
                    console.error("Failed to delete article:", error);
                    toast.error("Failed to delete article.", { id: toastId });
                }
            }
        });
    };

    const handleSendAlert = (e: React.FormEvent) => {
        e.preventDefault();
        if (!alertMessage.trim()) {
            toast.error("Please enter an alert message.");
            return;
        }

        setConfirmDialog({
            isOpen: true,
            title: 'Broadcast Breaking News',
            message: 'This will instantly trigger an emergency alert email broadcast to all registered readers. Continue?',
            confirmText: 'Broadcast Alert',
            confirmColor: 'bg-red-600 hover:bg-red-700',
            onConfirm: async () => {
                closeConfirm();
                setSendingAlert(true);
                const toastId = toast.loading("Broadcasting breaking news alert...");
                try {
                    await alertService.sendBreakingNews(alertMessage);
                    toast.success("Breaking news alert dispatched successfully!", { id: toastId });
                    setAlertMessage('');
                } catch (error) {
                    console.error("Failed to send breaking news:", error);
                    toast.error(
                        "Failed to send breaking news. Ensure your alert-service is running and SMTP is configured.",
                        { id: toastId, duration: 6000 }
                    );
                } finally {
                    setSendingAlert(false);
                }
            }
        });
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    return (
        <div className="flex h-screen font-sans bg-[#f8f8fa] dark:bg-black text-neutral-900 dark:text-neutral-100 relative overflow-hidden">
            <Toaster position="top-right" reverseOrder={false} />

            {/* =========================
                LIGHT BLACK / BLACK SIDEBAR
            ========================= */}
            <aside className="w-64 sm:w-72 bg-white dark:bg-[#0c0c0e] border-r border-neutral-200 dark:border-neutral-800 flex flex-col shrink-0 shadow-sm z-20">
                {/* Brand Header */}
                <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-neutral-900 dark:bg-zinc-800 border border-neutral-800 dark:border-zinc-700 text-white flex items-center justify-center shadow-sm">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-neutral-900 dark:text-white m-0 tracking-tight">
                                Admin Console
                            </h2>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                                    System Oversight
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 py-6 px-3.5 overflow-y-auto">
                    <ul className="flex flex-col gap-1.5 list-none p-0 m-0">
                        {/* Tab 1: Read */}
                        <li>
                            <button
                                onClick={() => setActiveTab('read')}
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

                        {/* Tab 2: Approvals */}
                        <li>
                            <button
                                onClick={() => setActiveTab('approvals')}
                                className={`w-full px-3.5 py-3 text-left rounded-xl font-semibold text-sm transition-all flex justify-between items-center cursor-pointer ${
                                    activeTab === 'approvals'
                                        ? 'bg-neutral-900 text-white dark:bg-zinc-800 dark:text-white shadow-xs'
                                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-zinc-900'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <Users className="w-4 h-4" />
                                    <span>👤 Approvals</span>
                                </div>
                                {users.length > 0 && activeTab !== 'approvals' && (
                                    <span className="bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                                        {users.length}
                                    </span>
                                )}
                            </button>
                        </li>

                        {/* Tab 3: Categories */}
                        <li>
                            <button
                                onClick={() => setActiveTab('categories')}
                                className={`w-full px-3.5 py-3 text-left rounded-xl font-semibold text-sm transition-all flex items-center gap-3 cursor-pointer ${
                                    activeTab === 'categories'
                                        ? 'bg-neutral-900 text-white dark:bg-zinc-800 dark:text-white shadow-xs'
                                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-zinc-900'
                                }`}
                            >
                                <FolderPlus className="w-4 h-4" />
                                <span>📁 Categories</span>
                            </button>
                        </li>

                        {/* Tab 4: Article Reviews */}
                        <li>
                            <button
                                onClick={() => setActiveTab('articles')}
                                className={`w-full px-3.5 py-3 text-left rounded-xl font-semibold text-sm transition-all flex justify-between items-center cursor-pointer ${
                                    activeTab === 'articles'
                                        ? 'bg-neutral-900 text-white dark:bg-zinc-800 dark:text-white shadow-xs'
                                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-zinc-900'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <FileCheck2 className="w-4 h-4" />
                                    <span>📰 Article Reviews</span>
                                </div>
                                {pendingArticles.length > 0 && activeTab !== 'articles' && (
                                    <span className="bg-amber-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                                        {pendingArticles.length}
                                    </span>
                                )}
                            </button>
                        </li>

                        {/* Tab 5: Breaking News Alerts */}
                        <li>
                            <button
                                onClick={() => setActiveTab('alerts')}
                                className={`w-full px-3.5 py-3 text-left rounded-xl font-semibold text-sm transition-all flex items-center gap-3 cursor-pointer ${
                                    activeTab === 'alerts'
                                        ? 'bg-red-600 text-white shadow-xs'
                                        : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20'
                                }`}
                            >
                                <Megaphone className="w-4 h-4" />
                                <span>🚨 Breaking News Alert</span>
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
                    {/* STATS OVERVIEW ROW (LIGHT BLACK / BLACK) */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <div className="bg-white dark:bg-[#111113] p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-zinc-900 text-neutral-800 dark:text-neutral-200 flex items-center justify-center shrink-0 border border-neutral-200 dark:border-zinc-800">
                                <Users className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-xl font-black text-neutral-900 dark:text-white">
                                    {users.length}
                                </div>
                                <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                                    Pending Approvals
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-[#111113] p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-zinc-900 text-neutral-800 dark:text-neutral-200 flex items-center justify-center shrink-0 border border-neutral-200 dark:border-zinc-800">
                                <FileCheck2 className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-xl font-black text-neutral-900 dark:text-white">
                                    {pendingArticles.length}
                                </div>
                                <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                                    In Review Queue
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-[#111113] p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-zinc-900 text-neutral-800 dark:text-neutral-200 flex items-center justify-center shrink-0 border border-neutral-200 dark:border-zinc-800">
                                <FolderPlus className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-xl font-black text-neutral-900 dark:text-white">
                                    {categories.length}
                                </div>
                                <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                                    News Categories
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-[#111113] p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-zinc-900 text-neutral-800 dark:text-neutral-200 flex items-center justify-center shrink-0 border border-neutral-200 dark:border-zinc-800">
                                <BookOpen className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-xl font-black text-neutral-900 dark:text-white">
                                    {publishedArticles.length}
                                </div>
                                <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                                    Live Stories
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* =========================
                        TAB 1: READ ARTICLES
                    ========================= */}
                    {activeTab === 'read' && (
                        <div className="animate-fade-in">
                            {viewingArticleId ? (
                                <div className="w-full">
                                    <FullArticle
                                        articleId={viewingArticleId}
                                        onBack={() => setViewingArticleId(null)}
                                    />
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between pb-4 mb-6 border-b border-neutral-200 dark:border-neutral-800">
                                        <div>
                                            <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white m-0">
                                                Latest Headlines
                                            </h2>
                                            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                                                Review and moderate published stories across all categories
                                            </p>
                                        </div>
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
                                                    title="Editorial Highlights"
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
                                                        Complete article catalog
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

                                                    <div className="p-4 bg-neutral-50/80 dark:bg-[#0c0c0e]/80 border-t border-neutral-100 dark:border-neutral-800/80 flex justify-between items-center mt-auto">
                                                        <button
                                                            onClick={() => setViewingArticleId(article.id!)}
                                                            className="text-sm font-bold text-neutral-900 dark:text-white hover:opacity-80 cursor-pointer"
                                                        >
                                                            Read Full Story →
                                                        </button>

                                                        <button
                                                            onClick={() => confirmDeleteArticle(article.id!)}
                                                            className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                            <span>Delete</span>
                                                        </button>
                                                    </div>
                                                </article>
                                            ))}
                                            </div>
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* =========================
                        TAB 2: APPROVALS
                    ========================= */}
                    {activeTab === 'approvals' && (
                        <div className="animate-fade-in">
                            <div className="pb-4 mb-6 border-b border-neutral-200 dark:border-neutral-800">
                                <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white m-0">
                                    Review Account Requests
                                </h2>
                                <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                                    Manage author and journalist access requests waiting for moderation
                                </p>
                            </div>

                            {loading ? (
                                <div className="p-12 text-center animate-pulse text-neutral-500 font-medium">
                                    Loading approval requests...
                                </div>
                            ) : users.length === 0 ? (
                                <div className="p-10 bg-white dark:bg-[#111113] border border-neutral-200 dark:border-neutral-800 rounded-2xl text-center shadow-xs">
                                    <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-zinc-800 text-neutral-800 dark:text-neutral-200 flex items-center justify-center mx-auto mb-3">
                                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                                    </div>
                                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">
                                        All requests cleared!
                                    </h3>
                                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                        There are currently no new accounts waiting for administrative approval.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {users.map(user => (
                                        <div
                                            key={user.id}
                                            className="bg-white dark:bg-[#111113] p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs flex items-center justify-between gap-4"
                                        >
                                            <div className="flex items-center gap-3.5">
                                                <div className="w-11 h-11 rounded-xl bg-neutral-900 dark:bg-zinc-800 border border-neutral-700 dark:border-zinc-700 text-white font-bold text-base flex items-center justify-center shadow-xs">
                                                    {(user.username || 'U').charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-neutral-900 dark:text-white text-base">
                                                        {user.username}
                                                    </div>
                                                    <div className="text-xs text-neutral-500 dark:text-neutral-400">
                                                        {user.email}
                                                    </div>
                                                    <div className="mt-1">
                                                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-neutral-100 dark:bg-zinc-800 text-neutral-800 dark:text-zinc-200 border border-neutral-200 dark:border-zinc-700">
                                                            {user.role || 'ROLE_AUTHOR'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => confirmApproveUser(user.id, user.username)}
                                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                                            >
                                                <CheckCircle2 className="w-4 h-4" />
                                                <span>Approve User</span>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* =========================
                        TAB 3: CATEGORIES
                    ========================= */}
                    {activeTab === 'categories' && (
                        <div className="animate-fade-in">
                            <div className="pb-4 mb-6 border-b border-neutral-200 dark:border-neutral-800">
                                <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white m-0">
                                    Manage News Categories
                                </h2>
                                <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                                    Create and configure news sections for editorial organization
                                </p>
                            </div>

                            {/* Create Category Card */}
                            <div className="bg-white dark:bg-[#111113] p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs mb-8">
                                <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Plus className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
                                    Add New Category
                                </h3>

                                <form onSubmit={handleCreateCategory} className="flex flex-col sm:flex-row gap-3">
                                    <input
                                        type="text"
                                        placeholder="Category Name (e.g., Technology)"
                                        value={newCategoryName}
                                        onChange={e => setNewCategoryName(e.target.value)}
                                        required
                                        className="flex-1 px-4 py-2.5 text-sm bg-neutral-50 dark:bg-[#18181b] text-neutral-900 dark:text-white rounded-xl border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-400/30 focus:border-neutral-600"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Description (Optional)"
                                        value={newCategoryDesc}
                                        onChange={e => setNewCategoryDesc(e.target.value)}
                                        className="flex-1 px-4 py-2.5 text-sm bg-neutral-50 dark:bg-[#18181b] text-neutral-900 dark:text-white rounded-xl border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-400/30 focus:border-neutral-600"
                                    />
                                    <button
                                        type="submit"
                                        className="px-5 py-2.5 bg-neutral-900 hover:bg-black dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white font-semibold text-sm rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap"
                                    >
                                        Create Category
                                    </button>
                                </form>
                            </div>

                            {/* Categories Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {categories.map(category => (
                                    <div
                                        key={category.id}
                                        className="bg-white dark:bg-[#111113] p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-col justify-between"
                                    >
                                        <div>
                                            <div className="flex items-center justify-between gap-2 mb-2">
                                                <h4 className="font-bold text-neutral-900 dark:text-white text-base m-0">
                                                    {category.name}
                                                </h4>
                                                <span className="text-xs text-neutral-400 font-mono">
                                                    #{category.id}
                                                </span>
                                            </div>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
                                                {category.description || 'No description provided.'}
                                            </p>
                                        </div>

                                        <div className="pt-4 mt-4 border-t border-neutral-100 dark:border-neutral-800/80 flex justify-end">
                                            <button
                                                onClick={() => confirmDeleteCategory(category.id, category.name)}
                                                className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                <span>Delete</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* =========================
                        TAB 4: ARTICLE REVIEWS
                    ========================= */}
                    {activeTab === 'articles' && (
                        <div className="animate-fade-in">
                            <div className="pb-4 mb-6 border-b border-neutral-200 dark:border-neutral-800">
                                <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white m-0">
                                    Pending Article Reviews
                                </h2>
                                <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                                    Evaluate submissions from writers and approve stories for publication
                                </p>
                            </div>

                            {loading ? (
                                <div className="p-12 text-center animate-pulse text-neutral-500 font-medium">
                                    Loading pending articles...
                                </div>
                            ) : pendingArticles.length === 0 ? (
                                <div className="p-10 bg-white dark:bg-[#111113] border border-neutral-200 dark:border-neutral-800 rounded-2xl text-center shadow-xs">
                                    <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-zinc-800 text-neutral-800 dark:text-neutral-200 flex items-center justify-center mx-auto mb-3">
                                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                                    </div>
                                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">
                                        Review queue empty!
                                    </h3>
                                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                        All submitted articles have been reviewed. Great work!
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    {pendingArticles.map(article => (
                                        <div
                                            key={article.id}
                                            className="bg-white dark:bg-[#111113] p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6"
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-neutral-100 text-neutral-800 dark:bg-zinc-800 dark:text-zinc-200 border border-neutral-200 dark:border-zinc-700">
                                                        {getCategoryName(article.categoryId)}
                                                    </span>
                                                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                                        By <strong className="text-neutral-800 dark:text-neutral-200">{article.author}</strong>
                                                    </span>
                                                </div>

                                                <h3 className="text-xl font-bold text-black dark:text-white mb-2">
                                                    {article.title}
                                                </h3>

                                                <p className="text-sm text-neutral-600 dark:text-neutral-300 line-clamp-2">
                                                    {article.content}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2.5 shrink-0">
                                                <button
                                                    onClick={() => confirmRejectArticle(article.id!)}
                                                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                    <span>Reject to Draft</span>
                                                </button>

                                                <button
                                                    onClick={() => confirmPublishArticle(article.id!)}
                                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                                                >
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    <span>Publish</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* =========================
                        TAB 5: BREAKING NEWS ALERTS
                    ========================= */}
                    {activeTab === 'alerts' && (
                        <div className="animate-fade-in max-w-3xl">
                            <div className="pb-4 mb-6 border-b border-neutral-200 dark:border-neutral-800">
                                <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white m-0">
                                    Emergency Alert System
                                </h2>
                                <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                                    Dispatch high-priority breaking news broadcasts to all subscribers
                                </p>
                            </div>

                            <div className="bg-white dark:bg-[#111113] p-6 sm:p-8 rounded-2xl border border-neutral-300 dark:border-neutral-800 shadow-xs relative overflow-hidden">
                                <div className="flex items-center gap-3 mb-6 p-3.5 rounded-xl bg-neutral-100 dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 text-neutral-800 dark:text-neutral-200 text-xs sm:text-sm font-medium">
                                    <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                                    <span>
                                        Caution: Broadcasting will immediately notify all registered portal users via email.
                                    </span>
                                </div>

                                <form onSubmit={handleSendAlert} className="flex flex-col gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-neutral-900 dark:text-white mb-2">
                                            Breaking Alert Message
                                        </label>
                                        <textarea
                                            rows={5}
                                            value={alertMessage}
                                            onChange={e => setAlertMessage(e.target.value)}
                                            placeholder="Write urgent bulletin or breaking story alert..."
                                            required
                                            className="w-full p-4 text-sm bg-neutral-50 dark:bg-[#18181b] text-neutral-900 dark:text-white rounded-xl border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-400/30 focus:border-neutral-600 resize-y"
                                        />
                                        <div className="text-right text-xs text-neutral-400 mt-1">
                                            {alertMessage.length} characters
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-3">
                                        <button
                                            type="submit"
                                            disabled={sendingAlert}
                                            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                                        >
                                            <Send className="w-4 h-4" />
                                            <span>{sendingAlert ? 'Broadcasting...' : 'Broadcast Alert'}</span>
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* =========================
                CUSTOM CONFIRMATION MODAL
            ========================= */}
            {confirmDialog.isOpen && (
                <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white dark:bg-[#141416] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                            {confirmDialog.title}
                        </h3>
                        <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-6 leading-relaxed">
                            {confirmDialog.message}
                        </p>
                        <div className="flex items-center justify-end gap-3">
                            <button
                                onClick={closeConfirm}
                                className="px-4 py-2 text-sm font-semibold rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDialog.onConfirm}
                                className={`px-4 py-2 text-sm font-semibold rounded-xl text-white shadow-xs transition-all cursor-pointer ${confirmDialog.confirmColor}`}
                            >
                                {confirmDialog.confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
