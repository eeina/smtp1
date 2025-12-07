import React from 'react';
import { Mailbox } from '../../types';

interface Props {
  mailboxes: Mailbox[];
}

const MailboxManager = ({ mailboxes }: Props) => {
  return (
    <div className="bg-white shadow-md rounded-xl p-6 h-fit border border-gray-100">
      <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Mailboxes</h3>
          <span className="bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs font-medium">{mailboxes.length}</span>
      </div>
      
      <div className="space-y-3">
        {mailboxes.length === 0 && (
            <p className="text-gray-400 text-sm text-center py-4 italic">No mailboxes created.</p>
        )}
        {mailboxes.map(mb => (
          <div key={mb._id} className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded transition">
            <div className="flex items-center min-w-0">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0">
                    {mb.email.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-700 truncate" title={mb.email}>{mb.email}</div>
                    <div className="text-[10px] text-gray-400">1 GB Quota</div>
                </div>
            </div>
            {/* Future: Add delete/edit buttons here */}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MailboxManager;