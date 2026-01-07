
import React from 'react';
import '../types';

const LandingView = ({ onNavigate }: { onNavigate: (view: string) => void }) => (
  <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
    {/* Navbar */}
    <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="bg-emerald-600 rounded-2xl p-2 shadow-lg shadow-emerald-200 transform group-hover:rotate-6 transition-transform">
               <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
            </div>
            <span className="font-black text-2xl tracking-tighter text-slate-900">Eeina<span className="text-emerald-600">Health</span></span>
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => onNavigate('login')}
              className="bg-slate-900 text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-emerald-600 transition-all shadow-lg hover:shadow-emerald-200 active:scale-95"
            >
              Employee Access
            </button>
          </div>
        </div>
      </div>
    </nav>

    {/* Hero Section */}
    <div className="relative pt-24 pb-32 overflow-hidden">
       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="text-left max-w-2xl">
               <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-widest mb-8 animate-in fade-in slide-in-from-bottom-4">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                  Secure Workspace
               </div>
               <h1 className="text-6xl sm:text-7xl font-black text-slate-900 tracking-tight leading-[1.1] mb-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
                  Fueling Global <span className="text-emerald-600 italic">Wellness</span> through Data.
               </h1>
               <p className="text-xl text-slate-500 mb-12 leading-relaxed max-w-xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
                  Welcome to the Eeina internal node. Collaborate with our clinical teams to curate the world's most effective health recipes.
               </p>
               <div className="flex flex-wrap gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                  <button 
                    onClick={() => onNavigate('login')}
                    className="bg-emerald-600 text-white px-10 py-5 rounded-3xl text-lg font-bold hover:bg-emerald-700 transition-all transform hover:-translate-y-1 shadow-2xl shadow-emerald-200"
                  >
                    Open Webmail
                  </button>
                  <div className="flex items-center gap-4 px-6">
                    <div className="flex -space-x-3">
                        {[1,2,3].map(i => <div key={i} className="w-10 h-10 rounded-full border-4 border-white bg-slate-200 overflow-hidden shadow-sm"><img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" /></div>)}
                    </div>
                    <span className="text-sm font-bold text-slate-400">Join 400+ collaborators</span>
                  </div>
               </div>
            </div>
            
            <div className="relative flex-1 hidden lg:block animate-in fade-in zoom-in duration-1000">
                <div className="relative z-10 bg-white p-8 rounded-[3rem] shadow-2xl border border-slate-100 rotate-2 hover:rotate-0 transition-transform duration-500">
                    <div className="w-full aspect-video bg-slate-50 rounded-[2rem] border border-slate-100 overflow-hidden flex items-center justify-center">
                        <svg className="w-24 h-24 text-emerald-100" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5-10-5-10 5z" /></svg>
                    </div>
                    <div className="mt-8 space-y-3">
                        <div className="h-4 bg-slate-100 rounded-full w-3/4"></div>
                        <div className="h-4 bg-slate-100 rounded-full w-1/2"></div>
                    </div>
                </div>
                {/* Decorative blobs */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-400/10 rounded-full blur-[100px] -z-10"></div>
            </div>
          </div>
       </div>
    </div>

    {/* Feature Grid */}
    <div className="bg-white py-32 border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
           <div className="group">
              <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center text-emerald-400 mb-8 transform group-hover:scale-110 transition-transform shadow-xl">
                 <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 3c1.72 0 3.347.433 4.774 1.214a10.001 10.001 0 014.582 9.172m-6.23 1.841l-2.12 2.12a2 2 0 01-2.828 0L8.414 15m1.414-1.414l2.12-2.12a2 2 0 012.828 0l2.828 2.828" /></svg>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Clinical Security</h3>
              <p className="text-lg text-slate-500 leading-relaxed">
                 End-to-end encrypted node for sensitive nutritional research and recipe development data.
              </p>
           </div>
           
           <div className="group">
              <div className="w-16 h-16 bg-emerald-600 rounded-3xl flex items-center justify-center text-white mb-8 transform group-hover:scale-110 transition-transform shadow-xl">
                 <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Team Sync</h3>
              <p className="text-lg text-slate-500 leading-relaxed">
                 Seamless communication between sourcing, testing, and creative departments across the globe.
              </p>
           </div>

           <div className="group">
              <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center text-emerald-600 mb-8 transform group-hover:scale-110 transition-transform shadow-sm">
                 <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Optimized Delivery</h3>
              <p className="text-lg text-slate-500 leading-relaxed">
                 High-performance infrastructure built on custom SMTP nodes for near-instant recipe distribution.
              </p>
           </div>
        </div>
      </div>
    </div>
    
    <div className="bg-slate-50 border-t border-slate-200 py-20 text-center">
      <div className="max-w-7xl mx-auto px-4">
        <p className="text-slate-400 text-sm font-bold uppercase tracking-[0.2em]">
          &copy; {new Date().getFullYear()} Eeina Node • Proprietary Employee Portal
        </p>
      </div>
    </div>
  </div>
);

export default LandingView;
