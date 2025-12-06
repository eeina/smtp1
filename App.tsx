import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// Fix for missing JSX definitions in the environment
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

// --- TYPES ---
interface User {
  email: string;
  company_name?: string;
  token?: string;
  role: 'client' | 'mailbox';
}

interface Domain {
  _id: string;
  name: string;
  verification_token: string;
  is_verified: boolean;
  mx_status: string;
  dkim_public_key?: string;
}

interface Mailbox {
  _id: string;
  email: string;
  domain_id: { _id: string; name: string } | string;
}

interface EmailMessage {
  _id: string;
  from: string;
  to: string;
  subject: string;
  text_body: string;
  html_body: string;
  folder: 'inbox' | 'sent';
  created_at: string;
}

// --- API CONFIG ---
const api = axios.create({
  baseURL: 'http://localhost:4000/api',
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('smtp_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- COMPONENTS ---

const Spinner = () => (
  <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

// 1. LANDING VIEW
const LandingView = ({ onNavigate }: { onNavigate: (view: string) => void }) => (
  <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
      <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">Enterprise SMTP</h2>
      <p className="mt-2 text-lg text-gray-600">Professional Email Infrastructure</p>
    </div>

    <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-4xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
        {/* Client / Admin Card */}
        <div className="bg-white py-8 px-10 shadow rounded-lg border-t-4 border-blue-600 hover:shadow-lg transition-shadow">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Account Owners</h3>
          <p className="text-gray-500 mb-6">Manage domains, configure DNS, and provision mailboxes for your organization.</p>
          <button
            onClick={() => onNavigate('client-login')}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Manage Organization
          </button>
        </div>

        {/* Webmail / User Card */}
        <div className="bg-white py-8 px-10 shadow rounded-lg border-t-4 border-green-500 hover:shadow-lg transition-shadow">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Webmail</h3>
          <p className="text-gray-500 mb-6">Access your inbox, send emails, and manage your daily communications.</p>
          <button
            onClick={() => onNavigate('webmail-login')}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Open Webmail
          </button>
        </div>
      </div>
    </div>
  </div>
);

// 2. AUTH VIEW
const AuthView = ({ 
  role, 
  onSuccess, 
  onBack 
}: { 
  role: 'client' | 'mailbox', 
  onSuccess: (user: User) => void, 
  onBack: () => void 
}) => {
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
        ? (isRegister ? '/auth/register' : '/auth/login')
        : '/webmail/login';
      
      const payload = isRegister 
        ? { email, password, company_name: companyName }
        : { email, password };

      const res = await api.post(endpoint, payload);
      
      // If register, we auto login or ask to login. For simplicity, let's just log them in if the API supported it, 
      // but the current API returns success for register.
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

// 3. CLIENT DASHBOARD
const ClientDashboard = ({ user, onLogout }: { user: User, onLogout: () => void }) => {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [mailboxes, setMailboxes] = useState<Mailbox[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Mailbox creation state
  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null);
  const [newMailboxEmail, setNewMailboxEmail] = useState('');
  const [newMailboxPassword, setNewMailboxPassword] = useState('');

  const refreshData = async () => {
    try {
      const dRes = await api.get('/domains');
      setDomains(dRes.data);
      const mRes = await api.get('/mailboxes');
      setMailboxes(mRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { refreshData(); }, []);

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain) return;
    try {
      await api.post('/domains', { name: newDomain });
      setNewDomain('');
      refreshData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed');
    }
  };

  const handleVerify = async (domainId: string) => {
    setLoading(true);
    try {
      await api.post(`/domains/${domainId}/verify`);
      await refreshData();
      alert('Domain Verified Successfully!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Verification Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMailbox = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDomainId) return;
    try {
      await api.post(`/domains/${selectedDomainId}/mailboxes`, {
        email: newMailboxEmail,
        password: newMailboxPassword
      });
      setNewMailboxEmail('');
      setNewMailboxPassword('');
      setSelectedDomainId(null);
      refreshData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-xl font-bold text-gray-800">SMTP Admin</span>
              <span className="ml-4 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
                {user.company_name}
              </span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-500 mr-4">{user.email}</span>
              <button onClick={onLogout} className="text-red-600 hover:text-red-800 font-medium text-sm">Logout</button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        {/* Connection Info */}
        <div className="bg-slate-800 rounded-lg shadow-lg p-6 mb-8 text-white">
          <h3 className="text-lg font-medium mb-4 border-b border-slate-600 pb-2">SMTP Connection Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-slate-400 text-sm uppercase">SMTP Host</p>
              <p className="font-mono text-lg">localhost / your-public-ip</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm uppercase">Port 25 (Inbound)</p>
              <p className="font-mono text-lg">No Auth (Public)</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm uppercase">Port 587 (Submission)</p>
              <p className="font-mono text-lg">Auth Required</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Domains Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">Domains</h3>
                <form onSubmit={handleAddDomain} className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="example.com" 
                    className="border-gray-300 rounded-md shadow-sm border px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                    value={newDomain}
                    onChange={e => setNewDomain(e.target.value)}
                  />
                  <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">Add</button>
                </form>
              </div>

              <div className="space-y-4">
                {domains.length === 0 && <p className="text-gray-500 text-sm italic">No domains added yet.</p>}
                {domains.map(domain => (
                  <div key={domain._id} className="border border-gray-200 rounded-md p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-lg font-bold text-gray-800">{domain.name}</h4>
                        <div className="mt-1 flex items-center space-x-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${domain.is_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {domain.is_verified ? 'Verified' : 'Unverified'}
                          </span>
                          {domain.mx_status === 'active' && <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">MX Active</span>}
                        </div>
                      </div>
                      <div className="space-x-2">
                        {!domain.is_verified && (
                          <button 
                            onClick={() => handleVerify(domain._id)}
                            disabled={loading}
                            className="text-sm bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition"
                          >
                            {loading ? 'Checking...' : 'Verify DNS'}
                          </button>
                        )}
                        {domain.is_verified && (
                          <button 
                            onClick={() => setSelectedDomainId(domain._id === selectedDomainId ? null : domain._id)}
                            className="text-sm border border-gray-300 text-gray-700 px-3 py-1 rounded hover:bg-gray-50"
                          >
                            Manage Users
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {!domain.is_verified && (
                      <div className="mt-4 bg-gray-50 p-3 rounded text-sm font-mono text-gray-600 break-all">
                        <p className="mb-1 text-xs text-gray-500 uppercase font-sans">Verification Required: Add this TXT record to {domain.name}</p>
                        {domain.verification_token}
                      </div>
                    )}

                    {/* Add Mailbox Form */}
                    {selectedDomainId === domain._id && (
                      <div className="mt-4 border-t pt-4 bg-gray-50 p-4 rounded">
                        <h5 className="text-sm font-medium text-gray-700 mb-3">Add Mailbox for {domain.name}</h5>
                        <form onSubmit={handleCreateMailbox} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                          <input 
                            type="email" 
                            placeholder={`user@${domain.name}`}
                            className="border-gray-300 rounded px-3 py-1 text-sm col-span-1 sm:col-span-2"
                            value={newMailboxEmail}
                            onChange={e => setNewMailboxEmail(e.target.value)}
                            required
                          />
                          <input 
                            type="password" 
                            placeholder="Password"
                            className="border-gray-300 rounded px-3 py-1 text-sm"
                            value={newMailboxPassword}
                            onChange={e => setNewMailboxPassword(e.target.value)}
                            required
                          />
                          <div className="sm:col-span-3 text-right">
                             <button type="submit" className="bg-green-600 text-white px-4 py-1 rounded text-sm hover:bg-green-700">Create Mailbox</button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mailboxes Column */}
          <div className="bg-white shadow rounded-lg p-6 h-fit">
            <h3 className="text-lg font-medium text-gray-900 mb-4">All Mailboxes</h3>
            <div className="space-y-3">
              {mailboxes.length === 0 && <p className="text-gray-500 text-sm">No mailboxes created.</p>}
              {mailboxes.map(mb => (
                <div key={mb._id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                  <div className="text-sm text-gray-700 truncate" title={mb.email}>{mb.email}</div>
                  <div className="text-xs text-gray-400">1 GB</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// 4. WEBMAIL VIEW
const WebmailView = ({ user, onLogout }: { user: User, onLogout: () => void }) => {
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [selectedMsg, setSelectedMsg] = useState<EmailMessage | null>(null);
  const [view, setView] = useState<'inbox' | 'sent'>('inbox');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/webmail/messages');
        setMessages(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetch();
    const int = setInterval(fetch, 10000); // Poll every 10s
    return () => clearInterval(int);
  }, []);

  const filtered = messages.filter(m => m.folder === view);

  // Safe HTML renderer using iframe
  const SafeHtml = ({ html }: { html: string }) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    useEffect(() => {
      if (iframeRef.current) {
        const doc = iframeRef.current.contentDocument;
        if (doc) {
          doc.open();
          doc.write(html || '<div style="font-family:sans-serif;color:#666;">No content</div>');
          doc.close();
        }
      }
    }, [html]);
    return <iframe ref={iframeRef} title="email-body" className="w-full h-full border-0" />;
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-slate-800 flex flex-col flex-shrink-0 text-white">
        <div className="p-4 border-b border-slate-700">
          <h1 className="text-xl font-bold">Webmail</h1>
          <p className="text-xs text-slate-400 mt-1 truncate">{user.email}</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => { setView('inbox'); setSelectedMsg(null); }}
            className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${view === 'inbox' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
          >
            Inbox
          </button>
          <button 
            onClick={() => { setView('sent'); setSelectedMsg(null); }}
            className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${view === 'sent' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
          >
            Sent
          </button>
        </nav>
        <div className="p-4 border-t border-slate-700">
          <button onClick={onLogout} className="w-full text-left text-sm text-slate-400 hover:text-white">Sign Out</button>
        </div>
      </div>

      {/* Message List */}
      <div className={`${selectedMsg ? 'hidden md:flex' : 'flex'} w-full md:w-80 bg-white border-r border-gray-200 flex-col`}>
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-medium text-gray-700 capitalize">{view}</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">Folder is empty</div>
          ) : (
            filtered.map(msg => (
              <div 
                key={msg._id} 
                onClick={() => setSelectedMsg(msg)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-blue-50 transition ${selectedMsg?._id === msg._id ? 'bg-blue-50' : ''}`}
              >
                <div className="flex justify-between items-baseline mb-1">
                  <span className="font-semibold text-gray-900 text-sm truncate w-2/3">
                    {view === 'inbox' ? msg.from : `To: ${msg.to}`}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="text-sm font-medium text-gray-800 truncate">{msg.subject || '(No Subject)'}</div>
                <div className="text-xs text-gray-500 truncate mt-1">{msg.text_body.substring(0, 50)}...</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Message Detail */}
      <div className={`${selectedMsg ? 'flex' : 'hidden md:flex'} flex-1 bg-white flex-col h-full`}>
        {selectedMsg ? (
          <>
            <div className="p-6 border-b border-gray-200 shadow-sm z-10">
              <div className="flex justify-between items-start">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedMsg.subject || '(No Subject)'}</h2>
                <button onClick={() => setSelectedMsg(null)} className="md:hidden text-blue-600">Back</button>
              </div>
              <div className="flex flex-col space-y-1 text-sm text-gray-600">
                <div className="flex">
                  <span className="font-medium w-12">From:</span>
                  <span>{selectedMsg.from}</span>
                </div>
                <div className="flex">
                  <span className="font-medium w-12">To:</span>
                  <span>{selectedMsg.to}</span>
                </div>
                <div className="flex">
                  <span className="font-medium w-12">Date:</span>
                  <span>{new Date(selectedMsg.created_at).toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="flex-1 bg-gray-50 p-6 overflow-hidden relative">
              <div className="bg-white shadow-sm border border-gray-200 rounded-lg w-full h-full overflow-hidden">
                 {selectedMsg.html_body ? (
                   <SafeHtml html={selectedMsg.html_body} />
                 ) : (
                   <div className="p-6 whitespace-pre-wrap font-sans text-gray-800">
                     {selectedMsg.text_body}
                   </div>
                 )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50 text-gray-400">
            Select an email to read
          </div>
        )}
      </div>
    </div>
  );
};

// --- MAIN APP ---

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
        <ClientDashboard user={user} onLogout={handleLogout} />
      )}
      
      {view === 'webmail-dashboard' && user && (
        <WebmailView user={user} onLogout={handleLogout} />
      )}
    </>
  );
}