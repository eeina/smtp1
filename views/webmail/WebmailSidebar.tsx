import React from 'react';
import { User, EmailMessage } from '../../types';

interface Props {
  user: User;
  view: 'inbox' | 'sent';
  messages: EmailMessage[];
  onCompose: () => void;
  onViewChange: (view: 'inbox' | 'sent') => void;
  onSettings: () => void;
  onLogout: () => void;
}

const WebmailSidebar = ({ user, view, messages, onCompose, onViewChange, onSettings, onLogout }: Props) => {
  const unreadCount = messages.filter(m => m.folder === 'inbox' && !m.is_read).length;

  return (
    <div className="w-64 bg-gray-900 flex flex-col flex-shrink-0 text-gray-300 hidden md:flex border-r border-gray-800">
      <div className="h-16 flex items-center px-6 border-b border-gray-800">
        <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center mr-3 text-white font-bold text-sm shadow-lg shadow-green-900/20">E</div>
        <span className="text-white font-bold tracking-tight text-lg">Eeina</span>
      </div>
      
      <div className="p-4">
        <button 
          onClick={onCompose}
          className="w-full flex items-center justify-center px-4 py-3 bg-white text-gray-900 rounded-xl shadow-sm hover:bg-green-50 hover:text-green-700 transition-all font-semibold text-sm mb-8 transform hover:scale-[1.02]"
        >
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
          Compose
        </button>
        
        <nav className="space-y-1">
          <button onClick={() => onViewChange('inbox')} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${view === 'inbox' ? 'bg-gray-800 text-white shadow-inner' : 'hover:bg-gray-800/50 text-gray-400 hover:text-white'}`}>
            <div className="flex items-center"><svg className="w-5 h-5 mr-3 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>Inbox</div>
            {unreadCount > 0 && (<span className="bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">{unreadCount > 99 ? '99+' : unreadCount}</span>)}
          </button>
          <button onClick={() => onViewChange('sent')} className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${view === 'sent' ? 'bg-gray-800 text-white shadow-inner' : 'hover:bg-gray-800/50 text-gray-400 hover:text-white'}`}>
             <svg className="w-5 h-5 mr-3 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>Sent
          </button>
        </nav>
      </div>
      
      <div className="mt-auto p-4 border-t border-gray-800">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-green-500 to-emerald-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-gray-700">{user.email.charAt(0).toUpperCase()}</div>
          <div className="flex-1 min-w-0"><p className="text-sm font-medium text-white truncate">{user.email}</p><div className="flex items-center gap-1.5 mt-0.5"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span><p className="text-xs text-gray-500 truncate">Connected</p></div></div>
        </div>
        <div className="grid grid-cols-2 gap-2">
            <button onClick={onSettings} className="flex items-center justify-center px-3 py-2 text-xs font-medium bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-700">Settings</button>
            <button onClick={onLogout} className="flex items-center justify-center px-3 py-2 text-xs font-medium bg-gray-800 hover:bg-red-900/30 hover:text-red-400 rounded-lg transition-colors border border-gray-700 hover:border-red-900/50">Logout</button>
        </div>
      </div>
    </div>
  );
};

export default WebmailSidebar;