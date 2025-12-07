import React, { useState, useEffect } from 'react';
import api from './api';
import LandingView from './views/LandingView';
import AuthView from './views/AuthView';
import ClientDashboard from './views/ClientDashboard';
import WebmailView from './views/WebmailView';
import Spinner from './components/Spinner';
import { User } from './types';

export default function App() {
  const [view, setView] = useState<'landing' | 'login' | 'client-dashboard' | 'webmail-dashboard'>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check auth on load
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('smtp_token');
      const role = localStorage.getItem('smtp_role');

      if (token && role) {
        try {
          if (role === 'client') {
             const res = await api.get('/api/account/profile');
             setUser({ ...res.data, role: 'client', token });
             setView('client-dashboard');
          } else if (role === 'mailbox') {
             const res = await api.get('/api/webmail/profile');
             setUser({ ...res.data, role: 'mailbox', token });
             setView('webmail-dashboard');
          }
        } catch (err) {
          // Token invalid or session expired
          console.error("Session fetch failed", err);
          localStorage.removeItem('smtp_token');
          localStorage.removeItem('smtp_role');
          setView('landing');
        }
      } else {
         setView('landing');
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const handleLoginSuccess = (userData: User) => {
    setUser(userData);
    localStorage.setItem('smtp_role', userData.role);
    setView(userData.role === 'client' ? 'client-dashboard' : 'webmail-dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('smtp_token');
    localStorage.removeItem('smtp_role');
    setUser(null);
    setView('landing');
  };

  const handleUserUpdate = (updates: Partial<User>) => {
    if (user) {
        setUser({ ...user, ...updates });
    }
  };

  if (loading) {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="flex flex-col items-center">
                <Spinner />
                <p className="mt-4 text-gray-500 text-sm">Loading...</p>
            </div>
        </div>
    );
  }

  return (
    <>
      {view === 'landing' && <LandingView onNavigate={(v) => setView(v as any)} />}
      
      {view === 'login' && (
        <AuthView onSuccess={handleLoginSuccess} onBack={() => setView('landing')} />
      )}
      
      {view === 'client-dashboard' && user && (
        <ClientDashboard user={user} onLogout={handleLogout} onUserUpdate={handleUserUpdate} />
      )}
      
      {view === 'webmail-dashboard' && user && (
        <WebmailView user={user} onLogout={handleLogout} />
      )}
    </>
  );
}