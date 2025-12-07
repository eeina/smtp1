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
    // Simple feedback without adding a new UI library
    const btn = document.activeElement as HTMLButtonElement;
    if(btn) {
      const original = btn.innerText;
      btn.innerText = 'Copied!';
      setTimeout(() => btn.innerText = original, 2000);
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
                      <div className="mt-4 bg-orange-50 border border-orange-100 p-4 rounded-md">
                        <div className="flex items-start gap-3">
                          <div className="text-orange-400 mt-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-bold text-orange-900 mb-2">Domain Verification Required</h4>
                            <p className="text-sm text-orange-800 mb-3">
                              Go to your domain provider (GoDaddy, Namecheap, Cloudflare, etc.) and add the following <strong>TXT Record</strong> to verify ownership.
                            </p>
                            
                            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden text-sm">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider text-xs">Type</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider text-xs">Host / Name</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider text-xs">Value / Content</th>
                                    <th className="px-3 py-2"></th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  <tr>
                                    <td className="px-3 py-2 whitespace-nowrap font-mono text-gray-700">TXT</td>
                                    <td className="px-3 py-2 whitespace-nowrap font-mono text-gray-700">@</td>
                                    <td className="px-3 py-2 font-mono text-gray-500 break-all">{domain.verification_token}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-right">
                                      <button 
                                        onClick={() => handleCopy(domain.verification_token)}
                                        className="text-blue-600 hover:text-blue-900 font-medium text-xs border border-blue-200 px-2 py-1 rounded hover:bg-blue-50"
                                      >
                                        Copy
                                      </button>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                            <p className="text-xs text-orange-600 mt-2">
                              Note: DNS propagation can take anywhere from a few minutes to 24 hours.
                            </p>
                          </div>
                        </div>
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

export default ClientDashboard;
