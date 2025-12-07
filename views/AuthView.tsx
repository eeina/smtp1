import React, { useState } from 'react';
import api from '../api';
import Spinner from '../components/Spinner';
import { User } from '../types';

interface AuthViewProps {
  onSuccess: (user: User) => void;
  onBack: () => void;
}

const AuthView = ({ onSuccess, onBack }: AuthViewProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Use unified login endpoint
      const res = await api.post('/api/login', { email, password });

      const { token, role, email: userEmail, company_name } = res.data;
      
      localStorage.setItem('smtp_token', token);
      
      onSuccess({
        email: userEmail,
        company_name: company_name,
        token,
        role: role // 'client' or 'mailbox'
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
      e.preventDefault();
      alert("Please contact your administrator to reset your password.");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign In
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Continue to your email
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm text-center">
                {error}
              </div>
            )}
            
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
                  <button type="button" onClick={handleForgotPassword} className="font-medium text-blue-600 hover:text-blue-500">
                    Forgot password?
                  </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors">
              {loading ? <Spinner /> : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthView;