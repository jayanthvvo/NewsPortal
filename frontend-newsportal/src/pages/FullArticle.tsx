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
            await commentService.postComment({
                articleId: article.id!,
                text: newComment
            });
            setNewComment(''); // Clear the text box
            
            // Refresh comments to show the new one
            const updatedComments = await commentService.getCommentsByArticle(article.id!);
            setComments(updatedComments);
        } catch (error) {
            alert("Failed to post comment. Check your Java backend endpoints!");
        }
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '50px', fontSize: '20px' }}>Loading Story...</div>;
    if (!article) return null;

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#fdfdfd', fontFamily: "'Georgia', serif", paddingBottom: '50px' }}>
            
            {/* Minimal Header */}
            <header style={{ padding: '20px 40px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontFamily: 'sans-serif', color: '#1a1a1a', cursor: 'pointer' }} onClick={() => navigate('/articles')}>
                    ← Back to News Feed
                </h2>
                <div style={{ fontFamily: 'sans-serif', fontSize: '14px', color: '#666' }}>Logged in as {authService.getRole()}</div>
            </header>

            <main style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
                
                {/* ARTICLE CONTENT */}
                <article>
                    <h1 style={{ fontSize: '42px', lineHeight: '1.2', color: '#111', marginBottom: '20px' }}>{article.title}</h1>
                    <div style={{ fontSize: '16px', color: '#555', borderBottom: '2px solid #111', paddingBottom: '20px', marginBottom: '30px', fontStyle: 'italic' }}>
                        Written by <strong>{article.author}</strong> | Status: {article.status}
                    </div>
                    
                    <div style={{ fontSize: '20px', lineHeight: '1.8', color: '#333', whiteSpace: 'pre-wrap' }}>
                        {article.content}
                    </div>
                </article>

                {/* COMMENTS SECTION */}
                <section style={{ marginTop: '60px', borderTop: '1px solid #ddd', paddingTop: '40px', fontFamily: 'sans-serif' }}>
                    <h3 style={{ fontSize: '24px', marginBottom: '20px' }}>Discussion ({comments.length})</h3>

                    {/* Post a comment form */}
                    <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
                        <form onSubmit={handlePostComment} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <textarea 
                                value={newComment} 
                                onChange={(e) => setNewComment(e.target.value)} 
                                placeholder="Share your thoughts on this story..." 
                                required
                                style={{ width: '100%', padding: '15px', borderRadius: '4px', border: '1px solid #ccc', minHeight: '100px', fontSize: '16px', boxSizing: 'border-box', fontFamily: 'inherit' }} 
                            />
                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button type="submit" style={{ padding: '10px 24px', backgroundColor: '#0056b3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>
                                    Post Comment
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* List of comments */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {comments.length === 0 ? (
                            <p style={{ color: '#666', fontStyle: 'italic' }}>No comments yet. Be the first to start the conversation!</p>
                        ) : (
                            comments.map((comment, index) => (
                                <div key={index} style={{ padding: '20px', border: '1px solid #eee', borderRadius: '8px', backgroundColor: 'white' }}>
                                    <div style={{ fontWeight: 'bold', color: '#0056b3', marginBottom: '8px' }}>{comment.author}</div>
                                    <div style={{ color: '#444', lineHeight: '1.5' }}>{comment.text}</div>
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