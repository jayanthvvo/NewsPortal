import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { articleService, type Article } from '../services/articleService';
import { categoryService, type Category } from '../services/categoryService';
import { authService } from '../services/authService';

const ArticlesDashboard: React.FC = () => {
    const [articles, setArticles] = useState<Article[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        // Redirect to login if they don't have a token
        if (!authService.isAuthenticated()) {
            navigate('/login');
            return;
        }
        fetchData();
    }, [navigate]);

    const fetchData = async () => {
        try {
            setLoading(true);
            // Fetch both the articles and categories simultaneously!
            const [articlesData, categoriesData] = await Promise.all([
                articleService.getAllPublishedArticles(),
                categoryService.getAllCategories()
            ]);
            
            // Reverse the articles so the newest ones are at the top
            setArticles(articlesData.reverse());
            setCategories(categoriesData);
        } catch (error) {
            console.error("Error fetching data", error);
            // If we get a 401 unauthorized, their token probably expired
            authService.logout();
            navigate('/login');
        } finally {
            setLoading(false);
        }
    };

    // Helper function to map a categoryId to its actual string name
    const getCategoryName = (id: number) => {
        const category = categories.find(c => c.id === id);
        return category ? category.name : 'Breaking News';
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', fontFamily: "'Georgia', serif" }}>
            
            {/* TOP NAVBAR */}
            <header style={{ backgroundColor: '#1a1a1a', color: 'white', padding: '15px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                    <h1 style={{ margin: 0, fontSize: '28px', letterSpacing: '1px' }}>The Daily Chronicle</h1>
                    <span style={{ color: '#aaa', fontSize: '14px', fontFamily: 'sans-serif' }}>Your trusted news source</span>
                </div>
                
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', fontFamily: 'sans-serif' }}>
                    <button onClick={() => navigate('/profile')} style={{ padding: '8px 16px', backgroundColor: '#0056b3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                        My Profile
                    </button>
                    <button onClick={handleLogout} style={{ padding: '8px 16px', backgroundColor: 'transparent', color: 'white', border: '1px solid white', borderRadius: '4px', cursor: 'pointer', transition: '0.2s' }}>
                        Sign Out
                    </button>
                </div>
            </header>

            {/* MAIN NEWS FEED */}
            <main style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px' }}>
                <h2 style={{ borderBottom: '3px solid #1a1a1a', paddingBottom: '10px', marginBottom: '30px', fontSize: '32px' }}>Latest Headlines</h2>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '50px', fontSize: '20px', color: '#666' }}>
                        Loading today's stories...
                    </div>
                ) : articles.length === 0 ? (
                    <div style={{ backgroundColor: 'white', padding: '40px', textAlign: 'center', borderRadius: '8px', border: '1px solid #ddd' }}>
                        <h3 style={{ margin: 0, color: '#555' }}>No stories published yet.</h3>
                        <p style={{ color: '#888' }}>Our journalists are currently out in the field. Check back later!</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '30px' }}>
                        
                        {/* MAP THROUGH EVERY ARTICLE */}
                        {articles.map((article) => (
                            <article key={article.id} style={{ backgroundColor: 'white', borderRadius: '4px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderTop: '4px solid #0056b3', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ padding: '25px', flex: 1 }}>
                                    
                                    {/* CATEGORY TAG */}
                                    <div style={{ color: '#0056b3', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', fontFamily: 'sans-serif' }}>
                                        {getCategoryName(article.categoryId)}
                                    </div>
                                    
                                    {/* HEADLINE */}
                                    <h3 style={{ margin: '0 0 15px 0', fontSize: '24px', lineHeight: '1.3', color: '#222' }}>
                                        {article.title}
                                    </h3>
                                    
                                    {/* AUTHOR */}
                                    <div style={{ fontSize: '14px', color: '#666', marginBottom: '15px', fontStyle: 'italic' }}>
                                        By {article.author}
                                    </div>
                                    
                                    {/* EXCERPT (Cut off at 150 characters) */}
                                    <p style={{ color: '#444', lineHeight: '1.6', fontSize: '16px', margin: 0 }}>
                                        {article.content.length > 150 ? article.content.substring(0, 150) + "..." : article.content}
                                    </p>
                                </div>
                                
                                {/* READ MORE BUTTON (Currently just an alert, will link to full page soon!) */}
                                <div style={{ padding: '15px 25px', backgroundColor: '#f8f9fa', borderTop: '1px solid #eee', textAlign: 'right' }}>
                                    <button 
                                        onClick={() => navigate(`/article/${article.id}`)}
                                        style={{ background: 'none', border: 'none', color: '#0056b3', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'sans-serif', fontSize: '14px' }}>
                                        Read Full Story →
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default ArticlesDashboard;