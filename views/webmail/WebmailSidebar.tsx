import React from 'react';
import { User, EmailMessage } from '../../types';

interface Props {
  user: User;
  view: 'inbox' | 'sent' | 'drafts';
  messages: EmailMessage[];
  onCompose: () => void;
  onViewChange: (view: 'inbox' | 'sent' | 'drafts') => void;
  onSettings: () => void;
  onLogout: () => void;
}

const WebmailSidebar = ({ user, view, messages, onCompose, onViewChange, onSettings, onLogout }: Props) => {
  const unreadCount = messages.filter(m => m.folder === 'inbox' && !m.is_read).length;

  return (
    <div className="w-72 bg-slate-950 flex flex-col flex-shrink-0 text-slate-400 hidden md:flex">
      <div className="h-20 flex items-center px-8 border-b border-white/5">
        <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center mr-4 text-white font-black text-lg shadow-lg shadow-emerald-900/40">E</div>
        <span className="text-white font-black tracking-tight text-xl">Eeina<span className="text-emerald-500">Node</span></span>
      </div>
      
      <div className="p-6">
        <button 
          onClick={onCompose}
          className="w-full flex items-center justify-center px-6 py-4 bg-emerald-600 text-white rounded-2xl shadow-xl shadow-emerald-900/20 hover:bg-emerald-50 hover:scale-[1.02] transition-all font-black text-sm mb-10 transform active:scale-95"
        >
          <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
          Compose Message
        </button>
        
        <nav className="space-y-2">
          <button onClick={() => onViewChange('inbox')} className={`w-full group flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${view === 'inbox' ? 'bg-white/10 text-white shadow-inner' : 'hover:bg-white/5 text-slate-500 hover:text-white'}`}>
            <div className="flex items-center">
              <svg className={`w-5 h-5 mr-4 transition-colors ${view === 'inbox' ? 'text-emerald-500' : 'text-slate-600 group-hover:text-emerald-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
              Inbox
            </div>
            {unreadCount > 0 && (<span className="bg-emerald-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full">{unreadCount > 99 ? '99+' : unreadCount}</span>)}
          </button>
          <button onClick={() => onViewChange('drafts')} className={`w-full group flex items-center px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${view === 'drafts' ? 'bg-white/10 text-white shadow-inner' : 'hover:bg-white/5 text-slate-500 hover:text-white'}`}>
             <svg className={`w-5 h-5 mr-4 transition-colors ${view === 'drafts' ? 'text-emerald-500' : 'text-slate-600 group-hover:text-emerald-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
             Drafts
          </button>
          <button onClick={() => onViewChange('sent')} className={`w-full group flex items-center px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${view === 'sent' ? 'bg-white/10 text-white shadow-inner' : 'hover:bg-white/5 text-slate-500 hover:text-white'}`}>
             <svg className={`w-5 h-5 mr-4 transition-colors ${view === 'sent' ? 'text-emerald-500' : 'text-slate-600 group-hover:text-emerald-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
             Sent Items
          </button>
        </nav>
      </div>
      
      <div className="mt-auto p-6 border-t border-white/5 bg-slate-900/50">
        <div className="flex items-center gap-4 mb-6 px-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white text-sm font-black ring-4 ring-slate-800 shadow-xl">{user.email.charAt(0).toUpperCase()}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-white truncate leading-none mb-1">{user.email.split('@')[0]}</p>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Node</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
            <button onClick={onSettings} className="flex items-center justify-center px-4 py-2.5 text-[10px] font-black uppercase tracking-widest bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all border border-slate-700/50">Settings</button>
            <button onClick={onLogout} className="flex items-center justify-center px-4 py-2.5 text-[10px] font-black uppercase tracking-widest bg-red-900/10 hover:bg-red-900/30 text-red-500 rounded-xl transition-all border border-red-900/20">Exit</button>
        </div>
      </div>
    </div>
  );
};

export default WebmailSidebar;