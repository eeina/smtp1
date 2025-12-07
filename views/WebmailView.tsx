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
      
      // Reset and close
      setShowCompose(false);
      setComposeTo('');
      setComposeSubject('');
      setComposeBody('');
      
      // Refresh list
      await fetchMessages();
      alert('Message Sent');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if(!confirm('Are you sure you want to delete this message?')) return;
    
    try {
        await api.delete(`/api/webmail/messages/${id}`);
        // Optimistic update
        setMessages(prev => prev.filter(m => m._id !== id));
        if (selectedMsg?._id === id) {
            setSelectedMsg(null);
        }
    } catch(err) {
        alert('Failed to delete message');
        fetchMessages(); // Revert on failure
    }
  };

  const handleReply = () => {
    if (!selectedMsg) return;
    const replyTo = view === 'inbox' ? selectedMsg.from : selectedMsg.to;
    const replySubject = selectedMsg.subject.startsWith('Re:') ? selectedMsg.subject : `Re: ${selectedMsg.subject}`;
    const quotedBody = `\n\n\n--------------------------------\nOn ${new Date(selectedMsg.created_at).toLocaleString()}, ${selectedMsg.from} wrote:\n\n${selectedMsg.text_body.split('\n').map(line => '> ' + line).join('\n')}`;
    
    setComposeTo(replyTo);
    setComposeSubject(replySubject);
    setComposeBody(quotedBody);
    setShowCompose(true);
  };

  const filtered = messages.filter(m => m.folder === view);

  // Safe HTML renderer using iframe
  const SafeHtml = ({ html }: { html: string }) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    useEffect(() => {
      if (iframeRef.current) {
        const doc = iframeRef.current.contentDocument;
        if (doc) {
          doc.open();
          doc.write(`
            <style>body { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; font-size: 14px; line-height: 1.5; color: #111827; margin: 0; padding: 1rem; } img { max-width: 100%; height: auto; }</style>
            ${html || '<div style="color:#666;">No content</div>'}
          `);
          doc.close();
        }
      }
    }, [html]);
    return <iframe ref={iframeRef} title="email-body" className="w-full h-full border-0 bg-white" sandbox="allow-same-origin" />;
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden relative">
      {/* Sidebar */}
      <div className="w-64 bg-slate-800 flex flex-col flex-shrink-0 text-white hidden md:flex">
        <div className="p-4 border-b border-slate-700">
          <h1 className="text-xl font-bold">Webmail</h1>
          <p className="text-xs text-slate-400 mt-1 truncate">{user.email}</p>
        </div>
        
        <div className="p-4 space-y-2">
          <button 
            onClick={() => {
                setComposeTo('');
                setComposeSubject('');
                setComposeBody('');
                setShowCompose(true);
            }}
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
            Compose
          </button>
          
          <button 
            onClick={() => setShowSettings(true)}
            className="w-full flex items-center justify-center px-4 py-2 border border-slate-600 rounded-md shadow-sm text-sm font-medium text-slate-200 bg-slate-700 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Connect Apps
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <button 
            onClick={() => { setView('inbox'); setSelectedMsg(null); }}
            className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium flex justify-between transition-colors ${view === 'inbox' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-700'}`}
          >
            <span>Inbox</span>
            <span className="bg-slate-600 text-slate-200 py-0.5 px-2 rounded-full text-xs">{messages.filter(m => m.folder === 'inbox' && !m.is_read).length}</span>
          </button>
          <button 
            onClick={() => { setView('sent'); setSelectedMsg(null); }}
            className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${view === 'sent' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-700'}`}
          >
            Sent
          </button>
        </nav>
        <div className="p-4 border-t border-slate-700">
          <button onClick={onLogout} className="w-full flex items-center text-sm text-slate-400 hover:text-white transition-colors">
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Sign Out
          </button>
        </div>
      </div>

      {/* Message List */}
      <div className={`${selectedMsg ? 'hidden md:flex' : 'flex'} w-full md:w-80 bg-white border-r border-gray-200 flex-col`}>
        {/* Mobile Header */}
        <div className="md:hidden bg-slate-800 text-white p-4 flex justify-between items-center shadow-md z-10">
             <div className="flex items-center">
                 <button onClick={() => setShowSettings(true)} className="mr-3 text-slate-300">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                 </button>
                 <span className="font-bold text-lg">Webmail</span>
             </div>
             <button onClick={() => {
                setComposeTo('');
                setComposeSubject('');
                setComposeBody('');
                setShowCompose(true);
             }} className="bg-blue-600 p-2 rounded-full shadow-lg">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
             </button>
        </div>
        
        {/* Tabs for Mobile */}
        <div className="md:hidden flex border-b border-gray-200">
            <button 
                onClick={() => setView('inbox')} 
                className={`flex-1 py-3 text-sm font-medium text-center ${view === 'inbox' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            >
                Inbox
            </button>
            <button 
                onClick={() => setView('sent')} 
                className={`flex-1 py-3 text-sm font-medium text-center ${view === 'sent' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            >
                Sent
            </button>
        </div>

        <div className="p-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center hidden md:flex">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">{view}</h2>
          <button onClick={fetchMessages} className="text-gray-400 hover:text-blue-600 transition" title="Refresh">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 text-sm">
                <svg className="w-10 h-10 mb-2 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                <span>No messages in {view}</span>
            </div>
          ) : (
            filtered.map(msg => (
              <div 
                key={msg._id} 
                onClick={() => setSelectedMsg(msg)}
                className={`group relative p-4 border-b border-gray-100 cursor-pointer hover:bg-blue-50/50 transition-colors ${selectedMsg?._id === msg._id ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'}`}
              >
                <div className="flex justify-between items-baseline mb-1">
                  <span className={`text-sm truncate w-2/3 ${!msg.is_read && view === 'inbox' ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                    {view === 'inbox' ? msg.from : `To: ${msg.to}`}
                  </span>
                  <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className={`text-sm truncate mb-1 ${!msg.is_read && view === 'inbox' ? 'font-semibold text-gray-800' : 'text-gray-600'}`}>
                    {msg.subject || '(No Subject)'}
                </div>
                <div className="text-xs text-gray-400 truncate pr-6">{msg.text_body.substring(0, 60)}...</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Message Detail */}
      <div className={`${selectedMsg ? 'flex' : 'hidden md:flex'} flex-1 bg-white flex-col h-full absolute md:relative inset-0 z-20 md:z-auto`}>
        {selectedMsg ? (
          <>
            <div className="p-4 border-b border-gray-200 shadow-sm z-10 bg-white flex justify-between items-center">
                <div className="flex items-center truncate">
                    <button onClick={() => setSelectedMsg(null)} className="md:hidden mr-3 text-gray-500 hover:text-gray-800">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                    </button>
                    <div className="flex-1 min-w-0">
                         <h2 className="text-lg font-bold text-gray-900 truncate" title={selectedMsg.subject}>{selectedMsg.subject || '(No Subject)'}</h2>
                    </div>
                </div>
                
                <div className="flex items-center space-x-1 sm:space-x-3 flex-shrink-0 ml-2">
                    <button 
                        onClick={handleReply}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition" 
                        title="Reply"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                    </button>
                    <button 
                        onClick={(e) => handleDelete(e, selectedMsg._id)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition" 
                        title="Delete"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
            </div>
            
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
                            {selectedMsg.from.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div className="text-sm font-bold text-gray-900">{selectedMsg.from}</div>
                            <div className="text-xs text-gray-500">To: {selectedMsg.to}</div>
                        </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                        {new Date(selectedMsg.created_at).toLocaleString()}
                    </div>
                </div>
            </div>

            <div className="flex-1 bg-white overflow-hidden relative">
                 {selectedMsg.html_body ? (
                   <SafeHtml html={selectedMsg.html_body} />
                 ) : (
                   <div className="p-6 whitespace-pre-wrap font-sans text-gray-800 text-sm leading-relaxed overflow-y-auto h-full">
                     {selectedMsg.text_body}
                   </div>
                 )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-gray-400">
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
            </div>
            <p className="font-medium text-lg">Select an email to read</p>
            <p className="text-sm mt-1">Or choose an action from the sidebar</p>
          </div>
        )}
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <div className="absolute inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-600 opacity-75 backdrop-blur-sm" onClick={() => !sending && setShowCompose(false)}></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl w-full">
              <form onSubmit={handleSend} className="flex flex-col h-[80vh] sm:h-auto">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 flex-1 flex flex-col overflow-y-auto">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl leading-6 font-bold text-gray-900">New Message</h3>
                    <button type="button" onClick={() => setShowCompose(false)} disabled={sending} className="text-gray-400 hover:text-gray-500 focus:outline-none bg-gray-100 p-1 rounded-full">
                      <span className="sr-only">Close</span>
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                  <div className="space-y-4 flex-1 flex flex-col">
                    <div>
                      <label htmlFor="to" className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">To</label>
                      <input type="text" id="to" required className="block w-full shadow-sm sm:text-sm border-gray-300 rounded-lg px-3 py-2 border focus:ring-blue-500 focus:border-blue-500" placeholder="recipient@example.com" value={composeTo} onChange={e => setComposeTo(e.target.value)} disabled={sending} />
                    </div>
                    <div>
                      <label htmlFor="subject" className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Subject</label>
                      <input type="text" id="subject" className="block w-full shadow-sm sm:text-sm border-gray-300 rounded-lg px-3 py-2 border focus:ring-blue-500 focus:border-blue-500" placeholder="Subject" value={composeSubject} onChange={e => setComposeSubject(e.target.value)} disabled={sending} />
                    </div>
                    <div className="flex-1 flex flex-col">
                      <label htmlFor="body" className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Message</label>
                      <textarea id="body" className="flex-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-lg px-3 py-2 border focus:ring-blue-500 focus:border-blue-500 resize-none min-h-[150px]" value={composeBody} onChange={e => setComposeBody(e.target.value)} disabled={sending}></textarea>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-100">
                  <button type="submit" disabled={sending} className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 transition">
                    {sending ? <Spinner /> : (
                        <span className="flex items-center">
                            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                            Send Message
                        </span>
                    )}
                  </button>
                  <button type="button" onClick={() => setShowCompose(false)} disabled={sending} className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Connection Settings Modal */}
      {showSettings && (
        <div className="absolute inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75 backdrop-blur-sm" onClick={() => setShowSettings(false)}></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                  <h3 className="text-lg leading-6 font-bold text-gray-900">External App Configuration</h3>
                  <button type="button" onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-500">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-800">
                    Use these settings to connect external applications (like Outlook, Printer, Contact Forms) to <strong>send</strong> email via this account.
                  </div>

                  <div className="grid grid-cols-3 gap-y-3 gap-x-4 text-sm">
                    <div className="font-semibold text-gray-500">Server Host</div>
                    <div className="col-span-2 font-mono bg-gray-50 px-2 py-1 rounded border text-gray-700">{window.location.hostname}</div>

                    <div className="font-semibold text-gray-500">SMTP Port</div>
                    <div className="col-span-2 font-mono bg-gray-50 px-2 py-1 rounded border text-gray-700">587 (Submission)</div>

                    <div className="font-semibold text-gray-500">Username</div>
                    <div className="col-span-2 font-mono bg-gray-50 px-2 py-1 rounded border select-all text-gray-700">{user.email}</div>

                    <div className="font-semibold text-gray-500">Password</div>
                    <div className="col-span-2 italic text-gray-400">Your mailbox password</div>

                    <div className="font-semibold text-gray-500">Encryption</div>
                    <div className="col-span-2 text-gray-700">STARTTLS (Optional/None)</div>
                  </div>

                  <div className="border-t pt-3 mt-4">
                    <h4 className="text-sm font-bold text-gray-800 mb-2">Incoming Mail (IMAP/POP3)</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      External read access (IMAP) is currently <strong>disabled</strong>. You can only read your emails via this Webmail interface. External apps can only be used for <strong>sending</strong>.
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button type="button" onClick={() => setShowSettings(false)} className="w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebmailView;
