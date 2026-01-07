
import React, { useState } from 'react';
import api from '../../../api';

interface DiagnosticResult {
  dns: { status: 'ok' | 'error' | 'warning'; message: string };
  port25: { status: 'ok' | 'error'; message: string };
  rdns?: { status: 'ok' | 'error' | 'warning'; message: string; ip: string; ptrs: string[]; help?: string };
  config?: { smtp_hostname: string };
  timestamp: string;
}

interface Props {
  result: DiagnosticResult | null;
  running: boolean;
  onClose: () => void;
}

const DiagnosticsModal = ({ result, running, onClose }: Props) => {
  const [activeTab, setActiveTab] = useState<'network' | 'spam' | 'integrity'>('network');
  const [integrityLoading, setIntegrityLoading] = useState(false);
  const [integrityData, setIntegrityData] = useState<any>(null);

  const getHostnameStatus = () => {
    if (!result?.rdns || !result.config?.smtp_hostname) return null;
    if (result.rdns.ptrs.includes(result.config.smtp_hostname)) {
        return { status: 'ok', msg: 'Matches PTR Record' };
    }
    return { status: 'error', msg: 'Mismatch with PTR Record' };
  };

  const hostnameStatus = getHostnameStatus();

  const runIntegrityAudit = async () => {
      setIntegrityLoading(true);
      try {
          const res = await api.get('/api/system/audit-integrity');
          setIntegrityData(res.data);
      } catch (err) {
          console.error(err);
      } finally {
          setIntegrityLoading(false);
      }
  };

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
            
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
                <button 
                    onClick={() => setActiveTab('network')}
                    className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${activeTab === 'network' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Infra
                </button>
                <button 
                    onClick={() => setActiveTab('spam')}
                    className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${activeTab === 'spam' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Spam
                </button>
                <button 
                    onClick={() => { setActiveTab('integrity'); if(!integrityData) runIntegrityAudit(); }}
                    className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${activeTab === 'integrity' ? 'bg-white shadow text-red-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Integrity
                </button>
            </div>

            <div className="min-h-[300px] flex flex-col">
                {running ? (
                    <div className="flex flex-col items-center justify-center flex-1 py-8 text-gray-500">
                         <div className="relative w-12 h-12 mb-4">
                            <div className="absolute top-0 left-0 w-full h-full border-4 border-gray-200 rounded-full"></div>
                            <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                         </div>
                         <p className="font-medium">Running diagnostics...</p>
                    </div>
                ) : (
                    <>
                    {activeTab === 'network' && result && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
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
                                        <h3 className={`text-sm font-bold ${result.dns.status === 'ok' ? 'text-green-800' : 'text-red-800'}`}>DNS Resolution</h3>
                                        <div className={`mt-1 text-sm ${result.dns.status === 'ok' ? 'text-green-700' : 'text-red-700'}`}>{result.dns.message}</div>
                                    </div>
                                </div>
                            </div>
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
                                        <h3 className={`text-sm font-bold ${result.port25.status === 'ok' ? 'text-green-800' : 'text-red-800'}`}>Outbound (Port 25)</h3>
                                        <div className={`mt-1 text-sm ${result.port25.status === 'ok' ? 'text-green-700' : 'text-red-700'}`}>{result.port25.message}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'spam' && result && (
                         <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className={`p-4 rounded-xl border ${result.rdns?.status === 'ok' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                <div className="flex items-start">
                                    <div className="ml-3">
                                        <h3 className={`text-sm font-bold ${result.rdns?.status === 'ok' ? 'text-green-800' : 'text-red-800'}`}>Reverse DNS (PTR)</h3>
                                        <div className="mt-1 text-sm text-gray-700">{result.rdns?.message}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'integrity' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4">
                                <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-1">Attachment Recovery Audit</h4>
                                <p className="text-xs text-blue-700 leading-relaxed">
                                    Checking if messages with attachments actually have the data in our GridFS storage.
                                </p>
                            </div>

                            {integrityLoading ? (
                                <div className="flex flex-col items-center py-8">
                                    <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mb-3"></div>
                                    <p className="text-sm text-gray-500">Auditing Database...</p>
                                </div>
                            ) : integrityData ? (
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                                        <span className="text-sm font-bold text-gray-700">Broken Attachments</span>
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${integrityData.brokenCount > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                            {integrityData.brokenCount}
                                        </span>
                                    </div>

                                    {integrityData.brokenCount > 0 ? (
                                        <div className="max-h-48 overflow-y-auto divide-y divide-gray-100 border rounded-lg bg-white">
                                            {integrityData.broken.map((msg: any) => (
                                                <div key={msg._id} className="p-3">
                                                    <div className="text-xs font-bold text-gray-800 truncate">{msg.subject || '(No Subject)'}</div>
                                                    <div className="text-[10px] text-gray-500">From: {msg.from}</div>
                                                    <div className="text-[10px] text-red-500 font-medium mt-1">Status: Binary data not found (Received before fix)</div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-gray-400">
                                            <svg className="w-12 h-12 mx-auto text-gray-100 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            <p className="text-sm">All attachments are safe!</p>
                                        </div>
                                    )}
                                    <button onClick={runIntegrityAudit} className="w-full text-xs text-blue-600 font-bold hover:underline py-2">Re-run Audit</button>
                                </div>
                            ) : null}
                        </div>
                    )}
                    </>
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
