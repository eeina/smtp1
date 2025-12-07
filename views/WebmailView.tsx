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
      if (view === 'sent') {
         // Force update if viewing sent
      }
      alert('Message Sent');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to send message');
    } finally {
      setSending(false);
    }
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
          doc.write(html || '<div style="font-family:sans-serif;color:#666;">No content</div>');
          doc.close();
        }
      }
    }, [html]);
    return <iframe ref={iframeRef} title="email-body" className="w-full h-full border-0" />;
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden relative">
      {/* Sidebar */}
      <div className="w-64 bg-slate-800 flex flex-col flex-shrink-0 text-white">
        <div className="p-4 border-b border-slate-700">
          <h1 className="text-xl font-bold">Webmail</h1>
          <p className="text-xs text-slate-400 mt-1 truncate">{user.email}</p>
        </div>
        
        <div className="p-4">
          <button 
            onClick={() => setShowCompose(true)}
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
            Compose
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <button 
            onClick={() => { setView('inbox'); setSelectedMsg(null); }}
            className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium flex justify-between ${view === 'inbox' ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
          >
            <span>Inbox</span>
            {/* Simple count badge could go here */}
          </button>
          <button 
            onClick={() => { setView('sent'); setSelectedMsg(null); }}
            className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${view === 'sent' ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
          >
            Sent
          </button>
        </nav>
        <div className="p-4 border-t border-slate-700">
          <button onClick={onLogout} className="w-full text-left text-sm text-slate-400 hover:text-white">Sign Out</button>
        </div>
      </div>

      {/* Message List */}
      <div className={`${selectedMsg ? 'hidden md:flex' : 'flex'} w-full md:w-80 bg-white border-r border-gray-200 flex-col`}>
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-700 capitalize">{view}</h2>
          <button onClick={fetchMessages} className="text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">Folder is empty</div>
          ) : (
            filtered.map(msg => (
              <div 
                key={msg._id} 
                onClick={() => setSelectedMsg(msg)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-blue-50 transition ${selectedMsg?._id === msg._id ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'}`}
              >
                <div className="flex justify-between items-baseline mb-1">
                  <span className="font-semibold text-gray-900 text-sm truncate w-2/3">
                    {view === 'inbox' ? msg.from : `To: ${msg.to}`}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="text-sm font-medium text-gray-800 truncate">{msg.subject || '(No Subject)'}</div>
                <div className="text-xs text-gray-500 truncate mt-1">{msg.text_body.substring(0, 50)}...</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Message Detail */}
      <div className={`${selectedMsg ? 'flex' : 'hidden md:flex'} flex-1 bg-white flex-col h-full`}>
        {selectedMsg ? (
          <>
            <div className="p-6 border-b border-gray-200 shadow-sm z-10 bg-white">
              <div className="flex justify-between items-start">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedMsg.subject || '(No Subject)'}</h2>
                <button onClick={() => setSelectedMsg(null)} className="md:hidden text-blue-600 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back
                </button>
              </div>
              <div className="flex flex-col space-y-1 text-sm text-gray-600">
                <div className="flex">
                  <span className="font-medium w-16 text-gray-500">From:</span>
                  <span className="text-gray-900">{selectedMsg.from}</span>
                </div>
                <div className="flex">
                  <span className="font-medium w-16 text-gray-500">To:</span>
                  <span className="text-gray-900">{selectedMsg.to}</span>
                </div>
                <div className="flex">
                  <span className="font-medium w-16 text-gray-500">Date:</span>
                  <span>{new Date(selectedMsg.created_at).toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="flex-1 bg-gray-50 p-6 overflow-hidden relative">
              <div className="bg-white shadow-sm border border-gray-200 rounded-lg w-full h-full overflow-hidden">
                 {selectedMsg.html_body ? (
                   <SafeHtml html={selectedMsg.html_body} />
                 ) : (
                   <div className="p-6 whitespace-pre-wrap font-sans text-gray-800">
                     {selectedMsg.text_body}
                   </div>
                 )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <p>Select an email to read</p>
          </div>
        )}
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <div className="absolute inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Backdrop */}
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => !sending && setShowCompose(false)}></div>
            </div>

            {/* Modal Panel */}
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
              <form onSubmit={handleSend}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">New Message</h3>
                    <button 
                      type="button" 
                      onClick={() => setShowCompose(false)} 
                      disabled={sending}
                      className="text-gray-400 hover:text-gray-500 focus:outline-none"
                    >
                      <span className="sr-only">Close</span>
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="to" className="block text-sm font-medium text-gray-700">To</label>
                      <input 
                        type="text" 
                        id="to" 
                        required
                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md px-3 py-2 border"
                        placeholder="recipient@example.com"
                        value={composeTo}
                        onChange={e => setComposeTo(e.target.value)}
                        disabled={sending}
                      />
                    </div>
                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-gray-700">Subject</label>
                      <input 
                        type="text" 
                        id="subject" 
                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md px-3 py-2 border"
                        placeholder="Subject"
                        value={composeSubject}
                        onChange={e => setComposeSubject(e.target.value)}
                        disabled={sending}
                      />
                    </div>
                    <div>
                      <label htmlFor="body" className="block text-sm font-medium text-gray-700">Message</label>
                      <textarea 
                        id="body" 
                        rows={8}
                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md px-3 py-2 border"
                        value={composeBody}
                        onChange={e => setComposeBody(e.target.value)}
                        disabled={sending}
                      ></textarea>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button 
                    type="submit" 
                    disabled={sending}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {sending ? <Spinner /> : 'Send Message'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowCompose(false)}
                    disabled={sending}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebmailView;
