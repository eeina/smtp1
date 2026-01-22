import React, { useState } from 'react';
import { EmailMessage } from '../../types';

interface Props {
  messages: EmailMessage[];
  selectedMsg: EmailMessage | null;
  selectedIds: Set<string>;
  loading: boolean;
  view: string;
  onSelect: (msg: EmailMessage) => void;
  onToggleSelect: (id: string, e: React.MouseEvent) => void;
  onRefresh: () => void;
  onMobileMenu: () => void;
  pagination: {
      page: number;
      totalPages: number;
      next: () => void;
      prev: () => void;
  }
}

const WebmailMessageList = ({ messages, selectedMsg, selectedIds, loading, view, onSelect, onToggleSelect, onRefresh, onMobileMenu, pagination }: Props) => {
  const [search, setSearch] = useState('');

  // Simple client-side search for the current page (server side search handled in parent conceptually, but strictly UI here)
  const displayMessages = messages.filter(m => 
    m.subject.toLowerCase().includes(search.toLowerCase()) || 
    m.from.toLowerCase().includes(search.toLowerCase()) ||
    m.to.toLowerCase().includes(search.toLowerCase())
  );

  const formatTime = (dateStr: string) => {
      const date = new Date(dateStr);
      const now = new Date();
      if (date.toDateString() === now.toDateString()) {
          return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Logic to hide this pane on mobile if a message is selected
  const containerClass = selectedMsg 
    ? "hidden md:flex w-full md:w-[350px] lg:w-[400px] xl:w-[450px]" 
    : "flex w-full md:w-[350px] lg:w-[400px] xl:w-[450px]";

  return (
    <div className={`${containerClass} flex-col border-r border-zinc-900 bg-black h-full flex-shrink-0 relative`}>
        
        {/* Header / Search */}
        <div className="h-14 flex items-center px-4 border-b border-zinc-900 gap-3">
             <button onClick={onMobileMenu} className="md:hidden text-zinc-400">
                 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
             </button>
             <div className="relative flex-1 group">
                 <svg className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-zinc-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                 <input 
                    type="text" 
                    placeholder="Search..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-700 transition-all"
                 />
             </div>
             <button onClick={onRefresh} className={`text-zinc-500 hover:text-white transition-colors ${loading ? 'animate-spin' : ''}`}>
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
             </button>
        </div>

        {/* Message List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
            {displayMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-zinc-600 space-y-2">
                    {loading ? (
                        <div className="w-6 h-6 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin"></div>
                    ) : (
                        <>
                            <svg className="w-10 h-10 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            <span className="text-xs font-medium">No messages</span>
                        </>
                    )}
                </div>
            ) : (
                <div className="divide-y divide-zinc-900">
                    {displayMessages.map(msg => {
                        const isSelected = selectedMsg?._id === msg._id;
                        const isChecked = selectedIds.has(msg._id);
                        
                        return (
                            <div 
                                key={msg._id} 
                                onClick={() => onSelect(msg)}
                                className={`
                                    relative px-4 py-3 cursor-pointer group transition-colors border-l-2
                                    ${isSelected ? 'bg-zinc-900 border-emerald-500' : 'bg-black hover:bg-zinc-900/40 border-transparent'}
                                    ${!msg.is_read && view === 'inbox' ? 'text-white' : 'text-zinc-400'}
                                `}
                            >
                                <div className="flex justify-between items-baseline mb-1">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        {!msg.is_read && view === 'inbox' && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0"></div>
                                        )}
                                        <span className={`text-sm truncate ${!msg.is_read && view === 'inbox' ? 'font-bold text-white' : 'font-medium text-zinc-300'}`}>
                                            {view === 'inbox' ? msg.from.split('<')[0].replace(/"/g, '') : `To: ${msg.to}`}
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-zinc-600 font-mono whitespace-nowrap ml-2 flex-shrink-0">{formatTime(msg.created_at)}</span>
                                </div>
                                
                                <div className={`text-sm mb-1 truncate ${!msg.is_read && view === 'inbox' ? 'font-semibold text-zinc-200' : 'font-normal text-zinc-400'}`}>
                                    {msg.subject || '(No Subject)'}
                                </div>
                                
                                <div className="text-xs text-zinc-600 line-clamp-1 h-4">
                                    {msg.text_body.substring(0, 100)}
                                </div>

                                {/* Hover Actions / Checkbox */}
                                <div className="absolute right-2 bottom-3 flex gap-2">
                                     {msg.has_attachments && (
                                         <svg className="w-4 h-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                     )}
                                     <input 
                                        type="checkbox" 
                                        checked={isChecked}
                                        onClick={(e) => onToggleSelect(msg._id, e)}
                                        readOnly
                                        className={`w-4 h-4 border-zinc-700 bg-zinc-800 rounded checked:bg-emerald-600 checked:border-emerald-600 focus:ring-0 cursor-pointer ${isChecked ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} 
                                     />
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>

        {/* Footer */}
        <div className="h-10 border-t border-zinc-900 bg-zinc-950 flex items-center justify-between px-4 text-[10px] text-zinc-500">
            <button disabled={pagination.page <= 1} onClick={pagination.prev} className="hover:text-white disabled:opacity-30">Prev</button>
            <span>Page {pagination.page} / {pagination.totalPages}</span>
            <button disabled={pagination.page >= pagination.totalPages} onClick={pagination.next} className="hover:text-white disabled:opacity-30">Next</button>
        </div>
    </div>
  );
};

export default WebmailMessageList;