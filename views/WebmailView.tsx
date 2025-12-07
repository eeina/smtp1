import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../api';
import { User, EmailMessage } from '../types';
import Spinner from '../components/Spinner';
import { useToast } from '../components/ToastContext';

// Helper for relative time
const timeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m";
    return "just now";
};

// Skeleton Component
const MessageListSkeleton = () => (
  <div className="animate-pulse">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="p-4 border-b border-gray-50">
        <div className="flex justify-between mb-2">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-3 bg-gray-200 rounded w-12"></div>
        </div>
        <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-2 bg-gray-100 rounded w-full"></div>
      </div>
    ))}
  </div>
);

// --- COMPONENT: Rich Text Toolbar ---
const RichTextToolbar = ({ onCmd, onImage }: { onCmd: (cmd: string, val?: string) => void, onImage: () => void }) => {
    const Btn = ({ cmd, label, val }: any) => (
        <button 
            type="button" 
            onMouseDown={(e) => { e.preventDefault(); onCmd(cmd, val); }}
            className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
            title={label}
        >
            {label}
        </button>
    );

    return (
        <div className="flex items-center gap-1 border-b border-gray-200 p-2 bg-gray-50">
            <Btn cmd="bold" label={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h8a4 4 0 100-8H6v8zm0 0h8a4 4 0 110 8H6v-8z" /></svg>} />
            <Btn cmd="italic" label={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>} />
            <Btn cmd="underline" label={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>} />
            <div className="w-px h-4 bg-gray-300 mx-1"></div>
            <Btn cmd="insertUnorderedList" label={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>} />
            <Btn cmd="insertOrderedList" label={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20h14M7 4h14M21 12H7M3 20h.01M3 4h.01M3 12h.01" /></svg>} />
            <div className="w-px h-4 bg-gray-300 mx-1"></div>
            <button 
                type="button"
                onMouseDown={(e) => { e.preventDefault(); onImage(); }}
                className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                title="Insert Image"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </button>
        </div>
    );
};

const WebmailView = ({ user, onLogout }: { user: User, onLogout: () => void }) => {
  const { addToast } = useToast();
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [selectedMsg, setSelectedMsg] = useState<EmailMessage | null>(null);
  const [view, setView] = useState<'inbox' | 'sent'>('inbox');
  
  // Pagination & Bulk Selection
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMessages, setTotalMessages] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Compose State
  const [showCompose, setShowCompose] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeCc, setComposeCc] = useState('');
  const [composeBcc, setComposeBcc] = useState('');
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [composeSubject, setComposeSubject] = useState('');
  const [sending, setSending] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  
  // Editor Ref
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Settings Modal State
  const [showSettings, setShowSettings] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const fetchMessages = useCallback(async (isPolling = false) => {
    if (!isPolling) setLoadingMessages(true);
    try {
      const res = await api.get('/api/webmail/messages', {
        params: { folder: view, page, limit: 20 }
      });
      setMessages(res.data.messages);
      setTotalPages(res.data.pagination.pages);
      setTotalMessages(res.data.pagination.total);
    } catch (err) {
      console.error(err);
    } finally {
      if (!isPolling) setLoadingMessages(false);
    }
  }, [view, page]);

  useEffect(() => {
    fetchMessages();
    let int: any;
    if (page === 1) {
        int = setInterval(() => fetchMessages(true), 15000);
    }
    return () => clearInterval(int);
  }, [fetchMessages, page]);

  useEffect(() => {
      setPage(1);
      setSelectedIds(new Set());
      setSelectedMsg(null);
  }, [view]);

  // --- Handlers ---

  const handleSelectMessage = async (msg: EmailMessage) => {
    setSelectedMsg(msg);
    if (!msg.is_read) {
        setMessages(prev => prev.map(m => m._id === msg._id ? { ...m, is_read: true } : m));
        try { await api.patch(`/api/webmail/messages/${msg._id}/read`); } catch (err) {}
    }
  };

  const toggleSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === messages.length) {
        setSelectedIds(new Set());
    } else {
        setSelectedIds(new Set(messages.map(m => m._id)));
    }
  };

  const handleBatchDelete = async () => {
    if(!confirm(`Delete ${selectedIds.size} messages?`)) return;
    try {
        await api.post('/api/webmail/messages/batch-delete', { ids: Array.from(selectedIds) });
        addToast('Messages deleted', 'success');
        setSelectedIds(new Set());
        fetchMessages();
        if (selectedMsg && selectedIds.has(selectedMsg._id)) {
            setSelectedMsg(null);
        }
    } catch (err) {
        addToast('Failed to delete messages', 'error');
    }
  };

  // --- File Handling ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        const filesArray = Array.from(e.target.files);
        // Limit total size if needed, for now just allow
        setAttachments(prev => [...prev, ...filesArray]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
  };

  // --- Editor Handlers ---
  const execCmd = (cmd: string, val?: string) => {
      document.execCommand(cmd, false, val);
      if(editorRef.current) editorRef.current.focus();
  };

  const handleInsertImage = () => {
      // Simple prompt for now, could be improved with a file picker specifically for inline images
      const url = prompt("Enter Image URL:");
      if(url) execCmd('insertImage', url);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!editorRef.current) return;
    
    setSending(true);
    const htmlBody = editorRef.current.innerHTML;

    try {
      // Process attachments
      const attachmentPayload = await Promise.all(attachments.map(async (file) => ({
          filename: file.name,
          contentType: file.type,
          content: await fileToBase64(file)
      })));

      await api.post('/api/webmail/send', {
        to: composeTo,
        cc: composeCc,
        bcc: composeBcc,
        subject: composeSubject,
        htmlBody,
        attachments: attachmentPayload
      });
      
      setShowCompose(false);
      setComposeTo('');
      setComposeCc('');
      setComposeBcc('');
      setComposeSubject('');
      setAttachments([]);
      if(editorRef.current) editorRef.current.innerHTML = '';
      
      addToast('Message sent successfully', 'success');
      if (view === 'sent') fetchMessages();
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Failed to send message', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if(!confirm('Delete this message?')) return;
    try {
        await api.delete(`/api/webmail/messages/${id}`);
        setMessages(prev => prev.filter(m => m._id !== id));
        if (selectedMsg?._id === id) setSelectedMsg(null);
        addToast('Message deleted', 'success');
    } catch(err) {
        addToast('Failed to delete message', 'error');
        fetchMessages();
    }
  };

  const handleReply = () => {
    if (!selectedMsg) return;
    const replyTo = view === 'inbox' ? selectedMsg.from : selectedMsg.to;
    const replySubject = selectedMsg.subject.startsWith('Re:') ? selectedMsg.subject : `Re: ${selectedMsg.subject}`;
    
    // Simple blockquote for reply
    const quoteHtml = `<br><br><blockquote style="border-left: 2px solid #ccc; padding-left: 10px; margin-left: 5px; color: #666;">
        On ${new Date(selectedMsg.created_at).toLocaleString()}, <strong>${selectedMsg.from}</strong> wrote:<br>
        ${selectedMsg.html_body || selectedMsg.text_body}
    </blockquote><br>`;

    setComposeTo(replyTo);
    setComposeSubject(replySubject);
    setShowCompose(true);
    
    // Need to wait for modal to render before setting innerHTML
    setTimeout(() => {
        if(editorRef.current) {
            editorRef.current.innerHTML = quoteHtml;
            // Focus at start
            const range = document.createRange();
            const sel = window.getSelection();
            range.setStart(editorRef.current, 0);
            range.collapse(true);
            sel?.removeAllRanges();
            sel?.addRange(range);
        }
    }, 100);
  };

  const SafeHtml = ({ html }: { html: string }) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    useEffect(() => {
      if (iframeRef.current) {
        const doc = iframeRef.current.contentDocument;
        if (doc) {
          doc.open();
          doc.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <base target="_blank">
                <style>
                  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #374151; margin: 0; padding: 2rem; }
                  a { color: #16a34a; text-decoration: underline; }
                  img { max-width: 100%; height: auto; border-radius: 4px; }
                  blockquote { margin-left: 0; padding-left: 1em; border-left: 4px solid #e5e7eb; color: #6b7280; }
                </style>
            </head>
            <body>
            ${html || '<div style="color:#9ca3af; font-style: italic;">No content</div>'}
            </body>
            </html>
          `);
          doc.close();
        }
      }
    }, [html]);
    return <iframe ref={iframeRef} title="email-body" className="w-full h-full border-0 bg-white" sandbox="allow-same-origin allow-popups" />;
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      
      {/* SIDEBAR (Unchanged) */}
      <div className="w-64 bg-gray-900 flex flex-col flex-shrink-0 text-gray-300 hidden md:flex border-r border-gray-800">
        <div className="h-16 flex items-center px-6 border-b border-gray-800">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center mr-3 text-white font-bold text-sm shadow-lg shadow-green-900/20">E</div>
            <span className="text-white font-bold tracking-tight text-lg">Eeina</span>
        </div>
        <div className="p-4">
          <button 
            onClick={() => {
                setComposeTo('');
                setComposeSubject('');
                setAttachments([]);
                if(editorRef.current) editorRef.current.innerHTML = '';
                setShowCompose(true);
            }}
            className="w-full flex items-center justify-center px-4 py-3 bg-white text-gray-900 rounded-xl shadow-sm hover:bg-green-50 hover:text-green-700 transition-all font-semibold text-sm mb-8 transform hover:scale-[1.02]"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            Compose
          </button>
          <nav className="space-y-1">
            <button onClick={() => { setView('inbox'); setSelectedMsg(null); }} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${view === 'inbox' ? 'bg-gray-800 text-white shadow-inner' : 'hover:bg-gray-800/50 text-gray-400 hover:text-white'}`}>
              <div className="flex items-center"><svg className="w-5 h-5 mr-3 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>Inbox</div>
              {messages.filter(m => m.folder === 'inbox' && !m.is_read).length > 0 && (<span className="bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">{messages.filter(m => m.folder === 'inbox' && !m.is_read).length}+</span>)}
            </button>
            <button onClick={() => { setView('sent'); setSelectedMsg(null); }} className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${view === 'sent' ? 'bg-gray-800 text-white shadow-inner' : 'hover:bg-gray-800/50 text-gray-400 hover:text-white'}`}>
               <svg className="w-5 h-5 mr-3 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>Sent
            </button>
          </nav>
        </div>
        <div className="mt-auto p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-green-500 to-emerald-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-gray-700">{user.email.charAt(0).toUpperCase()}</div>
            <div className="flex-1 min-w-0"><p className="text-sm font-medium text-white truncate">{user.email}</p><div className="flex items-center gap-1.5 mt-0.5"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span><p className="text-xs text-gray-500 truncate">Connected</p></div></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setShowSettings(true)} className="flex items-center justify-center px-3 py-2 text-xs font-medium bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-700">Settings</button>
              <button onClick={onLogout} className="flex items-center justify-center px-3 py-2 text-xs font-medium bg-gray-800 hover:bg-red-900/30 hover:text-red-400 rounded-lg transition-colors border border-gray-700 hover:border-red-900/50">Logout</button>
          </div>
        </div>
      </div>

      {/* MESSAGE LIST */}
      <div className={`${selectedMsg ? 'hidden md:flex' : 'flex'} w-full md:w-96 bg-white border-r border-gray-200 flex-col shadow-sm z-10`}>
        <div className="h-16 border-b border-gray-100 flex items-center justify-between px-4 bg-white sticky top-0 z-20">
            <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-gray-900 capitalize">{view}</h2>
                <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{totalMessages}</span>
            </div>
            <div className="flex items-center gap-2">
                {selectedIds.size > 0 && (
                    <button onClick={handleBatchDelete} className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors text-xs font-bold flex items-center gap-1 animate-in fade-in">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>Delete ({selectedIds.size})
                    </button>
                )}
                <button onClick={() => fetchMessages()} className={`text-gray-400 hover:text-green-600 transition-colors p-2 rounded-full hover:bg-gray-50 ${loadingMessages ? 'animate-spin text-green-600' : ''}`} title="Refresh"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg></button>
            </div>
        </div>
        <div className="px-4 py-2 border-b border-gray-100 bg-gray-50 flex items-center gap-3 text-xs text-gray-500">
            <input type="checkbox" checked={messages.length > 0 && selectedIds.size === messages.length} onChange={toggleSelectAll} className="rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"/>
            <span>Select All</span>
        </div>
        <div className="flex-1 overflow-y-auto">
            {loadingMessages && messages.length === 0 ? <MessageListSkeleton /> : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400"><p className="text-sm">No messages found</p></div>
            ) : (
                messages.map(msg => (
                <div key={msg._id} onClick={() => handleSelectMessage(msg)} className={`cursor-pointer p-4 border-b border-gray-50 hover:bg-gray-50 transition-all group relative ${selectedMsg?._id === msg._id ? 'bg-green-50/60 border-l-4 border-l-green-600 pl-3' : 'border-l-4 border-l-transparent'}`}>
                    <div className="flex items-start gap-3">
                         <div className="pt-1"><input type="checkbox" checked={selectedIds.has(msg._id)} onClick={(e) => e.stopPropagation()} onChange={(e) => toggleSelection(msg._id, e as any)} className="rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"/></div>
                         <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                                <span className={`text-sm truncate pr-2 ${!msg.is_read && view === 'inbox' ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>{view === 'inbox' ? msg.from : `To: ${msg.to}`}</span>
                                <span className={`text-[10px] whitespace-nowrap ${!msg.is_read && view === 'inbox' ? 'text-green-600 font-bold' : 'text-gray-400'}`}>{timeAgo(msg.created_at)}</span>
                            </div>
                            <div className={`text-sm mb-1 truncate ${!msg.is_read && view === 'inbox' ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>{msg.subject || '(No Subject)'}</div>
                            <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{msg.text_body}</p>
                         </div>
                    </div>
                </div>
                ))
            )}
        </div>
        <div className="p-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs">
            <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-1.5 rounded bg-white border border-gray-200 text-gray-600 disabled:opacity-50 hover:bg-gray-50">Prev</button>
            <span className="text-gray-500">Page {page} of {totalPages || 1}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded bg-white border border-gray-200 text-gray-600 disabled:opacity-50 hover:bg-gray-50">Next</button>
        </div>
      </div>

      {/* READING PANE (Unchanged) */}
      <div className={`${selectedMsg ? 'flex' : 'hidden md:flex'} flex-1 bg-white flex-col h-full absolute md:relative inset-0 z-20`}>
        {selectedMsg ? (
            <>
                <div className="h-16 px-6 border-b border-gray-100 flex items-center justify-between bg-white shadow-sm z-10">
                    <div className="flex items-center gap-4 overflow-hidden">
                        <button onClick={() => setSelectedMsg(null)} className="md:hidden text-gray-500 hover:text-gray-900"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
                        <div className="flex-1 min-w-0"><h2 className="text-lg font-bold text-gray-900 truncate">{selectedMsg.subject || '(No Subject)'}</h2></div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={handleReply} className="text-gray-500 hover:text-green-600 hover:bg-green-50 p-2 rounded-lg transition-colors" title="Reply"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg></button>
                        <button onClick={(e) => handleDelete(e, selectedMsg._id)} className="text-gray-500 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Delete"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                    </div>
                </div>
                <div className="px-6 py-4 bg-gray-50/50 flex justify-between items-start border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-sm border border-white">{selectedMsg.from.charAt(0).toUpperCase()}</div>
                        <div>
                            <div className="text-sm font-bold text-gray-900">{selectedMsg.from}</div>
                            <div className="text-xs text-gray-500">to {selectedMsg.to}</div>
                        </div>
                    </div>
                    <div className="text-xs text-gray-500 font-medium bg-white px-2 py-1 rounded border border-gray-200">{new Date(selectedMsg.created_at).toLocaleString()}</div>
                </div>
                <div className="flex-1 bg-white relative">
                    {selectedMsg.html_body ? (<SafeHtml html={selectedMsg.html_body} />) : (<div className="p-8 whitespace-pre-wrap font-sans text-gray-800 leading-relaxed max-w-3xl">{selectedMsg.text_body}</div>)}
                </div>
            </>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-gray-400">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-gray-100"><svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg></div>
                <p className="text-gray-500 font-medium">Select an email to read</p>
            </div>
        )}
      </div>

      {/* --- NEW COMPOSE MODAL --- */}
      {showCompose && (
        <div className="absolute inset-0 z-50 overflow-hidden flex items-end sm:items-center justify-center p-0 sm:p-4 bg-gray-900/30 backdrop-blur-sm">
            <div className="bg-white w-full sm:max-w-3xl h-[95vh] sm:h-[85vh] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-200 ring-1 ring-black/5">
                <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-lg font-bold text-gray-900">New Message</h3>
                    <button onClick={() => setShowCompose(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                
                <form onSubmit={handleSend} className="flex-1 flex flex-col min-h-0">
                    <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
                        
                        {/* Recipients */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                                <span className="text-sm font-semibold text-gray-500 w-10">To</span>
                                <input 
                                    type="text" 
                                    value={composeTo} 
                                    onChange={e => setComposeTo(e.target.value)}
                                    className="flex-1 outline-none text-sm text-gray-800"
                                    placeholder="recipient@example.com"
                                    required 
                                />
                                <div className="flex gap-2 text-xs text-gray-500">
                                    <button type="button" onClick={() => setShowCc(!showCc)} className="hover:text-gray-800 hover:underline">Cc</button>
                                    <button type="button" onClick={() => setShowBcc(!showBcc)} className="hover:text-gray-800 hover:underline">Bcc</button>
                                </div>
                            </div>

                            {showCc && (
                                <div className="flex items-center gap-2 border-b border-gray-100 pb-2 animate-in fade-in slide-in-from-top-1">
                                    <span className="text-sm font-semibold text-gray-500 w-10">Cc</span>
                                    <input 
                                        type="text" 
                                        value={composeCc} 
                                        onChange={e => setComposeCc(e.target.value)}
                                        className="flex-1 outline-none text-sm text-gray-800"
                                        placeholder="cc@example.com"
                                    />
                                </div>
                            )}

                            {showBcc && (
                                <div className="flex items-center gap-2 border-b border-gray-100 pb-2 animate-in fade-in slide-in-from-top-1">
                                    <span className="text-sm font-semibold text-gray-500 w-10">Bcc</span>
                                    <input 
                                        type="text" 
                                        value={composeBcc} 
                                        onChange={e => setComposeBcc(e.target.value)}
                                        className="flex-1 outline-none text-sm text-gray-800"
                                        placeholder="bcc@example.com"
                                    />
                                </div>
                            )}

                            <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                                <span className="text-sm font-semibold text-gray-500 w-10">Subject</span>
                                <input 
                                    type="text" 
                                    value={composeSubject} 
                                    onChange={e => setComposeSubject(e.target.value)}
                                    className="flex-1 outline-none text-sm text-gray-800 font-medium"
                                    placeholder="Subject"
                                />
                            </div>
                        </div>

                        {/* Editor */}
                        <div className="flex flex-col h-full min-h-[300px] border border-gray-200 rounded-lg overflow-hidden bg-white">
                            <RichTextToolbar onCmd={execCmd} onImage={handleInsertImage} />
                            <div 
                                ref={editorRef}
                                contentEditable
                                className="flex-1 p-4 outline-none overflow-y-auto text-sm font-sans"
                                style={{ minHeight: '200px' }}
                            ></div>
                        </div>
                        
                        {/* Attachments List */}
                        {attachments.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-2">
                                {attachments.map((file, idx) => (
                                    <div key={idx} className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full text-xs text-gray-700 border border-gray-200">
                                        <svg className="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                        <span className="max-w-[150px] truncate">{file.name}</span>
                                        <button type="button" onClick={() => removeAttachment(idx)} className="hover:text-red-500">
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                             {/* Hidden File Input */}
                             <input 
                                type="file" 
                                multiple 
                                ref={fileInputRef} 
                                className="hidden" 
                                onChange={handleFileSelect} 
                             />
                             <button 
                                type="button" 
                                onClick={() => fileInputRef.current?.click()}
                                className="text-gray-500 hover:text-gray-900 hover:bg-gray-200 p-2 rounded-full transition-colors" 
                                title="Attach File"
                             >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                             </button>
                        </div>
                        <div className="flex items-center gap-3">
                            <button type="button" onClick={() => setShowCompose(false)} className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors">Discard</button>
                            <button 
                                type="submit" 
                                disabled={sending}
                                className="bg-green-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
                            >
                                {sending && <Spinner />}
                                Send
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Settings Modal (Unchanged) */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-900">App Settings</h3>
                    <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="p-6">
                    <div className="bg-green-50 text-green-800 p-4 rounded-xl text-sm mb-6 border border-green-100 flex gap-3">
                        <svg className="w-5 h-5 flex-shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <p>These settings allow you to connect external apps like printers or contact forms to <strong>send</strong> email through your account.</p>
                    </div>
                    <div className="space-y-4">
                        <div className="grid grid-cols-3 items-center text-sm"><span className="font-medium text-gray-500">SMTP Host</span><code className="col-span-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 block text-gray-800 font-mono select-all">{window.location.hostname}</code></div>
                        <div className="grid grid-cols-3 items-center text-sm"><span className="font-medium text-gray-500">Port</span><code className="col-span-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 block text-gray-800 font-mono">587 (STARTTLS)</code></div>
                        <div className="grid grid-cols-3 items-center text-sm"><span className="font-medium text-gray-500">Username</span><code className="col-span-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 block text-gray-800 font-mono select-all">{user.email}</code></div>
                    </div>
                </div>
                <div className="px-6 py-4 bg-gray-50 text-right"><button onClick={() => setShowSettings(false)} className="text-sm font-medium text-gray-600 hover:text-gray-900 bg-white border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">Close</button></div>
            </div>
        </div>
      )}
    </div>
  );
};

export default WebmailView;