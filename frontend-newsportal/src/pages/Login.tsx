import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';

const Login: React.FC = () => {
    const [username, setUsername] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const response = await authService.login({ username, password });
            
            // Redirect based on role
            const userRole = response.role;
            if (userRole === 'ROLE_ADMIN') navigate('/admin');
            else if (userRole === 'ROLE_AUTHOR') navigate('/author');
            else navigate('/articles');
            
        } catch (err) {
            setError("Invalid username or password. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f4f7f6', fontFamily: 'sans-serif' }}>
            <div style={{ width: '100%', maxWidth: '400px', padding: '30px', backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <h1 style={{ margin: '0 0 5px 0', color: '#0056b3' }}>NewsPortal</h1>
                    <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Welcome back! Please sign in.</p>
                </div>
                
                {error && <div style={{ padding: '10px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '5px', marginBottom: '15px', fontSize: '14px' }}>{error}</div>}
                
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', color: '#555', fontSize: '14px' }}>Username</label>
                        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required 
                            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', color: '#555', fontSize: '14px' }}>Password</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required 
                            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }} />
                    </div>
                    
                    <button type="submit" disabled={loading} style={{ marginTop: '10px', padding: '12px', backgroundColor: '#0056b3', color: 'white', border: 'none', borderRadius: '5px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '16px', fontWeight: 'bold' }}>
                        {loading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#666' }}>
                    Don't have an account? <Link to="/register" style={{ color: '#0056b3', textDecoration: 'none', fontWeight: 'bold' }}>Register here</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;