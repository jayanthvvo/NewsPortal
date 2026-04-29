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
    const [avatarUrl, setAvatarUrl] = useState('');

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
            setAvatarUrl(data.avatarUrl || '');
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
                bio,
                avatarUrl
            });
            alert("Profile updated successfully!");
        } catch (error) {
            alert("Failed to update profile.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Loading Profile...</div>;
    if (!profile) return <div style={{ textAlign: 'center', padding: '50px' }}>Profile not found! Did the auth-service create it during registration?</div>;

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f4f7f6', fontFamily: 'sans-serif' }}>
            
            {/* Simple Header */}
            <header style={{ padding: '20px 40px', backgroundColor: '#1a1a1a', color: 'white', display: 'flex', justifyContent: 'space-between' }}>
                <h2 style={{ margin: 0, cursor: 'pointer' }} onClick={() => navigate('/articles')}>The Daily Chronicle</h2>
                <button onClick={() => navigate('/articles')} style={{ padding: '8px 16px', background: 'transparent', color: 'white', border: '1px solid white', borderRadius: '4px', cursor: 'pointer' }}>
                    Back to News
                </button>
            </header>

            <main style={{ maxWidth: '600px', margin: '40px auto', padding: '0 20px' }}>
                <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px', borderBottom: '1px solid #eee', paddingBottom: '20px' }}>
                        {/* Avatar Display */}
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#0056b3', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '30px', fontWeight: 'bold', overflow: 'hidden' }}>
                            {avatarUrl ? <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : profile.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h1 style={{ margin: '0 0 5px 0' }}>{profile.username}</h1>
                            <div style={{ color: '#666' }}>{profile.email}</div>
                        </div>
                    </div>

                    <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', gap: '20px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>First Name</label>
                                <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>Last Name</label>
                                <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }} />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>Avatar URL (Image Link)</label>
                            <input type="text" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://example.com/my-photo.jpg" style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }} />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>About Me (Bio)</label>
                            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} placeholder="Tell the community about yourself..." style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                        </div>

                        <button type="submit" disabled={saving} style={{ padding: '12px', backgroundColor: '#0056b3', color: 'white', border: 'none', borderRadius: '4px', fontSize: '16px', fontWeight: 'bold', cursor: saving ? 'not-allowed' : 'pointer', marginTop: '10px' }}>
                            {saving ? 'Saving...' : 'Save Profile Changes'}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default UserProfilePage;