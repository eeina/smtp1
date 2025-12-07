import React from 'react';
import '../types';

const LandingView = ({ onNavigate }: { onNavigate: (view: string) => void }) => (
  <div className="min-h-screen bg-white font-sans text-gray-900">
    {/* Navbar */}
    <nav className="border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-2">
            <div className="bg-green-600 rounded-lg p-1.5">
               <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
            </div>
            <span className="font-bold text-xl tracking-tight text-gray-900">Eeina</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => onNavigate('login')}
              className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-200"
            >
              Employee Login
            </button>
          </div>
        </div>
      </div>
    </nav>

    {/* Hero Section */}
    <div className="relative overflow-hidden pt-16 pb-32">
       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 border border-green-100 text-green-700 text-xs font-bold uppercase tracking-wider mb-6">
                <span className="w-2 h-2 rounded-full bg-green-600 animate-pulse"></span>
                Internal Portal
             </div>
             <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 tracking-tight mb-6">
                Sharing the World's Best <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">Health Recipes</span>
             </h1>
             <p className="text-xl text-gray-500 mb-10 leading-relaxed">
                Welcome to the Eeina employee communication hub. Securely connect with your team to curate, edit, and publish healthy living content.
             </p>
             <div className="flex justify-center gap-4">
                <button 
                  onClick={() => onNavigate('login')}
                  className="bg-green-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-green-700 transition-all transform hover:scale-105 shadow-xl shadow-green-200"
                >
                  Log In to Webmail
                </button>
             </div>
          </div>
       </div>
       
       {/* Decorative Background Elements */}
       <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-tr from-green-50 to-emerald-50 rounded-full blur-3xl -z-10 opacity-60 pointer-events-none"></div>
    </div>

    {/* Feature Grid */}
    <div className="bg-gray-50 py-24 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Our Core Values</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600 mb-6">
                 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Health First</h3>
              <p className="text-gray-500 leading-relaxed">
                 Every recipe we share is vetted by nutritionists to ensure it meets our high standards for healthy living.
              </p>
           </div>
           
           <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 mb-6">
                 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Internal Knowledge</h3>
              <p className="text-gray-500 leading-relaxed">
                 Use this platform to share drafts, discuss ingredient sourcing, and coordinate with our culinary team.
              </p>
           </div>

           <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-lime-100 rounded-xl flex items-center justify-center text-lime-600 mb-6">
                 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Secure & Private</h3>
              <p className="text-gray-500 leading-relaxed">
                 Our proprietary communication infrastructure ensures your unique recipes remain our trade secret.
              </p>
           </div>
        </div>
      </div>
    </div>
    
    <div className="border-t border-gray-200 py-12 text-center text-gray-400 text-sm">
      &copy; {new Date().getFullYear()} Eeina Health. For Employees Only.
    </div>
  </div>
);

export default LandingView;