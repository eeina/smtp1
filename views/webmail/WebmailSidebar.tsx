import React from 'react';
import { User } from '../../types';

interface Props {
  user: User;
  view: string;
  unreadCount: number;
  onCompose: () => void;
  onViewChange: (v: 'inbox' | 'sent' | 'drafts') => void;
  onSettings: () => void;
  onLogout: () => void;
  onAdminPanel?: () => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}

const WebmailSidebar = ({ user, view, unreadCount, onCompose, onViewChange, onSettings, onLogout, onAdminPanel, mobileOpen, setMobileOpen }: Props) => {
  
  const NavItem = ({ id, label, icon }: any) => (
      <button 
        onClick={() => { onViewChange(id); setMobileOpen(false); }}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            view === id 
            ? 'bg-zinc-800 text-white shadow-sm' 
            : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
        }`}
      >
          <div className="flex items-center gap-3">
              {icon}
              <span>{label}</span>
          </div>
          {id === 'inbox' && unreadCount > 0 && (
              <span className="bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md min-w-[20px] text-center">
                  {unreadCount}
              </span>
          )}
      </button>
  );

  return (
    <>
        {/* Mobile Backdrop */}
        {mobileOpen && (
            <div className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-sm" onClick={() => setMobileOpen(false)}></div>
        )}

        <div className={`
            fixed inset-y-0 left-0 z-50 w-64 bg-black border-r border-zinc-900 flex flex-col transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
            ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
            {/* Header */}
            <div className="h-14 flex items-center px-4 border-b border-zinc-900">
                <div className="w-6 h-6 bg-emerald-600 rounded-md flex items-center justify-center text-white font-bold text-xs mr-2">E</div>
                <span className="font-bold text-zinc-200 tracking-tight">Eeina<span className="text-zinc-500">Mail</span></span>
            </div>

            {/* Compose */}
            <div className="p-3">
                <button 
                    onClick={() => { onCompose(); setMobileOpen(false); }}
                    className="w-full bg-white text-black hover:bg-zinc-200 font-bold text-sm py-2 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    New Message
                </button>
            </div>

            {/* Navigation */}
            <div className="flex-1 px-3 space-y-0.5 mt-2">
                <div className="px-3 py-2 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Mailbox</div>
                
                <NavItem 
                    id="inbox" 
                    label="Inbox" 
                    icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>}
                />
                <NavItem 
                    id="sent" 
                    label="Sent" 
                    icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>}
                />
                <NavItem 
                    id="drafts" 
                    label="Drafts" 
                    icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
                />
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-zinc-900 bg-zinc-950">
                <div className="flex items-center gap-3 mb-3 px-1">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-300 border border-zinc-700">
                        {user.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium text-white truncate" title={user.email}>{user.email}</div>
                        <div className="text-[10px] text-zinc-500 truncate">Pro Plan</div>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                     <button onClick={onSettings} className="bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white py-1.5 rounded text-xs font-medium transition-colors border border-zinc-800">Settings</button>
                     <button onClick={onLogout} className="bg-zinc-900 hover:bg-red-900/20 text-zinc-400 hover:text-red-400 py-1.5 rounded text-xs font-medium transition-colors border border-zinc-800">Logout</button>
                </div>
                
                {onAdminPanel && (
                    <button onClick={onAdminPanel} className="w-full mt-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-500 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors border border-blue-600/20">
                        Switch to Admin
                    </button>
                )}
            </div>
        </div>
    </>
  );
};

export default WebmailSidebar;