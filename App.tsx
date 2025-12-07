import React, { useState, useEffect } from 'react';
import LandingView from './views/LandingView';
import AuthView from './views/AuthView';
import ClientDashboard from './views/ClientDashboard';
import WebmailView from './views/WebmailView';
import { User } from './types';

export default function App() {
  const [view, setView] = useState<'landing' | 'login' | 'client-dashboard' | 'webmail-dashboard'>('landing');
  const [user, setUser] = useState<User | null>(null);

  // Check auth on load
  useEffect(() => {
    const token = localStorage.getItem('smtp_token');
    const role = localStorage.getItem('smtp_role');
    
    // In a real app we would verify token validity with backend here
    if (token && role) {
        if (role === 'client') setView('client-dashboard');
        else if (role === 'mailbox') setView('webmail-dashboard');
        
        // We need to re-fetch user details, but for now we rely on re-login or basic persistence 
        // For prototype, we might miss user details on refresh unless we decode token or fetch profile
        // Let's force re-login if we don't have user object for safety in this demo
    } else {
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