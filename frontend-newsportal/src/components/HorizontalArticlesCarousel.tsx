import React, { useRef, useState, useMemo } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    Eye,
    Heart,
    Clock,
    TrendingUp,
    Sparkles,
    Calendar,
    Layers,
    ArrowUpRight
} from 'lucide-react';
import { type Article } from '../services/articleService';
import { type Category } from '../services/categoryService';

interface HorizontalArticlesCarouselProps {
    articles: Article[];
    categories?: Category[];
    onSelectArticle: (articleId: number) => void;
    title?: string;
    description?: string;
}

type TabType = 'viewed' | 'liked' | 'recent' | 'all';

interface ShelfConfig {
    key: 'viewed' | 'liked' | 'recent';
    label: string;
    icon: React.ReactNode;
    subtitle: string;
    items: Article[];
}

export const HorizontalArticlesCarousel: React.FC<HorizontalArticlesCarouselProps> = ({
    articles,
    categories = [],
    onSelectArticle,
    title = 'Curated Highlights',
    description = 'Discover top-ranked reporting, reader favorites, and breaking publications'
}) => {
    const [activeTab, setActiveTab] = useState<TabType>('viewed');

    // Helper: calculate reading time
    const calculateReadTime = (content?: string) => {
        if (!content) return '1 min read';
        const words = content.trim().split(/\s+/).length;
        return `${Math.max(1, Math.ceil(words / 180))} min read`;
    };

    // Helper: category lookup
    const getCategoryName = (catId?: number) => {
        if (!catId) return 'General';
        const found = categories.find(c => c.id === catId);
        return found ? found.name : 'General';
    };

    // Sort 1: Most Viewed
    const mostViewedArticles = useMemo(() => {
        return [...articles].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
    }, [articles]);

    // Sort 2: Most Liked
    const mostLikedArticles = useMemo(() => {
        return [...articles].sort((a, b) => {
            const likesB = b.likeCount ?? ((b.viewCount || 0) > 0 ? Math.floor((b.viewCount || 0) * 0.4) : 0);
            const likesA = a.likeCount ?? ((a.viewCount || 0) > 0 ? Math.floor((a.viewCount || 0) * 0.4) : 0);
            if (likesB !== likesA) return likesB - likesA;
            return (b.id || 0) - (a.id || 0);
        });
    }, [articles]);

    // Sort 3: Most Recent
    const mostRecentArticles = useMemo(() => {
        return [...articles].sort((a, b) => {
            if (a.createdAt && b.createdAt) {
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
            return (b.id || 0) - (a.id || 0);
        });
    }, [articles]);

    // Format relative date or display
    const formatArticleDate = (createdAt?: string, id?: number) => {
        if (createdAt) {
            try {
                const date = new Date(createdAt);
                if (!isNaN(date.getTime())) {
                    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                }
            } catch {
                // fallback
            }
        }
        return `Story #${id || 1}`;
    };

    // Shelf configs
    const shelves: ShelfConfig[] = useMemo(() => [
        {
            key: 'viewed',
            label: 'Most Viewed',
            icon: <TrendingUp className="w-4 h-4 text-slate-800 dark:text-zinc-200" />,
            subtitle: 'Ranked by reader traffic & high engagement',
            items: mostViewedArticles
        },
        {
            key: 'liked',
            label: 'Most Liked',
            icon: <Heart className="w-4 h-4 text-rose-500 fill-current" />,
            subtitle: 'Highest audience praise and reader appreciation',
            items: mostLikedArticles
        },
        {
            key: 'recent',
            label: 'Most Recent',
            icon: <Sparkles className="w-4 h-4 text-amber-500" />,
            subtitle: 'Freshest perspectives and newly published headlines',
            items: mostRecentArticles
        }
    ], [mostViewedArticles, mostLikedArticles, mostRecentArticles]);

    // If no articles exist, don't render empty carousel
    if (!articles || articles.length === 0) {
        return null;
    }

    return (
        <section className="mb-10 p-5 sm:p-7 bg-white/80 dark:bg-[#0d0d0f] rounded-2xl border border-slate-200/80 dark:border-neutral-800/80 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.04)]">
            {/* Top Carousel Navigation Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200/80 dark:border-neutral-800/80">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-900 text-white dark:bg-zinc-800 dark:text-zinc-200 border border-slate-700 dark:border-zinc-700">
                            <Layers className="w-3 h-3" />
                            Curated Feed
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-500 dark:text-neutral-400 font-medium">
                            {articles.length} Published {articles.length === 1 ? 'Story' : 'Stories'}
                        </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight m-0">
                        {title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-0.5">
                        {description}
                    </p>
                </div>

                {/* Interactive Filter Pills */}
                <div className="flex flex-wrap items-center gap-2">
                    {shelves.map(shelf => {
                        const isActive = activeTab === shelf.key;
                        return (
                            <button
                                key={shelf.key}
                                onClick={() => setActiveTab(shelf.key)}
                                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                    isActive
                                        ? 'bg-slate-900 text-white dark:bg-white dark:text-black shadow-xs border border-transparent'
                                        : 'bg-white dark:bg-[#151518] text-slate-600 dark:text-neutral-400 border border-slate-200/90 dark:border-neutral-800 hover:bg-slate-100 dark:hover:bg-zinc-800'
                                }`}
                            >
                                {shelf.icon}
                                <span>{shelf.label}</span>
                                <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                                    isActive
                                        ? 'bg-slate-800 text-slate-200 dark:bg-neutral-200 dark:text-neutral-800'
                                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-neutral-400'
                                }`}>
                                    {shelf.items.length}
                                </span>
                            </button>
                        );
                    })}

                    {/* View All Shelves Pill */}
                    <button
                        onClick={() => setActiveTab(activeTab === 'all' ? 'viewed' : 'all')}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            activeTab === 'all'
                                ? 'bg-slate-900 text-white dark:bg-white dark:text-black shadow-xs border border-transparent'
                                : 'bg-white dark:bg-[#151518] text-slate-600 dark:text-neutral-400 border border-slate-200/90 dark:border-neutral-800 hover:bg-slate-100 dark:hover:bg-zinc-800'
                        }`}
                        title="View all 3 collections at once"
                    >
                        <Layers className="w-3.5 h-3.5" />
                        <span>All Collections</span>
                    </button>
                </div>
            </div>

            {/* Carousel Shelves Render */}
            <div className="mt-5 flex flex-col gap-8">
                {shelves
                    .filter(shelf => activeTab === 'all' || activeTab === shelf.key)
                    .map(shelf => (
                        <ShelfRow
                            key={shelf.key}
                            shelf={shelf}
                            getCategoryName={getCategoryName}
                            calculateReadTime={calculateReadTime}
                            formatArticleDate={formatArticleDate}
                            onSelectArticle={onSelectArticle}
                        />
                    ))}
            </div>
        </section>
    );
};

// Subcomponent: Individual Horizontal Shelf with Arrow Controls
interface ShelfRowProps {
    shelf: ShelfConfig;
    getCategoryName: (catId?: number) => string;
    calculateReadTime: (content?: string) => string;
    formatArticleDate: (createdAt?: string, id?: number) => string;
    onSelectArticle: (articleId: number) => void;
}

const ShelfRow: React.FC<ShelfRowProps> = ({
    shelf,
    getCategoryName,
    calculateReadTime,
    formatArticleDate,
    onSelectArticle
}) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const handleScroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollDistance = direction === 'left' ? -340 : 340;
            scrollContainerRef.current.scrollBy({ left: scrollDistance, behavior: 'smooth' });
        }
    };

    return (
        <div>
            {/* Shelf Sub-header */}
            <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-white dark:bg-[#141416] border border-slate-200 dark:border-neutral-800 flex items-center justify-center shadow-2xs">
                        {shelf.icon}
                    </div>
                    <div>
                        <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white m-0">
                            {shelf.label}
                        </h4>
                        <span className="text-[11px] text-slate-500 dark:text-neutral-400 hidden sm:inline">
                            {shelf.subtitle}
                        </span>
                    </div>
                </div>

                {/* Left/Right Arrow Controls */}
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={() => handleScroll('left')}
                        aria-label={`Scroll ${shelf.label} left`}
                        className="w-8 h-8 rounded-xl bg-white dark:bg-[#141416] border border-slate-200/90 dark:border-neutral-800 text-slate-700 dark:text-neutral-200 hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-black active:scale-95 flex items-center justify-center transition-all shadow-2xs cursor-pointer"
                        title="Navigate left"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handleScroll('right')}
                        aria-label={`Scroll ${shelf.label} right`}
                        className="w-8 h-8 rounded-xl bg-white dark:bg-[#141416] border border-slate-200/90 dark:border-neutral-800 text-slate-700 dark:text-neutral-200 hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-black active:scale-95 flex items-center justify-center transition-all shadow-2xs cursor-pointer"
                        title="Navigate right"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Horizontally Scrollable Container (scrollbar removed; left & right buttons navigate) */}
            <div
                ref={scrollContainerRef}
                className="flex items-stretch gap-4 overflow-x-auto pb-2 pt-1 scroll-smooth snap-x no-scrollbar focus:outline-none"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {shelf.items.map((article, index) => {
                    const rank = index + 1;
                    const catName = getCategoryName(article.categoryId);
                    const readTime = calculateReadTime(article.content);
                    const authorInitial = (article.author || 'A').charAt(0).toUpperCase();
                    const computedLikes = article.likeCount ?? ((article.viewCount || 0) > 0 ? Math.floor((article.viewCount || 0) * 0.4) : 0);

                    // Rank badge style
                    const isTop1 = rank === 1;
                    const isTop2 = rank === 2;
                    const isTop3 = rank === 3;

                    return (
                        <div
                            key={`${shelf.key}-${article.id || index}`}
                            onClick={() => article.id && onSelectArticle(article.id)}
                            className="w-72 sm:w-80 shrink-0 snap-start bg-white dark:bg-[#111113] rounded-2xl border border-slate-200/80 dark:border-neutral-800 p-5 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.05),0_1px_3px_-1px_rgba(15,23,42,0.03)] hover:shadow-[0_10px_25px_-5px_rgba(15,23,42,0.09)] hover:border-slate-300 dark:hover:border-zinc-700 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between cursor-pointer group"
                        >
                            <div>
                                {/* Badges Row */}
                                <div className="flex items-center justify-between gap-2 mb-3">
                                    <div className="flex items-center gap-1.5">
                                        {/* Rank Badge */}
                                        <span
                                            className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-[11px] font-black border ${
                                                isTop1
                                                    ? 'bg-slate-900 text-white border-slate-800 dark:bg-zinc-100 dark:text-black dark:border-white shadow-2xs'
                                                    : isTop2
                                                    ? 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700'
                                                    : isTop3
                                                    ? 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-800'
                                                    : 'bg-transparent text-slate-500 border-slate-200 dark:border-neutral-800'
                                            }`}
                                        >
                                            #{rank}
                                        </span>

                                        {/* Category Badge */}
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-neutral-300 border border-slate-200 dark:border-zinc-700">
                                            {`🏷️ ${catName}`}
                                        </span>
                                    </div>

                                    {/* Metric Highlight Badge based on shelf */}
                                    {shelf.key === 'viewed' && (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-800 dark:text-zinc-200 bg-slate-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded-md border border-slate-200 dark:border-zinc-700">
                                            <Eye className="w-3 h-3 text-slate-500" />
                                            {article.viewCount || 0}
                                        </span>
                                    )}
                                    {shelf.key === 'liked' && (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-900/60">
                                            <Heart className="w-3 h-3 fill-current" />
                                            {computedLikes}
                                        </span>
                                    )}
                                    {shelf.key === 'recent' && (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded-md border border-slate-200 dark:border-zinc-700">
                                            <Calendar className="w-3 h-3 text-slate-400" />
                                            {formatArticleDate(article.createdAt, article.id)}
                                        </span>
                                    )}
                                </div>

                                {/* Headline (Single string with rank prefix to ensure exact uniqueness) */}
                                <h5 className="text-base font-bold text-slate-900 dark:text-white leading-snug group-hover:text-indigo-600 dark:group-hover:text-zinc-200 transition-colors mb-2 line-clamp-2 m-0">
                                    {`#${rank} • ${article.title}`}
                                </h5>

                                {/* Excerpt */}
                                <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed line-clamp-2 mb-4 m-0">
                                    {article.content && article.content.length > 110
                                        ? article.content.substring(0, 110) + '...'
                                        : article.content}
                                </p>
                            </div>

                            {/* Card Bottom Meta & CTA */}
                            <div className="pt-3 border-t border-slate-100 dark:border-neutral-800/70 flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400">
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-slate-900 dark:bg-zinc-800 text-white flex items-center justify-center font-bold text-[9px]">
                                        {authorInitial}
                                    </div>
                                    <span className="font-semibold text-slate-800 dark:text-neutral-200 truncate max-w-[100px]">
                                        {article.author}
                                    </span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1 text-[11px]">
                                        <Clock className="w-3 h-3" />
                                        {readTime}
                                    </span>
                                </div>

                                <div className="inline-flex items-center gap-0.5 font-bold text-[11px] text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-zinc-200 group-hover:translate-x-0.5 transition-transform">
                                    <span>Read</span>
                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default HorizontalArticlesCarousel;
