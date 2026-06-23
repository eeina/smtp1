import React, { useState, useEffect } from 'react';
import api from '../api';
import { User, Domain, Mailbox, DnsStatus } from '../types';
import { useToast } from '../components/ToastContext';

// Components
import DashboardSidebar from './dashboard/DashboardSidebar';
import ServerInfoPanel from './dashboard/ServerInfoPanel';
import DomainManager from './dashboard/DomainManager';
import MailboxManager from './dashboard/MailboxManager';
import GlobalAuditView from './dashboard/GlobalAuditView';
import AdminManager from './dashboard/AdminManager';

// Modals
import DnsConfigModal from './dashboard/modals/DnsConfigModal';
import SystemLogsModal from './dashboard/modals/SystemLogsModal';
import DiagnosticsModal from './dashboard/modals/DiagnosticsModal';
import AccountSettingsModal from './dashboard/modals/AccountSettingsModal';
import EditMailboxModal from './dashboard/modals/EditMailboxModal';

// Types
interface SystemLog {
  _id: string;
  level: string;
  message: string;
  timestamp: string;
  meta?: any;
}

interface DiagnosticResult {
  dns: { status: 'ok' | 'error'; message: string };
  port25: { status: 'ok' | 'error'; message: string };
  timestamp: string;
}

interface Props {
    user: User;
    onLogout: () => void;
    onUserUpdate: (u: Partial<User>) => void;
    onOpenWebmail: () => void;
    onImpersonate: (token: string, user: any) => void;
}

const ClientDashboard = ({ user, onLogout, onUserUpdate, onOpenWebmail, onImpersonate }: Props) => {
  const { addToast } = useToast();
  
  // Navigation State
  const [currentView, setCurrentView] = useState<'dashboard' | 'audit' | 'admins'>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [domains, setDomains] = useState<Domain[]>([]);
  const [mailboxes, setMailboxes] = useState<Mailbox[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Mailbox creation state
  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null);
  const [newMailboxEmail, setNewMailboxEmail] = useState('');
  const [newMailboxPassword, setNewMailboxPassword] = useState('');
  
  // DNS View State
  const [viewDnsDomain, setViewDnsDomain] = useState<Domain | null>(null);
  const [dnsStatus, setDnsStatus] = useState<DnsStatus | null>(null);
  const [checkingDns, setCheckingDns] = useState(false);

  // Logs View State
  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState<SystemLog[]>([]);

  // Diagnostics View State
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(null);
  const [runningDiagnostics, setRunningDiagnostics] = useState(false);

  // Account Settings State
  const [showAccountSettings, setShowAccountSettings] = useState(false);

  // Edit Mailbox State
  const [editingMailbox, setEditingMailbox] = useState<Mailbox | null>(null);

  const refreshData = async () => {
    try {
      const dRes = await api.get('/api/domains');
      setDomains(dRes.data);
      const mRes = await api.get('/api/mailboxes');
      setMailboxes(mRes.data);
    } catch (err: any) {
      console.error(err);
      // Auto-logout on 403 Forbidden (Session Invalid/Expired)
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          onLogout();
      }
    }
  };

  useEffect(() => { refreshData(); }, []);

  useEffect(() => {
    let interval: any;
    if (showLogs) {
      fetchLogs();
      interval = setInterval(fetchLogs, 5000);
    }
    return () => clearInterval(interval);
  }, [showLogs]);

  const fetchLogs = async () => {
    try {
      const res = await api.get('/api/system/logs');
      setLogs(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const runDiagnostics = async () => {
    setShowDiagnostics(true);
    setRunningDiagnostics(true);
    setDiagnosticResult(null);
    try {
      const res = await api.get('/api/system/diagnostics');
      setDiagnosticResult(res.data);
    } catch (err) {
      console.error(err);
      addToast('Failed to run diagnostics', 'error');
    } finally {
      setRunningDiagnostics(false);
    }
  };

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain) return;
    try {
      await api.post('/api/domains', { name: newDomain });
      setNewDomain('');
      addToast('Domain added successfully', 'success');
      refreshData();
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Failed to add domain', 'error');
    }
  };

  const handleDeleteDomain = async (id: string) => {
    if(!confirm('Are you sure? This will delete all mailboxes and emails associated with this domain.')) return;
    try {
        await api.delete(`/api/domains/${id}`);
        addToast('Domain deleted', 'success');
        refreshData();
    } catch (err: any) {
        addToast(err.response?.data?.error || 'Failed to delete domain', 'error');
    }
  };

  const handleDeleteMailbox = async (id: string) => {
    if(!confirm('Are you sure you want to delete this mailbox? All messages will be lost.')) return;
    try {
        await api.delete(`/api/mailboxes/${id}`);
        addToast('Mailbox deleted', 'success');
        refreshData();
    } catch(err: any) {
        addToast(err.response?.data?.error || 'Failed to delete mailbox', 'error');
    }
  };

  const handleAccessMailbox = async (id: string) => {
      try {
          const res = await api.post(`/api/mailboxes/${id}/impersonate`);
          addToast(`Accessing inbox: ${res.data.user.email}`, 'success');
          onImpersonate(res.data.token, res.data.user);
      } catch (err: any) {
          addToast(err.response?.data?.error || 'Failed to access mailbox', 'error');
      }
  };

  const handleVerify = async (domainId: string) => {
    setLoading(true);
    try {
      await api.post(`/api/domains/${domainId}/verify`);
      await refreshData();
      addToast('Domain Verified Successfully!', 'success');
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Verification Failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMailbox = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDomainId) return;

    const domain = domains.find(d => d._id === selectedDomainId);
    if (!domain) return;

    // Get recovery email from form input directly since we don't have separate state for it
    const formData = new FormData(e.target as HTMLFormElement);
    const recoveryEmail = formData.get('recoveryEmail') as string;

    // Strictly clean the prefix to ensure no @ symbols exist
    const cleanPrefix = newMailboxEmail.split('@')[0].trim();
    const fullEmail = `${cleanPrefix}@${domain.name}`;

    try {
      await api.post(`/api/domains/${selectedDomainId}/mailboxes`, {
        email: fullEmail,
        password: newMailboxPassword,
        recovery_email: recoveryEmail
      });
      setNewMailboxEmail('');
      setNewMailboxPassword('');
      setSelectedDomainId(null);
      addToast('Mailbox created successfully', 'success');
      refreshData();
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Failed to create mailbox', 'error');
    }
  };

  const openDnsModal = async (domain: Domain) => {
    setViewDnsDomain(domain);
    setDnsStatus(null);
    checkDns(domain);
  };

  const checkDns = async (domain: Domain) => {
    setCheckingDns(true);
    try {
      const res = await api.get(`/api/domains/${domain._id}/dns`);
      setDnsStatus(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setCheckingDns(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
      
      {/* Sidebar Navigation */}
      <DashboardSidebar 
        user={user} 
        onLogout={onLogout} 
        onShowLogs={() => { setShowLogs(true); setIsMobileMenuOpen(false); }} 
        onOpenSettings={() => { setShowAccountSettings(true); setIsMobileMenuOpen(false); }}
        onOpenInbox={onOpenWebmail}
        onViewChange={(view) => { setCurrentView(view); setIsMobileMenuOpen(false); }}
        currentView={currentView}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      <main className="flex-1 min-w-0 overflow-y-auto flex flex-col">
        {/* Mobile Header */}
        <div className="lg:hidden h-16 border-b border-slate-800 bg-slate-950 flex items-center px-4 shrink-0">
            <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>
            <div className="ml-4 font-black tracking-tight text-lg text-white">
                Admin<span className="text-emerald-500">Panel</span>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              
              {/* AUDIT VIEW */}
            {currentView === 'audit' && (
                <GlobalAuditView />
            )}

            {/* ADMINS VIEW */}
            {currentView === 'admins' && (
                <AdminManager currentUser={user} />
            )}

            {/* DASHBOARD VIEW */}
            {currentView === 'dashboard' && (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                        {/* Server Status Widget */}
                        <div className="lg:col-span-3">
                            <ServerInfoPanel onRunDiagnostics={runDiagnostics} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                        {/* Domains Column */}
                        <div className="xl:col-span-2 space-y-6">
                            <DomainManager 
                                domains={domains}
                                newDomain={newDomain}
                                setNewDomain={setNewDomain}
                                onAddDomain={handleAddDomain}
                                onDeleteDomain={handleDeleteDomain}
                                onVerify={handleVerify}
                                onOpenDns={openDnsModal}
                                loading={loading}
                                selectedDomainId={selectedDomainId}
                                setSelectedDomainId={setSelectedDomainId}
                                newMailboxEmail={newMailboxEmail}
                                setNewMailboxEmail={setNewMailboxEmail}
                                newMailboxPassword={newMailboxPassword}
                                setNewMailboxPassword={setNewMailboxPassword}
                                onCreateMailbox={handleCreateMailbox}
                            />
                        </div>

                        {/* Mailboxes Column */}
                        <div className="space-y-6">
                            <MailboxManager 
                                mailboxes={mailboxes} 
                                onDeleteMailbox={handleDeleteMailbox}
                                onEditMailbox={(mb) => setEditingMailbox(mb)}
                                onAccessMailbox={handleAccessMailbox}
                            />
                        </div>
                    </div>
                </>
            )}
          </div>
        </div>
      </main>

      {/* MODALS */}
      {viewDnsDomain && (
        <DnsConfigModal 
            domain={viewDnsDomain}
            status={dnsStatus}
            checking={checkingDns}
            onClose={() => setViewDnsDomain(null)}
            onRefresh={() => checkDns(viewDnsDomain)}
        />
      )}

      {showLogs && (
        <SystemLogsModal 
            logs={logs}
            onClose={() => setShowLogs(false)}
            onRefresh={fetchLogs}
        />
      )}

      {showDiagnostics && (
        <DiagnosticsModal 
            result={diagnosticResult}
            running={runningDiagnostics}
            onClose={() => !runningDiagnostics && setShowDiagnostics(false)}
        />
      )}

      {showAccountSettings && (
        <AccountSettingsModal
            user={user}
            onClose={() => setShowAccountSettings(false)}
            onUpdate={(u) => {
                onUserUpdate(u);
                addToast('Account updated', 'success');
            }}
        />
      )}

      {editingMailbox && (
        <EditMailboxModal 
            mailbox={editingMailbox}
            onClose={() => setEditingMailbox(null)}
            onSuccess={() => { 
                setEditingMailbox(null); 
                refreshData(); 
                addToast('Mailbox updated', 'success');
            }}
        />
      )}

    </div>
  );
};

export default ClientDashboard;