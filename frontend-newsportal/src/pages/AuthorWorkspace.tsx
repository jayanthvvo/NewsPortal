import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { articleService, type Article } from '../services/articleService';
import { categoryService, type Category } from '../services/categoryService';
import { authService } from '../services/authService';
import { userService, type UserProfile } from '../services/userService';
import FullArticle from './FullArticle'; 

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

    useEffect(() => {
        const role = authService.getRole();
        if (!authService.isAuthenticated() || (role !== 'ROLE_EDITOR' && role !== 'ROLE_AUTHOR')) {
            navigate('/login');
            return;
        }

        fetchCategories();

        if (activeTab === 'manage') fetchMyArticles();
        else if (activeTab === 'read') fetchPublishedArticles();
        else if (activeTab === 'profile') fetchUserProfile();
        
        // Reset article view if they change tabs
        setViewingArticleId(null);
    }, [activeTab, navigate]);

    // --- FETCH FUNCTIONS ---
    const fetchCategories = async () => {
        try {
            const data = await categoryService.getAllCategories();
            setCategories(data);
            if (data.length > 0 && categoryId === '') setCategoryId(data[0].id);
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

    const fetchUserProfile = async () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                const username = payload.sub; 
                setLoading(true);
                const data = await userService.getProfile(username);
                setProfile(data);
                setFirstName(data.firstName || '');
                setLastName(data.lastName || '');
                setBio(data.bio || '');
            } catch (error) {
                console.error("Profile not found.");
            } finally {
                setLoading(false);
            }
        }
    };

    // --- ACTION FUNCTIONS ---
    const handleSaveDraft = async (e: React.FormEvent) => {
        e.preventDefault();
        if (categoryId === '') {
            toast.error("Please select a category first!");
            return;
        }

        try {
            setLoading(true);
            await articleService.createArticle({ title, content, categoryId: Number(categoryId) });
            toast.success("Article saved successfully as a DRAFT!");
            setTitle(''); 
            setContent(''); 
            setActiveTab('manage');
        } catch (error) { 
            toast.error("Failed to save article."); 
        } finally { 
            setLoading(false); 
        }
    };

    const confirmSubmitForReview = async () => {
        if (!confirmSubmitId) return;
        
        try {
            const toastId = toast.loading("Submitting article...");
            await articleService.submitForReview(confirmSubmitId);
            toast.success("Sent to admin for review!", { id: toastId });
            setConfirmSubmitId(null);
            fetchMyArticles();
        } catch (error) { 
            toast.error("Failed to submit article."); 
            setConfirmSubmitId(null);
        }
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingProfile(true);
        try {
            await userService.updateProfile({ firstName, lastName, bio });
            toast.success("Profile updated successfully!");
        } catch (error) {
            toast.error("Failed to update profile.");
        } finally {
            setSavingProfile(false);
        }
    };

    const handleLogout = () => { 
        authService.logout(); 
        navigate('/login'); 
    };

    // --- HELPERS ---
    const getCategoryName = (id: number) => {
        const category = categories.find(c => c.id === id);
        return category ? category.name : 'Breaking News';
    };

    const getStatusClasses = (status: string) => {
        switch(status) {
            case 'PUBLISHED': return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-200 dark:border-green-800';
            case 'REVIEW': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
            case 'REJECTED': return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800';
            default: return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'; 
        }
    };

    return (
        <div className="flex h-screen font-sans bg-[var(--bg)] text-[var(--text)] relative">
            
            <Toaster position="top-right" reverseOrder={false} />

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
                                onClick={() => setActiveTab('write')} 
                                className={`w-full p-3 text-left rounded-lg font-medium transition-colors ${
                                    activeTab === 'write' ? 'bg-[var(--accent)] text-white shadow-md' : 'text-[var(--text-h)] hover:bg-[var(--accent-bg)]'
                                }`}
                            >
                                ✍️ Write New Article
                            </button>
                        </li>
                        <li>
                            <button 
                                onClick={() => setActiveTab('manage')} 
                                className={`w-full p-3 text-left rounded-lg font-medium transition-colors ${
                                    activeTab === 'manage' ? 'bg-[var(--accent)] text-white shadow-md' : 'text-[var(--text-h)] hover:bg-[var(--accent-bg)]'
                                }`}
                            >
                                🗂️ My Content
                            </button>
                        </li>
                        <li>
                            <button 
                                onClick={() => setActiveTab('profile')} 
                                className={`w-full p-3 text-left rounded-lg font-medium transition-colors ${
                                    activeTab === 'profile' ? 'bg-[var(--accent)] text-white shadow-md' : 'text-[var(--text-h)] hover:bg-[var(--accent-bg)]'
                                }`}
                            >
                                👤 My Profile
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
                
                {/* TAB 1: READ ARTICLES */}
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

                {/* TAB 2: WRITE ARTICLE */}
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

                {/* TAB 3: MY ARTICLES */}
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
                                                            onClick={() => setConfirmSubmitId(article.id!)} 
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

                {/* TAB 4: MY PROFILE */}
                {activeTab === 'profile' && (
                    <div className="max-w-3xl mx-auto">
                        <h2 className="text-2xl font-bold border-b-2 border-[var(--accent)] pb-3 mb-6 text-[var(--text-h)]">My Profile Settings</h2>
                        
                        {loading ? (
                            <div className="p-8 text-center animate-pulse text-[var(--text)]">Loading profile...</div>
                        ) : (
                            <div className="bg-[var(--code-bg)] p-8 rounded-xl border border-[var(--border)] shadow-[var(--shadow)]">
                                <div className="mb-8 border-b border-[var(--border)] pb-6">
                                    <h3 className="m-0 text-2xl font-bold text-[var(--text-h)] tracking-tight">
                                        {profile?.username || 'Unknown User'}
                                    </h3>
                                    <div className="text-[var(--text)] font-medium mt-1">
                                        {profile?.email || 'No email associated'}
                                    </div>
                                </div>

                                <form onSubmit={handleSaveProfile} className="flex flex-col gap-6">
                                    <div className="flex flex-col sm:flex-row gap-6">
                                        <div className="flex-1">
                                            <label className="block mb-2 font-semibold text-[var(--text-h)] text-sm">First Name</label>
                                            <input 
                                                type="text" 
                                                value={firstName} 
                                                onChange={(e) => setFirstName(e.target.value)} 
                                                className="w-full p-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text-h)] focus:ring-2 focus:ring-[var(--accent)] outline-none transition-all" 
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="block mb-2 font-semibold text-[var(--text-h)] text-sm">Last Name</label>
                                            <input 
                                                type="text" 
                                                value={lastName} 
                                                onChange={(e) => setLastName(e.target.value)} 
                                                className="w-full p-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text-h)] focus:ring-2 focus:ring-[var(--accent)] outline-none transition-all" 
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block mb-2 font-semibold text-[var(--text-h)] text-sm">About Me (Bio)</label>
                                        <textarea 
                                            value={bio} 
                                            onChange={(e) => setBio(e.target.value)} 
                                            rows={4} 
                                            placeholder="Tell the community about yourself..." 
                                            className="w-full p-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text-h)] focus:ring-2 focus:ring-[var(--accent)] outline-none transition-all resize-y" 
                                        />
                                    </div>

                                    <button 
                                        type="submit" 
                                        disabled={savingProfile} 
                                        className="w-full mt-2 py-3 px-4 bg-[var(--accent)] text-white font-bold rounded-lg shadow-md transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {savingProfile ? 'Saving...' : 'Save Profile Changes'}
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                )}

            </div>

            {/* CONFIRMATION MODAL */}
            {confirmSubmitId && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-[var(--code-bg)] p-6 rounded-xl shadow-xl max-w-md w-full mx-4 border border-[var(--border)]">
                        <h3 className="text-xl font-bold text-[var(--text-h)] mb-2">Submit for Review?</h3>
                        <p className="text-[var(--text)] mb-6 opacity-90">
                            Are you sure you want to submit this article to the admin? Once submitted, it will be locked until reviewed.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button 
                                onClick={() => setConfirmSubmitId(null)}
                                className="px-4 py-2 rounded-lg font-semibold bg-[var(--bg)] border border-[var(--border)] hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmSubmitForReview}
                                className="px-4 py-2 rounded-lg font-semibold bg-[var(--accent)] text-white hover:opacity-90 transition-opacity"
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