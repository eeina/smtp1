import React, { useRef, useEffect, useState } from 'react';
import { EmailMessage } from '../../types';
import api from '../../api';

interface Props {
  message: EmailMessage | null;
  onClose: () => void;
  onDelete: () => void;
  onReply: () => void;
}

// Safe HTML Component
const SafeHtml = ({ html }: { html: string }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  useEffect(() => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        // Inject styles to force readable fonts in the iframe, but keep background white for email compatibility
        doc.write(`
          <!DOCTYPE html>
          <html>
          <head>
              <base target="_blank">
              <style>
                body { 
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
                    font-size: 15px; 
                    line-height: 1.6; 
                    color: #1a1a1a; 
                    margin: 0; 
                    padding: 24px; 
                    background-color: #ffffff;
                }
                a { color: #059669; text-decoration: none; font-weight: 500; }
                a:hover { text-decoration: underline; }
                img { max-width: 100%; height: auto; border-radius: 4px; }
                blockquote { margin-left: 0; padding-left: 12px; border-left: 3px solid #e5e7eb; color: #6b7280; }
                /* Scrollbar styling for the iframe content */
                ::-webkit-scrollbar { width: 8px; height: 8px; }
                ::-webkit-scrollbar-track { background: #f1f1f1; }
                ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
                ::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
              </style>
          </head>
          <body>${html || '<p style="color:#9ca3af; font-style:italic;">No content.</p>'}</body>
          </html>
        `);
        doc.close();
      }
    }
  }, [html]);
  
  return <iframe ref={iframeRef} title="email-body" className="w-full h-full border-0 bg-white" />;
};

const WebmailReadingPane = ({ message, onClose, onDelete, onReply }: Props) => {
  const [downloading, setDownloading] = useState<string | null>(null);

  if (!message) {
    return (
      <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-zinc-950 text-zinc-500">
        <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" /></svg>
        </div>
        <p className="text-sm font-medium">Select a message to read</p>
      </div>
    );
  }

  const handleDownload = async (att: any) => {
      setDownloading(att.filename);
      try {
          const response = await api.get(`/api/webmail/messages/${message._id}/download/${att.filename}`, { responseType: 'blob' });
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', att.filename);
          document.body.appendChild(link);
          link.click();
          link.remove();
      } catch (e) {
          alert('Download failed');
      } finally {
          setDownloading(null);
      }
  };

  const getInitials = (str: string) => {
      return str.replace(/[^a-zA-Z ]/g, "").split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <div className="fixed inset-0 z-50 md:static md:z-auto bg-zinc-950 flex flex-col h-full w-full md:flex-1 animate-in slide-in-from-right-10 duration-200">
        
        {/* Header Actions */}
        <div className="h-14 border-b border-zinc-900 flex items-center justify-between px-4 bg-zinc-950">
            <div className="flex items-center gap-3">
                <button onClick={onClose} className="md:hidden text-zinc-400 hover:text-white">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <div className="flex gap-1">
                    <button onClick={onDelete} className="p-2 text-zinc-400 hover:text-red-500 hover:bg-zinc-900 rounded-lg transition-colors" title="Delete">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                    <button className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg transition-colors" title="Archive">
                         <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                    </button>
                </div>
            </div>
            <div className="text-zinc-500 text-xs font-mono">
                {new Date(message.created_at).toLocaleString()}
            </div>
        </div>

        {/* Metadata Area */}
        <div className="p-6 pb-4 bg-zinc-950">
            <h1 className="text-xl font-bold text-white leading-tight mb-4">{message.subject || '(No Subject)'}</h1>
            
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-lg">
                        {getInitials(message.from)}
                    </div>
                    <div>
                        <div className="text-sm font-bold text-white">{message.from.split('<')[0].replace(/"/g, '')}</div>
                        <div className="text-xs text-zinc-500">{message.from}</div>
                    </div>
                </div>
                <button 
                    onClick={onReply}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white text-black hover:bg-zinc-200 text-xs font-bold rounded-md transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                    Reply
                </button>
            </div>
        </div>

        {/* Attachments */}
        {message.has_attachments && message.attachments && (
            <div className="px-6 pb-4 flex gap-2 overflow-x-auto">
                {message.attachments.map((att, i) => (
                    <button 
                        key={i} 
                        onClick={() => handleDownload(att)}
                        disabled={downloading === att.filename}
                        className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs hover:border-zinc-600 transition-colors max-w-[200px]"
                    >
                        <div className="p-1 bg-zinc-800 rounded text-zinc-400">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                        </div>
                        <div className="text-left min-w-0">
                            <div className="truncate text-zinc-200 font-medium">{att.filename}</div>
                            <div className="text-zinc-500">{Math.round(att.size / 1024)} KB</div>
                        </div>
                    </button>
                ))}
            </div>
        )}

        {/* Content Body */}
        <div className="flex-1 bg-white relative overflow-hidden mx-4 mb-4 rounded-xl border border-zinc-800 shadow-inner">
             {message.html_body ? (
                 <SafeHtml html={message.html_body} />
             ) : (
                 <div className="p-6 whitespace-pre-wrap font-sans text-slate-800 text-sm overflow-y-auto h-full bg-white">
                     {message.text_body}
                 </div>
             )}
        </div>

    </div>
  );
};

export default WebmailReadingPane;