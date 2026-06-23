import React from 'react';
import { User } from '../../types';

interface Props {
  user: User;
  onLogout: () => void;
  onShowLogs: () => void;
  onOpenSettings: () => void;
  onOpenInbox: () => void;
  onViewChange?: (view: 'dashboard' | 'audit' | 'admins') => void;
  currentView?: 'dashboard' | 'audit' | 'admins';
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

const DashboardSidebar = ({ 
    user, onLogout, onShowLogs, onOpenSettings, onOpenInbox, onViewChange, currentView = 'dashboard', isOpenMobile, onCloseMobile 
}: Props) => {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpenMobile && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={onCloseMobile}
          />
      )}
      
      {/* Sidebar Content */}
      <div className={`fixed inset-y-0 left-0 transform ${isOpenMobile ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 transition duration-300 ease-in-out w-64 bg-slate-900 border-r border-slate-800 flex flex-col flex-shrink-0 z-50`}>
        {/* Brand */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-950/30">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center mr-3 text-white font-black shadow-lg shadow-emerald-900/40">E</div>
            <span className="text-white font-black tracking-tight text-lg">Admin<span className="text-emerald-500">Panel</span></span>
          </div>
          <button className="lg:hidden text-slate-400 hover:text-white" onClick={onCloseMobile}>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      
      {/* Navigation */}
      <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-3 mb-2">Platform</div>
        
        <button 
            onClick={() => onViewChange && onViewChange('dashboard')}
            className={`w-full flex items-center px-3 py-2.5 rounded-xl font-bold text-sm transition-all ${currentView === 'dashboard' ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
        >
            <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            Dashboard
        </button>

        <button 
            onClick={() => onViewChange && onViewChange('audit')}
            className={`w-full flex items-center px-3 py-2.5 rounded-xl font-bold text-sm transition-all ${currentView === 'audit' ? 'bg-blue-500/10 text-blue-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
        >
             <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
            Global Audit
        </button>

        <button 
            onClick={() => onViewChange && onViewChange('admins')}
            className={`w-full flex items-center px-3 py-2.5 rounded-xl font-bold text-sm transition-all ${currentView === 'admins' ? 'bg-purple-500/10 text-purple-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
        >
             <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            Manage Admins
        </button>

        <button onClick={onOpenInbox} className="w-full flex items-center px-3 py-2.5 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all font-medium text-sm group">
            <svg className="w-5 h-5 mr-3 text-slate-500 group-hover:text-emerald-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            Personal Inbox
        </button>

        <div className="mt-8 text-[10px] font-black uppercase tracking-widest text-slate-500 px-3 mb-2">System</div>

        <button onClick={onShowLogs} className="w-full flex items-center px-3 py-2.5 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all font-medium text-sm group">
            <svg className="w-5 h-5 mr-3 text-slate-500 group-hover:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            Server Logs
        </button>

        <button onClick={onOpenSettings} className="w-full flex items-center px-3 py-2.5 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all font-medium text-sm group">
            <svg className="w-5 h-5 mr-3 text-slate-500 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Configuration
        </button>
      </div>

      {/* User Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-900">
        <div className="flex items-center gap-3 mb-4">
             <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
                 {user.email.charAt(0).toUpperCase()}
             </div>
             <div className="flex-1 min-w-0">
                 <div className="text-xs font-bold text-white break-all" title={user.email}>{user.email}</div>
                 <div className="text-[10px] text-emerald-500 font-medium">System Admin</div>
             </div>
        </div>
        <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all text-xs font-bold uppercase tracking-wider">
            Sign Out
        </button>
      </div>
    </div>
    </>
  );
};

export default DashboardSidebar;