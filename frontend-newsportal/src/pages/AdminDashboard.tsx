import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService, type User } from '../services/adminService';
import { categoryService, type Category } from '../services/categoryService';
import { articleService, type Article } from '../services/articleService';
import { authService } from '../services/authService';

const AdminDashboard: React.FC = () => {
    // Shared State
    const [activeTab, setActiveTab] = useState<string>('approvals');
    const [loading, setLoading] = useState<boolean>(true);
    const navigate = useNavigate();

    // Tab 1 State (Approvals)
    const [users, setUsers] = useState<User[]>([]);

    // Tab 2 State (Categories)
    const [categories, setCategories] = useState<Category[]>([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryDesc, setNewCategoryDesc] = useState('');

    // Tab 3 State (Articles)
    const [pendingArticles, setPendingArticles] = useState<Article[]>([]);

    useEffect(() => {
        // SECURITY CHECK
        const role = authService.getRole();
        if (!authService.isAuthenticated() || role !== 'ROLE_ADMIN') {
            navigate('/login');
            return;
        }
        
        // Load data based on which tab is clicked
        if (activeTab === 'approvals') fetchPendingUsers();
        else if (activeTab === 'categories') fetchCategories();
        else if (activeTab === 'articles') fetchPendingArticles();
        
    }, [activeTab, navigate]);

    // --- TAB 1 FUNCTIONS ---
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

    const handleApprove = async (userId: number, username: string) => {
        if (!window.confirm(`Are you sure you want to approve ${username}?`)) return;
        try {
            await adminService.approveUser(userId);
            fetchPendingUsers();
        } catch (error) {
            alert("Failed to approve user.");
        }
    };

    // --- TAB 2 FUNCTIONS ---
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
        try {
            await categoryService.createCategory({ name: newCategoryName, description: newCategoryDesc });
            setNewCategoryName('');
            setNewCategoryDesc('');
            fetchCategories(); 
            alert("Category created successfully!");
        } catch (error) {
            alert("Failed to create category. Check Java backend logs.");
        }
    };

    // --- TAB 3 FUNCTIONS ---
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

    const handlePublishArticle = async (id: number) => {
        if (!window.confirm("Approve this article for public viewing?")) return;
        try {
            await articleService.updateArticleStatus(id, "PUBLISHED");
            fetchPendingArticles();
        } catch (error) {
            alert("Failed to publish article.");
        }
    };

    const handleRejectArticle = async (id: number) => {
        if (!window.confirm("Send this article back to the author as a Draft?")) return;
        try {
            await articleService.updateArticleStatus(id, "DRAFT");
            fetchPendingArticles();
        } catch (error) {
            alert("Failed to reject article.");
        }
    };

    const handleDeleteArticle = async (id: number) => {
        if (!window.confirm("CRITICAL: Are you sure you want to completely delete this article? This cannot be undone.")) return;
        try {
            await articleService.deleteArticle(id);
            fetchPendingArticles();
        } catch (error) {
            alert("Failed to delete article.");
        }
    };

    // --- SHARED FUNCTIONS ---
    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    return (
        <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif', backgroundColor: '#f4f7f6' }}>
            
            {/* SIDEBAR NAVIGATION */}
            <div style={{ width: '250px', backgroundColor: '#343a40', color: 'white', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid #4b545c' }}>
                    <h2 style={{ margin: 0, fontSize: '20px' }}>Admin Console</h2>
                    <small style={{ color: '#adb5bd' }}>Logged in as {authService.getRole()}</small>
                </div>
                
                <nav style={{ flex: 1, padding: '20px 0' }}>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        <li>
                            <button onClick={() => setActiveTab('approvals')} style={{ width: '100%', padding: '15px 20px', textAlign: 'left', background: activeTab === 'approvals' ? '#007bff' : 'transparent', color: 'white', border: 'none', cursor: 'pointer', fontSize: '16px' }}>
                                👤 Pending Approvals {users.length > 0 && activeTab !== 'approvals' && <span style={{ background: 'red', borderRadius: '50%', padding: '2px 8px', fontSize: '12px', marginLeft: '10px' }}>!</span>}
                            </button>
                        </li>
                        <li>
                            <button onClick={() => setActiveTab('categories')} style={{ width: '100%', padding: '15px 20px', textAlign: 'left', background: activeTab === 'categories' ? '#007bff' : 'transparent', color: 'white', border: 'none', cursor: 'pointer', fontSize: '16px' }}>
                                📁 Manage Categories
                            </button>
                        </li>
                        <li>
                            <button onClick={() => setActiveTab('articles')} style={{ width: '100%', padding: '15px 20px', textAlign: 'left', background: activeTab === 'articles' ? '#007bff' : 'transparent', color: 'white', border: 'none', cursor: 'pointer', fontSize: '16px' }}>
                                📰 Content Oversight
                            </button>
                        </li>
                    </ul>
                </nav>
                
                <div style={{ padding: '20px' }}>
                    <button onClick={handleLogout} style={{ width: '100%', padding: '10px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        Logout
                    </button>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
                
                {/* TAB 1: PENDING APPROVALS */}
                {activeTab === 'approvals' && (
                    /* ... (Your existing Approvals Code is untouched) ... */
                    <div>
                        <h2 style={{ borderBottom: '2px solid #007bff', paddingBottom: '10px' }}>Review Account Requests</h2>
                        {loading ? <p>Loading users...</p> : users.length === 0 ? (
                            <div style={{ backgroundColor: '#d4edda', color: '#155724', padding: '15px', borderRadius: '5px', marginTop: '20px' }}>
                                ✅ No pending approval requests at this time. You're all caught up!
                            </div>
                        ) : (
                            <table style={{ width: '100%', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginTop: '20px', borderCollapse: 'collapse' }}>
                                <thead style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                                    <tr style={{ textAlign: 'left' }}>
                                        <th style={{ padding: '15px' }}>Username</th>
                                        <th style={{ padding: '15px' }}>Email</th>
                                        <th style={{ padding: '15px' }}>Requested Role</th>
                                        <th style={{ padding: '15px' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => (
                                        <tr key={user.id} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '15px', fontWeight: 'bold' }}>{user.username}</td>
                                            <td style={{ padding: '15px' }}>{user.email}</td>
                                            <td style={{ padding: '15px' }}>
                                                <span style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: user.role === 'ROLE_ADMIN' ? '#f8d7da' : '#fff3cd', fontSize: '12px' }}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td style={{ padding: '15px' }}>
                                                <button onClick={() => handleApprove(user.id, user.username)} style={{ padding: '8px 16px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                                                    ✓ Approve
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {/* TAB 2: MANAGE CATEGORIES */}
                {activeTab === 'categories' && (
                    /* ... (Your existing Categories Code is untouched) ... */
                    <div>
                        <h2 style={{ borderBottom: '2px solid #007bff', paddingBottom: '10px' }}>Manage News Categories</h2>
                        
                        <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
                            <div style={{ flex: 1, backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', height: 'fit-content' }}>
                                <h3 style={{ marginTop: 0 }}>Create New Category</h3>
                                <form onSubmit={handleCreateCategory} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#555' }}>Category Name</label>
                                        <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} required style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }} placeholder="e.g. Technology" />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#555' }}>Description</label>
                                        <textarea value={newCategoryDesc} onChange={(e) => setNewCategoryDesc(e.target.value)} required style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', minHeight: '80px', boxSizing: 'border-box', fontFamily: 'inherit' }} placeholder="All tech related news..." />
                                    </div>
                                    <button type="submit" style={{ padding: '12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                                        + Add Category
                                    </button>
                                </form>
                            </div>

                            <div style={{ flex: 2, backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                                <h3 style={{ marginTop: 0 }}>Existing Categories</h3>
                                {categories.length === 0 ? (
                                    <p style={{ color: '#666' }}>No categories found in the database.</p>
                                ) : (
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ backgroundColor: '#f8f9fa', textAlign: 'left' }}>
                                                <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6' }}>ID</th>
                                                <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6' }}>Name</th>
                                                <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6' }}>Description</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {categories.map((category) => (
                                                <tr key={category.id} style={{ borderBottom: '1px solid #eee' }}>
                                                    <td style={{ padding: '12px', color: '#666' }}>{category.id}</td>
                                                    <td style={{ padding: '12px', fontWeight: 'bold' }}>{category.name}</td>
                                                    <td style={{ padding: '12px', color: '#444' }}>{category.description}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* NEW TAB 3: CONTENT OVERSIGHT */}
                {activeTab === 'articles' && (
                    <div>
                        <h2 style={{ borderBottom: '2px solid #007bff', paddingBottom: '10px' }}>Article Publishing Queue</h2>
                        <p style={{ color: '#666', marginBottom: '20px' }}>Review articles submitted by your authors. You must approve them before they go live on the public dashboard.</p>
                        
                        {loading ? <p>Loading pending articles...</p> : pendingArticles.length === 0 ? (
                            <div style={{ backgroundColor: '#d4edda', color: '#155724', padding: '15px', borderRadius: '5px', marginTop: '20px' }}>
                                ✅ Inbox Zero! There are no articles currently waiting for review.
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {pendingArticles.map((article) => (
                                    <div key={article.id} style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden', borderLeft: '5px solid #ffc107' }}>
                                        <div style={{ padding: '20px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                                <div>
                                                    <h3 style={{ margin: '0 0 5px 0', color: '#333' }}>{article.title}</h3>
                                                    <small style={{ color: '#666' }}>Written by <strong>{article.author}</strong> | Status: <span style={{ color: '#d39e00', fontWeight: 'bold' }}>{article.status}</span></small>
                                                </div>
                                            </div>
                                            
                                            {/* We slice the content so huge articles don't break the layout */}
                                            <p style={{ color: '#444', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '4px', fontStyle: 'italic', margin: '15px 0' }}>
                                                {article.content.length > 200 ? article.content.substring(0, 200) + "..." : article.content}
                                            </p>
                                            
                                            <div style={{ display: 'flex', gap: '10px', marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                                                <button onClick={() => handlePublishArticle(article.id)} style={{ padding: '8px 16px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                                                    ✓ Publish to Front Page
                                                </button>
                                                <button onClick={() => handleRejectArticle(article.id)} style={{ padding: '8px 16px', backgroundColor: '#ffc107', color: '#212529', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                                                    ↩ Send Back to Author (Draft)
                                                </button>
                                                <div style={{ flex: 1 }}></div> {/* Spacer */}
                                                <button onClick={() => handleDeleteArticle(article.id)} style={{ padding: '8px 16px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                                    🗑 Delete Permanently
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
};

export default AdminDashboard;