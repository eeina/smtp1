import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import { User, EmailMessage } from '../types';

const WebmailView = ({ user, onLogout }: { user: User, onLogout: () => void }) => {
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [selectedMsg, setSelectedMsg] = useState<EmailMessage | null>(null);
  const [view, setView] = useState<'inbox' | 'sent'>('inbox');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/api/webmail/messages');
        setMessages(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetch();
    const int = setInterval(fetch, 10000); // Poll every 10s
    return () => clearInterval(int);
  }, []);

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
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-slate-800 flex flex-col flex-shrink-0 text-white">
        <div className="p-4 border-b border-slate-700">
          <h1 className="text-xl font-bold">Webmail</h1>
          <p className="text-xs text-slate-400 mt-1 truncate">{user.email}</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => { setView('inbox'); setSelectedMsg(null); }}
            className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${view === 'inbox' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
          >
            Inbox
          </button>
          <button 
            onClick={() => { setView('sent'); setSelectedMsg(null); }}
            className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${view === 'sent' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
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
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-medium text-gray-700 capitalize">{view}</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">Folder is empty</div>
          ) : (
            filtered.map(msg => (
              <div 
                key={msg._id} 
                onClick={() => setSelectedMsg(msg)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-blue-50 transition ${selectedMsg?._id === msg._id ? 'bg-blue-50' : ''}`}
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
            <div className="p-6 border-b border-gray-200 shadow-sm z-10">
              <div className="flex justify-between items-start">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedMsg.subject || '(No Subject)'}</h2>
                <button onClick={() => setSelectedMsg(null)} className="md:hidden text-blue-600">Back</button>
              </div>
              <div className="flex flex-col space-y-1 text-sm text-gray-600">
                <div className="flex">
                  <span className="font-medium w-12">From:</span>
                  <span>{selectedMsg.from}</span>
                </div>
                <div className="flex">
                  <span className="font-medium w-12">To:</span>
                  <span>{selectedMsg.to}</span>
                </div>
                <div className="flex">
                  <span className="font-medium w-12">Date:</span>
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
          <div className="flex-1 flex items-center justify-center bg-gray-50 text-gray-400">
            Select an email to read
          </div>
        )}
      </div>
    </div>
  );
};

export default WebmailView;
