import React from 'react';

interface Props {
  onRunDiagnostics: () => void;
}

const ServerInfoPanel = ({ onRunDiagnostics }: Props) => {
  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden group">
      
      {/* Background glow effect */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/10 transition-colors duration-700"></div>

      <div className="flex items-center gap-6 relative z-10">
         <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-emerald-500 shadow-inner">
             <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
         </div>
         <div>
             <h2 className="text-white font-bold text-lg leading-tight">SMTP Node Active</h2>
             <div className="flex items-center gap-2 mt-1">
                 <span className="relative flex h-2 w-2">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                 </span>
                 <p className="text-slate-400 text-xs font-mono">{window.location.hostname}</p>
             </div>
         </div>
      </div>

      <div className="flex items-center gap-8 relative z-10 w-full md:w-auto justify-around md:justify-end border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-8">
         <div className="text-center md:text-left">
             <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Inbound</p>
             <p className="text-white font-mono font-bold text-xl">25 <span className="text-emerald-500 text-xs">●</span></p>
         </div>
         <div className="text-center md:text-left">
             <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Submission</p>
             <p className="text-white font-mono font-bold text-xl">587 <span className="text-emerald-500 text-xs">●</span></p>
         </div>
         <button 
           onClick={onRunDiagnostics}
           className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border border-slate-700 hover:border-slate-600"
         >
           Diagnostics
         </button>
      </div>
    </div>
  );
};

export default ServerInfoPanel;