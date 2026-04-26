import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';

const Register: React.FC = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    // NEW: Add a state for the role selection, defaulting to normal user
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
            // We pass the selected role as 'rolerequest' to match your Java backend
            const backendMessage = await authService.register({ 
                username, 
                email, 
                password, 
                rolerequest: role 
            });
            
            // Show the exact string returned by your AuthService.java!
            alert(backendMessage); 
            navigate('/login'); 
        } catch (err: any) {
            // Display error from backend if available
            const errorMsg = err.response?.data || "Registration failed. Username or email might already be taken.";
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f4f7f6', fontFamily: 'sans-serif' }}>
            <div style={{ width: '100%', maxWidth: '400px', padding: '30px', backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                <h2 style={{ textAlign: 'center', color: '#333', marginBottom: '20px' }}>Create an Account</h2>
                
                {error && <div style={{ padding: '10px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '5px', marginBottom: '15px', fontSize: '14px' }}>{error}</div>}
                
                <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', color: '#555', fontSize: '14px' }}>Username</label>
                        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required 
                            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', color: '#555', fontSize: '14px' }}>Email</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required 
                            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', color: '#555', fontSize: '14px' }}>Password</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', color: '#555', fontSize: '14px' }}>Confirm Password</label>
                        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required 
                            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }} />
                    </div>
                    
                    {/* NEW: Role Selection Dropdown */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', color: '#555', fontSize: '14px' }}>Account Type</label>
                        <select value={role} onChange={(e) => setRole(e.target.value)} required 
                            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box', backgroundColor: 'white' }}>
                            <option value="ROLE_USER">Standard Reader</option>
                            <option value="ROLE_AUTHOR">Content Author / Editor</option>
                            <option value="ROLE_ADMIN">System Administrator</option>
                        </select>
                        {role !== 'ROLE_USER' && (
                            <small style={{ color: '#d9534f', display: 'block', marginTop: '5px' }}>
                                Note: This role requires manual approval from an existing Admin before you can log in.
                            </small>
                        )}
                    </div>
                    
                    <button type="submit" disabled={loading} style={{ marginTop: '10px', padding: '12px', backgroundColor: '#0056b3', color: 'white', border: 'none', borderRadius: '5px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '16px', fontWeight: 'bold' }}>
                        {loading ? 'Processing...' : 'Register'}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#666' }}>
                    Already have an account? <Link to="/login" style={{ color: '#0056b3', textDecoration: 'none', fontWeight: 'bold' }}>Sign in here</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;