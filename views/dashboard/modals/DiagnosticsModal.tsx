import React, { useState } from 'react';

interface DiagnosticResult {
  dns: { status: 'ok' | 'error' | 'warning'; message: string };
  port25: { status: 'ok' | 'error'; message: string };
  rdns?: { status: 'ok' | 'error' | 'warning'; message: string; ip: string; ptrs: string[]; help?: string };
  timestamp: string;
}

interface Props {
  result: DiagnosticResult | null;
  running: boolean;
  onClose: () => void;
}

const DiagnosticsModal = ({ result, running, onClose }: Props) => {
  const [activeTab, setActiveTab] = useState<'network' | 'spam'>('network');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity backdrop-blur-sm" aria-hidden="true" onClick={onClose}></div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg leading-6 font-bold text-gray-900">System Diagnostics</h3>
            </div>
            
            {/* TABS */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
                <button 
                    onClick={() => setActiveTab('network')}
                    className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${activeTab === 'network' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Infrastructure
                </button>
                <button 
                    onClick={() => setActiveTab('spam')}
                    className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${activeTab === 'spam' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Deliverability & Spam
                </button>
            </div>

            <div className="min-h-[250px] flex flex-col">
                {running ? (
                    <div className="flex flex-col items-center justify-center flex-1 py-8 text-gray-500">
                         <div className="relative w-12 h-12 mb-4">
                            <div className="absolute top-0 left-0 w-full h-full border-4 border-gray-200 rounded-full"></div>
                            <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                         </div>
                         <p className="font-medium">Running diagnostics...</p>
                         <p className="text-xs text-gray-400 mt-1">Checking Ports, DNS, and rDNS</p>
                    </div>
                ) : result ? (
                    <>
                    {activeTab === 'network' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            {/* DNS Check */}
                            <div className={`p-4 rounded-xl border ${result.dns.status === 'ok' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                <div className="flex items-start">
                                    <div className="flex-shrink-0 mt-0.5">
                                        {result.dns.status === 'ok' ? (
                                            <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                        ) : (
                                            <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                                        )}
                                    </div>
                                    <div className="ml-3">
                                        <h3 className={`text-sm font-bold ${result.dns.status === 'ok' ? 'text-green-800' : 'text-red-800'}`}>
                                            Internal DNS Resolution
                                        </h3>
                                        <div className={`mt-1 text-sm ${result.dns.status === 'ok' ? 'text-green-700' : 'text-red-700'}`}>
                                            {result.dns.message}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Port Check */}
                            <div className={`p-4 rounded-xl border ${result.port25.status === 'ok' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                <div className="flex items-start">
                                    <div className="flex-shrink-0 mt-0.5">
                                        {result.port25.status === 'ok' ? (
                                            <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                        ) : (
                                            <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                                        )}
                                    </div>
                                    <div className="ml-3">
                                        <h3 className={`text-sm font-bold ${result.port25.status === 'ok' ? 'text-green-800' : 'text-red-800'}`}>
                                            Outbound Mail (Port 25)
                                        </h3>
                                        <div className={`mt-1 text-sm ${result.port25.status === 'ok' ? 'text-green-700' : 'text-red-700'}`}>
                                            {result.port25.message}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {result.port25.status === 'error' && (
                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                    <p className="text-xs text-gray-500 leading-relaxed">
                                        <span className="font-bold">Why is this failing?</span> Many cloud providers (AWS, Google Cloud, Azure, DigitalOcean) block Port 25 by default to prevent spam. You may need to request them to unblock it or use a Smart Host/Relay.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'spam' && (
                         <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            {/* rDNS Check */}
                            <div className={`p-4 rounded-xl border ${result.rdns?.status === 'ok' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                <div className="flex items-start">
                                    <div className="flex-shrink-0 mt-0.5">
                                        {result.rdns?.status === 'ok' ? (
                                            <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                        ) : (
                                            <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                                        )}
                                    </div>
                                    <div className="ml-3">
                                        <h3 className={`text-sm font-bold ${result.rdns?.status === 'ok' ? 'text-green-800' : 'text-red-800'}`}>
                                            Reverse DNS (PTR)
                                        </h3>
                                        <div className={`mt-1 text-sm ${result.rdns?.status === 'ok' ? 'text-green-700' : 'text-red-700'}`}>
                                            {result.rdns?.message}
                                        </div>
                                        {result.rdns?.ip && (
                                            <div className="mt-2 text-xs font-mono bg-white/50 p-1.5 rounded inline-block">
                                                Public IP: {result.rdns.ip}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {result.rdns?.status !== 'ok' && (
                                    <div className="mt-3 text-xs bg-white p-2 rounded border border-red-100 text-red-600">
                                        {result.rdns?.help || "Missing PTR records are the #1 cause of spam rejection."}
                                    </div>
                                )}
                            </div>

                            {/* External Tools */}
                            <div className="grid grid-cols-2 gap-3">
                                <a 
                                    href={result.rdns?.ip ? `https://mxtoolbox.com/SuperTool.aspx?action=blacklist%3a${result.rdns.ip}` : 'https://mxtoolbox.com/blacklists.aspx'}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors flex flex-col items-center justify-center text-center group"
                                >
                                    <span className="text-gray-900 font-bold text-sm group-hover:text-blue-600">Check Blacklists</span>
                                    <span className="text-xs text-gray-500 mt-1">MXToolbox</span>
                                </a>
                                <a 
                                    href="https://www.mail-tester.com/"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors flex flex-col items-center justify-center text-center group"
                                >
                                    <span className="text-gray-900 font-bold text-sm group-hover:text-blue-600">Test Email Score</span>
                                    <span className="text-xs text-gray-500 mt-1">Mail-Tester.com</span>
                                </a>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-2">Checklist for 10/10 Score:</h4>
                                <ul className="text-sm text-blue-900 space-y-1 list-disc pl-4">
                                    <li>DNS: <strong>SPF</strong> record is valid.</li>
                                    <li>DNS: <strong>DKIM</strong> signature is valid.</li>
                                    <li>DNS: <strong>DMARC</strong> policy exists.</li>
                                    <li>Server: <strong>PTR Record</strong> matches hostname.</li>
                                    <li>Reputation: IP is not blacklisted.</li>
                                </ul>
                            </div>
                         </div>
                    )}
                    </>
                ) : (
                    <div className="text-center text-gray-400">Not run yet</div>
                )}
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button type="button" onClick={onClose} className="w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticsModal;