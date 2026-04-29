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
    const getStatusStyle = (status: string) => {
        switch(status) {
            case 'PUBLISHED': return { bg: '#d4edda', color: '#155724' };
            case 'REVIEW': return { bg: '#fff3cd', color: '#856404' };
            case 'REJECTED': return { bg: '#f8d7da', color: '#721c24' };
            default: return { bg: '#e2e3e5', color: '#383d41' }; // DRAFT
        }
    };

    return (
        <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif', backgroundColor: '#f4f7f6' }}>
            
            {/* SIDEBAR NAVIGATION */}
            <div style={{ width: '250px', backgroundColor: '#2c3e50', color: 'white', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid #34495e' }}>
                    <h2 style={{ margin: 0, fontSize: '20px' }}>Author Workspace</h2>
                    <small style={{ color: '#adb5bd' }}>Journalist Desk</small>
                </div>
                
                <nav style={{ flex: 1, padding: '20px 0' }}>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        <li>
                            <button onClick={() => setActiveTab('write')} style={{ width: '100%', padding: '15px 20px', textAlign: 'left', background: activeTab === 'write' ? '#18bc9c' : 'transparent', color: 'white', border: 'none', cursor: 'pointer', fontSize: '16px' }}>
                                ✍️ Write New Article
                            </button>
                        </li>
                        <li>
                            <button onClick={() => setActiveTab('manage')} style={{ width: '100%', padding: '15px 20px', textAlign: 'left', background: activeTab === 'manage' ? '#18bc9c' : 'transparent', color: 'white', border: 'none', cursor: 'pointer', fontSize: '16px' }}>
                                🗂️ My Content
                            </button>
                        </li>
                    </ul>
                </nav>
                
                <div style={{ padding: '20px' }}>
                    <button onClick={handleLogout} style={{ width: '100%', padding: '10px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        Logout
                    </button>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
                
                {/* TAB 1: WRITE ARTICLE */}
                {activeTab === 'write' && (
                    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                        <h2 style={{ borderBottom: '2px solid #18bc9c', paddingBottom: '10px' }}>Compose News Story</h2>
                        
                        <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginTop: '20px' }}>
                            <form onSubmit={handleSaveDraft} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>Headline</label>
                                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required style={{ width: '100%', padding: '12px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '18px', boxSizing: 'border-box' }} placeholder="Breaking News..." />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>News Category</label>
                                    <select value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))} required style={{ width: '100%', padding: '12px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '16px', boxSizing: 'border-box', backgroundColor: 'white' }}>
                                        <option value="" disabled>Select a Category...</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>Article Content</label>
                                    <textarea value={content} onChange={(e) => setContent(e.target.value)} required style={{ width: '100%', padding: '12px', border: '1px solid #ccc', borderRadius: '4px', minHeight: '300px', fontSize: '16px', boxSizing: 'border-box', fontFamily: 'inherit' }} placeholder="Write your full story here..." />
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                                    <button type="submit" disabled={loading} style={{ padding: '12px 24px', backgroundColor: '#18bc9c', color: 'white', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '16px', fontWeight: 'bold' }}>
                                        {loading ? 'Saving...' : '💾 Save as Draft'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* TAB 2: MY ARTICLES */}
                {activeTab === 'manage' && (
                    <div>
                        <h2 style={{ borderBottom: '2px solid #18bc9c', paddingBottom: '10px' }}>My Content Portfolio</h2>
                        
                        {loading ? <p>Loading your articles...</p> : myArticles.length === 0 ? (
                            <div style={{ backgroundColor: '#e9ecef', color: '#383d41', padding: '15px', borderRadius: '5px', marginTop: '20px' }}>
                                You haven't written any articles yet! Go to the "Write New Article" tab to start your first story.
                            </div>
                        ) : (
                            <table style={{ width: '100%', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginTop: '20px', borderCollapse: 'collapse' }}>
                                <thead style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                                    <tr style={{ textAlign: 'left' }}>
                                        <th style={{ padding: '15px' }}>ID</th>
                                        <th style={{ padding: '15px' }}>Headline</th>
                                        <th style={{ padding: '15px' }}>Status</th>
                                        <th style={{ padding: '15px', textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {myArticles.map((article) => {
                                        const statusStyle = getStatusStyle(article.status);
                                        return (
                                            <tr key={article.id} style={{ borderBottom: '1px solid #eee' }}>
                                                <td style={{ padding: '15px', color: '#666' }}>#{article.id}</td>
                                                <td style={{ padding: '15px', fontWeight: 'bold' }}>{article.title}</td>
                                                <td style={{ padding: '15px' }}>
                                                    <span style={{ padding: '6px 10px', borderRadius: '4px', backgroundColor: statusStyle.bg, color: statusStyle.color, fontSize: '12px', fontWeight: 'bold' }}>
                                                        {article.status}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '15px', textAlign: 'right' }}>
                                                    {article.status === 'DRAFT' || article.status === 'REJECTED' ? (
                                                        <button onClick={() => handleSubmitForReview(article.id!)} style={{ padding: '8px 16px', backgroundColor: '#f39c12', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                                                            📤 Submit for Review
                                                        </button>
                                                    ) : (
                                                        <span style={{ color: '#aaa', fontSize: '14px', fontStyle: 'italic' }}>Locked (Pending/Published)</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
};

export default AuthorWorkspace;