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
    XCircle,
    LogOut,
    Send,
    Plus,
    ExternalLink,
    BarChart3,
    Eye,
    Heart,
    Award,
    X,
    ChevronDown,
    ChevronUp,
    ChevronLeft,
    ChevronRight,
    Clock
} from 'lucide-react';

import { adminService, type User } from '../services/adminService';
import { categoryService, type Category } from '../services/categoryService';
import { articleService, type Article } from '../services/articleService';
import { alertService } from '../services/alertService';
import { authService } from '../services/authService';
import FullArticle from './FullArticle';
import HorizontalArticlesCarousel from '../components/HorizontalArticlesCarousel';
import ThemeToggle from '../components/ThemeToggle';

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
        confirmColor: 'bg-slate-900 dark:bg-zinc-800',
        onConfirm: () => {}
    });

    const closeConfirm = () =>
        setConfirmDialog(prev => ({
            ...prev,
            isOpen: false
        }));

    // Editorial Rejection Modal State
    const [rejectionModal, setRejectionModal] = useState<{
        isOpen: boolean;
        articleId: number | null;
        rejectionReason: string;
    }>({
        isOpen: false,
        articleId: null,
        rejectionReason: ''
    });

    const openRejectModal = (id: number) => {
        setRejectionModal({
            isOpen: true,
            articleId: id,
            rejectionReason: ''
        });
    };

    const closeRejectModal = () => {
        setRejectionModal({
            isOpen: false,
            articleId: null,
            rejectionReason: ''
        });
    };

    const handleConfirmReject = async () => {
        if (!rejectionModal.articleId) return;
        const id = rejectionModal.articleId;
        const note = rejectionModal.rejectionReason.trim();

        closeRejectModal();
        setReviewingArticle(null);
        const toastId = toast.loading("Rejecting article...");
        try {
            await articleService.updateArticleStatus(id, "DRAFT", note);
            toast.success("Article sent back to drafts with feedback.", { id: toastId });
            await fetchPendingArticles();
        } catch (error) {
            console.error("Failed to reject article:", error);
            toast.error("Failed to reject article.", { id: toastId });
        }
    };

    // Tab: Read Articles State & Pagination
    const ARTICLES_PER_PAGE = 10;
    const [publishedArticles, setPublishedArticles] = useState<Article[]>([]);
    const [allCatalogArticles, setAllCatalogArticles] = useState<Article[]>([]);
    const [viewingArticleId, setViewingArticleId] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    // Tab: Approvals State
    const [users, setUsers] = useState<User[]>([]);

    // Tab: Categories State
    const [categories, setCategories] = useState<Category[]>([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryDesc, setNewCategoryDesc] = useState('');

    // Tab: Articles Review State
    const [pendingArticles, setPendingArticles] = useState<Article[]>([]);
    const [reviewingArticle, setReviewingArticle] = useState<Article | null>(null);
    const [expandedArticleIds, setExpandedArticleIds] = useState<Set<number>>(new Set());

    // Tab: Breaking News Editorial Alerts State
    const [selectedArticleId, setSelectedArticleId] = useState<number | ''>('');
    const [alertHeadline, setAlertHeadline] = useState('');
    const [alertMessage, setAlertMessage] = useState('');
    const [alertPriority, setAlertPriority] = useState<'CRITICAL' | 'BREAKING' | 'FLASH'>('BREAKING');
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
            fetchPublishedArticles(0);
            fetchAllCatalogArticles();
        } else if (activeTab === 'alerts') {
            fetchAllCatalogArticles();
        } else if (activeTab === 'analytics') {
            fetchAllCatalogArticles();
            fetchPendingUsers();
            fetchPendingArticles();
        }

        setViewingArticleId(null);
    }, [activeTab, navigate]);

    // --- FETCH FUNCTIONS ---

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
            console.error("Error loading published articles:", error);
            toast.error("Unable to load published articles.");
            setPublishedArticles([]);
            setTotalPages(0);
            setTotalElements(0);
        } finally {
            setLoading(false);
        }
    };

    const fetchAllCatalogArticles = async () => {
        try {
            const data = await articleService.getAllPublishedArticles(0, 100);
            const contentList = Array.isArray(data) ? data : (data?.content || []);
            setAllCatalogArticles([...contentList].reverse());
        } catch (e) {
            // fallback
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
            setCategories([]);
        }
    };

    const fetchPendingArticles = async () => {
        try {
            setLoading(true);
            const data = await articleService.getPendingReviews();
            setPendingArticles(data || []);
        } catch (error) {
            console.error("Error fetching reviews:", error);
            toast.error("Unable to load pending article reviews.");
            setPendingArticles([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategoryName.trim()) {
            toast.error("Please provide a category name.");
            return;
        }

        try {
            await categoryService.createCategory({
                name: newCategoryName.trim(),
                description: newCategoryDesc.trim()
            });
            toast.success("Category created successfully!");
            setNewCategoryName('');
            setNewCategoryDesc('');
            fetchCategories();
        } catch (error) {
            console.error("Error creating category:", error);
            toast.error("Failed to create category. Ensure the name is unique.");
        }
    };

    const getCategoryName = (id: number) => {
        const cat = categories.find(c => c.id === id);
        return cat ? cat.name : "Breaking News";
    };

    const handleSelectArticleForAlert = (idVal: string) => {
        if (!idVal) {
            setSelectedArticleId('');
            setAlertHeadline('');
            setAlertMessage('');
            return;
        }
        const artId = Number(idVal);
        setSelectedArticleId(artId);
        const art = publishedArticles.find(a => a.id === artId);
        if (art) {
            setAlertHeadline(art.title);
            const excerpt = art.content && art.content.length > 180
                ? art.content.substring(0, 180) + '...'
                : art.content || '';
            setAlertMessage(excerpt);
        }
    };

    // --- CONFIRMATION HANDLERS ---

    const confirmApproveUser = (id: number, username: string) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Approve User Account',
            message: `Grant author/journalist privileges to "${username}"?`,
            confirmText: 'Approve User',
            confirmColor: 'bg-emerald-600 hover:bg-emerald-700',
            onConfirm: async () => {
                closeConfirm();
                const toastId = toast.loading("Approving user account...");
                try {
                    await adminService.approveUser(id);
                    toast.success(`User ${username} approved!`, { id: toastId });
                    await fetchPendingUsers();
                } catch (error) {
                    console.error("Failed to approve user:", error);
                    toast.error("Failed to approve user.", { id: toastId });
                }
            }
        });
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
                setReviewingArticle(null);
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
        openRejectModal(id);
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

        if (!selectedArticleId) {
            toast.error("Please select a published article to attach to this broadcast.");
            return;
        }

        if (!alertMessage.trim()) {
            toast.error("Please enter an urgent bulletin message.");
            return;
        }

        const selectedArt = publishedArticles.find(a => a.id === Number(selectedArticleId));
        const finalHeadline = alertHeadline.trim() || selectedArt?.title || 'Breaking News Alert';

        setConfirmDialog({
            isOpen: true,
            title: 'Broadcast Breaking News Bulletin',
            message: `Dispatch ${alertPriority} alert "${finalHeadline}" to all registered readers via email and portal live banner?`,
            confirmText: 'Broadcast Alert Now',
            confirmColor: 'bg-red-600 hover:bg-red-700',
            onConfirm: async () => {
                closeConfirm();
                setSendingAlert(true);
                const toastId = toast.loading("Broadcasting breaking news alert...");
                try {
                    await alertService.sendBreakingNews({
                        headline: finalHeadline,
                        message: alertMessage.trim(),
                        articleId: selectedArticleId ? Number(selectedArticleId) : null,
                        articleTitle: selectedArt?.title,
                        priority: alertPriority,
                        category: selectedArt ? getCategoryName(selectedArt.categoryId) : undefined
                    });
                    toast.success("Breaking news alert dispatched successfully!", { id: toastId });
                    setAlertMessage('');
                    setAlertHeadline('');
                    setSelectedArticleId('');
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

    const catalogArticles = allCatalogArticles.length > 0 ? allCatalogArticles : publishedArticles;
    const selectedArticleObj = catalogArticles.find(a => a.id === Number(selectedArticleId));

    // =========================
    // COMPUTED ANALYTICS DATA
    // =========================
    const totalViews = catalogArticles.reduce((acc, a) => acc + (a.viewCount || 0), 0);
    const totalLikes = catalogArticles.reduce((acc, a) => acc + (a.likeCount || 0), 0);
    const uniqueAuthors = new Set(catalogArticles.map(a => a.author).filter(Boolean)).size;

    // Leaderboard: Top 5 by views
    const topArticles = [...catalogArticles]
        .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
        .slice(0, 5);

    // Category distribution
    const categoryStats = categories.map(cat => {
        const count = catalogArticles.filter(a => a.categoryId === cat.id).length;
        const percent = catalogArticles.length > 0 ? Math.round((count / catalogArticles.length) * 100) : 0;
        return {
            ...cat,
            count,
            percent
        };
    });

    // Author contribution breakdown
    const authorStats = React.useMemo(() => {
        const map: { [author: string]: { count: number; views: number } } = {};
        catalogArticles.forEach(a => {
            const author = a.author || 'Anonymous';
            if (!map[author]) {
                map[author] = { count: 0, views: 0 };
            }
            map[author].count += 1;
            map[author].views += (a.viewCount || 0);
        });
        return Object.entries(map)
            .map(([name, stat]) => ({ name, ...stat }))
            .sort((a, b) => b.views - a.views)
            .slice(0, 6);
    }, [catalogArticles]);

    return (
        <div className="flex h-screen font-sans bg-[#f8f9fc] dark:bg-black text-slate-900 dark:text-neutral-100 relative overflow-hidden">
            <Toaster position="top-right" reverseOrder={false} />

            {/* =========================
                MODERN SIDEBAR
            ========================= */}
            <aside className="w-64 sm:w-72 bg-white dark:bg-[#0c0c0e] border-r border-slate-200/80 dark:border-neutral-800 flex flex-col shrink-0 shadow-[1px_0_3px_0_rgba(15,23,42,0.02)] z-20">
                {/* Brand Header */}
                <div className="p-6 border-b border-slate-200/80 dark:border-neutral-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-zinc-800 border border-slate-800 dark:border-zinc-700 text-white flex items-center justify-center shadow-xs">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white m-0 tracking-tight">
                                Admin Console
                            </h2>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-xs font-semibold text-slate-500 dark:text-neutral-400">
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
                                        ? 'bg-slate-900 text-white dark:bg-zinc-800 dark:text-white shadow-xs'
                                        : 'text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-zinc-900'
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
                                        ? 'bg-slate-900 text-white dark:bg-zinc-800 dark:text-white shadow-xs'
                                        : 'text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-zinc-900'
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
                                        ? 'bg-slate-900 text-white dark:bg-zinc-800 dark:text-white shadow-xs'
                                        : 'text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-zinc-900'
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
                                        ? 'bg-slate-900 text-white dark:bg-zinc-800 dark:text-white shadow-xs'
                                        : 'text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-zinc-900'
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

                        {/* Tab 5: Analytics */}
                        <li>
                            <button
                                onClick={() => setActiveTab('analytics')}
                                className={`w-full px-3.5 py-3 text-left rounded-xl font-semibold text-sm transition-all flex items-center gap-3 cursor-pointer ${
                                    activeTab === 'analytics'
                                        ? 'bg-slate-900 text-white dark:bg-zinc-800 dark:text-white shadow-xs'
                                        : 'text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-zinc-900'
                                }`}
                            >
                                <BarChart3 className="w-4 h-4" />
                                <span>📊 Analytics</span>
                            </button>
                        </li>

                        {/* Tab 6: Breaking News Alerts */}
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
                                    <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200/80 dark:border-neutral-800">
                                        <div>
                                            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white m-0">
                                                Latest Headlines
                                            </h2>
                                            <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-1">
                                                Review and moderate published stories across all categories
                                            </p>
                                        </div>
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
                                                    title="Editorial Highlights"
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
                                                                : 'Complete article catalog'}
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

                                                    <div className="p-4 bg-slate-50/70 dark:bg-[#0c0c0e]/80 border-t border-slate-100 dark:border-neutral-800/80 flex justify-between items-center mt-auto">
                                                        <button
                                                            onClick={() => setViewingArticleId(article.id!)}
                                                            className="text-sm font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-zinc-300 cursor-pointer"
                                                        >
                                                            Read Full Story →
                                                        </button>

                                                        <button
                                                            onClick={() => confirmDeleteArticle(article.id!)}
                                                            className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                            <span>Delete</span>
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
                                </>
                            )}
                        </div>
                    )}

                    {/* =========================
                        TAB 2: APPROVALS
                    ========================= */}
                    {activeTab === 'approvals' && (
                        <div className="animate-fade-in">
                            <div className="pb-4 mb-6 border-b border-slate-200/80 dark:border-neutral-800">
                                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white m-0">
                                    Review Account Requests
                                </h2>
                                <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-1">
                                    Manage author and journalist access requests waiting for moderation
                                </p>
                            </div>

                            {loading ? (
                                <div className="p-12 text-center animate-pulse text-slate-500 font-medium">
                                    Loading approval requests...
                                </div>
                            ) : users.length === 0 ? (
                                <div className="p-10 bg-white dark:bg-[#111113] border border-slate-200/80 dark:border-neutral-800 rounded-2xl text-center shadow-xs">
                                    <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-zinc-700 flex items-center justify-center mx-auto mb-3">
                                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                                        All requests cleared!
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-neutral-400">
                                        There are currently no new accounts waiting for administrative approval.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {users.map(user => (
                                        <div
                                            key={user.id}
                                            className="bg-white dark:bg-[#111113] p-5 rounded-2xl border border-slate-200/80 dark:border-neutral-800 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.05)] flex items-center justify-between gap-4"
                                        >
                                            <div className="flex items-center gap-3.5">
                                                <div className="w-11 h-11 rounded-xl bg-indigo-600 dark:bg-zinc-800 border border-indigo-700 dark:border-zinc-700 text-white font-bold text-base flex items-center justify-center shadow-xs">
                                                    {(user.username || 'U').charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900 dark:text-white text-base">
                                                        {user.username}
                                                    </div>
                                                    <div className="text-xs text-slate-500 dark:text-neutral-400">
                                                        {user.email}
                                                    </div>
                                                    <div className="mt-1">
                                                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700">
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
                            <div className="pb-4 mb-6 border-b border-slate-200/80 dark:border-neutral-800">
                                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white m-0">
                                    Manage News Categories
                                </h2>
                                <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-1">
                                    Create and configure news sections for editorial organization
                                </p>
                            </div>

                            {/* Create Category Card */}
                            <div className="bg-white dark:bg-[#111113] p-6 rounded-2xl border border-slate-200/80 dark:border-neutral-800 shadow-xs mb-8">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Plus className="w-4 h-4 text-slate-700 dark:text-neutral-300" />
                                    Add New Category
                                </h3>

                                <form onSubmit={handleCreateCategory} className="flex flex-col sm:flex-row gap-3">
                                    <input
                                        type="text"
                                        placeholder="Category Name (e.g., Technology)"
                                        value={newCategoryName}
                                        onChange={e => setNewCategoryName(e.target.value)}
                                        required
                                        className="flex-1 px-4 py-2.5 text-sm bg-slate-50/70 dark:bg-[#18181b] text-slate-900 dark:text-white rounded-xl border border-slate-200/90 dark:border-neutral-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Description (Optional)"
                                        value={newCategoryDesc}
                                        onChange={e => setNewCategoryDesc(e.target.value)}
                                        className="flex-1 px-4 py-2.5 text-sm bg-slate-50/70 dark:bg-[#18181b] text-slate-900 dark:text-white rounded-xl border border-slate-200/90 dark:border-neutral-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500"
                                    />
                                    <button
                                        type="submit"
                                        className="px-5 py-2.5 bg-slate-900 hover:bg-black dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white font-semibold text-sm rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap"
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
                                        className="bg-white dark:bg-[#111113] p-5 rounded-2xl border border-slate-200/80 dark:border-neutral-800 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.05)] flex flex-col justify-between"
                                    >
                                        <div>
                                            <div className="flex items-center justify-between gap-2 mb-2">
                                                <h4 className="font-bold text-slate-900 dark:text-white text-base m-0">
                                                    {category.name}
                                                </h4>
                                                <span className="text-xs text-slate-400 font-mono">
                                                    #{category.id}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-neutral-400 line-clamp-2">
                                                {category.description || 'No description provided.'}
                                            </p>
                                        </div>

                                        <div className="pt-4 mt-4 border-t border-slate-100 dark:border-neutral-800/80 flex justify-end">
                                            <button
                                                onClick={() => confirmDeleteCategory(category.id, category.name)}
                                                className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
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
                            <div className="pb-4 mb-6 border-b border-slate-200/80 dark:border-neutral-800">
                                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white m-0">
                                    Pending Article Reviews
                                </h2>
                                <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-1">
                                    Evaluate submissions from writers and approve stories for publication
                                </p>
                            </div>

                            {loading ? (
                                <div className="p-12 text-center animate-pulse text-slate-500 font-medium">
                                    Loading pending articles...
                                </div>
                            ) : pendingArticles.length === 0 ? (
                                <div className="p-10 bg-white dark:bg-[#111113] border border-slate-200/80 dark:border-neutral-800 rounded-2xl text-center shadow-xs">
                                    <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-zinc-700 flex items-center justify-center mx-auto mb-3">
                                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                                        Review queue empty!
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-neutral-400">
                                        All submitted articles have been reviewed. Great work!
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    {pendingArticles.map(article => {
                                        const isExpanded = article.id ? expandedArticleIds.has(article.id) : false;
                                        const wordCount = (article.content || '').trim().split(/\s+/).filter(Boolean).length;
                                        const readTime = Math.max(1, Math.ceil(wordCount / 180));

                                        return (
                                            <div
                                                key={article.id}
                                                className="bg-white dark:bg-[#111113] p-6 rounded-2xl border border-slate-200/80 dark:border-neutral-800 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.05)] flex flex-col gap-4"
                                            >
                                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200/80 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700">
                                                                {getCategoryName(article.categoryId)}
                                                            </span>
                                                            <span className="text-xs text-slate-500 dark:text-neutral-400">
                                                                By <strong className="text-slate-800 dark:text-neutral-200">{article.author}</strong>
                                                            </span>
                                                            <span className="text-slate-300 dark:text-neutral-700">•</span>
                                                            <span className="text-xs text-slate-500 dark:text-neutral-400 flex items-center gap-1">
                                                                <Clock className="w-3.5 h-3.5" />
                                                                {wordCount} words (~{readTime} min read)
                                                            </span>
                                                        </div>

                                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                                                            {article.title}
                                                        </h3>

                                                        <p className={`text-sm text-slate-600 dark:text-neutral-300 ${isExpanded ? 'whitespace-pre-wrap leading-relaxed' : 'line-clamp-2'}`}>
                                                            {article.content}
                                                        </p>

                                                        {article.content && article.content.length > 160 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    if (!article.id) return;
                                                                    setExpandedArticleIds(prev => {
                                                                        const next = new Set(prev);
                                                                        if (next.has(article.id!)) {
                                                                            next.delete(article.id!);
                                                                        } else {
                                                                            next.add(article.id!);
                                                                        }
                                                                        return next;
                                                                    });
                                                                }}
                                                                className="mt-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                                                            >
                                                                {isExpanded ? (
                                                                    <>
                                                                        <span>Show less</span>
                                                                        <ChevronUp className="w-3.5 h-3.5" />
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <span>Expand full text inline</span>
                                                                        <ChevronDown className="w-3.5 h-3.5" />
                                                                    </>
                                                                )}
                                                            </button>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center flex-wrap">
                                                        <button
                                                            onClick={() => setReviewingArticle(article)}
                                                            className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-indigo-700 dark:text-indigo-300 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                            <span>Review Full Story</span>
                                                        </button>

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
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* =========================
                        TAB 5: PLATFORM ANALYTICS
                    ========================= */}
                    {activeTab === 'analytics' && (
                        <div className="animate-fade-in space-y-8">
                            {/* Analytics Header */}
                            <div className="pb-4 border-b border-slate-200/80 dark:border-neutral-800">
                                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white m-0">
                                    Platform & Editorial Analytics
                                </h2>
                                <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-1">
                                    Live readership metrics, audience engagement, and editorial content distribution
                                </p>
                            </div>

                            {/* 1. KEY ANALYTICS KPI CARDS */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-white dark:bg-[#111113] p-5 rounded-2xl border border-slate-200/80 dark:border-neutral-800 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.05)]">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                                            Total Readership
                                        </span>
                                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900 flex items-center justify-center">
                                            <Eye className="w-4 h-4" />
                                        </div>
                                    </div>
                                    <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                        {totalViews.toLocaleString()}
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
                                        Total article view impressions
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-[#111113] p-5 rounded-2xl border border-slate-200/80 dark:border-neutral-800 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.05)]">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                                            Reader Engagement
                                        </span>
                                        <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900 flex items-center justify-center">
                                            <Heart className="w-4 h-4" />
                                        </div>
                                    </div>
                                    <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                        {totalLikes.toLocaleString()}
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
                                        Total story likes & bookmarks
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-[#111113] p-5 rounded-2xl border border-slate-200/80 dark:border-neutral-800 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.05)]">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                                            Published Coverage
                                        </span>
                                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900 flex items-center justify-center">
                                            <BookOpen className="w-4 h-4" />
                                        </div>
                                    </div>
                                    <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                        {totalElements || catalogArticles.length}
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
                                        Active articles across {categories.length} categories
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-[#111113] p-5 rounded-2xl border border-slate-200/80 dark:border-neutral-800 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.05)]">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                                            Contributing Authors
                                        </span>
                                        <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 border border-purple-200/60 dark:border-purple-900 flex items-center justify-center">
                                            <Users className="w-4 h-4" />
                                        </div>
                                    </div>
                                    <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                        {uniqueAuthors}
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
                                        Verified journalists & writers
                                    </div>
                                </div>
                            </div>

                            {/* 2. TWO-COLUMN: CATEGORY BREAKDOWN & EDITORIAL PIPELINE */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Category Distribution */}
                                <div className="bg-white dark:bg-[#111113] p-6 rounded-2xl border border-slate-200/80 dark:border-neutral-800 shadow-xs">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                                        <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                        Category Content Distribution
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-neutral-400 mb-5">
                                        Breakdown of published journalism across news sections
                                    </p>

                                    {categoryStats.length === 0 ? (
                                        <div className="text-center py-8 text-xs text-slate-400">
                                            No categories configured yet.
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {categoryStats.map(cat => (
                                                <div key={cat.id}>
                                                    <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                                                        <span className="text-slate-800 dark:text-neutral-200">
                                                            {cat.name}
                                                        </span>
                                                        <span className="text-slate-500 dark:text-neutral-400 font-mono">
                                                            {cat.count} stories ({cat.percent}%)
                                                        </span>
                                                    </div>
                                                    <div className="w-full h-2.5 bg-slate-100 dark:bg-zinc-800/80 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-500"
                                                            style={{ width: `${Math.max(cat.percent, cat.count > 0 ? 5 : 0)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Editorial Pipeline Health */}
                                <div className="bg-white dark:bg-[#111113] p-6 rounded-2xl border border-slate-200/80 dark:border-neutral-800 shadow-xs flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                                            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                            Editorial Pipeline & Moderation
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-neutral-400 mb-5">
                                            Current throughput across submission, review, and publication
                                        </p>

                                        <div className="grid grid-cols-3 gap-3 mb-6">
                                            <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/40 text-center">
                                                <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
                                                    {totalElements || catalogArticles.length}
                                                </div>
                                                <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase mt-0.5">
                                                    Live Published
                                                </div>
                                            </div>

                                            <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 text-center">
                                                <div className="text-2xl font-black text-amber-700 dark:text-amber-400">
                                                    {pendingArticles.length}
                                                </div>
                                                <div className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase mt-0.5">
                                                    In Review
                                                </div>
                                            </div>

                                            <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-900/40 text-center">
                                                <div className="text-2xl font-black text-blue-700 dark:text-blue-400">
                                                    {users.length}
                                                </div>
                                                <div className="text-[11px] font-bold text-blue-800 dark:text-blue-300 uppercase mt-0.5">
                                                    Author Requests
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/70 dark:border-zinc-800 text-xs flex items-center justify-between">
                                        <span className="text-slate-600 dark:text-neutral-400 font-medium">
                                            Moderation Queue Status:
                                        </span>
                                        <span className={`font-bold px-2.5 py-1 rounded-full uppercase text-[10px] ${
                                            pendingArticles.length === 0 && users.length === 0
                                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                        }`}>
                                            {pendingArticles.length === 0 && users.length === 0 ? '✓ Up to Date' : `${pendingArticles.length + users.length} Action(s) Needed`}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* 3. LEADERBOARD: TOP PERFORMING ARTICLES */}
                            <div className="bg-white dark:bg-[#111113] p-6 rounded-2xl border border-slate-200/80 dark:border-neutral-800 shadow-xs">
                                <div className="flex items-center justify-between mb-5">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white m-0 flex items-center gap-2">
                                            <Award className="w-5 h-5 text-amber-500" />
                                            Top Performing Stories
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                                            Most engaged articles ranked by verified reader impressions
                                        </p>
                                    </div>
                                    <span className="text-xs font-semibold text-slate-400">
                                        Top 5 Published
                                    </span>
                                </div>

                                {topArticles.length === 0 ? (
                                    <div className="text-center py-8 text-sm text-slate-500">
                                        No published stories available yet.
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100 dark:divide-neutral-800/80">
                                        {topArticles.map((art, idx) => (
                                            <div
                                                key={art.id}
                                                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 first:pt-0 last:pb-0"
                                            >
                                                <div className="flex items-center gap-3.5 min-w-0">
                                                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                                                        idx === 0
                                                            ? 'bg-amber-500 text-white shadow-xs'
                                                            : idx === 1
                                                            ? 'bg-slate-300 dark:bg-zinc-700 text-slate-800 dark:text-zinc-100'
                                                            : idx === 2
                                                            ? 'bg-amber-700/60 text-white'
                                                            : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400'
                                                    }`}>
                                                        #{idx + 1}
                                                    </span>

                                                    <div className="min-w-0">
                                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate m-0">
                                                            {art.title}
                                                        </h4>
                                                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                                                            <span className="font-semibold text-slate-700 dark:text-neutral-300">
                                                                {art.author}
                                                            </span>
                                                            <span>•</span>
                                                            <span>{getCategoryName(art.categoryId)}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-neutral-300">
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800">
                                                            <Eye className="w-3.5 h-3.5 text-blue-500" />
                                                            {(art.viewCount || 0).toLocaleString()} views
                                                        </span>
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800">
                                                            <Heart className="w-3.5 h-3.5 text-rose-500" />
                                                            {(art.likeCount || 0).toLocaleString()}
                                                        </span>
                                                    </div>

                                                    <button
                                                        onClick={() => setViewingArticleId(art.id!)}
                                                        className="px-3 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition-colors cursor-pointer"
                                                    >
                                                        Read →
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* 4. TOP CONTRIBUTING AUTHORS */}
                            {authorStats.length > 0 && (
                                <div className="bg-white dark:bg-[#111113] p-6 rounded-2xl border border-slate-200/80 dark:border-neutral-800 shadow-xs">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                                        <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                        Leading Journalists & Contributors
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-neutral-400 mb-5">
                                        Writers driving the highest audience engagement on the portal
                                    </p>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {authorStats.map((auth) => (
                                            <div
                                                key={auth.name}
                                                className="p-4 rounded-xl bg-slate-50/70 dark:bg-[#141416] border border-slate-200/70 dark:border-neutral-800 flex items-center justify-between"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-zinc-800 text-white font-black text-xs flex items-center justify-center">
                                                        {auth.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                                                            {auth.name}
                                                        </div>
                                                        <div className="text-xs text-slate-500 dark:text-neutral-400">
                                                            {auth.count} {auth.count === 1 ? 'article' : 'articles'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs font-black text-slate-800 dark:text-neutral-200">
                                                        {auth.views.toLocaleString()}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 uppercase font-semibold">
                                                        views
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* =========================
                        TAB 6: BREAKING NEWS ALERTS (EDITORIAL BROADCAST STUDIO)
                    ========================= */}
                    {activeTab === 'alerts' && (
                        <div className="animate-fade-in max-w-4xl">
                            <div className="pb-4 mb-6 border-b border-slate-200/80 dark:border-neutral-800">
                                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white m-0">
                                    Emergency Alert System
                                </h2>
                                <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-1">
                                    Broadcast high-priority breaking news bulletins across registered subscribers and the portal live banner
                                </p>
                            </div>

                            {/* BROADCAST FORM CARD */}
                            <div className="bg-white dark:bg-[#111113] p-6 sm:p-8 rounded-2xl border border-slate-200/90 dark:border-neutral-800 shadow-xs">
                                <form onSubmit={handleSendAlert} className="flex flex-col gap-6">
                                    {/* 1. Article Selection Dropdown */}
                                    <div>
                                        <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
                                            Select Published Story to Promote <span className="text-rose-600">*</span>
                                        </label>
                                        <select
                                            value={selectedArticleId}
                                            onChange={e => handleSelectArticleForAlert(e.target.value)}
                                            required
                                            className="w-full px-4 py-3 bg-slate-50/70 dark:bg-[#18181b] text-slate-900 dark:text-white rounded-xl border border-slate-200/90 dark:border-neutral-800 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all cursor-pointer"
                                        >
                                            <option value="">-- Choose a live published article ({catalogArticles.length} available) --</option>
                                            {catalogArticles.map(art => (
                                                <option key={art.id} value={art.id}>
                                                    #{art.id} • {art.title} (By {art.author})
                                                </option>
                                            ))}
                                        </select>

                                        {selectedArticleObj && (
                                            <div className="mt-2.5 p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 flex items-center justify-between text-xs">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-slate-700 dark:text-neutral-300">
                                                        🏷️ {getCategoryName(selectedArticleObj.categoryId)}
                                                    </span>
                                                    <span>•</span>
                                                    <span className="text-slate-500">
                                                        Author: <strong className="text-slate-800 dark:text-white">{selectedArticleObj.author}</strong>
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setViewingArticleId(selectedArticleObj.id!)}
                                                    className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                                                >
                                                    <span>Preview Article</span>
                                                    <ExternalLink className="w-3 h-3" />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* 2. Priority & Headline */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
                                                Alert Priority
                                            </label>
                                            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-zinc-900 rounded-xl">
                                                {(['CRITICAL', 'BREAKING', 'FLASH'] as const).map(p => (
                                                    <button
                                                        key={p}
                                                        type="button"
                                                        onClick={() => setAlertPriority(p)}
                                                        className={`py-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                                                            alertPriority === p
                                                                ? p === 'CRITICAL'
                                                                    ? 'bg-rose-600 text-white shadow-xs'
                                                                    : p === 'BREAKING'
                                                                    ? 'bg-amber-600 text-white shadow-xs'
                                                                    : 'bg-blue-600 text-white shadow-xs'
                                                                : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                                                        }`}
                                                    >
                                                        {p}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="sm:col-span-2">
                                            <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
                                                Broadcast Headline / Email Subject
                                            </label>
                                            <input
                                                type="text"
                                                value={alertHeadline}
                                                onChange={e => setAlertHeadline(e.target.value)}
                                                placeholder="e.g. Major Tech Announcement Made at Global Summit"
                                                required
                                                className="w-full px-4 py-2.5 text-sm bg-slate-50/70 dark:bg-[#18181b] text-slate-900 dark:text-white rounded-xl border border-slate-200/90 dark:border-neutral-800 focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500"
                                            />
                                        </div>
                                    </div>

                                    {/* 3. Urgent Bulletin Message */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-sm font-bold text-slate-900 dark:text-white">
                                                Urgent Flash Bulletin / Editorial Summary
                                            </label>
                                            <span className="text-xs text-slate-400">
                                                {alertMessage.length} characters
                                            </span>
                                        </div>
                                        <textarea
                                            rows={4}
                                            value={alertMessage}
                                            onChange={e => setAlertMessage(e.target.value)}
                                            placeholder="Write a concise 1-3 sentence summary that explains what just happened and why readers should open the story..."
                                            required
                                            className="w-full p-4 text-sm bg-slate-50/70 dark:bg-[#18181b] text-slate-900 dark:text-white rounded-xl border border-slate-200/90 dark:border-neutral-800 focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 resize-y"
                                        />
                                    </div>

                                    {/* Dispatch Button */}
                                    <div className="flex justify-end pt-2">
                                        <button
                                            type="submit"
                                            disabled={sendingAlert}
                                            className="px-6 py-3 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                                        >
                                            <Send className="w-4 h-4" />
                                            <span>{sendingAlert ? 'Broadcasting Alert...' : 'Broadcast Alert Now'}</span>
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* =========================
                EDITORIAL REVIEW MODAL (FULL ARTICLE REVIEW)
            ========================= */}
            {reviewingArticle && (
                <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fade-in overflow-y-auto">
                    <div className="bg-white dark:bg-[#121214] rounded-3xl border border-slate-200/90 dark:border-neutral-800 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">
                        {/* Modal Header */}
                        <div className="px-6 py-4.5 border-b border-slate-200/80 dark:border-neutral-800 flex items-center justify-between gap-4 bg-slate-50/70 dark:bg-[#161619] shrink-0">
                            <div className="flex items-center gap-2.5 flex-wrap">
                                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                                    🏷️ {getCategoryName(reviewingArticle.categoryId)}
                                </span>
                                <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                                    ⏳ Pending Review
                                </span>
                                <span className="text-xs text-slate-500 dark:text-neutral-400">
                                    By <strong className="text-slate-800 dark:text-neutral-100">{reviewingArticle.author}</strong>
                                </span>
                            </div>

                            <button
                                onClick={() => setReviewingArticle(null)}
                                className="p-2 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer text-slate-500 hover:text-slate-800 dark:text-neutral-400 dark:hover:text-white"
                                title="Close review"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Content / Article Body */}
                        <div className="px-6 sm:px-10 py-8 overflow-y-auto flex-1 font-sans">
                            <div className="max-w-3xl mx-auto">
                                <div className="flex items-center gap-3 text-xs text-slate-400 font-medium mb-3">
                                    <span>
                                        {((reviewingArticle.content || '').trim().split(/\s+/).filter(Boolean).length)} words
                                    </span>
                                    <span>•</span>
                                    <span>
                                        ~{Math.max(1, Math.ceil(((reviewingArticle.content || '').trim().split(/\s+/).filter(Boolean).length) / 180))} min read
                                    </span>
                                </div>

                                <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight mb-6">
                                    {reviewingArticle.title}
                                </h1>

                                <div className="w-full h-px bg-slate-200/80 dark:bg-neutral-800 mb-6" />

                                <div className="text-base sm:text-lg leading-relaxed text-slate-800 dark:text-neutral-200 whitespace-pre-wrap font-serif sm:font-sans selection:bg-indigo-500/20">
                                    {reviewingArticle.content}
                                </div>
                            </div>
                        </div>

                        {/* Modal Action Bar */}
                        <div className="px-6 py-4 border-t border-slate-200/80 dark:border-neutral-800 bg-slate-50/70 dark:bg-[#161619] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                            <div className="text-xs text-slate-500 dark:text-neutral-400">
                                Article <strong className="text-slate-700 dark:text-neutral-300">#{reviewingArticle.id}</strong> submitted for editorial publication
                            </div>

                            <div className="flex items-center gap-3 justify-end flex-wrap">
                                <button
                                    onClick={() => setReviewingArticle(null)}
                                    className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => confirmRejectArticle(reviewingArticle.id!)}
                                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                                >
                                    <XCircle className="w-4 h-4" />
                                    <span>Reject to Draft</span>
                                </button>
                                <button
                                    onClick={() => confirmPublishArticle(reviewingArticle.id!)}
                                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>Approve & Publish Story</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* =========================
                CUSTOM CONFIRMATION MODAL
            ========================= */}
            {confirmDialog.isOpen && (
                <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white dark:bg-[#141416] rounded-2xl border border-slate-200/90 dark:border-neutral-800 shadow-xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                            {confirmDialog.title}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-neutral-300 mb-6 leading-relaxed">
                            {confirmDialog.message}
                        </p>
                        <div className="flex items-center justify-end gap-3">
                            <button
                                onClick={closeConfirm}
                                className="px-4 py-2 text-sm font-semibold rounded-xl border border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
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

            {/* =========================
                EDITORIAL REJECTION MODAL
            ========================= */}
            {rejectionModal.isOpen && (
                <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white dark:bg-[#141416] rounded-2xl border border-slate-200/90 dark:border-neutral-800 shadow-xl max-w-lg w-full p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                <XCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                    Reject Article to Draft
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-neutral-400">
                                    Provide feedback explaining why this draft needs revision so the author can re-edit it.
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 mb-6">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-2">
                                Editorial Feedback Note <span className="text-rose-500">*</span>
                            </label>
                            <textarea
                                rows={4}
                                value={rejectionModal.rejectionReason}
                                onChange={(e) => setRejectionModal(prev => ({ ...prev, rejectionReason: e.target.value }))}
                                placeholder="Explain why this article is being rejected (e.g., cite primary sources, fix headline typos, expand section 2)..."
                                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all resize-none"
                                autoFocus
                            />
                            <p className="text-[11px] text-slate-500 dark:text-neutral-500 mt-1.5">
                                This note will be visible to the author in their workspace when editing their draft.
                            </p>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-neutral-800">
                            <button
                                onClick={closeRejectModal}
                                className="px-4 py-2 text-sm font-semibold rounded-xl border border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmReject}
                                disabled={!rejectionModal.rejectionReason.trim()}
                                className="px-4 py-2 text-sm font-semibold rounded-xl text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                            >
                                <XCircle className="w-4 h-4" />
                                <span>Confirm Rejection</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
