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
            else if (userRole === 'ROLE_EDITOR') navigate('/author');
            else navigate('/articles');
            
        } catch (err) {
            setError("Invalid username or password. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen font-sans">
            {/* Form Container using your custom theme background and borders */}
            <div className="w-full max-w-md p-8 rounded-xl border border-[var(--border)] bg-[var(--code-bg)] shadow-[var(--shadow)]">
                
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-2 text-[var(--text-h)]">NewsPortal</h1>
                    <p className="text-sm text-[var(--text)]">Welcome back! Please sign in.</p>
                </div>
                
                {/* Error Message */}
                {error && (
                    <div className="p-3 mb-6 text-sm text-red-700 bg-red-100 rounded-lg border border-red-200">
                        {error}
                    </div>
                )}
                
                {/* Login Form */}
                <form onSubmit={handleLogin} className="flex flex-col gap-5">
                    <div>
                        <label className="block mb-1.5 text-sm font-medium text-[var(--text-h)]">
                            Username
                        </label>
                        <input 
                            type="text" 
                            value={username} 
                            onChange={(e) => setUsername(e.target.value)} 
                            required 
                            className="w-full p-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text-h)] focus:ring-2 focus:ring-[var(--accent)] outline-none transition-all"
                            placeholder="Enter your username"
                        />
                    </div>

                    <div>
                        <label className="block mb-1.5 text-sm font-medium text-[var(--text-h)]">
                            Password
                        </label>
                        <input 
                            type="password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required 
                            className="w-full p-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text-h)] focus:ring-2 focus:ring-[var(--accent)] outline-none transition-all"
                            placeholder="••••••••"
                        />
                        <div className="flex justify-end mt-2">
                            <Link 
                                to="/forgot-password" 
                                className="text-sm font-medium text-[var(--accent)] hover:underline"
                            >
                                Forgot Password?
                            </Link>
                        </div>
                    </div>
                    
                    <button 
                        type="submit" 
                        disabled={loading} 
                        className="w-full mt-2 py-3 px-4 bg-[var(--accent)] text-white font-semibold rounded-lg transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>

                {/* Footer Link */}
                <div className="text-center mt-8 text-sm text-[var(--text)]">
                    Don't have an account?{' '}
                    <Link to="/register" className="font-semibold text-[var(--accent)] hover:underline">
                        Register here
                    </Link>
                </div>

            </div>
        </div>
    );
};

export default Login;