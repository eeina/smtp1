import React, { useState, useEffect } from 'react';
import LandingView from './views/LandingView';
import AuthView from './views/AuthView';
import ClientDashboard from './views/ClientDashboard';
import WebmailView from './views/WebmailView';
import { User } from './types';

export default function App() {
  const [view, setView] = useState<'landing' | 'client-login' | 'webmail-login' | 'client-dashboard' | 'webmail-dashboard'>('landing');
  const [user, setUser] = useState<User | null>(null);

  // Check auth on load
  useEffect(() => {
    const token = localStorage.getItem('smtp_token');
    const role = localStorage.getItem('smtp_role');
    // Note: In a real app we would decode the token to get the user or verify via API.
    // For this prototype, we will just clear if no token.
    if (!token) {
      setView('landing');
    }
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

  return (
    <>
      {view === 'landing' && <LandingView onNavigate={(v) => setView(v as any)} />}
      
      {view === 'client-login' && (
        <AuthView role="client" onSuccess={handleLoginSuccess} onBack={() => setView('landing')} />
      )}
      
      {view === 'webmail-login' && (
        <AuthView role="mailbox" onSuccess={handleLoginSuccess} onBack={() => setView('landing')} />
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