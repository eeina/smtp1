import React, { useState, useEffect } from 'react';
import api from '../api';
import { User, Domain, Mailbox, DnsStatus } from '../types';
import { useToast } from '../components/ToastContext';

// Components
import DashboardNavbar from './dashboard/DashboardNavbar';
import ServerInfoPanel from './dashboard/ServerInfoPanel';
import DomainManager from './dashboard/DomainManager';
import MailboxManager from './dashboard/MailboxManager';

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
}

const ClientDashboard = ({ user, onLogout, onUserUpdate }: Props) => {
  const { addToast } = useToast();
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
    } catch (err) {
      console.error(err);
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

    // Get recovery email from form input directly since we don't have separate state for it
    const formData = new FormData(e.target as HTMLFormElement);
    const recoveryEmail = formData.get('recoveryEmail') as string;

    try {
      await api.post(`/api/domains/${selectedDomainId}/mailboxes`, {
        email: newMailboxEmail,
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
    <div className="min-h-screen bg-gray-100 relative pb-20 font-sans">
      
      {/* Navigation */}
      <DashboardNavbar 
        user={user} 
        onLogout={onLogout} 
        onShowLogs={() => setShowLogs(true)} 
        onOpenSettings={() => setShowAccountSettings(true)}
      />

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        
        {/* Server Health Panel */}
        <ServerInfoPanel 
          onRunDiagnostics={runDiagnostics} 
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Domains Section */}
          <div className="lg:col-span-2 space-y-6">
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

          {/* Mailboxes Section */}
          <div className="space-y-6">
            <MailboxManager 
                mailboxes={mailboxes} 
                onDeleteMailbox={handleDeleteMailbox}
                onEditMailbox={(mb) => setEditingMailbox(mb)}
            />
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