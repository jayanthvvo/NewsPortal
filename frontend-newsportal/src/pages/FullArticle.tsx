
import React, {
    useEffect,
    useRef,
    useState
} from 'react';

import {
    useParams,
    useNavigate
} from 'react-router-dom';

import toast, {
    Toaster
} from 'react-hot-toast';

import {
    articleService,
    type Article
} from '../services/articleService';

import {
    commentService,
    type Comment
} from '../services/commentService';

import {
    authService
} from '../services/authService';


interface FullArticleProps {
    articleId?: number;
    onBack?: () => void;
}


const FullArticle: React.FC<FullArticleProps> = ({
    articleId,
    onBack
}) => {

    const { id } =
        useParams<{ id: string }>();

    const navigate =
        useNavigate();

    const activeId =
        articleId || Number(id);


    // =========================
    // ARTICLE
    // =========================

    const [article, setArticle] =
        useState<Article | null>(null);

    const [loading, setLoading] =
        useState(true);


    // =========================
    // COMMENTS
    // =========================

    const [comments, setComments] =
        useState<Comment[]>([]);

    const [newComment, setNewComment] =
        useState('');


    // =========================
    // LIKES
    // =========================

    const [liked, setLiked] =
        useState(false);

    const [likeCount, setLikeCount] =
        useState(0);

    const [likeLoading, setLikeLoading] =
        useState(false);


    // =========================
    // COMMENT DELETE
    // =========================

    const [commentToDelete, setCommentToDelete] =
        useState<number | null>(null);


    // =========================
    // VIEW TRACKING
    // =========================

    /*
     * Prevent React StrictMode from
     * incrementing the same article twice
     * during development.
     */
    const viewTrackedRef =
        useRef<number | null>(null);


    const userRole =
        authService.getRole();


    // =========================
    // LOAD ARTICLE
    // =========================

    useEffect(() => {

        if (!activeId) {
            return;
        }

        fetchArticleAndComments(activeId);

    }, [activeId]);


    const fetchArticleAndComments =
        async (targetId: number) => {

            try {

                setLoading(true);


                // =========================
                // 1. GET ARTICLE
                // =========================

                const fetchedArticle =
                    await articleService.getArticleById(
                        targetId
                    );

                setArticle(
                    fetchedArticle
                );


                // =========================
                // 2. INCREMENT VIEW
                // =========================

                /*
                 * Only increment once for this
                 * article during this component
                 * lifecycle.
                 */
                if (
                    viewTrackedRef.current !==
                    targetId
                ) {

                    viewTrackedRef.current =
                        targetId;

                    try {

                        const updatedArticle =
                            await articleService.incrementView(
                                targetId
                            );


                        setArticle(prev =>
                            prev
                                ? {
                                      ...prev,

                                      viewCount:
                                          updatedArticle.viewCount ??
                                          (
                                              prev.viewCount ||
                                              0
                                          ) + 1
                                  }
                                : prev
                        );

                    } catch (error) {

                        /*
                         * If the API request failed,
                         * allow it to be retried.
                         */
                        viewTrackedRef.current =
                            null;

                        console.error(
                            'Failed to increment view count:',
                            error
                        );
                    }
                }


                // =========================
                // 3. GET LIKE STATUS
                // =========================

                try {

                    const likeStatus =
                        await articleService.getLikeStatus(
                            targetId
                        );

                    setLiked(
                        likeStatus.liked
                    );

                    setLikeCount(
                        likeStatus.likeCount
                    );

                } catch (error) {

                    console.error(
                        'Failed to load like status:',
                        error
                    );
                }


                // =========================
                // 4. GET COMMENTS
                // =========================

                try {

                    const fetchedComments =
                        await commentService.getCommentsByArticle(
                            targetId
                        );

                    setComments(
                        fetchedComments
                    );

                } catch (error) {

                    console.error(
                        'Failed to load comments:',
                        error
                    );

                    toast.error(
                        'Unable to load comments.'
                    );

                    setComments([]);
                }

            } catch (error) {

                console.error(
                    'Failed to load article:',
                    error
                );

                toast.error(
                    'Article not found!'
                );


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

    const handleLike =
        async () => {

            if (
                !article?.id ||
                likeLoading
            ) {
                return;
            }


            try {

                setLikeLoading(true);


                // =========================
                // UNLIKE
                // =========================

                if (liked) {

                    const response =
                        await articleService.unlikeArticle(
                            article.id
                        );

                    setLiked(false);

                    setLikeCount(
                        response.likeCount
                    );


                }

                // =========================
                // LIKE
                // =========================

                else {

                    const response =
                        await articleService.likeArticle(
                            article.id
                        );

                    setLiked(true);

                    setLikeCount(
                        response.likeCount
                    );

                }

            } catch (error) {

                console.error(
                    'Failed to update like:',
                    error
                );

                toast.error(
                    'Unable to update like. Please try again.'
                );

            } finally {

                setLikeLoading(false);

            }
        };


    // =========================
    // POST COMMENT
    // =========================

    const handlePostComment =
        async (
            e: React.FormEvent
        ) => {

            e.preventDefault();


            if (
                !newComment.trim() ||
                !article
            ) {
                return;
            }


            const toastId =
                toast.loading(
                    'Posting comment...'
                );


            try {

                await commentService.postComment({
                    articleId: article.id!,
                    content: newComment
                });


                setNewComment('');


                toast.success(
                    'Comment posted successfully!',
                    {
                        id: toastId
                    }
                );


                try {

                    const updatedComments =
                        await commentService.getCommentsByArticle(
                            article.id!
                        );

                    setComments(
                        updatedComments
                    );

                } catch (error) {

                    console.error(
                        'Comment was posted but refresh failed:',
                        error
                    );

                    toast.error(
                        'Comment posted, but comments could not be refreshed.'
                    );
                }

            } catch (error) {

                console.error(
                    'Failed to post comment:',
                    error
                );

                toast.error(
                    'Failed to post comment. Please try again.',
                    {
                        id: toastId
                    }
                );
            }
        };


    // =========================
    // DELETE COMMENT
    // =========================

    const confirmDeleteComment =
        async () => {

            if (!commentToDelete) {
                return;
            }


            const toastId =
                toast.loading(
                    'Deleting comment...'
                );


            try {

                await commentService.deleteComment(
                    commentToDelete
                );


                setComments(
                    prevComments =>
                        prevComments.filter(
                            comment =>
                                comment.id !==
                                commentToDelete
                        )
                );


                toast.success(
                    'Comment deleted permanently.',
                    {
                        id: toastId
                    }
                );

            } catch (error) {

                console.error(
                    'Failed to delete comment:',
                    error
                );

                toast.error(
                    'Failed to delete comment.',
                    {
                        id: toastId
                    }
                );

            } finally {

                setCommentToDelete(null);

            }
        };


    // =========================
    // BACK
    // =========================

    const handleBackClick =
        () => {

            if (onBack) {

                onBack();

            } else {

                navigate('/articles');

            }
        };


    // =========================
    // LOADING
    // =========================

    if (loading) {

        return (

            <div
                className={`
                    flex
                    items-center
                    justify-center
                    bg-[var(--bg)]
                    text-[var(--text)]
                    ${
                        !onBack
                            ? 'min-h-screen'
                            : 'py-20'
                    }
                `}
            >

                <div className="text-xl animate-pulse font-sans">
                    Loading Story...
                </div>

            </div>
        );
    }


    // =========================
    // ARTICLE NOT FOUND
    // =========================

    if (!article) {
        return null;
    }


    return (

        <div
            className={`
                bg-[var(--bg)]
                font-sans
                relative
                ${
                    !onBack
                        ? 'min-h-screen pb-16'
                        : 'pb-6'
                }
            `}
        >

            <Toaster
                position="top-right"
                reverseOrder={false}
            />


            {/* =========================
                HEADER
            ========================= */}

            {!onBack ? (

                <header
                    className="
                        px-6
                        py-5
                        md:px-10
                        border-b
                        border-[var(--border)]
                        flex
                        justify-between
                        items-center
                        sticky
                        top-0
                        bg-[var(--bg)]
                        z-10
                        shadow-sm
                    "
                >

                    <h2
                        className="
                            m-0
                            text-lg
                            font-semibold
                            text-[var(--text-h)]
                            cursor-pointer
                            hover:text-[var(--accent)]
                            transition-colors
                        "
                        onClick={
                            handleBackClick
                        }
                    >
                        ← Back to News Feed
                    </h2>


                    <div
                        className="
                            text-sm
                            text-[var(--text)]
                            font-medium
                        "
                    >
                        Logged in as{' '}

                        <span
                            className="
                                text-[var(--accent)]
                            "
                        >
                            {userRole}
                        </span>
                    </div>

                </header>

            ) : (

                <div className="mb-8">

                    <button
                        onClick={
                            handleBackClick
                        }
                        className="
                            px-4
                            py-2
                            bg-[var(--code-bg)]
                            border
                            border-[var(--border)]
                            rounded-lg
                            text-[var(--text-h)]
                            font-semibold
                            hover:bg-[var(--accent-bg)]
                            transition-colors
                            shadow-sm
                        "
                    >
                        ← Back to List
                    </button>

                </div>

            )}


            <main
                className={`
                    max-w-3xl
                    mx-auto
                    ${
                        !onBack
                            ? 'mt-10 px-6 md:px-0'
                            : ''
                    }
                `}
            >


                {/* =========================
                    ARTICLE
                ========================= */}

                <article>

                    <h1
                        className="
                            text-4xl
                            md:text-5xl
                            font-bold
                            leading-tight
                            text-[var(--text-h)]
                            mb-6
                            font-serif
                        "
                    >
                        {article.title}
                    </h1>


                    <div
                        className="
                            text-base
                            text-[var(--text)]
                            border-b-2
                            border-[var(--border)]
                            pb-5
                            mb-6
                            italic
                        "
                    >

                        Written by{' '}

                        <strong
                            className="
                                text-[var(--text-h)]
                            "
                        >
                            {article.author}
                        </strong>

                        {' | Status: '}

                        <span
                            className="
                                uppercase
                                tracking-wide
                                text-xs
                                font-bold
                                px-2
                                py-1
                                bg-[var(--code-bg)]
                                rounded
                                border
                                border-[var(--border)]
                                ml-1
                                not-italic
                            "
                        >
                            {article.status}
                        </span>

                    </div>


                    {/* =========================
                        ARTICLE STATS
                    ========================= */}

                    <div
                        className="
                            flex
                            flex-wrap
                            items-center
                            gap-6
                            mb-8
                            text-sm
                            text-[var(--text)]
                            font-sans
                        "
                    >

                        {/* VIEWS */}

                        <div
                            className="
                                flex
                                items-center
                                gap-2
                            "
                        >

                            <span className="text-lg">
                                👁️
                            </span>

                            <span
                                className="
                                    font-semibold
                                "
                            >
                                {article.viewCount || 0}
                            </span>

                            <span>
                                {
                                    article.viewCount === 1
                                        ? 'view'
                                        : 'views'
                                }
                            </span>

                        </div>


                        {/* LIKES */}

                        <button
                            onClick={handleLike}
                            disabled={likeLoading}
                            className={`
                                flex
                                items-center
                                gap-2
                                font-semibold
                                transition-all
                                ${
                                    liked
                                        ? 'text-red-500'
                                        : 'text-[var(--text)] hover:text-red-500'
                                }
                                ${
                                    likeLoading
                                        ? 'opacity-50 cursor-not-allowed'
                                        : 'cursor-pointer'
                                }
                            `}
                        >

                            <span className="text-xl">

                                {liked
                                    ? '❤️'
                                    : '♡'}

                            </span>

                            <span>

                                {likeCount}{' '}

                                {
                                    likeCount === 1
                                        ? 'like'
                                        : 'likes'
                                }

                            </span>

                        </button>

                    </div>


                    {/* =========================
                        ARTICLE CONTENT
                    ========================= */}

                    <div
                        className="
                            text-lg
                            md:text-xl
                            leading-relaxed
                            text-[var(--text-h)]
                            whitespace-pre-wrap
                            font-serif
                        "
                    >
                        {article.content}
                    </div>

                </article>


                {/* =========================
                    COMMENTS
                ========================= */}

                <section
                    className="
                        mt-16
                        border-t
                        border-[var(--border)]
                        pt-10
                        font-sans
                    "
                >

                    <h3
                        className="
                            text-2xl
                            font-bold
                            mb-6
                            text-[var(--text-h)]
                        "
                    >
                        Discussion ({comments.length})
                    </h3>


                    {/* POST COMMENT */}

                    <div
                        className="
                            bg-[var(--code-bg)]
                            p-6
                            rounded-xl
                            mb-10
                            border
                            border-[var(--border)]
                            shadow-sm
                        "
                    >

                        <form
                            onSubmit={
                                handlePostComment
                            }
                            className="
                                flex
                                flex-col
                                gap-4
                            "
                        >

                            <textarea
                                value={newComment}
                                onChange={
                                    e =>
                                        setNewComment(
                                            e.target.value
                                        )
                                }
                                placeholder="Share your thoughts on this story..."
                                required
                                className="
                                    w-full
                                    p-4
                                    rounded-lg
                                    border
                                    border-[var(--border)]
                                    bg-[var(--bg)]
                                    text-[var(--text-h)]
                                    min-h-[120px]
                                    text-base
                                    focus:ring-2
                                    focus:ring-[var(--accent)]
                                    outline-none
                                    transition-all
                                    resize-y
                                "
                            />


                            <div
                                className="
                                    flex
                                    justify-end
                                "
                            >

                                <button
                                    type="submit"
                                    className="
                                        px-6
                                        py-2.5
                                        bg-[var(--accent)]
                                        text-white
                                        font-bold
                                        rounded-lg
                                        hover:opacity-90
                                        transition-opacity
                                        shadow-sm
                                    "
                                >
                                    Post Comment
                                </button>

                            </div>

                        </form>

                    </div>


                    {/* COMMENTS LIST */}

                    <div
                        className="
                            flex
                            flex-col
                            gap-5
                        "
                    >

                        {comments.length === 0 ? (

                            <p
                                className="
                                    text-[var(--text)]
                                    italic
                                    text-center
                                    py-8
                                "
                            >
                                No comments yet. Be the first
                                to start the conversation!
                            </p>

                        ) : (

                            comments.map(
                                (
                                    comment,
                                    index
                                ) => (

                                    <div
                                        key={
                                            comment.id ||
                                            index
                                        }
                                        className="
                                            p-6
                                            border
                                            border-[var(--border)]
                                            rounded-xl
                                            bg-[var(--bg)]
                                            shadow-sm
                                            hover:border-[var(--accent-border)]
                                            transition-colors
                                            relative
                                        "
                                    >

                                        <div
                                            className="
                                                flex
                                                justify-between
                                                items-start
                                                mb-3
                                            "
                                        >

                                            <div
                                                className="
                                                    font-bold
                                                    text-[var(--accent)]
                                                    text-lg
                                                "
                                            >
                                                {
                                                    comment.authorUsername ||
                                                    'Anonymous'
                                                }
                                            </div>


                                            {/* ADMIN DELETE */}

                                            {userRole ===
                                                'ROLE_ADMIN' &&
                                                comment.id && (

                                                    <button
                                                        onClick={() =>
                                                            setCommentToDelete(
                                                                comment.id!
                                                            )
                                                        }
                                                        className="
                                                            text-xs
                                                            font-bold
                                                            text-red-600
                                                            bg-red-100
                                                            hover:bg-red-200
                                                            dark:text-red-400
                                                            dark:bg-red-900/30
                                                            dark:hover:bg-red-900/50
                                                            px-3
                                                            py-1.5
                                                            rounded
                                                            transition-colors
                                                        "
                                                    >
                                                        🗑 Delete
                                                    </button>

                                                )}

                                        </div>


                                        <div
                                            className="
                                                text-[var(--text-h)]
                                                leading-relaxed
                                                text-base
                                            "
                                        >
                                            {comment.content}
                                        </div>

                                    </div>

                                )
                            )

                        )}

                    </div>

                </section>

            </main>


            {/* =========================
                DELETE COMMENT MODAL
            ========================= */}

            {commentToDelete && (

                <div
                    className="
                        fixed
                        inset-0
                        bg-black/50
                        flex
                        items-center
                        justify-center
                        z-50
                    "
                >

                    <div
                        className="
                            bg-[var(--code-bg)]
                            p-6
                            rounded-xl
                            shadow-xl
                            max-w-md
                            w-full
                            mx-4
                            border
                            border-[var(--border)]
                        "
                    >

                        <h3
                            className="
                                text-xl
                                font-bold
                                text-[var(--text-h)]
                                mb-2
                            "
                        >
                            Delete Comment
                        </h3>


                        <p
                            className="
                                text-[var(--text)]
                                mb-6
                                opacity-90
                            "
                        >
                            Admin Action: Are you sure you
                            want to permanently delete this
                            comment?
                        </p>


                        <div
                            className="
                                flex
                                justify-end
                                gap-3
                            "
                        >

                            <button
                                onClick={() =>
                                    setCommentToDelete(
                                        null
                                    )
                                }
                                className="
                                    px-4
                                    py-2
                                    rounded-lg
                                    font-semibold
                                    bg-[var(--bg)]
                                    border
                                    border-[var(--border)]
                                    hover:bg-gray-100
                                    dark:hover:bg-gray-800
                                    transition-colors
                                "
                            >
                                Cancel
                            </button>


                            <button
                                onClick={
                                    confirmDeleteComment
                                }
                                className="
                                    px-4
                                    py-2
                                    rounded-lg
                                    font-semibold
                                    bg-red-600
                                    text-white
                                    hover:bg-red-700
                                    transition-colors
                                    shadow-sm
                                "
                            >
                                Delete Permanently
                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
};


export default FullArticle;
