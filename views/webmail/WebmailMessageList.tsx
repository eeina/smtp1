
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
  <div className="animate-pulse px-4">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="py-6 border-b border-slate-50">
        <div className="flex justify-between mb-3">
            <div className="h-4 bg-slate-100 rounded-full w-1/3"></div>
            <div className="h-3 bg-slate-50 rounded-full w-12"></div>
        </div>
        <div className="h-4 bg-slate-100 rounded-full w-3/4 mb-3"></div>
        <div className="h-2 bg-slate-50 rounded-full w-full"></div>
      </div>
    ))}
  </div>
);

const WebmailMessageList = (props: Props) => {
  const containerClass = props.selectedMsg 
    ? "hidden md:flex w-full md:w-[400px]" 
    : "flex w-full md:w-[400px]";

  return (
    <div className={`${containerClass} bg-white border-r border-slate-200/60 flex-col h-full relative z-10`}>
        {/* Header */}
        <div className="h-20 border-b border-slate-100 flex items-center justify-between px-6 bg-white/80 backdrop-blur-md sticky top-0 z-20">
            <div className="flex items-center gap-4">
                <div className="md:hidden w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white text-sm font-black shadow-lg shadow-emerald-100">
                   {props.user.email.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 capitalize leading-none mb-1">{props.view}</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{props.totalMessages} items</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                {props.selectedIds.size > 0 && (
                    <button onClick={props.onBatchDelete} className="text-red-500 hover:bg-red-50 p-2.5 rounded-xl transition-all font-black flex items-center gap-1 active:scale-90">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                )}
                <button onClick={props.onRefresh} className={`text-slate-400 hover:text-emerald-600 transition-all p-2.5 rounded-xl hover:bg-emerald-50 active:scale-90 ${props.loading ? 'animate-spin text-emerald-600' : ''}`} title="Refresh"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg></button>
            </div>
        </div>

        {/* Action Bar */}
        <div className="px-6 py-3 border-b border-slate-50 bg-slate-50/50 flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <input type="checkbox" checked={props.messages.length > 0 && props.selectedIds.size === props.messages.length} onChange={props.toggleSelectAll} className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/20 cursor-pointer"/>
            <span>Syncing 4s ago</span>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto pb-24 md:pb-0 scrollbar-hide">
            {props.loading && props.messages.length === 0 ? <MessageListSkeleton /> : props.messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-12 text-center text-slate-300 space-y-4">
                    <div className="w-20 h-20 rounded-[2.5rem] bg-slate-50 flex items-center justify-center">
                        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 mb-1">Node Empty</p>
                      <p className="text-xs font-medium">Your node is currently synced with no messages.</p>
                    </div>
                </div>
            ) : (
                props.messages.map(msg => (
                <div key={msg._id} onClick={() => props.onSelect(msg)} className={`group cursor-pointer py-6 px-6 border-b border-slate-50 transition-all relative ${props.selectedMsg?._id === msg._id ? 'bg-emerald-50/50' : 'hover:bg-slate-50/50'}`}>
                    {/* Read Indicator */}
                    {!msg.is_read && props.view === 'inbox' && (
                        <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-emerald-600 rounded-full animate-in slide-in-from-left-2"></div>
                    )}
                    
                    <div className="flex items-start gap-4">
                         <div className="pt-0.5"><input type="checkbox" checked={props.selectedIds.has(msg._id)} onClick={(e) => e.stopPropagation()} onChange={(e) => props.toggleSelection(msg._id, e)} className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/20 cursor-pointer"/></div>
                         <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1.5">
                                <span className={`text-sm truncate pr-4 leading-none ${!msg.is_read && props.view === 'inbox' ? 'font-black text-slate-900' : 'font-bold text-slate-600'}`}>{props.view === 'inbox' ? msg.from.split(' <')[0] : `To: ${msg.to}`}</span>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {msg.has_attachments && (
                                        <svg className="w-3.5 h-3.5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                    )}
                                    <span className={`text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${!msg.is_read && props.view === 'inbox' ? 'text-emerald-600' : 'text-slate-400'}`}>{timeAgo(msg.created_at)}</span>
                                </div>
                            </div>
                            <div className={`text-sm mb-2 truncate leading-tight ${!msg.is_read && props.view === 'inbox' ? 'font-black text-slate-900' : 'font-bold text-slate-500'}`}>{msg.subject || '(No Subject)'}</div>
                            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed font-medium">{msg.text_body}</p>
                         </div>
                    </div>
                </div>
                ))
            )}
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-100 bg-white/80 backdrop-blur-md flex items-center justify-between text-xs md:relative fixed bottom-16 md:bottom-0 left-0 right-0 z-30">
            <button disabled={props.page <= 1} onClick={() => props.setPage(p => Math.max(1, p - 1))} className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 font-black uppercase tracking-widest disabled:opacity-30 hover:bg-slate-50 active:scale-95 transition-all">Prev</button>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Node {props.page} / {props.totalPages || 1}</span>
            <button disabled={props.page >= props.totalPages} onClick={() => props.setPage(p => p + 1)} className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 font-black uppercase tracking-widest disabled:opacity-30 hover:bg-slate-50 active:scale-95 transition-all">Next</button>
        </div>
    </div>
  );
};

export default WebmailMessageList;
