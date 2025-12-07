import React from 'react';

interface Props {
  onRunDiagnostics: () => void;
}

const ServerInfoPanel = ({ onRunDiagnostics }: Props) => {
  return (
    <div className="bg-gray-900 rounded-2xl shadow-xl p-6 mb-8 text-white relative overflow-hidden ring-1 ring-white/10">
      {/* Background Gradients */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
           <h3 className="text-2xl font-bold tracking-tight text-white">Connection Details</h3>
           <p className="text-gray-400 text-sm mt-1">Use these credentials to configure your email clients (Outlook, Thunderbird).</p>
        </div>
        <button 
          onClick={onRunDiagnostics} 
          className="group flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium px-4 py-2 rounded-lg backdrop-blur-sm border border-white/10 transition-all"
        >
          <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          System Health
        </button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10">
        <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-4 border border-gray-700/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-1.5 bg-blue-500/10 rounded-lg">
                <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" /></svg>
            </div>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">SMTP Host</p>
          </div>
          <p className="font-mono text-lg text-white font-medium break-all">{window.location.hostname}</p>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-4 border border-gray-700/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-1.5 bg-green-500/10 rounded-lg">
                <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Inbound Port</p>
          </div>
          <div className="flex justify-between items-baseline">
            <p className="font-mono text-lg text-white font-medium">25</p>
            <span className="text-xs text-green-400 font-medium bg-green-400/10 px-2 py-0.5 rounded-full">Public</span>
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-4 border border-gray-700/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-1.5 bg-yellow-500/10 rounded-lg">
                <svg className="w-4 h-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Client Port</p>
          </div>
          <div className="flex justify-between items-baseline">
            <p className="font-mono text-lg text-white font-medium">587</p>
            <span className="text-xs text-yellow-400 font-medium bg-yellow-400/10 px-2 py-0.5 rounded-full">Auth Required</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServerInfoPanel;
