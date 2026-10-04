
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';

import {
    userService,
    type UserProfile
} from '../services/userService';

import { authService } from '../services/authService';

import {
    articleService,
    type Article
} from '../services/articleService';


const UserProfilePage: React.FC = () => {

    const navigate = useNavigate();


    // =========================
    // PROFILE STATE
    // =========================

    const [profile, setProfile] =
        useState<UserProfile | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);


    // =========================
    // PROFILE FORM
    // =========================

    const [firstName, setFirstName] =
        useState('');

    const [lastName, setLastName] =
        useState('');

    const [bio, setBio] =
        useState('');


    // =========================
    // LIKED ARTICLES
    // =========================

    const [likedArticles, setLikedArticles] =
        useState<Article[]>([]);

    const [likedArticlesLoading, setLikedArticlesLoading] =
        useState(true);


    // =========================
    // INITIAL LOAD
    // =========================

    useEffect(() => {

        if (!authService.isAuthenticated()) {
            navigate('/login');
            return;
        }

        const token =
            localStorage.getItem('token');

        if (!token) {
            navigate('/login');
            return;
        }

        try {

            const payload = JSON.parse(
                atob(
                    token
                        .split('.')[1]
                        .replace(/-/g, '+')
                        .replace(/_/g, '/')
                )
            );

            const username =
                payload.sub;

            if (!username) {
                throw new Error(
                    'Username not found in token.'
                );
            }

            fetchProfile(username);
            fetchLikedArticles();

        } catch (error) {

            console.error(
                'Error decoding token:',
                error
            );

            toast.error(
                'Your session is invalid. Please log in again.'
            );

            authService.logout();

            navigate('/login');
        }

    }, [navigate]);


    // =========================
    // FETCH PROFILE
    // =========================

    const fetchProfile = async (
        username: string
    ) => {

        try {

            setLoading(true);

            const data =
                await userService.getProfile(
                    username
                );

            setProfile(data);

            setFirstName(
                data.firstName || ''
            );

            setLastName(
                data.lastName || ''
            );

            setBio(
                data.bio || ''
            );

        } catch (error: any) {

            console.error(
                'Failed to fetch profile:',
                error.response?.status,
                error.response?.data ||
                    error.message
            );

            toast.error(
                'Unable to load your profile. Please try again.'
            );

        } finally {

            setLoading(false);

        }
    };


    // =========================
    // FETCH LIKED ARTICLES
    // =========================

    const fetchLikedArticles = async () => {

        try {

            setLikedArticlesLoading(true);

            const articles =
                await articleService.getLikedArticles();

            setLikedArticles(articles);

        } catch (error) {

            console.error(
                'Failed to fetch liked articles:',
                error
            );

            toast.error(
                'Unable to load liked articles.'
            );

        } finally {

            setLikedArticlesLoading(false);

        }
    };


    // =========================
    // SAVE PROFILE
    // =========================

    const handleSave = async (
        e: React.FormEvent
    ) => {

        e.preventDefault();

        setSaving(true);

        const toastId =
            toast.loading(
                'Saving profile...'
            );

        try {

            await userService.updateProfile({
                firstName,
                lastName,
                bio
            });

            toast.success(
                'Profile updated successfully!',
                {
                    id: toastId
                }
            );

        } catch (error) {

            console.error(
                'Failed to update profile:',
                error
            );

            toast.error(
                'Failed to update profile.',
                {
                    id: toastId
                }
            );

        } finally {

            setSaving(false);

        }
    };


    // =========================
    // LOGOUT
    // =========================

    const handleLogout = () => {

        authService.logout();

        navigate('/login');

    };


    // =========================
    // LOADING
    // =========================

    if (loading) {

        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--text)]">

                <div className="text-xl animate-pulse font-sans">
                    Loading Profile...
                </div>

            </div>
        );
    }


    // =========================
    // PROFILE NOT FOUND
    // =========================

    if (!profile) {

        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--text)]">

                <div className="text-center p-8 bg-[var(--code-bg)] border border-[var(--border)] rounded-xl shadow-sm">

                    <h2 className="text-xl font-bold text-[var(--text-h)] mb-2">
                        Profile could not be loaded
                    </h2>

                    <p className="mb-5">
                        Please try again or return to the news feed.
                    </p>

                    <button
                        onClick={() =>
                            navigate('/articles')
                        }
                        className="px-4 py-2 bg-[var(--accent)] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
                    >
                        Back to News
                    </button>

                </div>

            </div>
        );
    }


    return (

        <div className="min-h-screen bg-[var(--bg)] font-sans text-[var(--text)] pb-12">

            <Toaster
                position="top-right"
                reverseOrder={false}
            />


            {/* =========================
                HEADER
            ========================= */}

            <header className="px-6 py-5 md:px-10 border-b border-[var(--border)] flex justify-between items-center sticky top-0 bg-[var(--code-bg)] z-10 shadow-sm">

                <h2
                    className="m-0 text-xl font-bold text-[var(--text-h)] cursor-pointer hover:text-[var(--accent)] transition-colors tracking-wide"
                    onClick={() =>
                        navigate('/articles')
                    }
                >
                    The Daily Chronicle
                </h2>


                <div className="flex gap-3">

                    <button
                        onClick={() =>
                            navigate('/articles')
                        }
                        className="px-4 py-2 bg-transparent text-[var(--text-h)] border border-[var(--border)] rounded-lg hover:bg-[var(--accent-bg)] transition-colors font-medium"
                    >
                        Back to News
                    </button>

                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 bg-transparent text-[var(--text-h)] border border-[var(--border)] rounded-lg hover:bg-[var(--accent-bg)] transition-colors font-medium"
                    >
                        Sign Out
                    </button>

                </div>

            </header>


            {/* =========================
                MAIN
            ========================= */}

            <main className="max-w-5xl mx-auto my-10 px-6">


                {/* =========================
                    PROFILE CARD
                ========================= */}

                <div className="bg-[var(--code-bg)] p-8 md:p-10 rounded-xl border border-[var(--border)] shadow-[var(--shadow)]">

                    <div className="mb-8 border-b border-[var(--border)] pb-8 text-center sm:text-left">

                        <h1 className="m-0 mb-1 text-3xl font-bold text-[var(--text-h)] tracking-tight">
                            {profile.username}
                        </h1>

                        <div className="text-[var(--text)] font-medium text-lg">
                            {profile.email}
                        </div>

                    </div>


                    {/* PROFILE FORM */}

                    <form
                        onSubmit={handleSave}
                        className="flex flex-col gap-6"
                    >

                        <div className="flex flex-col sm:flex-row gap-6">


                            {/* FIRST NAME */}

                            <div className="flex-1">

                                <label className="block mb-2 font-semibold text-[var(--text-h)] text-sm">
                                    First Name
                                </label>

                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={(e) =>
                                        setFirstName(
                                            e.target.value
                                        )
                                    }
                                    className="w-full p-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text-h)] focus:ring-2 focus:ring-[var(--accent)] outline-none transition-all"
                                />

                            </div>


                            {/* LAST NAME */}

                            <div className="flex-1">

                                <label className="block mb-2 font-semibold text-[var(--text-h)] text-sm">
                                    Last Name
                                </label>

                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={(e) =>
                                        setLastName(
                                            e.target.value
                                        )
                                    }
                                    className="w-full p-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text-h)] focus:ring-2 focus:ring-[var(--accent)] outline-none transition-all"
                                />

                            </div>

                        </div>


                        {/* BIO */}

                        <div>

                            <label className="block mb-2 font-semibold text-[var(--text-h)] text-sm">
                                About Me (Bio)
                            </label>

                            <textarea
                                value={bio}
                                onChange={(e) =>
                                    setBio(
                                        e.target.value
                                    )
                                }
                                rows={4}
                                placeholder="Tell the community about yourself..."
                                className="w-full p-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text-h)] focus:ring-2 focus:ring-[var(--accent)] outline-none transition-all resize-y"
                            />

                        </div>


                        {/* SAVE */}

                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full mt-4 py-3 px-4 bg-[var(--accent)] text-white font-bold rounded-lg shadow-md transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving
                                ? 'Saving...'
                                : 'Save Profile Changes'}
                        </button>

                    </form>

                </div>


                {/* =========================
                    LIKED ARTICLES
                ========================= */}

                <section className="mt-10">

                    <div className="flex items-center justify-between mb-6">

                        <div>

                            <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-h)]">
                                Liked Articles
                            </h2>

                            <p className="text-[var(--text)] mt-1">
                                Articles you have saved by liking them.
                            </p>

                        </div>

                        <div className="text-sm font-semibold text-[var(--accent)] bg-[var(--accent-bg)] px-3 py-2 rounded-lg">
                            ❤️ {likedArticles.length}
                        </div>

                    </div>


                    {/* LOADING */}

                    {likedArticlesLoading ? (

                        <div className="bg-[var(--code-bg)] p-10 rounded-xl border border-[var(--border)] text-center">

                            <div className="text-[var(--text)] animate-pulse">
                                Loading liked articles...
                            </div>

                        </div>

                    ) : likedArticles.length === 0 ? (

                        /* EMPTY STATE */

                        <div className="bg-[var(--code-bg)] p-10 rounded-xl border border-[var(--border)] text-center">

                            <div className="text-4xl mb-4">
                                ❤️
                            </div>

                            <h3 className="text-xl font-bold text-[var(--text-h)] mb-2">
                                No liked articles yet
                            </h3>

                            <p className="text-[var(--text)] mb-6">
                                When you like an article, it will appear here.
                            </p>

                            <button
                                onClick={() =>
                                    navigate('/articles')
                                }
                                className="px-5 py-2.5 bg-[var(--accent)] text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
                            >
                                Browse News
                            </button>

                        </div>

                    ) : (

                        /* ARTICLES */

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {likedArticles.map(
                                (article) => (

                                    <article
                                        key={article.id}
                                        className="bg-[var(--code-bg)] rounded-xl border border-[var(--border)] shadow-sm hover:shadow-lg transition-shadow overflow-hidden flex flex-col"
                                    >

                                        <div className="p-6 flex-1">

                                            <div className="flex items-center justify-between gap-3 mb-3">

                                                <span className="text-xs font-bold uppercase tracking-widest text-[var(--accent)]">
                                                    Article
                                                </span>

                                                <span className="text-red-500 text-lg">
                                                    ❤️
                                                </span>

                                            </div>


                                            <h3 className="text-xl md:text-2xl font-bold text-[var(--text-h)] leading-snug mb-3">
                                                {article.title}
                                            </h3>


                                            <p className="text-sm text-[var(--text)] italic mb-4">
                                                By{' '}
                                                <span className="font-semibold">
                                                    {article.author}
                                                </span>
                                            </p>


                                            <p className="text-[var(--text-h)] leading-relaxed">

                                                {article.content.length > 160
                                                    ? article.content.substring(
                                                          0,
                                                          160
                                                      ) + '...'
                                                    : article.content}

                                            </p>

                                        </div>


                                        {/* FOOTER */}

                                        <div className="p-4 bg-[var(--bg)] border-t border-[var(--border)] flex justify-between items-center">

                                            <span className="text-sm text-[var(--text)]">
                                                👁️{' '}
                                                {article.viewCount || 0}{' '}
                                                views
                                            </span>


                                            <button
                                                onClick={() =>
                                                    navigate(
                                                        `/article/${article.id}`
                                                    )
                                                }
                                                className="px-4 py-2 bg-[var(--accent)] text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
                                            >
                                                Read Article →
                                            </button>

                                        </div>

                                    </article>

                                )
                            )}

                        </div>

                    )}

                </section>

            </main>

        </div>
    );
};

export default UserProfilePage;
