import React, { useState } from 'react';
import { authService } from '../services/authService';
import { useNavigate, Link } from 'react-router-dom'; 

export default function ForgotPassword() {
  const navigate = useNavigate(); 

  // State to track which step the user is on
  const [step, setStep] = useState<1 | 2>(1);
  
  // Form data
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Handle Step 1: Sending the OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await authService.forgotPassword(email);
      setMessage('OTP sent successfully! Please check your email.');
      setStep(2); // Move to the next step to enter OTP
    } catch (err: any) {
      // Catching the exact 400 error we set up in the backend!
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to send OTP. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Step 2: Resetting the Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await authService.resetPassword({ email, otp, newPassword });
      setMessage('Password reset successfully! Redirecting to login...');
      
      // Redirect to login page after a few seconds
      setTimeout(() => navigate('/login'), 3000);
      
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Invalid OTP or failed to reset password.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--bg)] font-sans px-4 text-[var(--text)]">
      <div className="w-full max-w-md p-8 bg-[var(--code-bg)] border border-[var(--border)] rounded-xl shadow-[var(--shadow)]">
        
        {/* Header */}
        <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2 text-[var(--text-h)]">Reset Password</h2>
            <p className="text-sm">
                {step === 1 ? "Enter your email to receive a secure OTP." : "Check your email for the 6-digit code."}
            </p>
        </div>

        {/* Display Success or Error Messages */}
        {message && (
            <div className="p-4 mb-6 text-sm font-medium text-green-800 bg-green-100 border border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800 rounded-lg">
                {message}
            </div>
        )}
        {error && (
            <div className="p-4 mb-6 text-sm font-medium text-red-800 bg-red-100 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800 rounded-lg">
                {error}
            </div>
        )}

        {/* STEP 1 FORM */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="flex flex-col gap-5">
            <div>
              <label className="block mb-1.5 text-sm font-semibold text-[var(--text-h)]">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text-h)] focus:ring-2 focus:ring-[var(--accent)] outline-none transition-all"
                placeholder="Enter your registered email"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 font-bold text-white bg-[var(--accent)] rounded-lg shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        )}

        {/* STEP 2 FORM */}
        {step === 2 && (
          <form onSubmit={handleResetPassword} className="flex flex-col gap-5">
            <div>
              <label className="block mb-1.5 text-sm font-semibold text-[var(--text-h)]">Email Address</label>
              <input
                type="email"
                disabled
                value={email}
                className="w-full p-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text-h)] opacity-60 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block mb-1.5 text-sm font-semibold text-[var(--text-h)]">Enter OTP</label>
              <input
                type="text"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full p-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text-h)] focus:ring-2 focus:ring-[var(--accent)] outline-none transition-all tracking-widest"
                placeholder="6-digit code"
              />
            </div>
            <div>
              <label className="block mb-1.5 text-sm font-semibold text-[var(--text-h)]">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text-h)] focus:ring-2 focus:ring-[var(--accent)] outline-none transition-all"
                placeholder="Enter new password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full py-2 mt-1 text-sm font-semibold text-[var(--accent)] hover:underline"
            >
              ← Back to request OTP
            </button>
          </form>
        )}

        {/* Footer Link */}
        <div className="text-center mt-8 text-sm border-t border-[var(--border)] pt-6">
            Remembered your password?{' '}
            <Link to="/login" className="font-semibold text-[var(--accent)] hover:underline">
                Sign in here
            </Link>
        </div>

      </div>
    </div>
  );
}