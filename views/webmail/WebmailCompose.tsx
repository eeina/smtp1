import React, { useState, useRef, useEffect } from 'react';
import api from '../../api';
import { User } from '../../types';
import { useToast } from '../../components/ToastContext';

interface Props {
  show: boolean;
  onClose: () => void;
  onSuccess: () => void;
  data: { to: string; subject: string; body: string; draftId?: string };
  user: User;
}

const WebmailCompose = ({ show, onClose, onSuccess, data, user }: Props) => {
  const { addToast } = useToast();
  
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [sending, setSending] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (show) {
        setTo(data.to);
        setSubject(data.subject);
        setAttachments([]);
        // Initialize editor
        setTimeout(() => {
            if (editorRef.current) {
                let content = data.body;
                if (!content && user.signature) {
                    content = `<p><br></p><div style="margin-top:20px; border-top:1px solid #ddd; padding-top:10px; color:#666;">${user.signature.replace(/\n/g, '<br>')}</div>`;
                }
                editorRef.current.innerHTML = content || '<p><br></p>';
                editorRef.current.focus();
            }
        }, 100);
    }
  }, [show, data, user.signature]);

  if (!show) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    
    try {
        const formData = new FormData();
        formData.append('to', to);
        formData.append('subject', subject);
        formData.append('htmlBody', editorRef.current?.innerHTML || '');
        if (data.draftId) formData.append('draftId', data.draftId);
        
        attachments.forEach(file => formData.append('attachments', file));

        await api.post('/api/webmail/send', formData);
        addToast('Sent successfully', 'success');
        onSuccess();
        onClose();
    } catch (err: any) {
        addToast(err.response?.data?.error || 'Failed to send', 'error');
    } finally {
        setSending(false);
    }
  };

  const handleAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
  };

  // Minimal Toolbar Buttons
  const ToolbarBtn = ({ cmd, icon }: any) => (
      <button 
        type="button" 
        onMouseDown={(e) => { e.preventDefault(); document.execCommand(cmd, false); }}
        className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200 rounded transition-colors"
      >
          {icon}
      </button>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-white w-full max-w-2xl h-[70vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 ring-1 ring-zinc-200">
            {/* Header */}
            <div className="flex justify-between items-center px-4 py-3 border-b border-zinc-100 bg-zinc-50">
                <h3 className="text-sm font-bold text-zinc-700">New Message</h3>
                <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>

            <form onSubmit={handleSend} className="flex-1 flex flex-col min-h-0">
                {/* Inputs */}
                <div className="px-4 py-2 space-y-2 border-b border-zinc-100">
                    <div className="flex items-center gap-3">
                        <label className="text-xs font-semibold text-zinc-500 w-12">To</label>
                        <input 
                            type="text" 
                            className="flex-1 py-1.5 text-sm outline-none text-zinc-800 placeholder:text-zinc-300"
                            placeholder="recipient@example.com"
                            value={to}
                            onChange={e => setTo(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <label className="text-xs font-semibold text-zinc-500 w-12">Subject</label>
                        <input 
                            type="text" 
                            className="flex-1 py-1.5 text-sm outline-none text-zinc-800 font-medium placeholder:text-zinc-300"
                            placeholder="Subject line"
                            value={subject}
                            onChange={e => setSubject(e.target.value)}
                            required
                        />
                    </div>
                </div>

                {/* Toolbar */}
                <div className="px-3 py-1.5 border-b border-zinc-100 flex gap-1 bg-zinc-50/50">
                    <ToolbarBtn cmd="bold" icon={<b className="font-serif font-bold">B</b>} />
                    <ToolbarBtn cmd="italic" icon={<i className="font-serif italic">I</i>} />
                    <ToolbarBtn cmd="underline" icon={<u className="font-serif underline">U</u>} />
                    <div className="w-px h-4 bg-zinc-200 mx-1 self-center"></div>
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200 rounded">
                         <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                    </button>
                    <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleAttach} />
                </div>

                {/* Editor */}
                <div 
                    ref={editorRef}
                    contentEditable
                    className="flex-1 p-4 outline-none overflow-y-auto text-sm text-zinc-800 font-sans"
                    style={{ minHeight: '150px' }}
                ></div>

                {/* Attachments List */}
                {attachments.length > 0 && (
                    <div className="px-4 py-2 border-t border-zinc-100 bg-zinc-50 flex gap-2 flex-wrap max-h-24 overflow-y-auto">
                        {attachments.map((f, i) => (
                            <div key={i} className="text-xs bg-white border border-zinc-200 px-2 py-1 rounded-md flex items-center gap-2 shadow-sm">
                                <span className="truncate max-w-[150px]">{f.name}</span>
                                <button type="button" onClick={() => setAttachments(p => p.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700">×</button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Footer */}
                <div className="p-4 border-t border-zinc-100 flex justify-end gap-3 bg-zinc-50">
                    <button 
                        type="button" 
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
                    >
                        Discard
                    </button>
                    <button 
                        type="submit" 
                        disabled={sending}
                        className="bg-black text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-zinc-800 transition-all flex items-center gap-2 shadow-lg disabled:opacity-50"
                    >
                        {sending && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                        Send Message
                    </button>
                </div>
            </form>
        </div>
    </div>
  );
};

export default WebmailCompose;