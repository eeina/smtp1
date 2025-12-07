import React from 'react';

interface Props {
  view: 'inbox' | 'sent';
  onViewChange: (view: 'inbox' | 'sent') => void;
  onCompose: () => void;
  onSettings: () => void;
  showSettings: boolean;
}

const WebmailMobileNav = ({ view, onViewChange, onCompose, onSettings, showSettings }: Props) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 flex justify-around items-center z-40 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.03)]">
        <button onClick={() => onViewChange('inbox')} className={`flex flex-col items-center justify-center w-16 h-full space-y-1 ${view === 'inbox' && !showSettings ? 'text-green-600' : 'text-gray-400'}`}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
            <span className="text-[10px] font-medium">Inbox</span>
        </button>
        
        <button onClick={() => onViewChange('sent')} className={`flex flex-col items-center justify-center w-16 h-full space-y-1 ${view === 'sent' && !showSettings ? 'text-green-600' : 'text-gray-400'}`}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            <span className="text-[10px] font-medium">Sent</span>
        </button>

        <div className="relative -top-5">
            <button onClick={onCompose} className="flex items-center justify-center w-14 h-14 rounded-full bg-green-600 text-white shadow-lg shadow-green-200 active:scale-95 transition-transform">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            </button>
        </div>

        <button onClick={onSettings} className={`flex flex-col items-center justify-center w-16 h-full space-y-1 ${showSettings ? 'text-green-600' : 'text-gray-400'}`}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <span className="text-[10px] font-medium">Settings</span>
        </button>
    </div>
  );
};

export default WebmailMobileNav;