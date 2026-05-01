import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService, type UserProfile } from '../services/userService';
import { authService } from '../services/authService';

const UserProfilePage: React.FC = () => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form states
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [bio, setBio] = useState('');

    useEffect(() => {
        if (!authService.isAuthenticated()) {
            navigate('/login');
            return;
        }
        
        // Extract the username from the JWT token
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                const username = payload.sub; // In Spring Security, the subject is usually the username
                fetchProfile(username);
            } catch (e) {
                console.error("Error decoding token");
                navigate('/login');
            }
        }
    }, [navigate]);

    const fetchProfile = async (username: string) => {
        try {
            const data = await userService.getProfile(username);
            setProfile(data);
            setFirstName(data.firstName || '');
            setLastName(data.lastName || '');
            setBio(data.bio || '');
        } catch (error) {
            console.error("Profile not found.");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await userService.updateProfile({
                firstName,
                lastName,
                bio
            });
            alert("Profile updated successfully!");
        } catch (error) {
            alert("Failed to update profile.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--text)]">
                <div className="text-xl animate-pulse font-sans">Loading Profile...</div>
            </div>
        );
    }
    
    if (!profile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--text)]">
                <div className="text-center p-8 bg-[var(--code-bg)] border border-[var(--border)] rounded-xl shadow-sm">
                    <h2 className="text-xl font-bold text-[var(--text-h)] mb-2">Profile not found!</h2>
                    <p>Did the auth-service create it during registration?</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg)] font-sans text-[var(--text)] pb-12">
            
            {/* Simple Header */}
            <header className="px-6 py-5 md:px-10 border-b border-[var(--border)] flex justify-between items-center sticky top-0 bg-[var(--code-bg)] z-10 shadow-sm">
                <h2 
                    className="m-0 text-xl font-bold text-[var(--text-h)] cursor-pointer hover:text-[var(--accent)] transition-colors tracking-wide" 
                    onClick={() => navigate('/articles')}
                >
                    The Daily Chronicle
                </h2>
                <button 
                    onClick={() => navigate('/articles')} 
                    className="px-4 py-2 bg-transparent text-[var(--text-h)] border border-[var(--border)] rounded-lg hover:bg-[var(--accent-bg)] transition-colors font-medium"
                >
                    Back to News
                </button>
            </header>

            <main className="max-w-2xl mx-auto my-10 px-6 md:px-0">
                <div className="bg-[var(--code-bg)] p-8 md:p-10 rounded-xl border border-[var(--border)] shadow-[var(--shadow)]">
                    
                    {/* Profile Header (Info only) */}
                    <div className="mb-8 border-b border-[var(--border)] pb-8 text-center sm:text-left">
                        <h1 className="m-0 mb-1 text-3xl font-bold text-[var(--text-h)] tracking-tight">
                            {profile.username}
                        </h1>
                        <div className="text-[var(--text)] font-medium text-lg">
                            {profile.email}
                        </div>
                    </div>

                    {/* Edit Form */}
                    <form onSubmit={handleSave} className="flex flex-col gap-6">
                        
                        <div className="flex flex-col sm:flex-row gap-6">
                            <div className="flex-1">
                                <label className="block mb-2 font-semibold text-[var(--text-h)] text-sm">First Name</label>
                                <input 
                                    type="text" 
                                    value={firstName} 
                                    onChange={(e) => setFirstName(e.target.value)} 
                                    className="w-full p-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text-h)] focus:ring-2 focus:ring-[var(--accent)] outline-none transition-all" 
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block mb-2 font-semibold text-[var(--text-h)] text-sm">Last Name</label>
                                <input 
                                    type="text" 
                                    value={lastName} 
                                    onChange={(e) => setLastName(e.target.value)} 
                                    className="w-full p-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text-h)] focus:ring-2 focus:ring-[var(--accent)] outline-none transition-all" 
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block mb-2 font-semibold text-[var(--text-h)] text-sm">About Me (Bio)</label>
                            <textarea 
                                value={bio} 
                                onChange={(e) => setBio(e.target.value)} 
                                rows={4} 
                                placeholder="Tell the community about yourself..." 
                                className="w-full p-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text-h)] focus:ring-2 focus:ring-[var(--accent)] outline-none transition-all resize-y" 
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={saving} 
                            className="w-full mt-4 py-3 px-4 bg-[var(--accent)] text-white font-bold rounded-lg shadow-md transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? 'Saving...' : 'Save Profile Changes'}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default UserProfilePage;