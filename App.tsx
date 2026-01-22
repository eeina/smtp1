import React, { useState, useEffect } from 'react';
import api from './api';
import LandingView from './views/LandingView';
import AuthView from './views/AuthView';
import ClientDashboard from './views/ClientDashboard';
import WebmailView from './views/WebmailView';
import Spinner from './components/Spinner';
import { User } from './types';
import { ToastProvider } from './components/ToastContext';

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
             // Admin defaults to webmail now to look "like user", can switch to dashboard
             setView('webmail-dashboard'); 
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
          localStorage.removeItem('smtp_admin_token'); // Clear impersonation token too
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
    // Admins now land on webmail too
    setView('webmail-dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('smtp_token');
    localStorage.removeItem('smtp_role');
    localStorage.removeItem('smtp_admin_token');
    setUser(null);
    setView('landing');
  };

  const handleUserUpdate = (updates: Partial<User>) => {
    if (user) {
        setUser({ ...user, ...updates });
    }
  };

  const handleImpersonate = (token: string, impersonatedUser: any) => {
    // 1. Save current admin token
    const currentToken = localStorage.getItem('smtp_token');
    if (currentToken) {
        localStorage.setItem('smtp_admin_token', currentToken);
    }
    
    // 2. Set new user session
    localStorage.setItem('smtp_token', token);
    localStorage.setItem('smtp_role', 'mailbox');
    setUser(impersonatedUser);
    setView('webmail-dashboard');
  };

  const handleRestoreAdminSession = async () => {
    const adminToken = localStorage.getItem('smtp_admin_token');
    if (adminToken) {
        // Restore Admin Session
        localStorage.setItem('smtp_token', adminToken);
        localStorage.setItem('smtp_role', 'client');
        localStorage.removeItem('smtp_admin_token');
        
        // Fetch Admin Profile
        try {
            const res = await api.get('/api/account/profile');
            setUser({ ...res.data, role: 'client', token: adminToken });
            setView('client-dashboard');
        } catch (err) {
            // If admin token expired, just logout
            handleLogout();
        }
    }
  };

  const isImpersonating = !!localStorage.getItem('smtp_admin_token');

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
    <ToastProvider>
      {view === 'landing' && <LandingView onNavigate={(v) => setView(v as any)} />}
      
      {view === 'login' && (
        <AuthView onSuccess={handleLoginSuccess} onBack={() => setView('landing')} />
      )}
      
      {view === 'client-dashboard' && user && (
        <ClientDashboard 
            user={user} 
            onLogout={handleLogout} 
            onUserUpdate={handleUserUpdate}
            onOpenWebmail={() => setView('webmail-dashboard')}
            onImpersonate={handleImpersonate}
        />
      )}
      
      {view === 'webmail-dashboard' && user && (
        <WebmailView 
            user={user} 
            onLogout={handleLogout}
            onAdminPanel={user.role === 'client' ? () => setView('client-dashboard') : isImpersonating ? handleRestoreAdminSession : undefined}
        />
      )}
    </ToastProvider>
  );
}