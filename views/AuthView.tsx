import React, { useState } from 'react';
import api from '../api';
import Spinner from '../components/Spinner';
import { User } from '../types';

interface AuthViewProps {
  onSuccess: (user: User) => void;
  onBack: () => void;
}

const AuthView = ({ onSuccess, onBack }: AuthViewProps) => {
  const [mode, setMode] = useState<'login' | 'forgot' | 'reset'>('login');
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Reset State
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/api/login', { email, password });
      const { token, role, email: userEmail, company_name, recovery_email } = res.data;
      
      localStorage.setItem('smtp_token', token);
      
      onSuccess({
        email: userEmail,
        company_name: company_name,
        recovery_email: recovery_email,
        token,
        role: role
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setSuccessMsg('');
      setLoading(true);
      
      try {
          await api.post('/api/login/forgot-password', { email });
          setMode('reset');
          setSuccessMsg('OTP sent to your recovery email.');
      } catch (err: any) {
          setError(err.response?.data?.error || 'Request failed');
      } finally {
          setLoading(false);
      }
  };

  const handleReset = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setLoading(true);

      try {
          await api.post('/api/login/reset-password', { email, otp: resetOtp, newPassword });
          setMode('login');
          setSuccessMsg('Password reset successfully. Please login.');
          setPassword('');
      } catch (err: any) {
          setError(err.response?.data?.error || 'Reset failed');
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {mode === 'login' ? 'Sign In' : mode === 'forgot' ? 'Reset Password' : 'New Password'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {mode === 'login' ? 'Continue to your email' : mode === 'forgot' ? 'Enter your account email to receive an OTP' : 'Enter the OTP and your new password'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm text-center">
                {error}
              </div>
            )}
            {successMsg && (
              <div className="mb-4 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm text-center">
                {successMsg}
              </div>
            )}

            {/* LOGIN FORM */}
            {mode === 'login' && (
              <form className="space-y-6" onSubmit={handleLogin}>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email address</label>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} 
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition-colors" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <input type="password" required value={password} onChange={e => setPassword(e.target.value)} 
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition-colors" />
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm">
                     <button type="button" onClick={onBack} className="font-medium text-gray-600 hover:text-gray-900">
                        &larr; Back to Home
                      </button>
                  </div>
                  <div className="text-sm">
                      <button type="button" onClick={() => { setMode('forgot'); setError(''); setSuccessMsg(''); }} className="font-medium text-blue-600 hover:text-blue-500">
                        Forgot password?
                      </button>
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors">
                  {loading ? <Spinner /> : 'Sign In'}
                </button>
              </form>
            )}

            {/* FORGOT FORM */}
            {mode === 'forgot' && (
              <form className="space-y-6" onSubmit={handleForgot}>
                 <div>
                  <label className="block text-sm font-medium text-gray-700">Email address</label>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="e.g. user@example.com"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition-colors" />
                </div>
                
                <button type="submit" disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors">
                  {loading ? <Spinner /> : 'Send OTP'}
                </button>
                <div className="text-center">
                    <button type="button" onClick={() => { setMode('login'); setError(''); }} className="text-sm font-medium text-gray-600 hover:text-gray-900">
                        Cancel
                    </button>
                </div>
              </form>
            )}

            {/* RESET FORM */}
            {mode === 'reset' && (
              <form className="space-y-6" onSubmit={handleReset}>
                 <div className="bg-blue-50 p-3 rounded text-xs text-blue-800">
                    An OTP has been sent to your recovery email address.
                 </div>
                 <div>
                  <label className="block text-sm font-medium text-gray-700">Account Email</label>
                  <input type="email" disabled value={email} className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm text-gray-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Enter OTP</label>
                  <input type="text" required value={resetOtp} onChange={e => setResetOtp(e.target.value)} placeholder="123456"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition-colors font-mono text-center tracking-widest text-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">New Password</label>
                  <input type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min 6 characters" minLength={6}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition-colors" />
                </div>
                
                <button type="submit" disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors">
                  {loading ? <Spinner /> : 'Reset Password'}
                </button>
                <div className="text-center">
                    <button type="button" onClick={() => { setMode('login'); setError(''); }} className="text-sm font-medium text-gray-600 hover:text-gray-900">
                        Back to Login
                    </button>
                </div>
              </form>
            )}

        </div>
      </div>
    </div>
  );
};

export default AuthView;