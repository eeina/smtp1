import React, { useRef, useEffect } from 'react';
import { EmailMessage } from '../../types';

interface Props {
  selectedMsg: EmailMessage | null;
  onBack: () => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
  onReply: () => void;
}

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

const WebmailReadingPane = ({ selectedMsg, onBack, onDelete, onReply }: Props) => {
  // Mobile behavior: If msg selected, it takes full screen absolute. 
  // Desktop: It's flex-1.
  if (!selectedMsg) {
     return (
        <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-gray-50 text-gray-400 h-full">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-gray-100"><svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg></div>
            <p className="text-gray-500 font-medium">Select an email to read</p>
        </div>
     );
  }

  return (
    <div className="fixed inset-0 z-50 md:static md:z-auto bg-white flex flex-col h-full w-full md:flex-1">
        {/* Header */}
        <div className="h-16 px-4 md:px-6 border-b border-gray-100 flex items-center justify-between bg-white shadow-sm z-10">
            <div className="flex items-center gap-3 overflow-hidden">
                <button onClick={onBack} className="md:hidden text-gray-600 hover:bg-gray-100 p-2 rounded-full -ml-2">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h2 className="text-lg font-bold text-gray-900 truncate flex-1">{selectedMsg.subject || '(No Subject)'}</h2>
            </div>
            <div className="flex items-center gap-1">
                <button onClick={onReply} className="text-gray-500 hover:text-green-600 hover:bg-green-50 p-2 rounded-lg transition-colors" title="Reply"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg></button>
                <button onClick={(e) => onDelete(e, selectedMsg._id)} className="text-gray-500 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Delete"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
            </div>
        </div>

        {/* Sender Info */}
        <div className="px-4 md:px-6 py-4 bg-gray-50/50 flex justify-between items-start border-b border-gray-100">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-sm border border-white flex-shrink-0">{selectedMsg.from.charAt(0).toUpperCase()}</div>
                <div className="min-w-0">
                    <div className="text-sm font-bold text-gray-900 truncate">{selectedMsg.from}</div>
                    <div className="text-xs text-gray-500 truncate">to {selectedMsg.to}</div>
                </div>
            </div>
            <div className="text-xs text-gray-500 font-medium bg-white px-2 py-1 rounded border border-gray-200 whitespace-nowrap ml-2">{new Date(selectedMsg.created_at).toLocaleString()}</div>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white relative overflow-hidden">
            {selectedMsg.html_body ? (<SafeHtml html={selectedMsg.html_body} />) : (<div className="p-4 md:p-8 whitespace-pre-wrap font-sans text-gray-800 leading-relaxed max-w-3xl overflow-y-auto h-full">{selectedMsg.text_body}</div>)}
        </div>
    </div>
  );
};

export default WebmailReadingPane;