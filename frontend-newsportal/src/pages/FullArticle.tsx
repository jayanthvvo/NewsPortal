import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { articleService, type Article } from '../services/articleService';
import { commentService, type Comment } from '../services/commentService';
import { authService } from '../services/authService';

const FullArticle: React.FC = () => {
    const { id } = useParams<{ id: string }>(); // Grabs the article ID from the URL
    const navigate = useNavigate();
    
    const [article, setArticle] = useState<Article | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        fetchArticleAndComments(Number(id));
    }, [id]);

    const fetchArticleAndComments = async (articleId: number) => {
        try {
            setLoading(true);
            const fetchedArticle = await articleService.getArticleById(articleId);
            setArticle(fetchedArticle);

            const fetchedComments = await commentService.getCommentsByArticle(articleId);
            setComments(fetchedComments);
        } catch (error) {
            alert("Article not found!");
            navigate('/articles');
        } finally {
            setLoading(false);
        }
    };

    const handlePostComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !article) return;

        try {
            // Updated to match your Java backend's expected JSON perfectly!
            await commentService.postComment({
                articleId: article.id!,
                content: newComment
            });
            
            setNewComment(''); // Clear the text box
            
            // Refresh comments to show the new one
            const updatedComments = await commentService.getCommentsByArticle(article.id!);
            setComments(updatedComments);
        } catch (error) {
            alert("Failed to post comment. Check your Java backend endpoints!");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--text)]">
                <div className="text-xl animate-pulse font-sans">Loading Story...</div>
            </div>
        );
    }
    
    if (!article) return null;

    return (
        <div className="min-h-screen bg-[var(--bg)] pb-16 font-sans">
            
            {/* Minimal Header */}
            <header className="px-6 py-5 md:px-10 border-b border-[var(--border)] flex justify-between items-center sticky top-0 bg-[var(--bg)] z-10 shadow-sm">
                <h2 
                    className="m-0 text-lg font-semibold text-[var(--text-h)] cursor-pointer hover:text-[var(--accent)] transition-colors" 
                    onClick={() => navigate('/articles')}
                >
                    ← Back to News Feed
                </h2>
                <div className="text-sm text-[var(--text)] font-medium">
                    Logged in as <span className="text-[var(--accent)]">{authService.getRole()}</span>
                </div>
            </header>

            <main className="max-w-3xl mx-auto mt-10 px-6 md:px-0">
                
                {/* ARTICLE CONTENT */}
                <article>
                    <h1 className="text-4xl md:text-5xl font-bold leading-tight text-[var(--text-h)] mb-6 font-serif">
                        {article.title}
                    </h1>
                    <div className="text-base text-[var(--text)] border-b-2 border-[var(--border)] pb-5 mb-8 italic">
                        Written by <strong className="text-[var(--text-h)]">{article.author}</strong> | Status: <span className="uppercase tracking-wide text-xs font-bold px-2 py-1 bg-[var(--code-bg)] rounded border border-[var(--border)] ml-1 not-italic">{article.status}</span>
                    </div>
                    
                    <div className="text-lg md:text-xl leading-relaxed text-[var(--text-h)] whitespace-pre-wrap font-serif">
                        {article.content}
                    </div>
                </article>

                {/* COMMENTS SECTION */}
                <section className="mt-16 border-t border-[var(--border)] pt-10 font-sans">
                    <h3 className="text-2xl font-bold mb-6 text-[var(--text-h)]">
                        Discussion ({comments.length})
                    </h3>

                    {/* Post a comment form */}
                    <div className="bg-[var(--code-bg)] p-6 rounded-xl mb-10 border border-[var(--border)] shadow-sm">
                        <form onSubmit={handlePostComment} className="flex flex-col gap-4">
                            <textarea 
                                value={newComment} 
                                onChange={(e) => setNewComment(e.target.value)} 
                                placeholder="Share your thoughts on this story..." 
                                required
                                className="w-full p-4 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text-h)] min-h-[120px] text-base focus:ring-2 focus:ring-[var(--accent)] outline-none transition-all resize-y" 
                            />
                            <div className="flex justify-end">
                                <button 
                                    type="submit" 
                                    className="px-6 py-2.5 bg-[var(--accent)] text-white font-bold rounded-lg hover:opacity-90 transition-opacity shadow-sm"
                                >
                                    Post Comment
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* List of comments */}
                    <div className="flex flex-col gap-5">
                        {comments.length === 0 ? (
                            <p className="text-[var(--text)] italic text-center py-8">
                                No comments yet. Be the first to start the conversation!
                            </p>
                        ) : (
                            comments.map((comment, index) => (
                                <div key={index} className="p-6 border border-[var(--border)] rounded-xl bg-[var(--bg)] shadow-sm hover:border-[var(--accent-border)] transition-colors">
                                    {/* Displays the authorUsername generated by Java */}
                                    <div className="font-bold text-[var(--accent)] mb-3 text-lg">
                                        {comment.authorUsername || 'Anonymous'}
                                    </div>
                                    {/* Displays the actual content */}
                                    <div className="text-[var(--text-h)] leading-relaxed text-base">
                                        {comment.content}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>

            </main>
        </div>
    );
};

export default FullArticle;