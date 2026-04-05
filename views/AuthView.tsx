
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
      const { token, role, email: userEmail, company_name, _id } = res.data;
      localStorage.setItem('smtp_token', token);
      onSuccess({
        _id,
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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-emerald-500/5 rounded-full blur-[120px] -z-10"></div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mx-auto h-16 w-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white mb-8 shadow-2xl shadow-emerald-200">
             <svg className="w-9 h-9" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16m-7 6h7" /></svg>
        </div>
        <h2 className="text-4xl font-black text-slate-900 tracking-tight text-center">
          Employee Portal
        </h2>
        <p className="mt-3 text-center text-slate-500 font-medium">
          Secure node access for Eeina Health
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="bg-white py-10 px-8 shadow-2xl shadow-slate-200/50 rounded-[2.5rem] border border-slate-100">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-sm font-bold text-center animate-in shake duration-300">
                {error}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleLogin}>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Email Address</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} 
                  className="block w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-300" 
                  placeholder="name@eeina.com" />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Secure Password</label>
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} 
                  className="block w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-300"
                  placeholder="••••••••" />
              </div>

              <div className="flex items-center justify-center pt-2">
                 <button type="button" onClick={onBack} className="text-sm font-bold text-slate-400 hover:text-emerald-600 transition-colors">
                    &larr; Back to Landing
                  </button>
              </div>

              <button type="submit" disabled={loading}
                className="group w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-2xl shadow-xl text-lg font-black text-white bg-slate-900 hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-all transform hover:-translate-y-1 active:scale-95">
                {loading ? <Spinner /> : (
                  <>
                    Sign In
                    <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </>
                )}
              </button>
            </form>
        </div>
      </div>
    </div>
  );
};

export default AuthView;
