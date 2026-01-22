import React from 'react';
import { Mailbox } from '../../types';

interface Props {
  mailboxes: Mailbox[];
  onDeleteMailbox: (id: string) => void;
  onEditMailbox: (mailbox: Mailbox) => void;
  onAccessMailbox: (id: string) => void;
}

const MailboxManager = ({ mailboxes, onDeleteMailbox, onEditMailbox, onAccessMailbox }: Props) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            Mailboxes
          </h3>
          <span className="bg-slate-800 text-slate-300 text-xs font-bold px-2 py-1 rounded border border-slate-700">{mailboxes.length} Active</span>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {mailboxes.length === 0 ? (
            <div className="p-8 text-center text-slate-600 text-sm">
                No mailboxes found. Create one under a domain.
            </div>
        ) : (
            <div className="divide-y divide-slate-800">
                {mailboxes.map(mb => {
                    const quota = (mb as any).quota_bytes || 1073741824;
                    const formattedQuota = Math.round(quota / 1024 / 1024 / 1024);
                    const hasViewed = !!mb.last_admin_access;

                    return (
                        <div key={mb._id} className="p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors group">
                            <div className="flex items-center gap-4 min-w-0">
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold text-sm shadow-lg shadow-blue-900/20">
                                        {mb.email.charAt(0).toUpperCase()}
                                    </div>
                                    {!hasViewed && (
                                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-slate-900"></span>
                                        </span>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <div className="text-sm font-bold text-slate-200 truncate">{mb.email}</div>
                                        {!hasViewed && (
                                            <span className="text-[9px] font-black uppercase tracking-wide text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded border border-red-400/20">Unreviewed</span>
                                        )}
                                    </div>
                                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                                        <span>{formattedQuota} GB Allocated</span>
                                        <span className="text-slate-700">•</span>
                                        <span className="text-slate-500">IMAP/SMTP Active</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => onAccessMailbox(mb._id)}
                                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-emerald-900/20 hover:shadow-emerald-900/40"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    View Inbox
                                </button>
                                
                                <div className="h-6 w-px bg-slate-800 mx-1"></div>

                                <button 
                                    onClick={() => onEditMailbox(mb)}
                                    className="text-slate-500 hover:text-blue-400 transition-colors p-1.5"
                                    title="Edit Settings"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                </button>
                                <button 
                                    onClick={() => onDeleteMailbox(mb._id)}
                                    className="text-slate-500 hover:text-red-500 transition-colors p-1.5"
                                    title="Delete Mailbox"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
      </div>
    </div>
  );
};

export default MailboxManager;