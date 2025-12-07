import React from 'react';
import { Domain, DnsStatus } from '../../../types';

interface Props {
  domain: Domain;
  status: DnsStatus | null;
  checking: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

const DnsConfigModal = ({ domain, status, checking, onClose, onRefresh }: Props) => {
  
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add visual feedback toast here
  };

  const formatDkimValue = (pemKey?: string) => {
    if(!pemKey) return '';
    const raw = pemKey
      .replace('-----BEGIN PUBLIC KEY-----', '')
      .replace('-----END PUBLIC KEY-----', '')
      .replace(/[\r\n\s]/g, '');
    return `v=DKIM1; k=rsa; p=${raw}`;
  };

  const StatusIcon = ({ ok }: { ok?: boolean }) => {
    if (checking && ok === undefined) return <span className="animate-pulse text-gray-400 font-medium text-xs">Checking...</span>;
    if (ok) return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">OK</span>;
    return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">Missing</span>;
  };

  // Helper to render a DNS row
  const DnsRow = ({ type, host, value, statusOk, warnings }: any) => (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3 font-mono font-bold text-gray-700 align-top">{type}</td>
      <td className="px-4 py-3 font-mono text-gray-600 align-top">{host}</td>
      <td className="px-4 py-3 align-top">
        <div className="font-mono text-xs text-gray-600 break-all bg-gray-50 p-2 rounded border border-gray-100 mb-1">
          {value}
        </div>
        <button 
            onClick={() => handleCopy(value)} 
            className="text-blue-600 hover:text-blue-800 text-xs font-medium"
        >
            Copy Value
        </button>
        {warnings}
      </td>
      <td className="px-4 py-3 text-right align-top">
        <StatusIcon ok={statusOk} />
      </td>
    </tr>
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity backdrop-blur-sm" aria-hidden="true" onClick={onClose}></div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl leading-6 font-bold text-gray-900" id="modal-title">DNS Configuration</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Setup for <span className="font-semibold text-gray-700">{domain.name}</span>
                </p>
              </div>
              <button 
                onClick={onRefresh} 
                disabled={checking}
                className="text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-2 rounded-lg font-medium transition disabled:opacity-50"
              >
                {checking ? 'Refreshing...' : 'Refresh Status'}
              </button>
            </div>

            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <table className="min-w-full divide-y divide-gray-200 border rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-16">Type</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-24">Host</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Value</th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider w-24">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 text-sm">
                    {/* VERIFICATION */}
                    <DnsRow 
                        type="TXT" 
                        host="@" 
                        value={domain.verification_token} 
                        statusOk={status?.verification} 
                    />
                    
                    {/* A RECORD */}
                    <DnsRow 
                        type="A" 
                        host="mail" 
                        value="[Your Server IP]" 
                        statusOk={status?.a_record} 
                    />

                    {/* MX RECORD */}
                    <DnsRow 
                        type="MX" 
                        host="@" 
                        value={`mail.${domain.name} (Priority 10)`} 
                        statusOk={status?.mx}
                        warnings={
                             status?.found_mx && status.found_mx.length > 0 ? (
                                <div className="mt-2 pt-2 border-t border-gray-100">
                                   <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Detected (Delete Red):</div>
                                   <ul className="text-xs space-y-1">
                                      {status.found_mx.map((mx, i) => (
                                          <li key={i} className={`flex items-center ${mx.includes('mail.' + domain.name) ? 'text-green-600 font-bold' : 'text-red-600'}`}>
                                             {mx.includes('mail.' + domain.name) ? 
                                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg> 
                                                : 
                                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                             }
                                             {mx}
                                          </li>
                                      ))}
                                   </ul>
                                </div>
                             ) : null
                        }
                    />

                    {/* SPF */}
                    <DnsRow 
                        type="TXT" 
                        host="@" 
                        value="v=spf1 mx ~all" 
                        statusOk={status?.spf}
                        warnings={
                           (() => {
                               const spfs = status?.found_txt?.filter(t => t.toLowerCase().includes('v=spf1')) || [];
                               if (spfs.length > 1) return (
                                 <div className="mt-2 p-2 bg-red-50 text-red-600 text-xs border border-red-100 rounded">
                                   <strong>Critical: Multiple SPF records found!</strong>
                                   <p className="mt-1">Keep only one. Delete others:</p>
                                   <ul className="list-disc pl-4 mt-1 font-mono">
                                      {spfs.map((s,i) => <li key={i}>{s}</li>)}
                                   </ul>
                                 </div>
                               );
                               return null;
                           })()
                        } 
                    />

                    {/* DKIM */}
                    <DnsRow 
                        type="TXT" 
                        host="default._domainkey" 
                        value={domain.dkim_public_key ? formatDkimValue(domain.dkim_public_key) : '(Verify domain first)'} 
                        statusOk={status?.dkim} 
                    />

                    {/* DMARC */}
                    <DnsRow 
                        type="TXT" 
                        host="_dmarc" 
                        value="v=DMARC1; p=none;" 
                        statusOk={status?.dmarc} 
                    />
                  </tbody>
                </table>
              </div>
            </div>

            {/* Raw Diagnostics */}
            {status && (
                <div className="mt-6">
                    <button 
                        className="text-xs text-gray-500 underline mb-2"
                        onClick={(e) => {
                            const target = e.currentTarget.nextElementSibling;
                            if(target) target.classList.toggle('hidden');
                        }}
                    >
                        Toggle Raw Diagnostic Data
                    </button>
                    <div className="hidden bg-gray-900 rounded-lg p-4 text-xs text-green-400 font-mono overflow-auto max-h-40 shadow-inner">
                         <div className="mb-2 text-gray-500 uppercase font-bold tracking-wider">A Records (mail.{domain.name})</div>
                         {status.found_a?.length ? status.found_a.map((r,i) => <div key={'a'+i}>{r}</div>) : <div className="text-gray-600">None detected</div>}
                         
                         <div className="mt-3 mb-2 text-gray-500 uppercase font-bold tracking-wider">TXT Records (@)</div>
                         {status.found_txt?.length ? status.found_txt.map((r,i) => <div key={'txt'+i} className="mb-1 border-b border-gray-800 pb-1 last:border-0">{r}</div>) : <div className="text-gray-600">None detected</div>}
                    </div>
                </div>
            )}
          </div>
          
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button type="button" onClick={onClose} className="w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DnsConfigModal;