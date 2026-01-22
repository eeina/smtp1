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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden h-fit">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900">Active Mailboxes</h3>
          <span className="bg-blue-50 text-blue-700 py-1 px-3 rounded-full text-xs font-bold">{mailboxes.length}</span>
      </div>
      
      <div className="p-0">
        {mailboxes.length === 0 && (
            <div className="p-8 text-center text-gray-400 text-sm">
                No mailboxes created yet.
            </div>
        )}
        <div className="divide-y divide-gray-50">
        {mailboxes.map(mb => {
            const quota = (mb as any).quota_bytes || 1073741824;
            const formattedQuota = Math.round(quota / 1024 / 1024 / 1024);
            
            return (
              <div key={mb._id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-sm flex-shrink-0 ring-2 ring-white">
                        {mb.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1 mr-4">
                        <div className="text-sm font-semibold text-gray-800 truncate" title={mb.email}>{mb.email}</div>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full max-w-[100px] overflow-hidden">
                                {/* Simulating 0% usage for now since backend doesn't track live usage yet, but UI is ready */}
                                <div className="h-full bg-green-500 rounded-full w-[5%]"></div>
                            </div>
                            <div className="text-[10px] text-gray-400 font-medium">
                                {formattedQuota} GB
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                     <button 
                        onClick={() => onAccessMailbox(mb._id)}
                        className="text-gray-300 hover:text-emerald-600 bg-white hover:bg-emerald-50 border border-transparent hover:border-emerald-200 p-2 rounded-md transition-all opacity-0 group-hover:opacity-100"
                        title="Access Inbox"
                     >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                     </button>
                     <button 
                        onClick={() => onEditMailbox(mb)}
                        className="text-gray-300 hover:text-blue-600 p-2 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                        title="Edit Mailbox"
                     >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                     </button>
                     <button 
                        onClick={() => onDeleteMailbox(mb._id)}
                        className="text-gray-300 hover:text-red-600 p-2 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete Mailbox"
                     >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                     </button>
                </div>
              </div>
            );
        })}
        </div>
      </div>
    </div>
  );
};

export default MailboxManager;