import React from 'react';
import '../types';

const LandingView = ({ onNavigate }: { onNavigate: (view: string) => void }) => (
  <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
      <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">Webmail</h2>
      <p className="mt-2 text-lg text-gray-600">Secure Email Access</p>
    </div>

    <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
      <div className="bg-white py-8 px-4 shadow rounded-lg sm:px-10 border-t-4 border-blue-600">
          <h3 className="text-2xl font-bold text-gray-800 mb-2 text-center">Welcome Back</h3>
          <p className="text-gray-500 mb-8 text-center text-sm">Sign in to access your inbox.</p>
          
          <button
            onClick={() => onNavigate('login')}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all transform hover:scale-[1.02]"
          >
            Sign In
          </button>
      </div>
      
      <div className="mt-8 text-center text-xs text-gray-400">
        &copy; {new Date().getFullYear()} Secure Webmail. All rights reserved.
      </div>
    </div>
  </div>
);

export default LandingView;