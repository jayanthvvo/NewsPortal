import type { Article } from './articleService';

const getStorageKey = (): string => {
    try {
        const token = localStorage.getItem('token');
        if (token) {
            const payload = JSON.parse(
                atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
            );
            if (payload?.sub) {
                return `newsportal_saved_${payload.sub}`;
            }
        }
    } catch {
        // fallback
    }
    return 'newsportal_saved_articles';
};

export const bookmarkService = {
    getSavedArticles: (): Article[] => {
        try {
            const raw = localStorage.getItem(getStorageKey());
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    },

    isSaved: (articleId?: number): boolean => {
        if (!articleId) return false;
        const saved = bookmarkService.getSavedArticles();
        return saved.some(a => a.id === articleId);
    },

    toggleSave: (article: Article): boolean => {
        if (!article.id) return false;
        const saved = bookmarkService.getSavedArticles();
        const exists = saved.some(a => a.id === article.id);
        let updated: Article[];

        if (exists) {
            updated = saved.filter(a => a.id !== article.id);
        } else {
            updated = [article, ...saved];
        }

        try {
            localStorage.setItem(getStorageKey(), JSON.stringify(updated));
            window.dispatchEvent(
                new CustomEvent('bookmarks-changed', {
                    detail: { articleId: article.id, isSaved: !exists }
                })
            );
        } catch (e) {
            console.error('Failed to update bookmark in localStorage', e);
        }

        return !exists;
    },

    removeSave: (articleId: number): void => {
        const saved = bookmarkService.getSavedArticles();
        const updated = saved.filter(a => a.id !== articleId);
        try {
            localStorage.setItem(getStorageKey(), JSON.stringify(updated));
            window.dispatchEvent(
                new CustomEvent('bookmarks-changed', {
                    detail: { articleId, isSaved: false }
                })
            );
        } catch (e) {
            console.error('Failed to remove bookmark from localStorage', e);
        }
    }
};

export default bookmarkService;
