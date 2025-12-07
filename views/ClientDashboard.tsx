import React, { useState, useEffect } from 'react';
import api from '../api';
import { User, Domain, Mailbox } from '../types';

interface DnsStatus {
  verification: boolean;
  a_record: boolean;
  mx: boolean;
  spf: boolean;
  dmarc: boolean;
}

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

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    const btn = document.activeElement as HTMLButtonElement;
    if(btn) {
      const original = btn.innerText;
      btn.innerText = 'Copied!';
      setTimeout(() => btn.innerText = original, 2000);
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

  const StatusIcon = ({ ok }: { ok?: boolean }) => {
    if (checkingDns && ok === undefined) return <span className="animate-pulse text-gray-400">...</span>;
    if (ok) return <span className="text-green-500 font-bold">✓ OK</span>;
    return <span className="text-red-500 font-bold text-xs">✖ Missing</span>;
  };

  return (
    <div className="min-h-screen bg-gray-100 relative">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-xl font-bold text-gray-800">SMTP Admin</span>
              <span className="ml-4 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
                {user.company_name}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setShowLogs(true)}
                className="text-gray-600 hover:text-gray-900 font-medium text-sm flex items-center"
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                System Logs
              </button>
              <div className="flex items-center">
                <span className="text-gray-500 mr-4">{user.email}</span>
                <button onClick={onLogout} className="text-red-600 hover:text-red-800 font-medium text-sm">Logout</button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        {/* Connection Info */}
        <div className="bg-slate-800 rounded-lg shadow-lg p-6 mb-8 text-white relative">
          <div className="flex justify-between items-start border-b border-slate-600 pb-2 mb-4">
            <h3 className="text-lg font-medium">SMTP Connection Details</h3>
            <button 
              onClick={runDiagnostics} 
              className="text-xs bg-slate-700 hover:bg-slate-600 text-blue-300 px-3 py-1 rounded border border-slate-600 transition"
            >
              Check Server Health
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-slate-400 text-sm uppercase">SMTP Host</p>
              <p className="font-mono text-lg">localhost / {window.location.hostname}</p>
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
                            {loading ? 'Checking...' : 'Check Verification'}
                          </button>
                        )}
                        <button 
                          onClick={() => openDnsModal(domain)}
                          className="text-sm border border-gray-300 text-gray-700 px-3 py-1 rounded hover:bg-gray-50"
                        >
                          DNS Setup
                        </button>
                        {domain.is_verified && (
                          <button 
                            onClick={() => setSelectedDomainId(domain._id === selectedDomainId ? null : domain._id)}
                            className="text-sm border border-blue-300 text-blue-700 px-3 py-1 rounded hover:bg-blue-50"
                          >
                            Manage Users
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {!domain.is_verified && (
                      <div className="mt-4 bg-orange-50 border border-orange-100 p-4 rounded-md">
                         <p className="text-sm text-orange-800 mb-2 font-bold">Verification Token:</p>
                         <div className="flex items-center gap-2">
                            <code className="bg-orange-100 px-2 py-1 rounded text-sm flex-1 truncate">{domain.verification_token}</code>
                            <button onClick={() => handleCopy(domain.verification_token)} className="text-xs text-orange-600 underline">Copy</button>
                         </div>
                         <p className="text-xs text-orange-600 mt-2">Add as a TXT record for @</p>
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

      {/* DNS Configuration Modal */}
      {viewDnsDomain && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-600 opacity-75" onClick={() => setViewDnsDomain(null)}></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl leading-6 font-bold text-gray-900">DNS Configuration: {viewDnsDomain.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Add these records to your domain's DNS settings. Status updates automatically.
                    </p>
                  </div>
                  <button 
                    onClick={() => checkDns(viewDnsDomain)} 
                    disabled={checkingDns}
                    className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
                  >
                    {checkingDns ? 'Checking...' : 'Refresh Status'}
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 border">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-16">Type</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-16">Host</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-24">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 text-sm">
                      {/* 1. VERIFICATION TXT */}
                      <tr>
                        <td className="px-3 py-2 font-mono font-bold">TXT</td>
                        <td className="px-3 py-2 font-mono">@</td>
                        <td className="px-3 py-2 font-mono break-all text-gray-600">
                          <div className="flex items-center justify-between">
                            <span className="truncate mr-2">{viewDnsDomain.verification_token}</span>
                            <button onClick={() => handleCopy(viewDnsDomain.verification_token)} className="text-blue-600 text-xs shrink-0">Copy</button>
                          </div>
                        </td>
                        <td className="px-3 py-2"><StatusIcon ok={dnsStatus?.verification} /></td>
                      </tr>
                      {/* 2. A RECORD (Mail Server IP) */}
                      <tr>
                         <td className="px-3 py-2 font-mono font-bold">A</td>
                         <td className="px-3 py-2 font-mono">mail</td>
                         <td className="px-3 py-2 font-mono break-all text-gray-600">
                           <div className="flex items-center justify-between">
                             <span>[Your Server IP]</span>
                           </div>
                         </td>
                         <td className="px-3 py-2"><StatusIcon ok={dnsStatus?.a_record} /></td>
                      </tr>
                      {/* 3. MX RECORD */}
                      <tr>
                         <td className="px-3 py-2 font-mono font-bold">MX</td>
                         <td className="px-3 py-2 font-mono">@</td>
                         <td className="px-3 py-2 font-mono break-all text-gray-600">
                           <div className="flex items-center justify-between">
                             <span>mail.{viewDnsDomain.name} (Priority 10)</span>
                             <button onClick={() => handleCopy(`mail.${viewDnsDomain.name}`)} className="text-blue-600 text-xs shrink-0">Copy</button>
                           </div>
                         </td>
                         <td className="px-3 py-2"><StatusIcon ok={dnsStatus?.mx} /></td>
                      </tr>
                       {/* 4. SPF */}
                       <tr>
                         <td className="px-3 py-2 font-mono font-bold">TXT</td>
                         <td className="px-3 py-2 font-mono">@</td>
                         <td className="px-3 py-2 font-mono break-all text-gray-600">
                           <div className="flex items-center justify-between">
                             <span>v=spf1 mx ~all</span>
                             <button onClick={() => handleCopy('v=spf1 mx ~all')} className="text-blue-600 text-xs shrink-0">Copy</button>
                           </div>
                         </td>
                         <td className="px-3 py-2"><StatusIcon ok={dnsStatus?.spf} /></td>
                      </tr>
                      {/* 5. DMARC */}
                      <tr>
                         <td className="px-3 py-2 font-mono font-bold">TXT</td>
                         <td className="px-3 py-2 font-mono">_dmarc</td>
                         <td className="px-3 py-2 font-mono break-all text-gray-600">
                           <div className="flex items-center justify-between">
                             <span>v=DMARC1; p=none;</span>
                             <button onClick={() => handleCopy('v=DMARC1; p=none;')} className="text-blue-600 text-xs shrink-0">Copy</button>
                           </div>
                         </td>
                         <td className="px-3 py-2"><StatusIcon ok={dnsStatus?.dmarc} /></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button type="button" onClick={() => setViewDnsDomain(null)} className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* System Logs Modal */}
      {showLogs && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-600 opacity-75" onClick={() => setShowLogs(false)}></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-gray-900 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl w-full">
              <div className="bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-gray-700 flex justify-between items-center">
                <h3 className="text-lg leading-6 font-bold text-white">System Logs</h3>
                <button onClick={() => fetchLogs()} className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded hover:bg-gray-600">Refresh</button>
              </div>
              
              <div className="p-0 bg-gray-900 h-96 overflow-y-auto font-mono text-xs">
                {logs.length === 0 ? (
                    <div className="p-4 text-gray-500 italic">No logs found.</div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-gray-800 text-gray-400 sticky top-0">
                            <tr>
                                <th className="px-4 py-2 w-32">Time</th>
                                <th className="px-4 py-2 w-20">Level</th>
                                <th className="px-4 py-2">Message</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {logs.map((log) => (
                                <tr key={log._id} className="hover:bg-gray-800 transition-colors">
                                    <td className="px-4 py-2 text-gray-500 whitespace-nowrap">
                                        {new Date(log.timestamp).toLocaleTimeString()}
                                    </td>
                                    <td className="px-4 py-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                                            log.level === 'error' ? 'bg-red-900 text-red-200' :
                                            log.level === 'warn' ? 'bg-yellow-900 text-yellow-200' :
                                            'bg-blue-900 text-blue-200'
                                        }`}>
                                            {log.level}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 text-gray-300 break-all">
                                        {log.message}
                                        {log.meta && Object.keys(log.meta).length > 0 && JSON.stringify(log.meta) !== '{}' && (
                                           <div className="mt-1 text-gray-600 pl-2 border-l-2 border-gray-700 overflow-hidden text-[10px]">
                                             {JSON.stringify(log.meta)}
                                           </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
              </div>

              <div className="bg-gray-800 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button type="button" onClick={() => setShowLogs(false)} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Diagnostics Modal */}
      {showDiagnostics && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-600 opacity-75" onClick={() => !runningDiagnostics && setShowDiagnostics(false)}></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg leading-6 font-bold text-gray-900">Server Diagnostics</h3>
                </div>
                
                <div className="space-y-4">
                    {runningDiagnostics ? (
                        <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                             <svg className="animate-spin h-8 w-8 text-blue-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                             </svg>
                             <p>Running network checks...</p>
                        </div>
                    ) : diagnosticResult ? (
                        <div className="space-y-4">
                             {/* DNS Check */}
                             <div className={`p-4 rounded-md border ${diagnosticResult.dns.status === 'ok' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        {diagnosticResult.dns.status === 'ok' ? (
                                            <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        ) : (
                                            <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        )}
                                    </div>
                                    <div className="ml-3">
                                        <h3 className={`text-sm font-medium ${diagnosticResult.dns.status === 'ok' ? 'text-green-800' : 'text-red-800'}`}>
                                            Internet & DNS
                                        </h3>
                                        <div className={`mt-2 text-sm ${diagnosticResult.dns.status === 'ok' ? 'text-green-700' : 'text-red-700'}`}>
                                            {diagnosticResult.dns.message}
                                        </div>
                                    </div>
                                </div>
                             </div>

                             {/* Port Check */}
                             <div className={`p-4 rounded-md border ${diagnosticResult.port25.status === 'ok' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        {diagnosticResult.port25.status === 'ok' ? (
                                            <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        ) : (
                                            <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        )}
                                    </div>
                                    <div className="ml-3">
                                        <h3 className={`text-sm font-medium ${diagnosticResult.port25.status === 'ok' ? 'text-green-800' : 'text-red-800'}`}>
                                            Outbound Mail (Port 25)
                                        </h3>
                                        <div className={`mt-2 text-sm ${diagnosticResult.port25.status === 'ok' ? 'text-green-700' : 'text-red-700'}`}>
                                            {diagnosticResult.port25.message}
                                        </div>
                                    </div>
                                </div>
                             </div>

                             {diagnosticResult.port25.status === 'error' && (
                                 <div className="text-xs text-gray-500 italic mt-2">
                                     If Port 25 is blocked, you cannot send email directly to external providers like Gmail. 
                                     You must use a Smart Host or ask your hosting provider to unblock it.
                                 </div>
                             )}
                        </div>
                    ) : null}
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button type="button" onClick={() => setShowDiagnostics(false)} className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDashboard;
