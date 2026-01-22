import React, { useState, useMemo } from 'react';
import { Mailbox } from '../../types';

interface Props {
  mailboxes: Mailbox[];
  onDeleteMailbox: (id: string) => void;
  onEditMailbox: (mailbox: Mailbox) => void;
  onAccessMailbox: (id: string) => void;
}

const MailboxManager = ({ mailboxes, onDeleteMailbox, onEditMailbox, onAccessMailbox }: Props) => {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return mailboxes;
    return mailboxes.filter(m => 
        m.email.toLowerCase().includes(search.toLowerCase()) || 
        (m.first_name && m.first_name.toLowerCase().includes(search.toLowerCase())) ||
        (m.last_name && m.last_name.toLowerCase().includes(search.toLowerCase()))
    );
  }, [mailboxes, search]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl flex flex-col h-[calc(100vh-8rem)] sticky top-6 shadow-2xl overflow-hidden ring-1 ring-white/5">
      
      {/* Search Header */}
      <div className="p-4 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800 z-10 flex flex-col gap-3">
          <div className="flex items-center justify-between">
              <h3 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></span>
                  Accounts
              </h3>
              <div className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-400">
                  {filtered.length} / {mailboxes.length}
              </div>
          </div>
          <div className="relative group">
               <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
               <input 
                  type="text" 
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs font-medium text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  placeholder="Filter mailboxes..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
               />
          </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
         {filtered.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                 <div className="w-12 h-12 bg-slate-800/50 rounded-full flex items-center justify-center mb-3">
                     <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                 </div>
                 <p className="text-xs text-slate-500 font-medium">No mailboxes found.</p>
             </div>
         ) : (
             filtered.map(mb => {
                const quota = (mb as any).quota_bytes || 1073741824;
                const gb = Math.round(quota / 1024 / 1024 / 1024);
                
                return (
                    <div key={mb._id} className="group p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-transparent hover:border-slate-700/50 transition-all flex items-center justify-between relative overflow-hidden">
                        
                        <div className="flex items-center gap-3 min-w-0 z-10">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-slate-800 to-slate-700 border border-slate-600/30 flex items-center justify-center text-xs font-black text-slate-200 shrink-0 group-hover:from-blue-600 group-hover:to-indigo-600 group-hover:text-white transition-all shadow-lg">
                                {mb.first_name ? mb.first_name[0].toUpperCase() : mb.email[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-baseline gap-1.5">
                                    <h4 className="text-slate-200 font-bold text-xs truncate max-w-[120px]" title={mb.email}>
                                        {mb.email.split('@')[0]}
                                    </h4>
                                    <span className="text-[10px] text-slate-600 truncate">@{mb.email.split('@')[1]}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                                        {gb}GB
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Hover Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 absolute right-2 bg-slate-800 pl-2 rounded-l-lg shadow-[-10px_0_10px_rgba(30,41,59,0.9)]">
                            <button 
                                onClick={() => onAccessMailbox(mb._id)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-colors"
                                title="Login to Inbox"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
                            </button>
                            <button 
                                onClick={() => onEditMailbox(mb)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-colors"
                                title="Edit Settings"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            </button>
                            <button 
                                onClick={() => onDeleteMailbox(mb._id)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                                title="Delete Account"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </div>
                    </div>
                )
             })
         )}
      </div>
    </div>
  );
};

export default MailboxManager;