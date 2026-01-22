import React, { useEffect, useState, useCallback } from 'react';
import api from '../../api';
import AuditMessageModal from './modals/AuditMessageModal';

const GlobalAuditView = () => {
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [selectedMessage, setSelectedMessage] = useState<any>(null);

    // Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [directionFilter, setDirectionFilter] = useState<'all' | 'inbound' | 'outbound'>('all');
    
    // Debounce Search
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(1); // Reset to page 1 on search change
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        setPage(1); // Reset page when direction changes
    }, [directionFilter]);

    const fetchAudit = useCallback(async () => {
        setLoading(true);
        try {
            const params: any = { page, limit: 50 };
            if (debouncedSearch) params.search = debouncedSearch;
            if (directionFilter !== 'all') params.direction = directionFilter;

            const res = await api.get('/api/audit/messages', { params });
            setMessages(res.data.messages);
            setTotalPages(res.data.pagination.pages);
            setTotalItems(res.data.pagination.total);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [page, debouncedSearch, directionFilter]);

    useEffect(() => {
        fetchAudit();
    }, [fetchAudit]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">Global Message Audit</h2>
                    <p className="text-slate-500 text-sm">Track emails across all {totalItems} records.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                        <input 
                            type="text"
                            placeholder="Search subject, from, to..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-slate-900 border border-slate-700 text-white text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full pl-10 p-2.5 outline-none placeholder:text-slate-600"
                        />
                    </div>
                    <select 
                        value={directionFilter}
                        onChange={(e) => setDirectionFilter(e.target.value as any)}
                        className="bg-slate-900 border border-slate-700 text-white text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block p-2.5 outline-none"
                    >
                        <option value="all">All Traffic</option>
                        <option value="inbound">Inbound Only</option>
                        <option value="outbound">Outbound Only</option>
                    </select>
                    <button 
                        onClick={fetchAudit} 
                        className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-bold border border-slate-700 transition-colors whitespace-nowrap"
                    >
                        Refresh
                    </button>
                </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col h-[70vh]">
                <div className="overflow-auto flex-1 custom-scrollbar">
                    <table className="w-full text-left text-sm text-slate-400">
                        <thead className="bg-slate-950 text-xs uppercase font-black text-slate-500 tracking-wider sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-6 py-4 bg-slate-950">Time</th>
                                <th className="px-6 py-4 bg-slate-950">Node Owner</th>
                                <th className="px-6 py-4 bg-slate-950">Type</th>
                                <th className="px-6 py-4 bg-slate-950">From</th>
                                <th className="px-6 py-4 bg-slate-950">To</th>
                                <th className="px-6 py-4 bg-slate-950">Subject</th>
                                <th className="px-6 py-4 text-right bg-slate-950">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {loading && messages.length === 0 ? (
                                <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-500">Loading audit log...</td></tr>
                            ) : messages.length === 0 ? (
                                <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-600 flex flex-col items-center justify-center">
                                    <svg className="w-12 h-12 mb-3 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    <p>No messages found matching your criteria.</p>
                                </td></tr>
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
                <div className="px-6 py-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between flex-shrink-0">
                     <button 
                        disabled={page <= 1} 
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        className="text-xs font-bold text-slate-400 hover:text-white disabled:opacity-30 uppercase tracking-widest px-3 py-1.5 rounded hover:bg-slate-800"
                     >
                        Previous
                     </button>
                     <span className="text-xs font-mono text-slate-500">Page {page} of {totalPages}</span>
                     <button 
                        disabled={page >= totalPages}
                        onClick={() => setPage(p => p + 1)}
                        className="text-xs font-bold text-slate-400 hover:text-white disabled:opacity-30 uppercase tracking-widest px-3 py-1.5 rounded hover:bg-slate-800"
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