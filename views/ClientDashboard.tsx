import React, { useState, useEffect } from 'react';
import api from '../api';
import { User, Domain, Mailbox } from '../types';

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
                          onClick={() => setViewDnsDomain(domain)}
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
                <h3 className="text-xl leading-6 font-bold text-gray-900 mb-4">DNS Configuration: {viewDnsDomain.name}</h3>
                <p className="text-sm text-gray-500 mb-4">
                   Add these records to your domain's DNS settings (e.g., Namecheap, GoDaddy, Cloudflare) to verify ownership and enable sending/receiving.
                </p>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 border">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Host/Name</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                        <th className="px-3 py-2"></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 text-sm">
                      {/* 1. VERIFICATION TXT */}
                      <tr>
                        <td className="px-3 py-2 font-mono">TXT</td>
                        <td className="px-3 py-2 font-mono">@</td>
                        <td className="px-3 py-2 font-mono break-all text-gray-600">{viewDnsDomain.verification_token}</td>
                        <td className="px-3 py-2"><button onClick={() => handleCopy(viewDnsDomain.verification_token)} className="text-blue-600 hover:underline">Copy</button></td>
                      </tr>
                      {/* 2. A RECORD (Mail Server IP) */}
                      <tr>
                         <td className="px-3 py-2 font-mono">A</td>
                         <td className="px-3 py-2 font-mono">mail</td>
                         <td className="px-3 py-2 font-mono break-all text-gray-600">Your Server IP</td>
                         <td className="px-3 py-2"><span className="text-xs text-gray-400">Manual</span></td>
                      </tr>
                      {/* 3. MX RECORD */}
                      <tr>
                         <td className="px-3 py-2 font-mono">MX</td>
                         <td className="px-3 py-2 font-mono">@</td>
                         <td className="px-3 py-2 font-mono break-all text-gray-600">mail.{viewDnsDomain.name} (Priority 10)</td>
                         <td className="px-3 py-2"><button onClick={() => handleCopy(`mail.${viewDnsDomain.name}`)} className="text-blue-600 hover:underline">Copy</button></td>
                      </tr>
                       {/* 4. SPF */}
                       <tr>
                         <td className="px-3 py-2 font-mono">TXT</td>
                         <td className="px-3 py-2 font-mono">@</td>
                         <td className="px-3 py-2 font-mono break-all text-gray-600">v=spf1 mx ~all</td>
                         <td className="px-3 py-2"><button onClick={() => handleCopy('v=spf1 mx ~all')} className="text-blue-600 hover:underline">Copy</button></td>
                      </tr>
                      {/* 5. DMARC */}
                      <tr>
                         <td className="px-3 py-2 font-mono">TXT</td>
                         <td className="px-3 py-2 font-mono">_dmarc</td>
                         <td className="px-3 py-2 font-mono break-all text-gray-600">v=DMARC1; p=none;</td>
                         <td className="px-3 py-2"><button onClick={() => handleCopy('v=DMARC1; p=none;')} className="text-blue-600 hover:underline">Copy</button></td>
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
    </div>
  );
};

export default ClientDashboard;
