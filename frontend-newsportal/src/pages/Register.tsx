import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';

const Register: React.FC = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState('ROLE_USER'); 
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    
    const navigate = useNavigate();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            return setError("Passwords do not match!");
        }

        setLoading(true);
        try {
            const backendMessage = await authService.register({ 
                username, 
                email, 
                password, 
                rolerequest: role 
            });
            
            alert(backendMessage); 
            navigate('/login'); 
        } catch (err: any) {
            const errorMsg = err.response?.data || "Registration failed. Username or email might already be taken.";
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen font-sans">
            {/* Form Container */}
            <div className="w-full max-w-md p-8 rounded-xl border border-[var(--border)] bg-[var(--code-bg)] shadow-[var(--shadow)] my-8">
                
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-2 text-[var(--text-h)]">Create an Account</h1>
                    <p className="text-sm text-[var(--text)]">Join NewsPortal today.</p>
                </div>
                
                {/* Error Message */}
                {error && (
                    <div className="p-3 mb-6 text-sm text-red-700 bg-red-100 rounded-lg border border-red-200">
                        {error}
                    </div>
                )}
                
                {/* Register Form */}
                <form onSubmit={handleRegister} className="flex flex-col gap-4">
                    <div>
                        <label className="block mb-1.5 text-sm font-medium text-[var(--text-h)]">Username</label>
                        <input 
                            type="text" 
                            value={username} 
                            onChange={(e) => setUsername(e.target.value)} 
                            required 
                            className="w-full p-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text-h)] focus:ring-2 focus:ring-[var(--accent)] outline-none transition-all"
                            placeholder="Choose a username"
                        />
                    </div>

                    <div>
                        <label className="block mb-1.5 text-sm font-medium text-[var(--text-h)]">Email</label>
                        <input 
                            type="email" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            required 
                            className="w-full p-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text-h)] focus:ring-2 focus:ring-[var(--accent)] outline-none transition-all"
                            placeholder="you@example.com"
                        />
                    </div>

                    <div>
                        <label className="block mb-1.5 text-sm font-medium text-[var(--text-h)]">Password</label>
                        <input 
                            type="password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required 
                            minLength={6}
                            className="w-full p-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text-h)] focus:ring-2 focus:ring-[var(--accent)] outline-none transition-all"
                            placeholder="At least 6 characters"
                        />
                    </div>

                    <div>
                        <label className="block mb-1.5 text-sm font-medium text-[var(--text-h)]">Confirm Password</label>
                        <input 
                            type="password" 
                            value={confirmPassword} 
                            onChange={(e) => setConfirmPassword(e.target.value)} 
                            required 
                            className="w-full p-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text-h)] focus:ring-2 focus:ring-[var(--accent)] outline-none transition-all"
                            placeholder="Confirm your password"
                        />
                    </div>
                    
                    {/* Role Selection Dropdown */}
                    <div>
                        <label className="block mb-1.5 text-sm font-medium text-[var(--text-h)]">Account Type</label>
                        <select 
                            value={role} 
                            onChange={(e) => setRole(e.target.value)} 
                            required 
                            className="w-full p-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text-h)] focus:ring-2 focus:ring-[var(--accent)] outline-none transition-all cursor-pointer"
                        >
                            <option value="ROLE_USER">Standard Reader</option>
                            <option value="ROLE_AUTHOR">Content Author / Editor</option>
                            <option value="ROLE_ADMIN">System Administrator</option>
                        </select>
                        
                        {role !== 'ROLE_USER' && (
                            <small className="block mt-2 text-sm text-red-500 font-medium">
                                Note: This role requires manual approval from an existing Admin before you can log in.
                            </small>
                        )}
                    </div>
                    
                    <button 
                        type="submit" 
                        disabled={loading} 
                        className="w-full mt-4 py-3 px-4 bg-[var(--accent)] text-white font-semibold rounded-lg transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Processing...' : 'Register'}
                    </button>
                </form>

                {/* Footer Link */}
                <div className="text-center mt-8 text-sm text-[var(--text)]">
                    Already have an account?{' '}
                    <Link to="/login" className="font-semibold text-[var(--accent)] hover:underline">
                        Sign in here
                    </Link>
                </div>
                
            </div>
        </div>
    );
};

export default Register;