import React, { useEffect, useState } from 'react';
import api from '../../api';
import AuditMessageModal from './modals/AuditMessageModal';

const GlobalAuditView = () => {
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedMessage, setSelectedMessage] = useState<any>(null);

    const fetchAudit = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/audit/messages', { params: { page, limit: 50 } });
            setMessages(res.data.messages);
            setTotalPages(res.data.pagination.pages);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAudit();
    }, [page]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Global Message Audit</h2>
                    <p className="text-slate-500 text-sm">Track emails across all nodes and users.</p>
                </div>
                <button 
                    onClick={fetchAudit} 
                    className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-bold border border-slate-700 transition-colors"
                >
                    Refresh Data
                </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-400">
                        <thead className="bg-slate-950 text-xs uppercase font-black text-slate-500 tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Time</th>
                                <th className="px-6 py-4">Node Owner</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">From</th>
                                <th className="px-6 py-4">To</th>
                                <th className="px-6 py-4">Subject</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {loading && messages.length === 0 ? (
                                <tr><td colSpan={7} className="px-6 py-8 text-center">Loading audit log...</td></tr>
                            ) : messages.length === 0 ? (
                                <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-600">No messages found.</td></tr>
                            ) : (
                                messages.map((msg) => (
                                    <tr key={msg._id} className="hover:bg-slate-800/50 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap font-mono text-xs">{new Date(msg.created_at).toLocaleString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded text-xs font-bold border border-indigo-500/20">
                                                {msg.mailbox_id?.email || 'Unknown'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {msg.direction === 'inbound' ? (
                                                <span className="text-emerald-500 font-bold text-xs flex items-center gap-1">
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                                                    IN
                                                </span>
                                            ) : (
                                                <span className="text-blue-500 font-bold text-xs flex items-center gap-1">
                                                     <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                                                    OUT
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 truncate max-w-[150px] text-slate-300" title={msg.from}>{msg.from}</td>
                                        <td className="px-6 py-4 truncate max-w-[150px] text-slate-300" title={msg.to}>{msg.to}</td>
                                        <td className="px-6 py-4 truncate max-w-[200px] font-medium text-white">{msg.subject || '(No Subject)'}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={() => setSelectedMessage(msg)}
                                                className="text-slate-400 hover:text-emerald-500 font-bold text-xs uppercase tracking-wider transition-colors"
                                            >
                                                Inspect
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination */}
                <div className="px-6 py-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between">
                     <button 
                        disabled={page <= 1} 
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        className="text-xs font-bold text-slate-400 hover:text-white disabled:opacity-30 uppercase tracking-widest"
                     >
                        Previous
                     </button>
                     <span className="text-xs font-mono text-slate-500">Page {page} of {totalPages}</span>
                     <button 
                        disabled={page >= totalPages}
                        onClick={() => setPage(p => p + 1)}
                        className="text-xs font-bold text-slate-400 hover:text-white disabled:opacity-30 uppercase tracking-widest"
                     >
                        Next
                     </button>
                </div>
            </div>

            {selectedMessage && (
                <AuditMessageModal 
                    message={selectedMessage} 
                    onClose={() => setSelectedMessage(null)} 
                />
            )}
        </div>
    );
};

export default GlobalAuditView;