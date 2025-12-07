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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/api/login', { email, password });
      const { token, role, email: userEmail, company_name } = res.data;
      
      localStorage.setItem('smtp_token', token);
      
      onSuccess({
        email: userEmail,
        company_name: company_name,
        token,
        role: role
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto h-12 w-12 bg-green-600 rounded-xl flex items-center justify-center text-white mb-4">
             <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900">
          Eeina Employee Login
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Access your workspace
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-gray-100 sm:rounded-2xl sm:px-10 border border-gray-100">
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm text-center">
                {error}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleLogin}>
              <div>
                <label className="block text-sm font-bold text-gray-700">Email address</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} 
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 transition-colors" />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700">Password</label>
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} 
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 transition-colors" />
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm">
                   <button type="button" onClick={onBack} className="font-medium text-gray-500 hover:text-green-600 transition-colors">
                      &larr; Back to Website
                    </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors">
                {loading ? <Spinner /> : 'Sign In'}
              </button>
            </form>
        </div>
      </div>
    </div>
  );
};

export default AuthView;