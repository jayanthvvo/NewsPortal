import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[var(--bg)] font-sans selection:bg-[var(--accent)] selection:text-white flex flex-col animate-in fade-in duration-700">
            
            {/* --- TOP NAVIGATION --- */}
            <nav className="w-full px-6 py-6 sm:px-12 flex justify-between items-center border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-md sticky top-0 z-50">
                <div className="text-2xl font-extrabold tracking-tighter text-[var(--text-h)] flex items-center gap-2">
                    <span className="bg-[var(--accent)] text-white w-8 h-8 flex items-center justify-center rounded-lg">N</span>
                    NewsPortal
                </div>
                <div className="flex gap-4">
                    <button 
                        onClick={() => navigate('/login')}
                        className="px-5 py-2.5 text-sm font-semibold text-[var(--text-h)] hover:bg-[var(--code-bg)] rounded-xl transition-colors"
                    >
                        Sign In
                    </button>
                    <button 
                        onClick={() => navigate('/register')}
                        className="px-5 py-2.5 text-sm font-semibold bg-[var(--accent)] text-white rounded-xl hover:opacity-90 shadow-sm transition-opacity"
                    >
                        Get Started
                    </button>
                </div>
            </nav>

            {/* --- HERO SECTION --- */}
            <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 sm:py-32 relative overflow-hidden">
                
                {/* Decorative Background Blob */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--accent-bg)] rounded-full blur-3xl opacity-50 -z-10"></div>

                <span className="inline-block px-4 py-1.5 mb-6 text-sm font-bold tracking-widest uppercase bg-[var(--code-bg)] text-[var(--text-h)] rounded-full border border-[var(--border)] shadow-sm">
                    ✨ The New Standard in Journalism
                </span>
                
                <h1 className="text-5xl sm:text-7xl font-extrabold text-[var(--text-h)] max-w-4xl leading-[1.1] mb-8 tracking-tight">
                    Stay ahead of the curve with <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-500 to-gray-900 dark:from-gray-100 dark:to-gray-400">trusted reporting.</span>
                </h1>
                
                <p className="text-lg sm:text-xl text-[var(--text)] max-w-2xl mb-12 leading-relaxed">
                    Discover breaking news, deep-dive editorials, and real-time alerts tailored to your interests. Join thousands of readers who start their day with NewsPortal.
                </p>
                
                
            </main>

            {/* --- FEATURES SECTION --- */}
            <section className="bg-[var(--code-bg)] border-y border-[var(--border)] py-20 px-6 sm:px-12">
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        { title: "Real-Time Alerts", desc: "Get instant email notifications for breaking news the second it happens." },
                        { title: "Curated Categories", desc: "From Tech to Politics, filter the noise and read exactly what matters to you." },
                        { title: "Active Community", desc: "Join the discussion. Engage with authors and readers in our comment sections." }
                    ].map((feature, i) => (
                        <div key={i} className="bg-[var(--bg)] p-8 rounded-3xl border border-[var(--border)] shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 bg-[var(--accent-bg)] rounded-2xl mb-6 flex items-center justify-center text-xl">
                                💡
                            </div>
                            <h3 className="text-2xl font-bold text-[var(--text-h)] mb-3">{feature.title}</h3>
                            <p className="text-[var(--text)] leading-relaxed">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* --- FOOTER --- */}
            <footer className="py-10 text-center text-[var(--text)] border-t border-[var(--border)] bg-[var(--bg)]">
                <p className="font-medium">© {new Date().getFullYear()} NewsPortal. All rights reserved.</p>
            </footer>

        </div>
    );
};

export default LandingPage;


