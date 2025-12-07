import React from 'react';
import { Mailbox } from '../../types';

interface Props {
  mailboxes: Mailbox[];
}

const MailboxManager = ({ mailboxes }: Props) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden h-fit">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900">Active Mailboxes</h3>
          <span className="bg-gray-100 text-gray-600 py-1 px-3 rounded-full text-xs font-semibold">{mailboxes.length}</span>
      </div>
      
      <div className="p-0">
        {mailboxes.length === 0 && (
            <div className="p-8 text-center text-gray-400 text-sm">
                No mailboxes created yet.
            </div>
        )}
        <div className="divide-y divide-gray-50">
        {mailboxes.map(mb => (
          <div key={mb._id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group">
            <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-sm flex-shrink-0 ring-2 ring-white">
                    {mb.email.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-800 truncate" title={mb.email}>{mb.email}</div>
                    <div className="text-xs text-gray-400">1 GB Storage</div>
                </div>
            </div>
            <div className="flex items-center">
                 <button className="text-gray-300 hover:text-gray-500 p-1 rounded-md transition-colors opacity-0 group-hover:opacity-100">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                 </button>
            </div>
          </div>
        ))}
        </div>
      </div>
    </div>
  );
};

export default MailboxManager;
