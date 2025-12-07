import React, { useState } from 'react';
import api from '../api';
import Spinner from '../components/Spinner';
import { User } from '../types';

interface AuthViewProps {
  role: 'client' | 'mailbox';
  onSuccess: (user: User) => void;
  onBack: () => void;
}

const AuthView = ({ role, onSuccess, onBack }: AuthViewProps) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = role === 'client' 
        ? (isRegister ? '/api/auth/register' : '/api/auth/login')
        : '/api/webmail/login';
      
      const payload = isRegister 
        ? { email, password, company_name: companyName }
        : { email, password };

      const res = await api.post(endpoint, payload);
      
      if (isRegister) {
        setIsRegister(false);
        setLoading(false);
        alert('Registration successful! Please log in.');
        return;
      }

      const token = res.data.token;
      localStorage.setItem('smtp_token', token);
      
      onSuccess({
        email: res.data.client?.email || res.data.email,
        company_name: res.data.client?.company_name,
        token,
        role
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {role === 'client' ? (isRegister ? 'Register Organization' : 'Client Login') : 'Webmail Login'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && <div className="text-red-500 text-sm text-center">{error}</div>}
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Email address</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} 
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
            </div>

            {isRegister && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Company Name</label>
                <input type="text" required value={companyName} onChange={e => setCompanyName(e.target.value)} 
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} 
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
            </div>

            <div className="flex items-center justify-between">
              {role === 'client' && (
                <div className="text-sm">
                  <button type="button" onClick={() => setIsRegister(!isRegister)} className="font-medium text-blue-600 hover:text-blue-500">
                    {isRegister ? 'Already have an account? Login' : 'Need an account? Register'}
                  </button>
                </div>
              )}
              <div className="text-sm">
                 <button type="button" onClick={onBack} className="font-medium text-gray-600 hover:text-gray-500">
                    Back to Home
                  </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
              {loading ? <Spinner /> : (isRegister ? 'Create Account' : 'Sign In')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthView;
