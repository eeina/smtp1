import React from 'react';
import { User } from '../../types';

interface Props {
  user: User;
  onLogout: () => void;
  onShowLogs: () => void;
}

const DashboardNavbar = ({ user, onLogout, onShowLogs }: Props) => {
  return (
    <nav className="bg-white shadow-sm sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <span className="text-xl font-bold text-gray-800 tracking-tight">SMTP Admin</span>
            <span className="hidden sm:flex ml-3 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">
              {user.company_name}
            </span>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button 
              onClick={onShowLogs}
              className="text-gray-600 hover:text-gray-900 font-medium text-sm flex items-center px-2 py-2 rounded-md hover:bg-gray-50 transition"
              title="System Logs"
            >
              <svg className="w-5 h-5 sm:mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <span className="hidden sm:inline">System Logs</span>
            </button>
            <div className="h-6 w-px bg-gray-200 mx-2"></div>
            <div className="flex items-center">
              <span className="hidden md:block text-gray-500 mr-4 text-sm font-medium">{user.email}</span>
              <button 
                onClick={onLogout} 
                className="text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md text-sm font-medium transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Mobile Company Name Banner */}
      <div className="sm:hidden bg-blue-50 px-4 py-1 text-center">
        <span className="text-xs text-blue-800 font-medium">{user.company_name}</span>
      </div>
    </nav>
  );
};

export default DashboardNavbar;