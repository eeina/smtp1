
import React from 'react';

interface Props {
  onRunDiagnostics: () => void;
}

const ServerInfoPanel = ({ onRunDiagnostics }: Props) => {
  return (
    <div className="bg-slate-900 rounded-[3rem] shadow-2xl p-10 mb-12 text-white relative overflow-hidden border border-white/5 ring-1 ring-white/10">
      {/* Abstract Background Accents */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="relative z-10 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-10 mb-12">
        <div>
           <h3 className="text-3xl font-black tracking-tighter text-white mb-3">Core Infrastructure</h3>
           <p className="text-slate-400 text-sm font-medium max-w-lg leading-relaxed">System endpoints are operational. Use these encrypted protocols to connect your laboratory nodes to the main Eeina network.</p>
        </div>
        <button 
          onClick={onRunDiagnostics} 
          className="group flex items-center gap-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-[0.2em] px-8 py-4 rounded-3xl transition-all transform hover:-translate-y-1 active:scale-95 shadow-2xl shadow-emerald-900/40"
        >
          <svg className="w-5 h-5 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          Run Diagnostic Sweep
        </button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative z-10">
        <div className="bg-white/5 backdrop-blur-xl rounded-[2rem] p-6 border border-white/10 hover:border-white/20 transition-all group">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-2.5 bg-blue-500/20 rounded-2xl text-blue-400 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" /></svg>
            </div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Protocol Node</p>
          </div>
          <p className="font-mono text-xl text-white font-bold break-all leading-none">{window.location.hostname}</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-[2rem] p-6 border border-white/10 hover:border-white/20 transition-all group">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-2.5 bg-emerald-500/20 rounded-2xl text-emerald-400 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Global Ingress</p>
          </div>
          <div className="flex justify-between items-center">
            <p className="font-mono text-2xl text-white font-black">25</p>
            <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest bg-emerald-400/10 px-3 py-1.5 rounded-full ring-1 ring-emerald-400/20">Public Access</span>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-[2rem] p-6 border border-white/10 hover:border-white/20 transition-all group">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-2.5 bg-amber-500/20 rounded-2xl text-amber-400 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Local Submission</p>
          </div>
          <div className="flex justify-between items-center">
            <p className="font-mono text-2xl text-white font-black">587</p>
            <span className="text-[10px] text-amber-400 font-black uppercase tracking-widest bg-amber-400/10 px-3 py-1.5 rounded-full ring-1 ring-amber-400/20">Encrypted</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServerInfoPanel;
