import React from 'react';

interface Props {
  onRunDiagnostics: () => void;
}

const ServerInfoPanel = ({ onRunDiagnostics }: Props) => {
  return (
    <div className="bg-slate-800 rounded-xl shadow-lg p-5 sm:p-6 mb-8 text-white relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-5 rounded-full blur-xl"></div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-600 pb-4 mb-4 gap-4">
        <div>
           <h3 className="text-lg font-semibold tracking-wide">SMTP Connection Details</h3>
           <p className="text-slate-400 text-xs mt-1">Configure your email clients using these settings</p>
        </div>
        <button 
          onClick={onRunDiagnostics} 
          className="w-full sm:w-auto text-xs font-medium bg-slate-700 hover:bg-slate-600 text-blue-300 px-4 py-2 rounded-lg border border-slate-600 transition flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          Check Server Health
        </button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-slate-700/50 rounded-lg p-3">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">SMTP Host</p>
          <p className="font-mono text-sm sm:text-base md:text-lg break-all">{window.location.hostname}</p>
        </div>
        <div className="bg-slate-700/50 rounded-lg p-3">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Port 25 (Inbound)</p>
          <p className="font-mono text-sm sm:text-base md:text-lg text-green-400">No Auth (Public)</p>
        </div>
        <div className="bg-slate-700/50 rounded-lg p-3">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Port 587 (Submission)</p>
          <p className="font-mono text-sm sm:text-base md:text-lg text-yellow-400">Auth Required</p>
        </div>
      </div>
    </div>
  );
};

export default ServerInfoPanel;