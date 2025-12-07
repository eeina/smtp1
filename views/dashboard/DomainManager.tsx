import React from 'react';
import { Domain } from '../../types';

interface Props {
  domains: Domain[];
  newDomain: string;
  setNewDomain: (val: string) => void;
  onAddDomain: (e: React.FormEvent) => void;
  onVerify: (id: string) => void;
  onOpenDns: (domain: Domain) => void;
  loading: boolean;
  selectedDomainId: string | null;
  setSelectedDomainId: (id: string | null) => void;
  
  // Mailbox Form Props
  newMailboxEmail: string;
  setNewMailboxEmail: (val: string) => void;
  newMailboxPassword: string;
  setNewMailboxPassword: (val: string) => void;
  onCreateMailbox: (e: React.FormEvent) => void;
}

const DomainManager = (props: Props) => {
  const handleCopy = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    const btn = e.currentTarget as HTMLButtonElement;
    const original = btn.innerText;
    btn.innerText = 'Copied!';
    setTimeout(() => btn.innerText = original, 1000);
  };

  return (
    <div className="bg-white shadow-md rounded-xl p-4 sm:p-6 border border-gray-100">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
            <h3 className="text-lg font-bold text-gray-900">Domains</h3>
            <p className="text-sm text-gray-500">Manage your verified sending domains</p>
        </div>
        <form onSubmit={props.onAddDomain} className="flex gap-2 w-full sm:w-auto">
          <input 
            type="text" 
            placeholder="example.com" 
            className="flex-1 border-gray-300 rounded-lg shadow-sm border px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
            value={props.newDomain}
            onChange={e => props.setNewDomain(e.target.value)}
          />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm">
            Add
          </button>
        </form>
      </div>

      <div className="space-y-4">
        {props.domains.length === 0 && (
            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <p className="text-gray-500 text-sm font-medium">No domains added yet.</p>
                <p className="text-gray-400 text-xs mt-1">Add a domain to start sending emails.</p>
            </div>
        )}
        
        {props.domains.map(domain => (
          <div key={domain._id} className="border border-gray-200 rounded-xl p-4 sm:p-5 hover:border-blue-200 transition-colors bg-white">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
              <div className="flex-1 min-w-0">
                <h4 className="text-lg font-bold text-gray-800 truncate">{domain.name}</h4>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${domain.is_verified ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-yellow-100 text-yellow-800 border border-yellow-200'}`}>
                    {domain.is_verified ? 'Verified' : 'Unverified'}
                  </span>
                  {domain.mx_status === 'active' && (
                    <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                      MX Active
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                {!domain.is_verified && (
                  <button 
                    onClick={() => props.onVerify(domain._id)}
                    disabled={props.loading}
                    className="flex-1 md:flex-none text-center text-sm bg-yellow-500 text-white px-3 py-2 rounded-lg hover:bg-yellow-600 transition font-medium shadow-sm"
                  >
                    {props.loading ? '...' : 'Check Verify'}
                  </button>
                )}
                <button 
                  onClick={() => props.onOpenDns(domain)}
                  className="flex-1 md:flex-none text-center text-sm border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  DNS Setup
                </button>
                {domain.is_verified && (
                  <button 
                    onClick={() => props.setSelectedDomainId(domain._id === props.selectedDomainId ? null : domain._id)}
                    className={`flex-1 md:flex-none text-center text-sm border px-3 py-2 rounded-lg transition font-medium ${domain._id === props.selectedDomainId ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-blue-200 text-blue-600 hover:bg-blue-50'}`}
                  >
                    Manage Users
                  </button>
                )}
              </div>
            </div>
            
            {!domain.is_verified && (
              <div className="mt-4 bg-orange-50 border border-orange-100 p-4 rounded-lg">
                 <div className="flex justify-between items-center mb-2">
                    <p className="text-xs font-bold text-orange-800 uppercase tracking-wide">Verification Token</p>
                    <span className="text-[10px] text-orange-600 font-medium bg-orange-100 px-2 py-0.5 rounded-full">TXT Record @</span>
                 </div>
                 <div className="flex items-center gap-2 bg-white border border-orange-200 rounded p-2">
                    <code className="text-xs text-orange-900 flex-1 truncate font-mono">{domain.verification_token}</code>
                    <button onClick={(e) => handleCopy(domain.verification_token, e)} className="text-xs font-bold text-orange-600 hover:text-orange-800 px-2">Copy</button>
                 </div>
              </div>
            )}

            {/* Add Mailbox Form */}
            {props.selectedDomainId === domain._id && (
              <div className="mt-4 border-t border-gray-100 pt-4 bg-gray-50/50 -mx-4 sm:-mx-5 px-4 sm:px-5 pb-1 rounded-b-xl">
                <h5 className="text-sm font-bold text-gray-800 mb-3 flex items-center">
                    <svg className="w-4 h-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                    Create Mailbox for {domain.name}
                </h5>
                <form onSubmit={props.onCreateMailbox} className="grid grid-cols-1 gap-3 sm:grid-cols-12 mb-4">
                  <div className="sm:col-span-5">
                      <input 
                        type="email" 
                        placeholder={`user@${domain.name}`}
                        className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 outline-none shadow-sm"
                        value={props.newMailboxEmail}
                        onChange={e => props.setNewMailboxEmail(e.target.value)}
                        required
                      />
                  </div>
                  <div className="sm:col-span-4">
                      <input 
                        type="password" 
                        placeholder="Password"
                        className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 outline-none shadow-sm"
                        value={props.newMailboxPassword}
                        onChange={e => props.setNewMailboxPassword(e.target.value)}
                        required
                      />
                  </div>
                  <div className="sm:col-span-3">
                     <button type="submit" className="w-full bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 shadow-sm transition">
                        Create
                     </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DomainManager;