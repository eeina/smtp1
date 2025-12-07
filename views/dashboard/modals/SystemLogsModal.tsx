import React from 'react';

interface SystemLog {
  _id: string;
  level: string;
  message: string;
  timestamp: string;
  meta?: any;
}

interface Props {
  logs: SystemLog[];
  onClose: () => void;
  onRefresh: () => void;
}

const SystemLogsModal = ({ logs, onClose, onRefresh }: Props) => {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-900 bg-opacity-80 transition-opacity backdrop-blur-sm" aria-hidden="true" onClick={onClose}></div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        <div className="inline-block align-bottom bg-gray-900 rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl w-full border border-gray-800">
          <div className="bg-gray-800 px-4 pt-4 pb-3 sm:p-6 border-b border-gray-700 flex justify-between items-center">
            <div>
                 <h3 className="text-lg leading-6 font-bold text-white">System Logs</h3>
                 <p className="text-xs text-gray-400 mt-0.5">Real-time SMTP server events</p>
            </div>
            <button onClick={onRefresh} className="text-xs bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-600 transition border border-gray-600">
                Refresh
            </button>
          </div>
          
          <div className="p-0 bg-gray-950 h-[60vh] overflow-y-auto font-mono text-xs custom-scrollbar">
            {logs.length === 0 ? (
                <div className="p-10 text-center text-gray-600 italic">No logs found.</div>
            ) : (
                <div className="w-full">
                    {/* Sticky Header */}
                    <div className="sticky top-0 bg-gray-900 border-b border-gray-800 grid grid-cols-12 text-gray-400 font-bold text-[10px] uppercase tracking-wider">
                        <div className="col-span-3 sm:col-span-2 px-4 py-2">Time</div>
                        <div className="col-span-2 sm:col-span-1 px-4 py-2">Level</div>
                        <div className="col-span-7 sm:col-span-9 px-4 py-2">Message</div>
                    </div>
                    {/* Rows */}
                    <div className="divide-y divide-gray-800/50">
                        {logs.map((log) => (
                            <div key={log._id} className="grid grid-cols-12 hover:bg-gray-900/50 transition-colors group">
                                <div className="col-span-3 sm:col-span-2 px-4 py-2 text-gray-500 whitespace-nowrap truncate">
                                    {new Date(log.timestamp).toLocaleTimeString()}
                                </div>
                                <div className="col-span-2 sm:col-span-1 px-4 py-2">
                                    <span className={`px-1.5 py-0.5 rounded-[3px] text-[9px] uppercase font-bold border ${
                                        log.level === 'error' ? 'bg-red-900/30 text-red-400 border-red-900/50' :
                                        log.level === 'warn' ? 'bg-yellow-900/30 text-yellow-400 border-yellow-900/50' :
                                        'bg-blue-900/30 text-blue-400 border-blue-900/50'
                                    }`}>
                                        {log.level}
                                    </span>
                                </div>
                                <div className="col-span-7 sm:col-span-9 px-4 py-2 text-gray-300 break-words">
                                    {log.message}
                                    {log.meta && Object.keys(log.meta).length > 0 && JSON.stringify(log.meta) !== '{}' && (
                                       <div className="mt-1 text-gray-500 font-mono text-[10px] bg-black/20 p-1.5 rounded border-l-2 border-gray-700">
                                         {JSON.stringify(log.meta)}
                                       </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
          </div>

          <div className="bg-gray-800 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-700">
            <button type="button" onClick={onClose} className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm transition">
              Close Console
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemLogsModal;