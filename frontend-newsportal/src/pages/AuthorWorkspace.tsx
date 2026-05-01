import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { articleService, type Article } from '../services/articleService';
import { categoryService, type Category } from '../services/categoryService';
import { authService } from '../services/authService';

const AuthorWorkspace: React.FC = () => {
    // Shared State
    const [activeTab, setActiveTab] = useState<string>('write');
    const [loading, setLoading] = useState<boolean>(false);
    const navigate = useNavigate();

    // Tab 1: Write Article State
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [categoryId, setCategoryId] = useState<number | ''>('');
    const [categories, setCategories] = useState<Category[]>([]);

    // Tab 2: My Articles State
    const [myArticles, setMyArticles] = useState<Article[]>([]);

    useEffect(() => {
        // SECURITY CHECK: Kick out anyone who isn't an Editor or Author
        const role = authService.getRole();
        if (!authService.isAuthenticated() || (role !== 'ROLE_EDITOR' && role !== 'ROLE_AUTHOR')) {
            navigate('/login');
            return;
        }

        // Always load categories so the dropdown menu works
        fetchCategories();

        // Load articles if on the "My Articles" tab
        if (activeTab === 'manage') {
            fetchMyArticles();
        }
    }, [activeTab, navigate]);

    // --- FETCH FUNCTIONS ---
    const fetchCategories = async () => {
        try {
            const data = await categoryService.getAllCategories();
            setCategories(data);
            // Auto-select the first category if none is selected
            if (data.length > 0 && categoryId === '') {
                setCategoryId(data[0].id);
            }
        } catch (error) {
            console.error("Error loading categories");
        }
    };

    const fetchMyArticles = async () => {
        try {
            setLoading(true);
            const data = await articleService.getMyArticles();
            setMyArticles(data);
        } catch (error) {
            console.error("Error fetching my articles");
        } finally {
            setLoading(false);
        }
    };

    // --- ACTION FUNCTIONS ---
    const handleSaveDraft = async (e: React.FormEvent) => {
        e.preventDefault();
        if (categoryId === '') return alert("Please select a category first!");

        try {
            setLoading(true);
            await articleService.createArticle({ 
                title, 
                content, 
                categoryId: Number(categoryId) 
            });
            alert("Article saved successfully as a DRAFT!");
            
            // Clear form and switch to manage tab
            setTitle('');
            setContent('');
            setActiveTab('manage');
        } catch (error) {
            alert("Failed to save article. Check Java backend logs.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitForReview = async (id: number) => {
        if (!window.confirm("Submit this article to the Admin for review? You won't be able to edit it while it's pending.")) return;
        try {
            await articleService.submitForReview(id);
            alert("Sent to admin!");
            fetchMyArticles(); // Refresh the list
        } catch (error) {
            alert("Failed to submit article.");
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    // --- HELPER TO COLOR CODE STATUS ---
    const getStatusClasses = (status: string) => {
        switch(status) {
            case 'PUBLISHED': return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-200 dark:border-green-800';
            case 'REVIEW': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
            case 'REJECTED': return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800';
            default: return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'; // DRAFT
        }
    };

    return (
        <div className="flex h-screen font-sans bg-[var(--bg)] text-[var(--text)]">
            
            {/* SIDEBAR NAVIGATION */}
            <div className="w-64 bg-[var(--code-bg)] border-r border-[var(--border)] flex flex-col shrink-0">
                <div className="p-6 border-b border-[var(--border)]">
                    <h2 className="text-xl font-bold text-[var(--text-h)] m-0">Author Workspace</h2>
                    <span className="text-sm font-medium opacity-70">Journalist Desk</span>
                </div>
                
                <nav className="flex-1 py-6 px-4">
                    <ul className="flex flex-col gap-2">
                        <li>
                            <button 
                                onClick={() => setActiveTab('write')} 
                                className={`w-full p-3 text-left rounded-lg font-medium transition-colors ${
                                    activeTab === 'write' 
                                    ? 'bg-[var(--accent)] text-white shadow-md' 
                                    : 'text-[var(--text-h)] hover:bg-[var(--accent-bg)]'
                                }`}
                            >
                                ✍️ Write New Article
                            </button>
                        </li>
                        <li>
                            <button 
                                onClick={() => setActiveTab('manage')} 
                                className={`w-full p-3 text-left rounded-lg font-medium transition-colors ${
                                    activeTab === 'manage' 
                                    ? 'bg-[var(--accent)] text-white shadow-md' 
                                    : 'text-[var(--text-h)] hover:bg-[var(--accent-bg)]'
                                }`}
                            >
                                🗂️ My Content
                            </button>
                        </li>
                    </ul>
                </nav>
                
                <div className="p-6 border-t border-[var(--border)]">
                    <button 
                        onClick={handleLogout} 
                        className="w-full p-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition-colors shadow-sm"
                    >
                        Logout
                    </button>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 p-10 overflow-y-auto">
                
                {/* TAB 1: WRITE ARTICLE */}
                {activeTab === 'write' && (
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-2xl font-bold border-b-2 border-[var(--accent)] pb-3 mb-6 text-[var(--text-h)]">Compose News Story</h2>
                        
                        <div className="bg-[var(--code-bg)] border border-[var(--border)] p-8 rounded-xl shadow-[var(--shadow)]">
                            <form onSubmit={handleSaveDraft} className="flex flex-col gap-6">
                                
                                <div>
                                    <label className="block mb-2 font-semibold text-[var(--text-h)]">Headline</label>
                                    <input 
                                        type="text" 
                                        value={title} 
                                        onChange={(e) => setTitle(e.target.value)} 
                                        required 
                                        className="w-full p-3 bg-[var(--bg)] text-[var(--text-h)] border border-[var(--border)] rounded-lg text-lg focus:ring-2 focus:ring-[var(--accent)] outline-none transition-all" 
                                        placeholder="Breaking News..." 
                                    />
                                </div>

                                <div>
                                    <label className="block mb-2 font-semibold text-[var(--text-h)]">News Category</label>
                                    <select 
                                        value={categoryId} 
                                        onChange={(e) => setCategoryId(Number(e.target.value))} 
                                        required 
                                        className="w-full p-3 bg-[var(--bg)] text-[var(--text-h)] border border-[var(--border)] rounded-lg text-base focus:ring-2 focus:ring-[var(--accent)] outline-none transition-all cursor-pointer"
                                    >
                                        <option value="" disabled>Select a Category...</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block mb-2 font-semibold text-[var(--text-h)]">Article Content</label>
                                    <textarea 
                                        value={content} 
                                        onChange={(e) => setContent(e.target.value)} 
                                        required 
                                        className="w-full p-4 bg-[var(--bg)] text-[var(--text-h)] border border-[var(--border)] rounded-lg min-h-[350px] text-base font-sans focus:ring-2 focus:ring-[var(--accent)] outline-none transition-all resize-y" 
                                        placeholder="Write your full story here..." 
                                    />
                                </div>

                                <div className="flex justify-end pt-6 border-t border-[var(--border)]">
                                    <button 
                                        type="submit" 
                                        disabled={loading} 
                                        className="py-3 px-6 bg-[var(--accent)] hover:opacity-90 disabled:opacity-50 text-white font-bold rounded-lg shadow-md transition-all cursor-pointer"
                                    >
                                        {loading ? 'Saving...' : '💾 Save as Draft'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* TAB 2: MY ARTICLES */}
                {activeTab === 'manage' && (
                    <div className="max-w-5xl mx-auto">
                        <h2 className="text-2xl font-bold border-b-2 border-[var(--accent)] pb-3 mb-6 text-[var(--text-h)]">My Content Portfolio</h2>
                        
                        {loading ? (
                            <div className="p-8 text-center animate-pulse text-[var(--text)]">Loading your articles...</div>
                        ) : myArticles.length === 0 ? (
                            <div className="p-6 bg-[var(--code-bg)] border border-[var(--border)] rounded-lg text-[var(--text-h)] text-center shadow-sm">
                                You haven't written any articles yet! Go to the "Write New Article" tab to start your first story.
                            </div>
                        ) : (
                            <div className="overflow-x-auto bg-[var(--code-bg)] border border-[var(--border)] rounded-xl shadow-[var(--shadow)]">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-[var(--bg)] border-b border-[var(--border)]">
                                        <tr>
                                            <th className="p-4 font-bold text-[var(--text-h)]">ID</th>
                                            <th className="p-4 font-bold text-[var(--text-h)]">Headline</th>
                                            <th className="p-4 font-bold text-[var(--text-h)]">Status</th>
                                            <th className="p-4 font-bold text-[var(--text-h)] text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--border)]">
                                        {myArticles.map((article) => (
                                            <tr key={article.id} className="hover:bg-[var(--bg)] transition-colors">
                                                <td className="p-4 text-sm opacity-70">#{article.id}</td>
                                                <td className="p-4 font-semibold text-[var(--text-h)]">{article.title}</td>
                                                <td className="p-4">
                                                    <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full border ${getStatusClasses(article.status)}`}>
                                                        {article.status}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    {article.status === 'DRAFT' || article.status === 'REJECTED' ? (
                                                        <button 
                                                            onClick={() => handleSubmitForReview(article.id!)} 
                                                            className="py-2 px-4 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-lg shadow-sm transition-colors"
                                                        >
                                                            📤 Submit for Review
                                                        </button>
                                                    ) : (
                                                        <span className="text-sm italic opacity-50">Locked (Pending/Published)</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
};

export default AuthorWorkspace;