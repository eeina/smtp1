import React from 'react';
import { User, EmailMessage } from '../../types';

interface Props {
  messages: EmailMessage[];
  selectedMsg: EmailMessage | null;
  onSelect: (msg: EmailMessage) => void;
  view: 'inbox' | 'sent';
  loading: boolean;
  onRefresh: () => void;
  selectedIds: Set<string>;
  toggleSelectAll: () => void;
  toggleSelection: (id: string, e: React.SyntheticEvent) => void;
  onBatchDelete: () => void;
  page: number;
  totalPages: number;
  setPage: (p: number | ((prev: number) => number)) => void;
  totalMessages: number;
  user: User;
}

const timeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m";
    return "just now";
};

const MessageListSkeleton = () => (
  <div className="animate-pulse">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="p-4 border-b border-gray-50">
        <div className="flex justify-between mb-2">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-3 bg-gray-200 rounded w-12"></div>
        </div>
        <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-2 bg-gray-100 rounded w-full"></div>
      </div>
    ))}
  </div>
);

const WebmailMessageList = (props: Props) => {
  // If a message is selected on mobile, we hide the list to show the reading pane
  // On desktop (md), we always show the list as a sidebar
  const containerClass = props.selectedMsg 
    ? "hidden md:flex w-full md:w-96" 
    : "flex w-full md:w-96";

  return (
    <div className={`${containerClass} bg-white border-r border-gray-200 flex-col shadow-sm z-10 h-full`}>
        {/* Header */}
        <div className="h-16 border-b border-gray-100 flex items-center justify-between px-4 bg-white sticky top-0 z-20">
            <div className="flex items-center gap-3">
                {/* Mobile User Avatar */}
                <div className="md:hidden w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-gray-100 shadow-sm">
                   {props.user.email.charAt(0).toUpperCase()}
                </div>
                <h2 className="text-lg font-bold text-gray-900 capitalize">{props.view}</h2>
                <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{props.totalMessages}</span>
            </div>
            <div className="flex items-center gap-2">
                {props.selectedIds.size > 0 && (
                    <button onClick={props.onBatchDelete} className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors text-xs font-bold flex items-center gap-1 animate-in fade-in">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                )}
                <button onClick={props.onRefresh} className={`text-gray-400 hover:text-green-600 transition-colors p-2 rounded-full hover:bg-gray-50 ${props.loading ? 'animate-spin text-green-600' : ''}`} title="Refresh"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg></button>
            </div>
        </div>

        {/* Select All Bar */}
        <div className="px-4 py-2 border-b border-gray-100 bg-gray-50 flex items-center gap-3 text-xs text-gray-500">
            <input type="checkbox" checked={props.messages.length > 0 && props.selectedIds.size === props.messages.length} onChange={props.toggleSelectAll} className="rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"/>
            <span>Select All</span>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto pb-20 md:pb-0 scrollbar-thin scrollbar-thumb-gray-200">
            {props.loading && props.messages.length === 0 ? <MessageListSkeleton /> : props.messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2">
                    <svg className="w-12 h-12 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    <p className="text-sm font-medium">No messages</p>
                </div>
            ) : (
                props.messages.map(msg => (
                <div key={msg._id} onClick={() => props.onSelect(msg)} className={`cursor-pointer p-4 border-b border-gray-50 hover:bg-gray-50 transition-all group relative ${props.selectedMsg?._id === msg._id ? 'bg-green-50/60 border-l-4 border-l-green-600 pl-3' : 'border-l-4 border-l-transparent'}`}>
                    <div className="flex items-start gap-3">
                         <div className="pt-1"><input type="checkbox" checked={props.selectedIds.has(msg._id)} onClick={(e) => e.stopPropagation()} onChange={(e) => props.toggleSelection(msg._id, e)} className="rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"/></div>
                         <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                                <span className={`text-sm truncate pr-2 ${!msg.is_read && props.view === 'inbox' ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>{props.view === 'inbox' ? msg.from : `To: ${msg.to}`}</span>
                                <span className={`text-[10px] whitespace-nowrap ${!msg.is_read && props.view === 'inbox' ? 'text-green-600 font-bold' : 'text-gray-400'}`}>{timeAgo(msg.created_at)}</span>
                            </div>
                            <div className={`text-sm mb-1 truncate ${!msg.is_read && props.view === 'inbox' ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>{msg.subject || '(No Subject)'}</div>
                            <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{msg.text_body}</p>
                         </div>
                    </div>
                </div>
                ))
            )}
        </div>

        {/* Pagination */}
        <div className="p-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs md:relative fixed bottom-16 md:bottom-0 left-0 right-0 md:left-auto md:right-auto z-20">
            <button disabled={props.page <= 1} onClick={() => props.setPage(p => Math.max(1, p - 1))} className="px-3 py-1.5 rounded bg-white border border-gray-200 text-gray-600 disabled:opacity-50 hover:bg-gray-50">Prev</button>
            <span className="text-gray-500">Page {props.page} of {props.totalPages || 1}</span>
            <button disabled={props.page >= props.totalPages} onClick={() => props.setPage(p => p + 1)} className="px-3 py-1.5 rounded bg-white border border-gray-200 text-gray-600 disabled:opacity-50 hover:bg-gray-50">Next</button>
        </div>
    </div>
  );
};

export default WebmailMessageList;