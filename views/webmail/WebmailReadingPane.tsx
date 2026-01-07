
import React, { useRef, useEffect } from 'react';
import { EmailMessage } from '../../types';
import api from '../../api';

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
                body { font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif; font-size: 16px; line-height: 1.7; color: #1e293b; margin: 0; padding: 4rem 2rem; background-color: white; }
                a { color: #10b981; text-decoration: underline; font-weight: 600; }
                img { max-width: 100%; height: auto; border-radius: 24px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
                blockquote { margin-left: 0; padding-left: 1.5rem; border-left: 3px solid #10b981; color: #64748b; font-style: italic; }
                p { margin-bottom: 1.5rem; }
              </style>
          </head>
          <body>
          ${html || '<div style="color:#94a3b8; font-style: italic; text-align: center;">Node record contains no content body.</div>'}
          </body>
          </html>
        `);
        doc.close();
      }
    }
  }, [html]);
  return <iframe ref={iframeRef} title="email-body" className="w-full h-full border-0 bg-white" sandbox="allow-same-origin allow-popups" />;
};

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const WebmailReadingPane = ({ selectedMsg, onBack, onDelete, onReply }: Props) => {
  if (!selectedMsg) {
     return (
        <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-slate-50 text-slate-300 h-full">
            <div className="w-24 h-24 bg-white rounded-[3rem] flex items-center justify-center mb-6 shadow-2xl shadow-slate-200/50 border border-slate-100">
                <svg className="w-10 h-10 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </div>
            <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Awaiting node selection</p>
        </div>
     );
  }

  const handleDownload = async (att: any) => {
    if (!att.gridfs_id) {
        alert("Integrity check failed: File was not persisted during reception (Legacy Node Record).");
        return;
    }
    try {
        const response = await api.get(`/api/webmail/messages/${selectedMsg._id}/download/${att.filename}`, {
            responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', att.filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
    } catch (error: any) {
        console.error("Download failed", error);
        alert(error.response?.data?.error || "Failed to download node resource.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 md:static md:z-auto bg-white flex flex-col h-full w-full md:flex-1 animate-in slide-in-from-right-10 duration-500">
        <div className="h-20 px-6 md:px-10 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md z-10">
            <div className="flex items-center gap-4 overflow-hidden">
                <button onClick={onBack} className="md:hidden text-slate-600 hover:bg-slate-100 p-2.5 rounded-2xl -ml-2 transition-colors">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h2 className="text-xl font-black text-slate-900 truncate leading-none">{selectedMsg.subject || '(No Subject)'}</h2>
            </div>
            <div className="flex items-center gap-3">
                <button onClick={onReply} className="text-emerald-600 hover:bg-emerald-50 px-4 py-2 rounded-2xl transition-all font-black text-xs uppercase tracking-widest border border-emerald-100 active:scale-95" title="Reply">Reply</button>
                <button onClick={(e) => onDelete(e, selectedMsg._id)} className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2.5 rounded-2xl transition-all active:scale-90" title="Delete">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
            </div>
        </div>

        <div className="px-6 md:px-10 py-6 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-slate-100">
            <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-[1.5rem] bg-gradient-to-br from-emerald-500 to-emerald-700 text-white flex items-center justify-center font-black text-xl shadow-xl shadow-emerald-100 border-4 border-white flex-shrink-0">{selectedMsg.from.charAt(0).toUpperCase()}</div>
                <div className="min-w-0">
                    <div className="text-base font-black text-slate-900 truncate leading-none mb-2">{selectedMsg.from}</div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">To: {selectedMsg.to}</div>
                </div>
            </div>
            <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm self-end sm:self-center">{new Date(selectedMsg.created_at).toLocaleString()}</div>
        </div>
        
        {selectedMsg.has_attachments && selectedMsg.attachments && selectedMsg.attachments.length > 0 && (
            <div className="px-6 md:px-10 py-4 bg-white border-b border-slate-100 overflow-x-auto whitespace-nowrap scrollbar-hide">
                <div className="flex gap-4">
                    {selectedMsg.attachments.map((file: any, idx) => (
                        <button 
                            key={idx} 
                            onClick={() => handleDownload(file)}
                            className={`flex items-center gap-3 border rounded-2xl px-4 py-3 transition-all group ${!file.gridfs_id ? 'bg-red-50 border-red-100 opacity-60' : 'bg-white hover:bg-emerald-50 border-slate-200 hover:border-emerald-200 shadow-sm'}`}
                        >
                            <div className={`p-2 rounded-xl shadow-sm ${!file.gridfs_id ? 'bg-white text-red-500' : 'bg-slate-100 text-slate-500 group-hover:text-emerald-600 group-hover:bg-white transition-colors'}`}>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                            </div>
                            <div className="text-left">
                                <div className={`text-xs font-black truncate max-w-[150px] ${!file.gridfs_id ? 'text-red-700' : 'text-slate-900'}`}>{file.filename}</div>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{file.gridfs_id ? formatSize(file.size) : 'No Data'}</div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        )}

        <div className="flex-1 bg-white relative overflow-hidden flex justify-center">
            <div className="max-w-4xl w-full h-full">
               {selectedMsg.html_body ? (
                   <SafeHtml html={selectedMsg.html_body} />
               ) : (
                   <div className="p-8 md:p-16 whitespace-pre-wrap font-sans text-slate-700 text-lg leading-relaxed overflow-y-auto h-full scrollbar-hide">
                       {selectedMsg.text_body}
                   </div>
               )}
            </div>
        </div>
    </div>
  );
};

export default WebmailReadingPane;
