import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast'; // <-- Imported toast library
import { adminService, type User } from '../services/adminService';
import { categoryService, type Category } from '../services/categoryService';
import { articleService, type Article } from '../services/articleService';
import { alertService } from '../services/alertService';
import { authService } from '../services/authService';
import FullArticle from './FullArticle'; 

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
        confirmColor: 'bg-[var(--accent)]',
        onConfirm: () => {}
    });

    const closeConfirm = () => setConfirmDialog(prev => ({ ...prev, isOpen: false }));

    // Tab: Read Articles State
    const [publishedArticles, setPublishedArticles] = useState<Article[]>([]);
    const [viewingArticleId, setViewingArticleId] = useState<number | null>(null);

    // Tab 1 State (Approvals)
    const [users, setUsers] = useState<User[]>([]);

    // Tab 2 State (Categories)
    const [categories, setCategories] = useState<Category[]>([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryDesc, setNewCategoryDesc] = useState('');

    // Tab 3 State (Articles)
    const [pendingArticles, setPendingArticles] = useState<Article[]>([]);

    // Tab 4 State (Alerts)
    const [alertMessage, setAlertMessage] = useState('');
    const [sendingAlert, setSendingAlert] = useState(false);

    useEffect(() => {
        const role = authService.getRole();
        if (!authService.isAuthenticated() || role !== 'ROLE_ADMIN') {
            navigate('/login');
            return;
        }
        
        fetchCategories();

        if (activeTab === 'approvals') fetchPendingUsers();
        else if (activeTab === 'articles') fetchPendingArticles();
        else if (activeTab === 'read') fetchPublishedArticles();
        
        setViewingArticleId(null);
    }, [activeTab, navigate]);

    // --- FETCH FUNCTIONS ---
    const fetchPublishedArticles = async () => {
        try {
            setLoading(true);
            const data = await articleService.getAllPublishedArticles();
            setPublishedArticles(data.reverse()); 
        } catch (error) {
            console.error("Error fetching published articles");
        } finally {
            setLoading(false);
        }
    };

    const getCategoryName = (id: number) => {
        const category = categories.find(c => c.id === id);
        return category ? category.name : 'Unknown Category';
    };

    // --- TAB 1: APPROVALS ---
    const fetchPendingUsers = async () => {
        try {
            setLoading(true);
            const data = await adminService.getAllUsers();
            setUsers(data);
        } catch (error) {
            console.error("Error fetching pending requests");
        } finally {
            setLoading(false);
        }
    };

    const confirmApproveUser = (userId: number, username: string) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Approve User',
            message: `Are you sure you want to approve ${username}?`,
            confirmText: 'Approve User',
            confirmColor: 'bg-green-600 hover:bg-green-700',
            onConfirm: async () => {
                closeConfirm();
                const toastId = toast.loading(`Approving ${username}...`);
                try {
                    await adminService.approveUser(userId);
                    toast.success(`${username} has been approved!`, { id: toastId });
                    fetchPendingUsers();
                } catch (error) {
                    toast.error("Failed to approve user.", { id: toastId });
                }
            }
        });
    };

    // --- TAB 2: CATEGORIES ---
    const fetchCategories = async () => {
        try {
            const data = await categoryService.getAllCategories();
            setCategories(data);
        } catch (error) {
            console.error("Error loading categories");
        }
    };

    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        const toastId = toast.loading("Creating category...");
        try {
            await categoryService.createCategory({ name: newCategoryName, description: newCategoryDesc });
            setNewCategoryName('');
            setNewCategoryDesc('');
            fetchCategories(); 
            toast.success("Category created successfully!", { id: toastId });
        } catch (error) {
            toast.error("Failed to create category.", { id: toastId });
        }
    };

    // --- TAB 3: ARTICLES ---
    const fetchPendingArticles = async () => {
        try {
            setLoading(true);
            const data = await articleService.getPendingReviews();
            setPendingArticles(data);
        } catch (error) {
            console.error("Error fetching pending articles");
        } finally {
            setLoading(false);
        }
    };

    const confirmPublishArticle = (id: number) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Publish Article',
            message: 'Approve this article for public viewing?',
            confirmText: 'Publish',
            confirmColor: 'bg-green-600 hover:bg-green-700',
            onConfirm: async () => {
                closeConfirm();
                const toastId = toast.loading("Publishing article...");
                try {
                    await articleService.updateArticleStatus(id, "PUBLISHED");
                    toast.success("Article is now live!", { id: toastId });
                    fetchPendingArticles();
                } catch (error) {
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
            confirmColor: 'bg-yellow-500 hover:bg-yellow-600',
            onConfirm: async () => {
                closeConfirm();
                const toastId = toast.loading("Rejecting article...");
                try {
                    await articleService.updateArticleStatus(id, "DRAFT");
                    toast.success("Article sent back to drafts.", { id: toastId });
                    fetchPendingArticles();
                } catch (error) {
                    toast.error("Failed to reject article.", { id: toastId });
                }
            }
        });
    };

    const confirmDeleteArticle = (id: number) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Delete Article',
            message: 'CRITICAL: Permanently delete this article? This action cannot be undone.',
            confirmText: 'Delete Permanently',
            confirmColor: 'bg-red-600 hover:bg-red-700',
            onConfirm: async () => {
                closeConfirm();
                const toastId = toast.loading("Deleting article...");
                try {
                    await articleService.deleteArticle(id);
                    toast.success("Article deleted.", { id: toastId });
                    fetchPendingArticles();
                } catch (error) {
                    toast.error("Failed to delete article.", { id: toastId });
                }
            }
        });
    };

    // --- TAB 4: ALERTS ---
    const confirmSendAlert = (e: React.FormEvent) => {
        e.preventDefault();
        setConfirmDialog({
            isOpen: true,
            title: 'Broadcast Emergency Alert',
            message: 'WARNING: This will send an email to EVERY registered user in the database. Proceed?',
            confirmText: 'Broadcast Alert',
            confirmColor: 'bg-red-600 hover:bg-red-700',
            onConfirm: async () => {
                closeConfirm();
                setSendingAlert(true);
                const toastId = toast.loading("Broadcasting email to all users...");
                try {
                    const responseMsg = await alertService.sendBreakingNews(alertMessage);
                    toast.success(`Success! ${responseMsg}`, { id: toastId, duration: 5000 });
                    setAlertMessage('');
                } catch (error) {
                    toast.error("Failed to send breaking news. Ensure your alert-service is running and SMTP is configured.", { id: toastId, duration: 6000 });
                } finally {
                    setSendingAlert(false);
                }
            }
        });
    };

    // --- SHARED ---
    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    return (
        <div className="flex h-screen font-sans bg-[var(--bg)] text-[var(--text)] relative">
            
            {/* Global Toaster for notifications */}
            <Toaster position="top-right" reverseOrder={false} />

            {/* SIDEBAR NAVIGATION */}
            <div className="w-64 bg-[var(--code-bg)] border-r border-[var(--border)] flex flex-col shrink-0">
                <div className="p-6 border-b border-[var(--border)]">
                    <h2 className="text-xl font-bold text-[var(--text-h)] m-0">Admin Console</h2>
                    <span className="text-sm font-medium opacity-70">System Oversight</span>
                </div>
                
                <nav className="flex-1 py-6 px-4">
                    <ul className="flex flex-col gap-2">
                        <li>
                            <button 
                                onClick={() => setActiveTab('read')} 
                                className={`w-full p-3 text-left rounded-lg font-medium transition-colors ${
                                    activeTab === 'read' ? 'bg-[var(--accent)] text-white shadow-md' : 'text-[var(--text-h)] hover:bg-[var(--accent-bg)]'
                                }`}
                            >
                                📰 Read Articles
                            </button>
                        </li>
                        <li>
                            <button 
                                onClick={() => setActiveTab('approvals')} 
                                className={`w-full p-3 text-left rounded-lg font-medium transition-colors flex justify-between items-center ${
                                    activeTab === 'approvals' ? 'bg-[var(--accent)] text-white shadow-md' : 'text-[var(--text-h)] hover:bg-[var(--accent-bg)]'
                                }`}
                            >
                                <span>👤 Approvals</span>
                                {users.length > 0 && activeTab !== 'approvals' && (
                                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">!</span>
                                )}
                            </button>
                        </li>
                        <li>
                            <button 
                                onClick={() => setActiveTab('categories')} 
                                className={`w-full p-3 text-left rounded-lg font-medium transition-colors ${
                                    activeTab === 'categories' ? 'bg-[var(--accent)] text-white shadow-md' : 'text-[var(--text-h)] hover:bg-[var(--accent-bg)]'
                                }`}
                            >
                                📁 Categories
                            </button>
                        </li>
                        <li>
                            <button 
                                onClick={() => setActiveTab('articles')} 
                                className={`w-full p-3 text-left rounded-lg font-medium transition-colors ${
                                    activeTab === 'articles' ? 'bg-[var(--accent)] text-white shadow-md' : 'text-[var(--text-h)] hover:bg-[var(--accent-bg)]'
                                }`}
                            >
                                📰 Article Reviews
                            </button>
                        </li>
                        <li>
                            <button 
                                onClick={() => setActiveTab('alerts')} 
                                className={`w-full p-3 text-left rounded-lg font-medium transition-colors ${
                                    activeTab === 'alerts' ? 'bg-red-600 text-white shadow-md' : 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                                }`}
                            >
                                🚨 Breaking News Alert
                            </button>
                        </li>
                    </ul>
                </nav>
                
                <div className="p-6 border-t border-[var(--border)]">
                    <button 
                        onClick={handleLogout} 
                        className="w-full p-3 bg-slate-500 hover:bg-slate-600 text-white font-bold rounded-lg transition-colors shadow-sm"
                    >
                        Logout
                    </button>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 p-10 overflow-y-auto">
                
                {/* TAB 0: READ ARTICLES */}
                {activeTab === 'read' && (
                    <div className="max-w-6xl mx-auto">
                        {viewingArticleId ? (
                            <div className="bg-[var(--code-bg)] border border-[var(--border)] p-8 rounded-xl shadow-[var(--shadow)]">
                                <FullArticle 
                                    articleId={viewingArticleId} 
                                    onBack={() => setViewingArticleId(null)} 
                                />
                            </div>
                        ) : (
                            <>
                                <h2 className="text-2xl font-bold border-b-2 border-[var(--accent)] pb-3 mb-6 text-[var(--text-h)]">Latest Headlines</h2>
                                
                                {loading ? (
                                    <div className="p-8 text-center animate-pulse text-[var(--text)]">Loading today's stories...</div>
                                ) : publishedArticles.length === 0 ? (
                                    <div className="p-6 bg-[var(--code-bg)] border border-[var(--border)] rounded-lg text-[var(--text-h)] text-center shadow-sm">
                                        No stories published yet. Check back later!
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                        {publishedArticles.map((article) => (
                                            <article 
                                                key={article.id} 
                                                className="bg-[var(--code-bg)] rounded-xl overflow-hidden shadow-[var(--shadow)] border border-[var(--border)] border-t-4 border-t-[var(--accent)] flex flex-col hover:shadow-lg transition-shadow"
                                            >
                                                <div className="p-6 flex-1 flex flex-col">
                                                    <div className="text-[var(--accent)] text-xs font-bold uppercase tracking-widest mb-3 font-sans">
                                                        {getCategoryName(article.categoryId)}
                                                    </div>
                                                    <h3 className="m-0 mb-4 text-xl leading-snug text-[var(--text-h)] font-bold">
                                                        {article.title}
                                                    </h3>
                                                    <div className="text-sm text-[var(--text)] mb-4 italic">
                                                        By <span className="font-semibold">{article.author}</span>
                                                    </div>
                                                    <p className="text-[var(--text-h)] opacity-80 leading-relaxed text-sm m-0">
                                                        {article.content.length > 150 ? article.content.substring(0, 150) + "..." : article.content}
                                                    </p>
                                                </div>
                                                <div className="p-4 bg-[var(--bg)] border-t border-[var(--border)] text-right mt-auto">
                                                    <button 
                                                        onClick={() => setViewingArticleId(article.id!)}
                                                        className="bg-transparent border-none text-[var(--accent)] font-bold cursor-pointer font-sans text-sm hover:underline"
                                                    >
                                                        Read Full Story →
                                                    </button>
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* TAB 1: PENDING APPROVALS */}
                {activeTab === 'approvals' && (
                    <div className="max-w-5xl mx-auto">
                        <h2 className="text-2xl font-bold border-b-2 border-[var(--accent)] pb-3 mb-6 text-[var(--text-h)]">Review Account Requests</h2>
                        
                        {loading ? (
                            <p className="animate-pulse">Loading users...</p>
                        ) : users.length === 0 ? (
                            <div className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 p-4 rounded-lg font-medium border border-green-200 dark:border-green-800">
                                ✅ No pending approval requests at this time. You're all caught up!
                            </div>
                        ) : (
                            <div className="overflow-x-auto bg-[var(--code-bg)] border border-[var(--border)] rounded-xl shadow-[var(--shadow)]">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-[var(--bg)] border-b border-[var(--border)]">
                                        <tr>
                                            <th className="p-4 font-bold text-[var(--text-h)]">Username</th>
                                            <th className="p-4 font-bold text-[var(--text-h)]">Email</th>
                                            <th className="p-4 font-bold text-[var(--text-h)]">Requested Role</th>
                                            <th className="p-4 font-bold text-[var(--text-h)]">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--border)]">
                                        {users.map((user) => (
                                            <tr key={user.id} className="hover:bg-[var(--bg)] transition-colors">
                                                <td className="p-4 font-semibold text-[var(--text-h)]">{user.username}</td>
                                                <td className="p-4">{user.email}</td>
                                                <td className="p-4">
                                                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800 rounded-full text-xs font-bold tracking-wide">
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <button 
                                                        onClick={() => confirmApproveUser(user.id, user.username)} 
                                                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded shadow-sm transition-colors text-sm"
                                                    >
                                                        ✓ Approve
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 2: MANAGE CATEGORIES */}
                {activeTab === 'categories' && (
                    <div className="max-w-6xl mx-auto">
                        <h2 className="text-2xl font-bold border-b-2 border-[var(--accent)] pb-3 mb-6 text-[var(--text-h)]">Manage News Categories</h2>
                        
                        <div className="flex flex-col lg:flex-row gap-8">
                            <div className="flex-1 bg-[var(--code-bg)] p-6 md:p-8 rounded-xl shadow-[var(--shadow)] border border-[var(--border)] h-fit">
                                <h3 className="text-lg font-bold text-[var(--text-h)] mb-6 mt-0">Create New Category</h3>
                                <form onSubmit={handleCreateCategory} className="flex flex-col gap-5">
                                    <div>
                                        <label className="block mb-2 text-sm font-semibold text-[var(--text-h)]">Category Name</label>
                                        <input 
                                            type="text" 
                                            value={newCategoryName} 
                                            onChange={(e) => setNewCategoryName(e.target.value)} 
                                            required 
                                            className="w-full p-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text-h)] focus:ring-2 focus:ring-[var(--accent)] outline-none transition-all" 
                                            placeholder="e.g. Technology" 
                                        />
                                    </div>
                                    <div>
                                        <label className="block mb-2 text-sm font-semibold text-[var(--text-h)]">Description</label>
                                        <textarea 
                                            value={newCategoryDesc} 
                                            onChange={(e) => setNewCategoryDesc(e.target.value)} 
                                            required 
                                            className="w-full p-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text-h)] focus:ring-2 focus:ring-[var(--accent)] outline-none transition-all min-h-[100px] resize-y" 
                                        />
                                    </div>
                                    <button 
                                        type="submit" 
                                        className="py-3 bg-[var(--accent)] text-white font-bold rounded-lg shadow-sm hover:opacity-90 transition-opacity mt-2"
                                    >
                                        + Add Category
                                    </button>
                                </form>
                            </div>

                            <div className="flex-[2] bg-[var(--code-bg)] p-6 md:p-8 rounded-xl shadow-[var(--shadow)] border border-[var(--border)]">
                                <h3 className="text-lg font-bold text-[var(--text-h)] mb-6 mt-0">Existing Categories</h3>
                                {categories.length === 0 ? (
                                    <p className="italic opacity-70">No categories found in the database.</p>
                                ) : (
                                    <div className="overflow-x-auto border border-[var(--border)] rounded-lg">
                                        <table className="w-full text-left border-collapse">
                                            <thead className="bg-[var(--bg)] border-b border-[var(--border)]">
                                                <tr>
                                                    <th className="p-4 font-bold text-[var(--text-h)]">Name</th>
                                                    <th className="p-4 font-bold text-[var(--text-h)]">Description</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[var(--border)]">
                                                {categories.map((category) => (
                                                    <tr key={category.id} className="hover:bg-[var(--bg)] transition-colors">
                                                        <td className="p-4 font-bold text-[var(--text-h)] whitespace-nowrap">{category.name}</td>
                                                        <td className="p-4 opacity-80">{category.description}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 3: CONTENT OVERSIGHT */}
                {activeTab === 'articles' && (
                    <div className="max-w-5xl mx-auto">
                        <h2 className="text-2xl font-bold border-b-2 border-[var(--accent)] pb-3 mb-6 text-[var(--text-h)]">Article Publishing Queue</h2>
                        
                        {loading ? (
                            <p className="animate-pulse">Loading pending articles...</p>
                        ) : pendingArticles.length === 0 ? (
                            <div className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 p-4 rounded-lg font-medium border border-green-200 dark:border-green-800">
                                ✅ Inbox Zero! There are no articles currently waiting for review.
                            </div>
                        ) : (
                            <div className="flex flex-col gap-6">
                                {pendingArticles.map((article) => (
                                    <div key={article.id} className="bg-[var(--code-bg)] border border-[var(--border)] border-l-4 border-l-yellow-500 rounded-xl shadow-[var(--shadow)] overflow-hidden">
                                        <div className="p-6">
                                            <h3 className="m-0 mb-2 text-xl font-bold text-[var(--text-h)]">{article.title}</h3>
                                            <div className="text-sm opacity-80 mb-4">
                                                Written by <strong className="text-[var(--text-h)]">{article.author}</strong> | Status: <span className="text-yellow-600 dark:text-yellow-400 font-bold">{article.status}</span>
                                            </div>
                                            
                                            <div className="bg-[var(--bg)] p-4 rounded-lg border border-[var(--border)] italic opacity-90 mb-6">
                                                {article.content.length > 200 ? article.content.substring(0, 200) + "..." : article.content}
                                            </div>
                                            
                                            <div className="flex flex-wrap gap-3 pt-5 border-t border-[var(--border)]">
                                                <button 
                                                    onClick={() => confirmPublishArticle(article.id!)} 
                                                    className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded shadow-sm transition-colors text-sm"
                                                >
                                                    ✓ Publish
                                                </button>
                                                <button 
                                                    onClick={() => confirmRejectArticle(article.id!)} 
                                                    className="px-5 py-2 bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold rounded shadow-sm transition-colors text-sm"
                                                >
                                                    ↩ Reject (Draft)
                                                </button>
                                                <div className="flex-1"></div>
                                                <button 
                                                    onClick={() => confirmDeleteArticle(article.id!)} 
                                                    className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded shadow-sm transition-colors text-sm"
                                                >
                                                    🗑 Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 4: BREAKING NEWS ALERTS */}
                {activeTab === 'alerts' && (
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-2xl font-bold border-b-2 border-red-500 pb-3 mb-4 text-red-600 dark:text-red-500">Emergency Alert System</h2>
                        <p className="mb-8 opacity-80">Use this console to send an immediate Breaking News email blast to every registered reader in the database.</p>
                        
                        <div className="bg-[var(--code-bg)] p-8 rounded-xl shadow-[var(--shadow)] border-2 border-red-200 dark:border-red-900/50">
                            <form onSubmit={confirmSendAlert} className="flex flex-col gap-5">
                                <div>
                                    <label className="block mb-3 font-bold text-red-700 dark:text-red-400">Breaking News Message</label>
                                    <textarea 
                                        value={alertMessage} 
                                        onChange={(e) => setAlertMessage(e.target.value)} 
                                        required 
                                        placeholder="Type the emergency alert or breaking news here..." 
                                        className="w-full p-4 bg-[var(--bg)] border-2 border-red-400 dark:border-red-500 rounded-lg text-[var(--text-h)] focus:ring-4 focus:ring-red-500/20 outline-none transition-all min-h-[150px] resize-y" 
                                    />
                                </div>
                                <div className="flex justify-end mt-2">
                                    <button 
                                        type="submit" 
                                        disabled={sendingAlert} 
                                        className="py-3 px-6 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-bold rounded-lg shadow-md transition-colors disabled:cursor-not-allowed"
                                    >
                                        {sendingAlert ? '🚨 Broadcasting Alert to all Users...' : '🚨 Broadcast Breaking News'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            {/* SHARED CONFIRMATION MODAL */}
            {confirmDialog.isOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-[var(--code-bg)] p-6 rounded-xl shadow-xl max-w-md w-full mx-4 border border-[var(--border)]">
                        <h3 className="text-xl font-bold text-[var(--text-h)] mb-2">{confirmDialog.title}</h3>
                        <p className="text-[var(--text)] mb-6 opacity-90">{confirmDialog.message}</p>
                        <div className="flex justify-end gap-3">
                            <button 
                                onClick={closeConfirm}
                                className="px-4 py-2 rounded-lg font-semibold bg-[var(--bg)] border border-[var(--border)] hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmDialog.onConfirm}
                                className={`px-4 py-2 rounded-lg font-semibold text-white transition-opacity shadow-sm ${confirmDialog.confirmColor}`}
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