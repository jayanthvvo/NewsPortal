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
        <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] font-serif">
            
            {/* TOP NAVBAR */}
            <header className="sticky top-0 z-10 bg-[var(--code-bg)] border-b border-[var(--border)] px-6 py-4 md:px-10 flex justify-between items-center shadow-sm">
                <div className="flex items-baseline gap-3">
                    <h1 className="m-0 text-2xl md:text-3xl tracking-wide font-bold text-[var(--text-h)]">The Daily Chronicle</h1>
                    <span className="hidden sm:inline text-sm font-sans opacity-70">Your trusted news source</span>
                </div>
                
                <div className="flex gap-4 items-center font-sans">
                    <button 
                        onClick={() => navigate('/profile')} 
                        className="px-4 py-2 bg-[var(--accent)] text-white font-bold rounded-lg hover:opacity-90 transition-opacity shadow-sm"
                    >
                        My Profile
                    </button>
                    <button 
                        onClick={handleLogout} 
                        className="px-4 py-2 bg-transparent text-[var(--text-h)] border border-[var(--border)] rounded-lg hover:bg-[var(--accent-bg)] transition-colors"
                    >
                        Sign Out
                    </button>
                </div>
            </header>

            {/* MAIN NEWS FEED */}
            <main className="max-w-6xl mx-auto my-10 px-6">
                <h2 className="border-b-2 border-[var(--accent)] pb-3 mb-8 text-3xl font-bold text-[var(--text-h)]">
                    Latest Headlines
                </h2>

                {loading ? (
                    <div className="text-center py-16 text-xl text-[var(--text)] animate-pulse font-sans">
                        Loading today's stories...
                    </div>
                ) : articles.length === 0 ? (
                    <div className="bg-[var(--code-bg)] p-10 text-center rounded-xl border border-[var(--border)] shadow-sm">
                        <h3 className="m-0 mb-2 text-xl font-bold text-[var(--text-h)]">No stories published yet.</h3>
                        <p className="text-[var(--text)]">Our journalists are currently out in the field. Check back later!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        
                        {/* MAP THROUGH EVERY ARTICLE */}
                        {articles.map((article) => (
                            <article 
                                key={article.id} 
                                className="bg-[var(--bg)] rounded-xl overflow-hidden shadow-[var(--shadow)] border border-[var(--border)] border-t-4 border-t-[var(--accent)] flex flex-col hover:shadow-lg transition-shadow"
                            >
                                <div className="p-6 flex-1 flex flex-col">
                                    
                                    {/* CATEGORY TAG */}
                                    <div className="text-[var(--accent)] text-xs font-bold uppercase tracking-widest mb-3 font-sans">
                                        {getCategoryName(article.categoryId)}
                                    </div>
                                    
                                    {/* HEADLINE */}
                                    <h3 className="m-0 mb-4 text-2xl leading-snug text-[var(--text-h)] font-bold">
                                        {article.title}
                                    </h3>
                                    
                                    {/* AUTHOR */}
                                    <div className="text-sm text-[var(--text)] mb-4 italic">
                                        By <span className="font-semibold">{article.author}</span>
                                    </div>
                                    
                                    {/* EXCERPT (Cut off at 150 characters) */}
                                    <p className="text-[var(--text-h)] leading-relaxed text-base m-0">
                                        {article.content.length > 150 ? article.content.substring(0, 150) + "..." : article.content}
                                    </p>
                                </div>
                                
                                {/* READ MORE BUTTON */}
                                <div className="p-4 bg-[var(--code-bg)] border-t border-[var(--border)] text-right mt-auto">
                                    <button 
                                        onClick={() => navigate(`/article/${article.id}`)}
                                        className="bg-transparent border-none text-[var(--accent)] font-bold cursor-pointer font-sans text-sm hover:underline"
                                    >
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