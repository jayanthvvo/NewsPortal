import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { authService } from '../services/authService';

interface Article {
    id: number;
    title: string;
    content: string;
    authorId: number;
}

const ArticlesDashboard: React.FC = () => {
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const navigate = useNavigate();

    useEffect(() => {
        // Kick the user back to login if they don't have a token
        if (!authService.isAuthenticated()) {
            navigate('/login');
            return;
        }

        const fetchArticles = async () => {
            try {
                const response = await api.get('/articles');
                setArticles(response.data);
            } catch (error) {
                console.error("Failed to load articles", error);
                authService.logout();
                navigate('/login');
            } finally {
                setLoading(false);
            }
        };

        fetchArticles();
    }, [navigate]);

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                <h1>NewsPortal Dashboard</h1>
                <button onClick={handleLogout} style={{ padding: '8px 16px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    Logout
                </button>
            </header>

            <main style={{ marginTop: '20px' }}>
                <h2>Latest Articles</h2>
                
                {loading ? (
                    <p>Loading news...</p>
                ) : articles.length === 0 ? (
                    <p>No articles found. Check your Java backend database!</p>
                ) : (
                    <div style={{ display: 'grid', gap: '20px' }}>
                        {articles.map((article) => (
                            <div key={article.id} style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
                                <h3>{article.title}</h3>
                                <p>{article.content.substring(0, 100)}...</p>
                                <small>Author ID: {article.authorId}</small>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default ArticlesDashboard;