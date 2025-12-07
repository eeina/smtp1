import React from 'react';

const LandingView = ({ onNavigate }: { onNavigate: (view: string) => void }) => (
  <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
      <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">Enterprise SMTP</h2>
      <p className="mt-2 text-lg text-gray-600">Professional Email Infrastructure</p>
    </div>

    <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-4xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
        {/* Client / Admin Card */}
        <div className="bg-white py-8 px-10 shadow rounded-lg border-t-4 border-blue-600 hover:shadow-lg transition-shadow">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Account Owners</h3>
          <p className="text-gray-500 mb-6">Manage domains, configure DNS, and provision mailboxes for your organization.</p>
          <button
            onClick={() => onNavigate('client-login')}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Manage Organization
          </button>
        </div>

        {/* Webmail / User Card */}
        <div className="bg-white py-8 px-10 shadow rounded-lg border-t-4 border-green-500 hover:shadow-lg transition-shadow">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Webmail</h3>
          <p className="text-gray-500 mb-6">Access your inbox, send emails, and manage your daily communications.</p>
          <button
            onClick={() => onNavigate('webmail-login')}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Open Webmail
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default LandingView;
