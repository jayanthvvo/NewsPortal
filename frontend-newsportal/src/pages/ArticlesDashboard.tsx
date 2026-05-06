// frontend-newsportal/src/pages/ArticlesDashboard.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { articleService, type Article } from '../services/articleService';
import { categoryService, type Category } from '../services/categoryService';
import { authService } from '../services/authService';
import FullArticle from './FullArticle'; 

const ArticlesDashboard: React.FC = () => {
    const [articles, setArticles] = useState<Article[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    
    // State for local filtering (Title, Content)
    const [searchQuery, setSearchQuery] = useState('');
    
    // State for backend Author search
    const [authorSearch, setAuthorSearch] = useState('');
    
    const [viewingArticleId, setViewingArticleId] = useState<number | null>(null);

    const navigate = useNavigate();
    const role = authService.getRole();

    useEffect(() => {
        if (!authService.isAuthenticated()) {
            navigate('/login');
            return;
        }
        fetchData();
    }, [navigate]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [articlesData, categoriesData] = await Promise.all([
                articleService.getAllPublishedArticles(),
                categoryService.getAllCategories()
            ]);
            
            setArticles(articlesData.reverse());
            setCategories(categoriesData);
        } catch (error) {
            console.error("Error fetching data", error);
            authService.logout();
            navigate('/login');
        } finally {
            setLoading(false);
        }
    };

    // Function to trigger the backend API call to fetch by Author
    const handleAuthorSearch = async () => {
        try {
            setLoading(true);
            // If the user clears the author search, fetch all articles again
            if (!authorSearch.trim()) {
                await fetchData();
                return;
            }
            
            const articlesByAuthor = await articleService.getArticlesByAuthor(authorSearch);
            setArticles(articlesByAuthor.reverse());
        } catch (error) {
            console.error("Error fetching articles by author", error);
            setArticles([]); // Set to empty if no articles found for this author
        } finally {
            setLoading(false);
        }
    };

    const getCategoryName = (id: number) => {
        const category = categories.find(c => c.id === id);
        return category ? category.name : 'Breaking News';
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    // Local filter applied to whatever articles are currently loaded
    const filteredArticles = articles.filter(article => {
        const lowerCaseQuery = searchQuery.toLowerCase();
        return (
            article.title.toLowerCase().includes(lowerCaseQuery) ||
            article.content.toLowerCase().includes(lowerCaseQuery) ||
            article.author.toLowerCase().includes(lowerCaseQuery) 
        );
    });

    return (
        <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] font-serif">
            
            {/* TOP NAVBAR */}
            <header className="sticky top-0 z-10 bg-[var(--code-bg)] border-b border-[var(--border)] px-6 py-4 md:px-10 flex justify-between items-center shadow-sm">
                <div className="flex items-baseline gap-3">
                    <h1 className="m-0 text-2xl md:text-3xl tracking-wide font-bold text-[var(--text-h)]">NewsPortal</h1>
                    <span className="hidden sm:inline text-sm font-sans opacity-70">Your trusted news source</span>
                </div>
                
                <div className="flex gap-4 items-center font-sans">
                    {(role === 'ROLE_AUTHOR' || role === 'ROLE_EDITOR') && (
                        <button 
                            onClick={() => navigate(role === 'ROLE_EDITOR' ? '/admin' : '/author')} 
                            className="px-4 py-2 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
                        >
                            My Workspace
                        </button>
                    )}

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

            {/* MAIN CONTENT AREA */}
            <main className="max-w-6xl mx-auto my-10 px-6">
                
                {viewingArticleId ? (
                    <FullArticle 
                        articleId={viewingArticleId} 
                        onBack={() => setViewingArticleId(null)} 
                    />
                ) : (
                    <>
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-2 border-[var(--accent)] pb-3 mb-8 gap-4">
                            <h2 className="m-0 text-3xl font-bold text-[var(--text-h)] whitespace-nowrap">
                                Latest Headlines
                            </h2>
                            
                            {/* SEARCH BARS UI */}
                            <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto font-sans justify-end">
                                
                                {/* Local Search Input */}
                                <input 
                                    type="text" 
                                    placeholder="🔍 Search titles & content..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--code-bg)] text-[var(--text-h)] focus:ring-2 focus:ring-[var(--accent)] outline-none transition-all shadow-sm w-full md:w-64"
                                />

                                {/* Backend Author Search Input & Button */}
                                <div className="flex gap-2 w-full md:w-auto">
                                    <input 
                                        type="text" 
                                        placeholder="✍️ Filter by Author..." 
                                        value={authorSearch}
                                        onChange={(e) => setAuthorSearch(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAuthorSearch()}
                                        className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--code-bg)] text-[var(--text-h)] focus:ring-2 focus:ring-blue-400 outline-none transition-all shadow-sm flex-1 md:w-48"
                                    />
                                    <button 
                                        onClick={handleAuthorSearch}
                                        className="px-4 py-2 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
                                    >
                                        Filter
                                    </button>
                                </div>
                            </div>
                        </div>

                        {loading ? (
                            <div className="text-center py-16 text-xl text-[var(--text)] animate-pulse font-sans">
                                Loading today's stories...
                            </div>
                        ) : articles.length === 0 ? (
                            <div className="bg-[var(--code-bg)] p-10 text-center rounded-xl border border-[var(--border)] shadow-sm">
                                <h3 className="m-0 mb-2 text-xl font-bold text-[var(--text-h)]">No stories found.</h3>
                                <p className="text-[var(--text)]">We couldn't find any articles based on your current filters.</p>
                            </div>
                        ) : filteredArticles.length === 0 ? (
                            <div className="bg-[var(--code-bg)] p-10 text-center rounded-xl border border-[var(--border)] shadow-sm">
                                <h3 className="m-0 mb-2 text-xl font-bold text-[var(--text-h)]">No results found.</h3>
                                <p className="text-[var(--text)] font-sans">We couldn't find any articles matching "{searchQuery}". Try adjusting your search terms.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {filteredArticles.map((article) => (
                                    <article 
                                        key={article.id} 
                                        className="bg-[var(--bg)] rounded-xl overflow-hidden shadow-[var(--shadow)] border border-[var(--border)] border-t-4 border-t-[var(--accent)] flex flex-col hover:shadow-lg transition-shadow"
                                    >
                                        <div className="p-6 flex-1 flex flex-col">
                                            <div className="text-[var(--accent)] text-xs font-bold uppercase tracking-widest mb-3 font-sans">
                                                {getCategoryName(article.categoryId)}
                                            </div>
                                            <h3 className="m-0 mb-4 text-2xl leading-snug text-[var(--text-h)] font-bold">
                                                {article.title}
                                            </h3>
                                            <div className="text-sm text-[var(--text)] mb-4 italic">
                                                By <span className="font-semibold">{article.author}</span>
                                            </div>
                                            <p className="text-[var(--text-h)] leading-relaxed text-base m-0">
                                                {article.content.length > 150 ? article.content.substring(0, 150) + "..." : article.content}
                                            </p>
                                        </div>
                                        
                                        <div className="p-4 bg-[var(--code-bg)] border-t border-[var(--border)] text-right mt-auto">
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
            </main>
        </div>
    );
};

export default ArticlesDashboard;