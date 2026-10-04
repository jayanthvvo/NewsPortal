import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import {
    articleService,
    type Article
} from '../services/articleService';

import {
    categoryService,
    type Category
} from '../services/categoryService';

import { authService } from '../services/authService';

import FullArticle from './FullArticle';


const ARTICLES_PER_PAGE = 10;


const ArticlesDashboard: React.FC = () => {

    // =========================
    // ARTICLES
    // =========================

    const [articles, setArticles] =
        useState<Article[]>([]);

    const [categories, setCategories] =
        useState<Category[]>([]);


    // =========================
    // LOADING
    // =========================

    const [loading, setLoading] =
        useState(true);


    // =========================
    // SEARCH
    // =========================

    const [searchQuery, setSearchQuery] =
        useState('');

    const [authorSearch, setAuthorSearch] =
        useState('');


    // =========================
    // ARTICLE VIEW
    // =========================

    const [viewingArticleId, setViewingArticleId] =
        useState<number | null>(null);


    // =========================
    // PAGINATION
    // =========================

    const [currentPage, setCurrentPage] =
        useState(0);

    const [totalPages, setTotalPages] =
        useState(0);

    const [totalElements, setTotalElements] =
        useState(0);


    const navigate = useNavigate();

    const role = authService.getRole();


    // =========================
    // AUTH + INITIAL DATA
    // =========================

    useEffect(() => {

        if (!authService.isAuthenticated()) {

            navigate('/login');

            return;
        }

        fetchData(0);

    }, [navigate]);


    // =========================
    // FETCH PAGINATED ARTICLES
    // =========================

    const fetchData = async (
        page: number
    ) => {

        try {

            setLoading(true);


            const [
                articlesData,
                categoriesData
            ] = await Promise.all([

                articleService.getAllPublishedArticles(
                    page,
                    ARTICLES_PER_PAGE
                ),

                categoryService.getAllCategories()

            ]);


            setArticles(
                articlesData.content
            );


            setCurrentPage(
                articlesData.number
            );


            setTotalPages(
                articlesData.totalPages
            );


            setTotalElements(
                articlesData.totalElements
            );


            setCategories(
                categoriesData
            );


        } catch (error) {

            console.error(
                'Error fetching data',
                error
            );

            toast.error(
                'Unable to load articles. Please try again.'
            );

        } finally {

            setLoading(false);

        }
    };


    // =========================
    // PAGE CHANGE
    // =========================

    const handlePageChange = (
        page: number
    ) => {

        if (
            page < 0 ||
            page >= totalPages
        ) {
            return;
        }


        setSearchQuery('');

        fetchData(page);


        // Scroll back to top
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };


    // =========================
    // AUTHOR SEARCH
    // =========================

    const handleAuthorSearch = async () => {

        try {

            setLoading(true);


            // If author search is cleared,
            // return to normal pagination.
            if (!authorSearch.trim()) {

                setCurrentPage(0);

                await fetchData(0);

                return;
            }


            const articlesByAuthor =
                await articleService.getArticlesByAuthor(
                    authorSearch.trim()
                );


            setArticles(
                articlesByAuthor
            );


            // Author endpoint currently
            // returns List<Article>, not Page.
            setTotalPages(0);

            setTotalElements(
                articlesByAuthor.length
            );


        } catch (error) {

            console.error(
                'Error fetching articles by author',
                error
            );

            toast.error(
                'Unable to search articles by author.'
            );

        } finally {

            setLoading(false);

        }
    };


    // =========================
    // CATEGORY NAME
    // =========================

    const getCategoryName = (
        id: number
    ) => {

        const category =
            categories.find(
                c => c.id === id
            );


        return category
            ? category.name
            : 'Breaking News';
    };


    // =========================
    // LOGOUT
    // =========================

    const handleLogout = () => {

        authService.logout();

        navigate('/login');
    };


    // =========================
    // LOCAL SEARCH
    // =========================

    const filteredArticles =
        articles.filter(article => {

            const lowerCaseQuery =
                searchQuery.toLowerCase();


            return (

                article.title
                    .toLowerCase()
                    .includes(lowerCaseQuery)

                ||

                article.content
                    .toLowerCase()
                    .includes(lowerCaseQuery)

                ||

                article.author
                    .toLowerCase()
                    .includes(lowerCaseQuery)

            );
        });


    // =========================
    // PAGE NUMBERS
    // =========================

    const getPageNumbers = () => {

        const pages: number[] = [];

        for (
            let i = 0;
            i < totalPages;
            i++
        ) {

            pages.push(i);

        }

        return pages;
    };


    return (

        <div
            className="
                min-h-screen
                bg-[var(--bg)]
                text-[var(--text)]
                font-serif
            "
        >

            {/* =========================
                TOP NAVBAR
            ========================= */}

            <header
                className="
                    sticky
                    top-0
                    z-10
                    bg-[var(--code-bg)]
                    border-b
                    border-[var(--border)]
                    px-6
                    py-4
                    md:px-10
                    flex
                    justify-between
                    items-center
                    shadow-sm
                "
            >

                <div
                    className="
                        flex
                        items-baseline
                        gap-3
                    "
                >

                    <h1
                        className="
                            m-0
                            text-2xl
                            md:text-3xl
                            tracking-wide
                            font-bold
                            text-[var(--text-h)]
                        "
                    >
                        NewsPortal
                    </h1>


                    <span
                        className="
                            hidden
                            sm:inline
                            text-sm
                            font-sans
                            opacity-70
                        "
                    >
                        Your trusted news source
                    </span>

                </div>


                <div
                    className="
                        flex
                        gap-4
                        items-center
                        font-sans
                    "
                >

                    {(role === 'ROLE_AUTHOR' ||
                        role === 'ROLE_EDITOR') && (

                        <button
                            onClick={() =>
                                navigate(
                                    role === 'ROLE_EDITOR'
                                        ? '/admin'
                                        : '/author'
                                )
                            }
                            className="
                                px-4
                                py-2
                                bg-blue-500
                                text-white
                                font-bold
                                rounded-lg
                                hover:bg-blue-600
                                transition-colors
                                shadow-sm
                            "
                        >
                            My Workspace
                        </button>

                    )}


                    <button
                        onClick={() =>
                            navigate('/profile')
                        }
                        className="
                            px-4
                            py-2
                            bg-[var(--accent)]
                            text-white
                            font-bold
                            rounded-lg
                            hover:opacity-90
                            transition-opacity
                            shadow-sm
                        "
                    >
                        My Profile
                    </button>


                    <button
                        onClick={handleLogout}
                        className="
                            px-4
                            py-2
                            bg-transparent
                            text-[var(--text-h)]
                            border
                            border-[var(--border)]
                            rounded-lg
                            hover:bg-[var(--accent-bg)]
                            transition-colors
                        "
                    >
                        Sign Out
                    </button>

                </div>

            </header>


            {/* =========================
                MAIN
            ========================= */}

            <main
                className="
                    max-w-6xl
                    mx-auto
                    my-10
                    px-6
                "
            >

                {viewingArticleId ? (

                    <FullArticle
                        articleId={viewingArticleId}
                        onBack={() =>
                            setViewingArticleId(null)
                        }
                    />

                ) : (

                    <>

                        {/* =========================
                            TITLE + SEARCH
                        ========================= */}

                        <div
                            className="
                                flex
                                flex-col
                                md:flex-row
                                justify-between
                                items-start
                                md:items-center
                                border-b-2
                                border-[var(--accent)]
                                pb-3
                                mb-8
                                gap-4
                            "
                        >

                            <div>

                                <h2
                                    className="
                                        m-0
                                        text-3xl
                                        font-bold
                                        text-[var(--text-h)]
                                        whitespace-nowrap
                                    "
                                >
                                    Latest Headlines
                                </h2>


                                {!authorSearch && (
                                    <p
                                        className="
                                            mt-1
                                            text-sm
                                            text-[var(--text)]
                                            font-sans
                                        "
                                    >
                                        Showing{' '}
                                        {articles.length}{' '}
                                        of{' '}
                                        {totalElements}{' '}
                                        articles
                                    </p>
                                )}

                            </div>


                            {/* SEARCH */}

                            <div
                                className="
                                    flex
                                    flex-col
                                    md:flex-row
                                    gap-3
                                    w-full
                                    md:w-auto
                                    font-sans
                                    justify-end
                                "
                            >

                                {/* LOCAL SEARCH */}

                                <input
                                    type="text"
                                    placeholder="🔍 Search titles & content..."
                                    value={searchQuery}
                                    onChange={e =>
                                        setSearchQuery(
                                            e.target.value
                                        )
                                    }
                                    className="
                                        p-2.5
                                        rounded-lg
                                        border
                                        border-[var(--border)]
                                        bg-[var(--code-bg)]
                                        text-[var(--text-h)]
                                        focus:ring-2
                                        focus:ring-[var(--accent)]
                                        outline-none
                                        transition-all
                                        shadow-sm
                                        w-full
                                        md:w-64
                                    "
                                />


                                {/* AUTHOR SEARCH */}

                                <div
                                    className="
                                        flex
                                        gap-2
                                        w-full
                                        md:w-auto
                                    "
                                >

                                    <input
                                        type="text"
                                        placeholder="✍️ Filter by Author..."
                                        value={authorSearch}
                                        onChange={e =>
                                            setAuthorSearch(
                                                e.target.value
                                            )
                                        }
                                        onKeyDown={e => {

                                            if (
                                                e.key ===
                                                'Enter'
                                            ) {

                                                handleAuthorSearch();

                                            }

                                        }}
                                        className="
                                            p-2.5
                                            rounded-lg
                                            border
                                            border-[var(--border)]
                                            bg-[var(--code-bg)]
                                            text-[var(--text-h)]
                                            focus:ring-2
                                            focus:ring-blue-400
                                            outline-none
                                            transition-all
                                            shadow-sm
                                            flex-1
                                            md:w-48
                                        "
                                    />


                                    <button
                                        onClick={
                                            handleAuthorSearch
                                        }
                                        className="
                                            px-4
                                            py-2
                                            bg-gray-700
                                            text-white
                                            font-bold
                                            rounded-lg
                                            hover:bg-gray-800
                                            transition-colors
                                            shadow-sm
                                        "
                                    >
                                        Filter
                                    </button>

                                </div>

                            </div>

                        </div>


                        {/* =========================
                            LOADING
                        ========================= */}

                        {loading ? (

                            <div
                                className="
                                    text-center
                                    py-16
                                    text-xl
                                    text-[var(--text)]
                                    animate-pulse
                                    font-sans
                                "
                            >
                                Loading today's stories...
                            </div>

                        ) : articles.length === 0 ? (

                            <div
                                className="
                                    bg-[var(--code-bg)]
                                    p-10
                                    text-center
                                    rounded-xl
                                    border
                                    border-[var(--border)]
                                    shadow-sm
                                "
                            >

                                <h3
                                    className="
                                        m-0
                                        mb-2
                                        text-xl
                                        font-bold
                                        text-[var(--text-h)]
                                    "
                                >
                                    No stories found.
                                </h3>


                                <p
                                    className="
                                        text-[var(--text)]
                                    "
                                >
                                    We couldn't find any
                                    articles based on your
                                    current filters.
                                </p>

                            </div>

                        ) : filteredArticles.length === 0 ? (

                            <div
                                className="
                                    bg-[var(--code-bg)]
                                    p-10
                                    text-center
                                    rounded-xl
                                    border
                                    border-[var(--border)]
                                    shadow-sm
                                "
                            >

                                <h3
                                    className="
                                        m-0
                                        mb-2
                                        text-xl
                                        font-bold
                                        text-[var(--text-h)]
                                    "
                                >
                                    No results found.
                                </h3>


                                <p
                                    className="
                                        text-[var(--text)]
                                        font-sans
                                    "
                                >
                                    We couldn't find any
                                    articles matching "
                                    {searchQuery}".
                                </p>

                            </div>

                        ) : (

                            <>

                                {/* =========================
                                    ARTICLE GRID
                                ========================= */}

                                <div
                                    className="
                                        grid
                                        grid-cols-1
                                        md:grid-cols-2
                                        lg:grid-cols-3
                                        gap-8
                                    "
                                >

                                    {filteredArticles.map(
                                        article => (

                                            <article
                                                key={
                                                    article.id
                                                }
                                                className="
                                                    bg-[var(--bg)]
                                                    rounded-xl
                                                    overflow-hidden
                                                    shadow-[var(--shadow)]
                                                    border
                                                    border-[var(--border)]
                                                    border-t-4
                                                    border-t-[var(--accent)]
                                                    flex
                                                    flex-col
                                                    hover:shadow-lg
                                                    transition-shadow
                                                "
                                            >

                                                <div
                                                    className="
                                                        p-6
                                                        flex-1
                                                        flex
                                                        flex-col
                                                    "
                                                >

                                                    <div
                                                        className="
                                                            text-[var(--accent)]
                                                            text-xs
                                                            font-bold
                                                            uppercase
                                                            tracking-widest
                                                            mb-3
                                                            font-sans
                                                        "
                                                    >
                                                        {getCategoryName(
                                                            article.categoryId
                                                        )}
                                                    </div>


                                                    <h3
                                                        className="
                                                            m-0
                                                            mb-4
                                                            text-2xl
                                                            leading-snug
                                                            text-[var(--text-h)]
                                                            font-bold
                                                        "
                                                    >
                                                        {
                                                            article.title
                                                        }
                                                    </h3>


                                                    <div
                                                        className="
                                                            text-sm
                                                            text-[var(--text)]
                                                            mb-4
                                                            italic
                                                        "
                                                    >
                                                        By{' '}

                                                        <span
                                                            className="
                                                                font-semibold
                                                            "
                                                        >
                                                            {
                                                                article.author
                                                            }
                                                        </span>
                                                    </div>


                                                    <p
                                                        className="
                                                            text-[var(--text-h)]
                                                            leading-relaxed
                                                            text-base
                                                            m-0
                                                        "
                                                    >
                                                        {
                                                            article.content
                                                                .length >
                                                            150
                                                                ? article.content.substring(
                                                                      0,
                                                                      150
                                                                  ) +
                                                                  '...'
                                                                : article.content
                                                        }
                                                    </p>

                                                </div>


                                                {/* FOOTER */}

                                                <div
                                                    className="
                                                        p-4
                                                        bg-[var(--code-bg)]
                                                        border-t
                                                        border-[var(--border)]
                                                        text-right
                                                        mt-auto
                                                    "
                                                >

                                                    <button
                                                        onClick={() =>
                                                            setViewingArticleId(
                                                                article.id!
                                                            )
                                                        }
                                                        className="
                                                            bg-transparent
                                                            border-none
                                                            text-[var(--accent)]
                                                            font-bold
                                                            cursor-pointer
                                                            font-sans
                                                            text-sm
                                                            hover:underline
                                                        "
                                                    >
                                                        Read Full Story →
                                                    </button>

                                                </div>

                                            </article>

                                        )
                                    )}

                                </div>


                                {/* =========================
                                    PAGINATION
                                ========================= */}

                                {!authorSearch &&
                                    totalPages > 1 && (

                                        <div
                                            className="
                                                mt-12
                                                flex
                                                flex-col
                                                sm:flex-row
                                                items-center
                                                justify-center
                                                gap-3
                                                font-sans
                                            "
                                        >

                                            {/* PREVIOUS */}

                                            <button
                                                onClick={() =>
                                                    handlePageChange(
                                                        currentPage -
                                                            1
                                                    )
                                                }
                                                disabled={
                                                    currentPage ===
                                                    0
                                                }
                                                className="
                                                    px-4
                                                    py-2
                                                    rounded-lg
                                                    border
                                                    border-[var(--border)]
                                                    bg-[var(--code-bg)]
                                                    text-[var(--text-h)]
                                                    font-semibold
                                                    disabled:opacity-40
                                                    disabled:cursor-not-allowed
                                                    hover:bg-[var(--accent-bg)]
                                                    transition-colors
                                                "
                                            >
                                                ← Previous
                                            </button>


                                            {/* PAGE NUMBERS */}

                                            <div
                                                className="
                                                    flex
                                                    items-center
                                                    gap-2
                                                    flex-wrap
                                                    justify-center
                                                "
                                            >

                                                {getPageNumbers().map(
                                                    page => (

                                                        <button
                                                            key={
                                                                page
                                                            }
                                                            onClick={() =>
                                                                handlePageChange(
                                                                    page
                                                                )
                                                            }
                                                            className={`
                                                                min-w-[40px]
                                                                px-3
                                                                py-2
                                                                rounded-lg
                                                                border
                                                                font-semibold
                                                                transition-colors

                                                                ${
                                                                    currentPage ===
                                                                    page
                                                                        ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                                                                        : 'bg-[var(--code-bg)] text-[var(--text-h)] border-[var(--border)] hover:bg-[var(--accent-bg)]'
                                                                }
                                                            `}
                                                        >
                                                            {page +
                                                                1}
                                                        </button>

                                                    )
                                                )}

                                            </div>


                                            {/* NEXT */}

                                            <button
                                                onClick={() =>
                                                    handlePageChange(
                                                        currentPage +
                                                            1
                                                    )
                                                }
                                                disabled={
                                                    currentPage ===
                                                    totalPages - 1
                                                }
                                                className="
                                                    px-4
                                                    py-2
                                                    rounded-lg
                                                    border
                                                    border-[var(--border)]
                                                    bg-[var(--code-bg)]
                                                    text-[var(--text-h)]
                                                    font-semibold
                                                    disabled:opacity-40
                                                    disabled:cursor-not-allowed
                                                    hover:bg-[var(--accent-bg)]
                                                    transition-colors
                                                "
                                            >
                                                Next →
                                            </button>

                                        </div>

                                    )}

                            </>

                        )}

                    </>

                )}

            </main>

        </div>
    );
};


export default ArticlesDashboard;