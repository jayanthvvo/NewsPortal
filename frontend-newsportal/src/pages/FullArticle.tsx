import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import {
    ArrowLeft,
    Heart,
    Eye,
    MessageSquare,
    Clock,
    Trash2,
    Send,
    Share2,
    Bookmark,
    Check
} from 'lucide-react';

import { articleService, type Article } from '../services/articleService';
import { commentService, type Comment } from '../services/commentService';
import { categoryService, type Category } from '../services/categoryService';
import { bookmarkService } from '../services/bookmarkService';
import { authService } from '../services/authService';

interface FullArticleProps {
    articleId?: number;
    onBack?: () => void;
}

const FullArticle: React.FC<FullArticleProps> = ({ articleId, onBack }) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const activeId = articleId || Number(id);

    // =========================
    // STATE
    // =========================
    const [article, setArticle] = useState<Article | null>(null);
    const [loading, setLoading] = useState(true);

    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');

    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [likeLoading, setLikeLoading] = useState(false);

    const [commentToDelete, setCommentToDelete] = useState<number | null>(null);
    const [copied, setCopied] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);

    const viewTrackedRef = useRef<number | null>(null);
    const userRole = authService.getRole();

    // =========================
    // LOAD CATEGORIES
    // =========================
    useEffect(() => {
        categoryService.getAllCategories()
            .then(data => setCategories(Array.isArray(data) ? data : []))
            .catch(() => {});
    }, []);

    // =========================
    // LOAD ARTICLE
    // =========================
    useEffect(() => {
        if (!activeId) return;
        fetchArticleAndComments(activeId);
    }, [activeId]);

    const fetchArticleAndComments = async (targetId: number) => {
        try {
            setLoading(true);

            // 1. Get Article
            const fetchedArticle = await articleService.getArticleById(targetId);
            setArticle(fetchedArticle);
            if (fetchedArticle?.id) {
                setIsSaved(bookmarkService.isSaved(fetchedArticle.id));
            }

            // 2. Increment View (Only once per targetId)
            if (viewTrackedRef.current !== targetId) {
                viewTrackedRef.current = targetId;
                try {
                    const updatedArticle = await articleService.incrementView(targetId);
                    setArticle(prev =>
                        prev
                            ? {
                                  ...prev,
                                  viewCount:
                                      updatedArticle.viewCount ??
                                      (prev.viewCount || 0) + 1
                              }
                            : prev
                    );
                } catch (error) {
                    viewTrackedRef.current = null;
                    console.error('Failed to increment view count:', error);
                }
            }

            // 3. Get Like Status
            try {
                const likeStatus = await articleService.getLikeStatus(targetId);
                setLiked(likeStatus.liked);
                setLikeCount(likeStatus.likeCount);
            } catch (error) {
                console.error('Failed to load like status:', error);
            }

            // 4. Get Comments
            try {
                const fetchedComments = await commentService.getCommentsByArticle(targetId);
                setComments(fetchedComments || []);
            } catch (error) {
                console.error('Failed to load comments:', error);
                setComments([]);
            }
        } catch (error) {
            console.error('Failed to load article:', error);
            toast.error('Article not found!');
            if (onBack) {
                onBack();
            } else {
                navigate('/articles');
            }
        } finally {
            setLoading(false);
        }
    };

    // =========================
    // LIKE / UNLIKE
    // =========================
    const handleLike = async () => {
        if (!article?.id || likeLoading) return;

        try {
            setLikeLoading(true);

            if (liked) {
                const response = await articleService.unlikeArticle(article.id);
                setLiked(false);
                setLikeCount(response.likeCount);
            } else {
                const response = await articleService.likeArticle(article.id);
                setLiked(true);
                setLikeCount(response.likeCount);
            }
        } catch (error) {
            console.error('Failed to update like:', error);
            toast.error('Unable to update like. Please try again.');
        } finally {
            setLikeLoading(false);
        }
    };

    // =========================
    // POST COMMENT
    // =========================
    const handlePostComment = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newComment.trim() || !article) return;

        const toastId = toast.loading('Posting comment...');

        try {
            await commentService.postComment({
                articleId: article.id!,
                content: newComment
            });

            setNewComment('');
            toast.success('Comment posted successfully!', { id: toastId });

            try {
                const updatedComments = await commentService.getCommentsByArticle(article.id!);
                setComments(updatedComments || []);
            } catch (error) {
                console.error('Comment refresh failed:', error);
            }
        } catch (error) {
            console.error('Failed to post comment:', error);
            toast.error('Failed to post comment. Please try again.', { id: toastId });
        }
    };

    // =========================
    // DELETE COMMENT
    // =========================
    const confirmDeleteComment = async () => {
        if (!commentToDelete) return;

        const toastId = toast.loading('Deleting comment...');

        try {
            await commentService.deleteComment(commentToDelete);
            setComments(prev => prev.filter(c => c.id !== commentToDelete));
            toast.success('Comment deleted permanently.', { id: toastId });
        } catch (error) {
            console.error('Failed to delete comment:', error);
            toast.error('Failed to delete comment.', { id: toastId });
        } finally {
            setCommentToDelete(null);
        }
    };

    const handleBackClick = () => {
        if (onBack) {
            onBack();
        } else {
            navigate('/articles');
        }
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        toast.success('Article link copied to clipboard!');
        setTimeout(() => setCopied(false), 2500);
    };

    const handleToggleSave = () => {
        if (!article) return;
        const nowSaved = bookmarkService.toggleSave(article);
        setIsSaved(nowSaved);
        if (nowSaved) {
            toast.success('Article saved to your bookmarks!');
        } else {
            toast.success('Article removed from your bookmarks.');
        }
    };

    const words = article?.content ? article.content.trim().split(/\s+/).length : 0;
    const estTime = Math.max(1, Math.ceil(words / 180));
    const categoryName = categories.find(c => c.id === article?.categoryId)?.name;

    // =========================
    // LOADING & ERROR
    // =========================
    if (loading) {
        return (
            <div className={`flex flex-col items-center justify-center bg-transparent ${!onBack ? 'min-h-screen' : 'py-20'}`}>
                <div className="w-9 h-9 border-2 border-neutral-900 dark:border-white border-t-transparent rounded-full animate-spin mb-4" />
                <div className="text-sm font-semibold text-neutral-600 dark:text-neutral-400">
                    Loading Story...
                </div>
            </div>
        );
    }

    if (!article) return null;

    return (
        <div className={`w-full bg-transparent text-neutral-900 dark:text-neutral-100 font-sans relative ${!onBack ? 'min-h-screen pb-16' : 'pb-6'}`}>
            <Toaster position="top-right" reverseOrder={false} />

            {/* TOP NAVIGATION / BACK BUTTON */}
            {!onBack ? (
                <header className="sticky top-0 z-20 backdrop-blur-md bg-white/90 dark:bg-black/90 border-b border-neutral-200 dark:border-neutral-800 px-4 sm:px-8 py-3 shadow-2xs mb-6">
                    <div className="max-w-6xl mx-auto flex items-center justify-between">
                        <button
                            onClick={handleBackClick}
                            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-neutral-800 dark:text-neutral-200 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>← Back to News Feed</span>
                        </button>

                        <div className="text-xs text-neutral-500 dark:text-neutral-400">
                            Logged in as <span className="font-semibold text-neutral-900 dark:text-white">{userRole}</span>
                        </div>
                    </div>
                </header>
            ) : (
                <div className="mb-5 max-w-6xl mx-auto">
                    <button
                        onClick={handleBackClick}
                        className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#121214] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-all cursor-pointer shadow-2xs"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>← Back to List</span>
                    </button>
                </div>
            )}

            {/* WIDE MODERN ARTICLE CONTAINER (max-w-6xl) */}
            <main className={`max-w-6xl mx-auto ${!onBack ? 'px-4 sm:px-6' : ''}`}>
                {/* SHARP MAIN ARTICLE BOX */}
                <article className="bg-white dark:bg-[#101012] rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 sm:p-9 shadow-xs">
                    {/* Header meta & sharp controls */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-neutral-200 dark:border-neutral-800/80 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-neutral-900 dark:bg-zinc-800 border border-neutral-700 text-white font-bold text-sm flex items-center justify-center shadow-2xs shrink-0">
                                {(article.author || 'A').charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div className="text-sm font-bold text-neutral-900 dark:text-white">
                                    {article.author}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {estTime} min read
                                    </span>
                                    <span>•</span>
                                    <span className="uppercase font-semibold text-[10px] px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-zinc-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-zinc-700">
                                        {article.status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Top quick actions */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleLike}
                                disabled={likeLoading}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                                    liked
                                        ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 border-rose-200 dark:border-rose-900/60'
                                        : 'bg-white dark:bg-[#141416] text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50'
                                }`}
                            >
                                <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-current text-rose-600' : ''}`} />
                                <span>{likeCount}</span>
                            </button>

                            <button
                                onClick={handleShare}
                                className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                                title="Share Story"
                            >
                                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
                            </button>
                            <button
                                onClick={handleToggleSave}
                                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                    isSaved
                                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 border-amber-200 dark:border-amber-900/60 shadow-2xs'
                                        : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-zinc-800'
                                }`}
                                title={isSaved ? 'Remove from bookmarks' : 'Save to bookmarks'}
                            >
                                <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current text-amber-600' : ''}`} />
                            </button>
                        </div>
                    </div>

                    {/* Category Badge & Headline */}
                    <div className="mb-5">
                        {categoryName && (
                            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-neutral-100 dark:bg-zinc-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-zinc-700 mb-3">
                                {categoryName}
                            </div>
                        )}
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black leading-[1.18] tracking-tight text-black dark:text-white">
                            {article.title}
                        </h1>
                    </div>

                    {/* Stats Strip */}
                    <div className="flex items-center gap-5 pb-5 mb-7 border-b border-neutral-100 dark:border-neutral-800/60 text-xs text-neutral-500 dark:text-neutral-400">
                        <div className="flex items-center gap-1.5">
                            <Eye className="w-3.5 h-3.5 text-neutral-400" />
                            <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                                {article.viewCount || 0}
                            </span>
                            <span>{article.viewCount === 1 ? 'view' : 'views'}</span>
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-1.5">
                            <MessageSquare className="w-3.5 h-3.5 text-neutral-400" />
                            <span>{comments.length} comments</span>
                        </div>
                    </div>

                    {/* Full Article Content */}
                    <div className="text-base sm:text-lg leading-relaxed text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap font-sans">
                        {article.content}
                    </div>

                    {/* Bottom Like Callout */}
                    <div className="mt-10 pt-5 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                        <div className="text-xs sm:text-sm font-semibold text-neutral-600 dark:text-neutral-400">
                            Enjoyed this report?
                        </div>
                        <button
                            onClick={handleLike}
                            disabled={likeLoading}
                            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                liked
                                    ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 border-rose-200 dark:border-rose-900/60'
                                    : 'bg-white dark:bg-[#141416] text-neutral-800 dark:text-neutral-200 border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50'
                            }`}
                        >
                            <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-current text-rose-600' : ''}`} />
                            <span>{liked ? 'Liked Story' : 'Like Story'}</span>
                        </button>
                    </div>
                </article>

                {/* =========================
                    SHARP COMPACT COMMENTS BOX
                ========================= */}
                <section className="mt-6 bg-white dark:bg-[#101012] rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 sm:p-7 shadow-xs">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-4 mb-5 border-b border-neutral-200 dark:border-neutral-800">
                        <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white m-0 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                            <span>Discussion ({comments.length})</span>
                        </h3>
                        <span className="text-xs text-neutral-400 font-medium">
                            Join the conversation
                        </span>
                    </div>

                    {/* Compact Sharp Comment Input Form */}
                    <form onSubmit={handlePostComment} className="mb-6">
                        <div className="flex flex-col gap-2">
                            <textarea
                                value={newComment}
                                onChange={e => setNewComment(e.target.value)}
                                placeholder="Write your thoughts on this story..."
                                required
                                rows={2}
                                className="w-full p-3 text-sm bg-neutral-50 dark:bg-[#161618] text-neutral-900 dark:text-white rounded-lg border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-600 transition-all resize-y placeholder:text-neutral-400"
                            />
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-neutral-900 hover:bg-black dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white font-bold text-xs rounded-lg shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Send className="w-3 h-3" />
                                    <span>Post Comment</span>
                                </button>
                            </div>
                        </div>
                    </form>

                    {/* Sharp Comment Stream */}
                    <div className="flex flex-col gap-3">
                        {comments.length === 0 ? (
                            <div className="py-6 text-center text-xs text-neutral-500 dark:text-neutral-400 italic">
                                No comments yet. Be the first to start the conversation!
                            </div>
                        ) : (
                            comments.map((comment, index) => (
                                <div
                                    key={comment.id || index}
                                    className="p-3.5 rounded-lg bg-neutral-50/70 dark:bg-[#141416]/80 border border-neutral-100 dark:border-neutral-800/80 flex items-start justify-between gap-3"
                                >
                                    <div className="flex items-start gap-2.5 flex-1">
                                        <div className="w-7 h-7 rounded-md bg-neutral-900 dark:bg-zinc-800 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                            {(comment.authorUsername || 'U').charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-xs text-neutral-900 dark:text-white">
                                                    {comment.authorUsername || 'Reader'}
                                                </span>
                                                {comment.createdAt && (
                                                    <span className="text-[10px] text-neutral-400">
                                                        {new Date(comment.createdAt).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
                                                {comment.content}
                                            </p>
                                        </div>
                                    </div>

                                    {(userRole === 'ROLE_ADMIN' || userRole === 'ROLE_EDITOR') && comment.id && (
                                        <button
                                            onClick={() => setCommentToDelete(comment.id!)}
                                            className="text-neutral-400 hover:text-red-500 p-1 rounded-md transition-colors cursor-pointer shrink-0"
                                            title="Delete Comment"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </main>

            {/* CONFIRM COMMENT DELETE MODAL */}
            {commentToDelete && (
                <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white dark:bg-[#141416] rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xl max-w-sm w-full p-5">
                        <h4 className="text-base font-bold text-neutral-900 dark:text-white mb-1.5">
                            Delete Comment?
                        </h4>
                        <p className="text-xs text-neutral-600 dark:text-neutral-300 mb-5">
                            Are you sure you want to remove this reader comment permanently?
                        </p>
                        <div className="flex items-center justify-end gap-2.5">
                            <button
                                onClick={() => setCommentToDelete(null)}
                                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeleteComment}
                                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-2xs transition-colors cursor-pointer"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FullArticle;
