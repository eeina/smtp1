import React, { useRef, useEffect } from 'react';

interface Props {
  message: any;
  onClose: () => void;
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
                body { font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif; font-size: 14px; line-height: 1.6; color: #1e293b; margin: 0; padding: 2rem; background-color: white; }
                a { color: #10b981; text-decoration: underline; }
                img { max-width: 100%; height: auto; }
              </style>
          </head>
          <body>${html || '<i>No content.</i>'}</body>
          </html>
        `);
        doc.close();
      }
    }
  }, [html]);
  return <iframe ref={iframeRef} title="body" className="w-full h-full border-0 bg-white" />;
};

const AuditMessageModal = ({ message, onClose }: Props) => {
  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="bg-slate-900 w-full max-w-4xl h-[85vh] rounded-2xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex justify-between items-start">
                <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-white truncate leading-tight">{message.subject || '(No Subject)'}</h3>
                    <div className="mt-2 flex items-center gap-4 text-xs text-slate-400 font-mono">
                        <span className="flex items-center gap-2">
                            <span className="uppercase font-black text-slate-600 tracking-widest">From</span>
                            <span className="text-slate-300">{message.from}</span>
                        </span>
                        <span className="text-slate-700">|</span>
                        <span className="flex items-center gap-2">
                            <span className="uppercase font-black text-slate-600 tracking-widest">To</span>
                            <span className="text-slate-300">{message.to}</span>
                        </span>
                        <span className="text-slate-700">|</span>
                        <span className="text-slate-500">{new Date(message.created_at).toLocaleString()}</span>
                    </div>
                </div>
                <button onClick={onClose} className="ml-4 text-slate-500 hover:text-white bg-slate-800 p-2 rounded-lg hover:bg-slate-700 transition-colors">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>

            {/* Metadata Bar */}
            <div className="px-6 py-2 bg-slate-900 border-b border-slate-800 flex items-center gap-4 text-xs">
                <span className={`px-2 py-0.5 rounded border ${message.direction === 'inbound' ? 'bg-emerald-900/30 border-emerald-900/50 text-emerald-400' : 'bg-blue-900/30 border-blue-900/50 text-blue-400'} font-bold uppercase`}>
                    {message.direction}
                </span>
                <span className="text-slate-500">
                    Belongs to Node: <strong className="text-slate-300">{message.mailbox_id?.email}</strong>
                </span>
            </div>

            {/* Content */}
            <div className="flex-1 bg-white overflow-hidden relative">
                {message.html_body ? (
                    <SafeHtml html={message.html_body} />
                ) : (
                    <div className="p-8 whitespace-pre-wrap font-mono text-sm text-slate-800 overflow-y-auto h-full">
                        {message.text_body}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex justify-end">
                <button onClick={onClose} className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-lg border border-slate-700 transition-colors">
                    Close Viewer
                </button>
            </div>
        </div>
    </div>
  );
};

export default AuditMessageModal;