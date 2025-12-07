import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import { User, EmailMessage } from '../types';
import Spinner from '../components/Spinner';

const WebmailView = ({ user, onLogout }: { user: User, onLogout: () => void }) => {
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [selectedMsg, setSelectedMsg] = useState<EmailMessage | null>(null);
  const [view, setView] = useState<'inbox' | 'sent'>('inbox');
  
  // Compose State
  const [showCompose, setShowCompose] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [sending, setSending] = useState(false);

  // Settings Modal State
  const [showSettings, setShowSettings] = useState(false);

  const fetchMessages = async () => {
    try {
      const res = await api.get('/api/webmail/messages');
      setMessages(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMessages();
    const int = setInterval(fetchMessages, 10000); // Poll every 10s
    return () => clearInterval(int);
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await api.post('/api/webmail/send', {
        to: composeTo,
        subject: composeSubject,
        body: composeBody
      });
      
      setShowCompose(false);
      setComposeTo('');
      setComposeSubject('');
      setComposeBody('');
      
      await fetchMessages();
      // Simple Toast could go here
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to send message');
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
        if (selectedMsg?._id === id) {
            setSelectedMsg(null);
        }
    } catch(err) {
        alert('Failed to delete message');
        fetchMessages();
    }
  };

  const handleReply = () => {
    if (!selectedMsg) return;
    const replyTo = view === 'inbox' ? selectedMsg.from : selectedMsg.to;
    const replySubject = selectedMsg.subject.startsWith('Re:') ? selectedMsg.subject : `Re: ${selectedMsg.subject}`;
    const quotedBody = `\n\n\n> On ${new Date(selectedMsg.created_at).toLocaleString()}, ${selectedMsg.from} wrote:\n> ${selectedMsg.text_body.split('\n').join('\n> ')}`;
    
    setComposeTo(replyTo);
    setComposeSubject(replySubject);
    setComposeBody(quotedBody);
    setShowCompose(true);
  };

  const filtered = messages.filter(m => m.folder === view);

  const SafeHtml = ({ html }: { html: string }) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    useEffect(() => {
      if (iframeRef.current) {
        const doc = iframeRef.current.contentDocument;
        if (doc) {
          doc.open();
          doc.write(`
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #1f2937; margin: 0; padding: 1.5rem; }
              a { color: #2563eb; }
              img { max-width: 100%; height: auto; border-radius: 4px; }
              blockquote { margin-left: 0; padding-left: 1em; border-left: 3px solid #e5e7eb; color: #6b7280; }
            </style>
            ${html || '<div style="color:#9ca3af; font-style: italic;">No content</div>'}
          `);
          doc.close();
        }
      }
    }, [html]);
    return <iframe ref={iframeRef} title="email-body" className="w-full h-full border-0 bg-white" sandbox="allow-same-origin" />;
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      
      {/* SIDEBAR */}
      <div className="w-64 bg-gray-900 flex flex-col flex-shrink-0 text-gray-300 hidden md:flex border-r border-gray-800">
        <div className="h-16 flex items-center px-6 border-b border-gray-800">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3 text-white font-bold text-sm shadow-lg shadow-blue-900/20">
                W
            </div>
            <span className="text-white font-bold tracking-tight">Webmail</span>
        </div>
        
        <div className="p-4">
          <button 
            onClick={() => {
                setComposeTo('');
                setComposeSubject('');
                setComposeBody('');
                setShowCompose(true);
            }}
            className="w-full flex items-center justify-center px-4 py-3 bg-white text-gray-900 rounded-xl shadow-sm hover:bg-gray-50 transition-all font-semibold text-sm mb-6"
          >
            <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            Compose
          </button>
          
          <nav className="space-y-1">
            <button 
              onClick={() => { setView('inbox'); setSelectedMsg(null); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${view === 'inbox' ? 'bg-gray-800 text-white' : 'hover:bg-gray-800/50 text-gray-400 hover:text-white'}`}
            >
              <div className="flex items-center">
                  <svg className="w-5 h-5 mr-3 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                  Inbox
              </div>
              {messages.filter(m => m.folder === 'inbox' && !m.is_read).length > 0 && (
                  <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{messages.filter(m => m.folder === 'inbox' && !m.is_read).length}</span>
              )}
            </button>
            <button 
              onClick={() => { setView('sent'); setSelectedMsg(null); }}
              className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${view === 'sent' ? 'bg-gray-800 text-white' : 'hover:bg-gray-800/50 text-gray-400 hover:text-white'}`}
            >
               <svg className="w-5 h-5 mr-3 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
               Sent
            </button>
          </nav>
        </div>

        <div className="mt-auto p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
               {user.email.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.email}</p>
                <p className="text-xs text-gray-500 truncate">Online</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setShowSettings(true)} className="flex items-center justify-center px-3 py-2 text-xs font-medium bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">Settings</button>
              <button onClick={onLogout} className="flex items-center justify-center px-3 py-2 text-xs font-medium bg-gray-800 hover:bg-red-900/30 hover:text-red-400 rounded-lg transition-colors">Logout</button>
          </div>
        </div>
      </div>

      {/* MESSAGE LIST */}
      <div className={`${selectedMsg ? 'hidden md:flex' : 'flex'} w-full md:w-96 bg-white border-r border-gray-200 flex-col shadow-sm z-10`}>
        <div className="h-16 border-b border-gray-100 flex items-center justify-between px-4 bg-white sticky top-0">
            <h2 className="text-lg font-bold text-gray-900 capitalize">{view}</h2>
            <button onClick={fetchMessages} className="text-gray-400 hover:text-blue-600 transition-colors p-2 rounded-full hover:bg-gray-50">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <p className="text-sm">No messages found</p>
                </div>
            ) : (
                filtered.map(msg => (
                <div 
                    key={msg._id} 
                    onClick={() => setSelectedMsg(msg)}
                    className={`cursor-pointer p-4 border-b border-gray-50 hover:bg-gray-50 transition-all ${selectedMsg?._id === msg._id ? 'bg-blue-50/60 border-l-4 border-l-blue-600 pl-3' : 'border-l-4 border-l-transparent'}`}
                >
                    <div className="flex justify-between items-start mb-1">
                        <span className={`text-sm truncate pr-2 ${!msg.is_read && view === 'inbox' ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                            {view === 'inbox' ? msg.from : `To: ${msg.to}`}
                        </span>
                        <span className={`text-[10px] whitespace-nowrap ${!msg.is_read && view === 'inbox' ? 'text-blue-600 font-bold' : 'text-gray-400'}`}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                    <div className={`text-sm mb-1 truncate ${!msg.is_read && view === 'inbox' ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                        {msg.subject || '(No Subject)'}
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                        {msg.text_body}
                    </p>
                </div>
                ))
            )}
        </div>
      </div>

      {/* READING PANE */}
      <div className={`${selectedMsg ? 'flex' : 'hidden md:flex'} flex-1 bg-white flex-col h-full absolute md:relative inset-0 z-20`}>
        {selectedMsg ? (
            <>
                {/* Header */}
                <div className="h-16 px-6 border-b border-gray-100 flex items-center justify-between bg-white shadow-sm z-10">
                    <div className="flex items-center gap-4 overflow-hidden">
                        <button onClick={() => setSelectedMsg(null)} className="md:hidden text-gray-500 hover:text-gray-900">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-lg font-bold text-gray-900 truncate">{selectedMsg.subject || '(No Subject)'}</h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={handleReply} className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors" title="Reply">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                        </button>
                        <button onClick={(e) => handleDelete(e, selectedMsg._id)} className="text-gray-500 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Delete">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                </div>

                {/* Meta Info */}
                <div className="px-6 py-4 bg-gray-50/50 flex justify-between items-start border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-sm">
                            {selectedMsg.from.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div className="text-sm font-bold text-gray-900">{selectedMsg.from}</div>
                            <div className="text-xs text-gray-500">to {selectedMsg.to}</div>
                        </div>
                    </div>
                    <div className="text-xs text-gray-400 font-medium">
                        {new Date(selectedMsg.created_at).toLocaleString()}
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 bg-white relative">
                    {selectedMsg.html_body ? (
                        <SafeHtml html={selectedMsg.html_body} />
                    ) : (
                        <div className="p-8 whitespace-pre-wrap font-sans text-gray-800 leading-relaxed max-w-3xl">
                            {selectedMsg.text_body}
                        </div>
                    )}
                </div>
            </>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-gray-400">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                    <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <p className="text-gray-500 font-medium">Select an email to read</p>
            </div>
        )}
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <div className="absolute inset-0 z-50 overflow-hidden flex items-end sm:items-center justify-center p-0 sm:p-4 bg-gray-900/50 backdrop-blur-sm">
            <div className="bg-white w-full sm:max-w-2xl h-[90vh] sm:h-auto sm:max-h-[85vh] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="text-lg font-bold text-gray-900">New Message</h3>
                    <button onClick={() => setShowCompose(false)} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <form onSubmit={handleSend} className="flex-1 flex flex-col overflow-y-auto">
                    <div className="p-6 space-y-4 flex-1">
                        <div className="relative group">
                            <label htmlFor="to" className="absolute left-3 top-2.5 text-xs font-bold text-gray-400 uppercase tracking-wide">To</label>
                            <input 
                                type="text" 
                                id="to" 
                                value={composeTo} 
                                onChange={e => setComposeTo(e.target.value)}
                                className="w-full bg-gray-50 border border-transparent rounded-lg py-2.5 pl-10 pr-4 text-sm focus:bg-white focus:border-blue-500 focus:ring-0 transition-all outline-none"
                                required 
                            />
                        </div>
                        <div className="relative group">
                            <label htmlFor="subject" className="absolute left-3 top-2.5 text-xs font-bold text-gray-400 uppercase tracking-wide">Sub</label>
                            <input 
                                type="text" 
                                id="subject" 
                                value={composeSubject} 
                                onChange={e => setComposeSubject(e.target.value)}
                                className="w-full bg-gray-50 border border-transparent rounded-lg py-2.5 pl-12 pr-4 text-sm focus:bg-white focus:border-blue-500 focus:ring-0 transition-all outline-none"
                                placeholder="Subject"
                            />
                        </div>
                        <textarea 
                            value={composeBody} 
                            onChange={e => setComposeBody(e.target.value)}
                            className="w-full flex-1 min-h-[200px] resize-none border-0 p-4 text-sm focus:ring-0 outline-none text-gray-700 placeholder-gray-300"
                            placeholder="Type your message..."
                        />
                    </div>
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                        <button type="button" onClick={() => setShowCompose(false)} className="text-sm font-medium text-gray-500 hover:text-gray-800">Discard</button>
                        <button 
                            type="submit" 
                            disabled={sending}
                            className="bg-gray-900 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-black transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {sending && <Spinner />}
                            Send Message
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-900">App Settings</h3>
                    <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="p-6">
                    <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm mb-6 border border-blue-100">
                        These settings allow you to connect external apps like printers or contact forms to <strong>send</strong> email through your account.
                    </div>
                    
                    <div className="space-y-4">
                        <div className="grid grid-cols-3 items-center text-sm">
                            <span className="font-medium text-gray-500">SMTP Host</span>
                            <code className="col-span-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 block text-gray-800 font-mono select-all">{window.location.hostname}</code>
                        </div>
                        <div className="grid grid-cols-3 items-center text-sm">
                            <span className="font-medium text-gray-500">Port</span>
                            <code className="col-span-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 block text-gray-800 font-mono">587 (STARTTLS)</code>
                        </div>
                        <div className="grid grid-cols-3 items-center text-sm">
                            <span className="font-medium text-gray-500">Username</span>
                            <code className="col-span-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 block text-gray-800 font-mono select-all">{user.email}</code>
                        </div>
                    </div>
                </div>
                <div className="px-6 py-4 bg-gray-50 text-right">
                    <button onClick={() => setShowSettings(false)} className="text-sm font-medium text-gray-600 hover:text-gray-900">Close</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default WebmailView;
