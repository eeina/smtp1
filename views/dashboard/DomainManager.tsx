import React from 'react';
import { Domain } from '../../types';

interface Props {
  domains: Domain[];
  newDomain: string;
  setNewDomain: (val: string) => void;
  onAddDomain: (e: React.FormEvent) => void;
  onDeleteDomain: (id: string) => void;
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
    btn.innerText = 'COPIED';
    setTimeout(() => btn.innerText = original, 1000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
            Domains
          </h3>
          <form onSubmit={props.onAddDomain} className="flex gap-2">
             <input 
                type="text" 
                placeholder="example.com" 
                className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none placeholder:text-slate-600 w-48 transition-all"
                value={props.newDomain}
                onChange={e => props.setNewDomain(e.target.value)}
              />
              <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-lg transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              </button>
          </form>
      </div>

      <div className="grid grid-cols-1 gap-4">
          {props.domains.length === 0 && (
              <div className="bg-slate-900 border border-dashed border-slate-800 rounded-2xl p-8 text-center">
                  <p className="text-slate-500 mb-2">No domains configured.</p>
                  <p className="text-xs text-slate-600">Add a domain to start routing email.</p>
              </div>
          )}
          
          {props.domains.map(domain => (
              <div key={domain._id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all group relative overflow-hidden">
                  <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                          <div className="flex items-center gap-3">
                              <h4 className="text-lg font-bold text-white">{domain.name}</h4>
                              {domain.is_verified ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Verified</span>
                              ) : (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20">Pending</span>
                              )}
                          </div>
                          
                          {domain.is_verified && (
                             <div className="mt-2 flex items-center gap-4 text-xs text-slate-500 font-mono">
                                 <span className="flex items-center gap-1.5">
                                    <span className={`w-1.5 h-1.5 rounded-full ${domain.mx_status === 'active' ? 'bg-blue-500' : 'bg-slate-600'}`}></span>
                                    MX: {domain.mx_status === 'active' ? 'Active' : 'Checking...'}
                                 </span>
                                 <span className="flex items-center gap-1.5">
                                    <span className={`w-1.5 h-1.5 rounded-full ${domain.dkim_public_key ? 'bg-purple-500' : 'bg-slate-600'}`}></span>
                                    DKIM: {domain.dkim_public_key ? 'Generated' : 'Missing'}
                                 </span>
                             </div>
                          )}
                      </div>

                      <div className="flex items-center gap-2">
                          {!domain.is_verified && (
                              <button 
                                onClick={() => props.onVerify(domain._id)}
                                className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-colors"
                              >
                                  {props.loading ? 'Checking...' : 'Verify DNS'}
                              </button>
                          )}
                          <button 
                             onClick={() => props.onOpenDns(domain)}
                             className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-colors border border-slate-700"
                          >
                              DNS Records
                          </button>
                          {domain.is_verified && (
                              <button 
                                onClick={() => props.setSelectedDomainId(domain._id === props.selectedDomainId ? null : domain._id)}
                                className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-colors border ${domain._id === props.selectedDomainId ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'}`}
                              >
                                  + User
                              </button>
                          )}
                          <button 
                              onClick={() => props.onDeleteDomain(domain._id)}
                              className="text-slate-600 hover:text-red-500 p-1.5 transition-colors"
                              title="Delete Domain"
                          >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                      </div>
                  </div>

                  {!domain.is_verified && (
                      <div className="mt-4 bg-slate-950/50 p-3 rounded-lg border border-slate-800 flex items-center gap-3">
                          <code className="text-xs text-amber-500 font-mono">TXT @</code>
                          <code className="flex-1 text-xs text-slate-400 font-mono truncate bg-slate-900 px-2 py-1 rounded">{domain.verification_token}</code>
                          <button onClick={(e) => handleCopy(domain.verification_token, e)} className="text-[10px] font-bold uppercase text-slate-500 hover:text-white">Copy</button>
                      </div>
                  )}

                  {props.selectedDomainId === domain._id && (
                      <div className="mt-4 pt-4 border-t border-slate-800 animate-in slide-in-from-top-2">
                          <form onSubmit={props.onCreateMailbox} className="flex flex-wrap gap-2 items-end">
                              <div className="flex-1 min-w-[150px]">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase">Username</label>
                                  <div className="flex items-center">
                                     <input type="text" className="bg-slate-800 border border-slate-700 rounded-l-lg px-3 py-1.5 text-sm text-white focus:ring-1 focus:ring-emerald-500 outline-none w-full" placeholder="user" value={props.newMailboxEmail.split('@')[0]} onChange={e => props.setNewMailboxEmail(e.target.value + '@' + domain.name)} required />
                                     <span className="bg-slate-700 border border-slate-700 border-l-0 rounded-r-lg px-2 py-1.5 text-xs text-slate-400">@{domain.name}</span>
                                  </div>
                              </div>
                              <div className="w-32">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase">Password</label>
                                  <input type="password" className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:ring-1 focus:ring-emerald-500 outline-none w-full" placeholder="Secret" value={props.newMailboxPassword} onChange={e => props.setNewMailboxPassword(e.target.value)} required />
                              </div>
                              <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-lg text-sm font-bold h-[34px]">Create</button>
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