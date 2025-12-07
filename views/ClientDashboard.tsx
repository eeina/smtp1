import React, { useState, useEffect } from 'react';
import api from '../api';
import { User, Domain, Mailbox, DnsStatus } from '../types';

// Components
import DashboardNavbar from './dashboard/DashboardNavbar';
import ServerInfoPanel from './dashboard/ServerInfoPanel';
import DomainManager from './dashboard/DomainManager';
import MailboxManager from './dashboard/MailboxManager';

// Modals
import DnsConfigModal from './dashboard/modals/DnsConfigModal';
import SystemLogsModal from './dashboard/modals/SystemLogsModal';
import DiagnosticsModal from './dashboard/modals/DiagnosticsModal';

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

const ClientDashboard = ({ user, onLogout }: { user: User, onLogout: () => void }) => {
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
      refreshData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed');
    }
  };

  const handleDeleteDomain = async (id: string) => {
    if(!confirm('Are you sure? This will delete all mailboxes and emails associated with this domain.')) return;
    try {
        await api.delete(`/api/domains/${id}`);
        refreshData();
    } catch (err: any) {
        alert(err.response?.data?.error || 'Failed to delete domain');
    }
  };

  const handleDeleteMailbox = async (id: string) => {
    if(!confirm('Are you sure you want to delete this mailbox? All messages will be lost.')) return;
    try {
        await api.delete(`/api/mailboxes/${id}`);
        refreshData();
    } catch(err: any) {
        alert(err.response?.data?.error || 'Failed to delete mailbox');
    }
  };

  const handleVerify = async (domainId: string) => {
    setLoading(true);
    try {
      await api.post(`/api/domains/${domainId}/verify`);
      await refreshData();
      alert('Domain Verified Successfully!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Verification Failed. DNS changes can take up to 1 hour to propagate.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMailbox = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDomainId) return;
    try {
      await api.post(`/api/domains/${selectedDomainId}/mailboxes`, {
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
    <div className="min-h-screen bg-gray-100 relative pb-20">
      
      {/* Navigation */}
      <DashboardNavbar 
        user={user} 
        onLogout={onLogout} 
        onShowLogs={() => setShowLogs(true)} 
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

    </div>
  );
};

export default ClientDashboard;