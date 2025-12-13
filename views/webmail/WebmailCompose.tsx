import React, { useState, useRef, useEffect } from 'react';
import api from '../../api';
import Spinner from '../../components/Spinner';
import { useToast } from '../../components/ToastContext';

interface Props {
  show: boolean;
  onClose: () => void;
  initialTo?: string;
  initialSubject?: string;
  initialBody?: string;
  onSuccess: () => void;
}

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
        <div className="flex items-center gap-1 border-b border-gray-200 p-2 bg-gray-50 overflow-x-auto">
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

const WebmailCompose = ({ show, onClose, initialTo, initialSubject, initialBody, onSuccess }: Props) => {
  const { addToast } = useToast();
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [subject, setSubject] = useState('');
  const [sending, setSending] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (show) {
        setTo(initialTo || '');
        setSubject(initialSubject || '');
        setCc('');
        setBcc('');
        setAttachments([]);
        
        // Initialize Editor Content
        if(editorRef.current) {
             editorRef.current.innerHTML = initialBody || '';
             
             // Focus handling with slight delay to ensure render
             setTimeout(() => {
                 if (editorRef.current) {
                     editorRef.current.focus();
                     
                     // If replying (initialBody present), ensure cursor is at the very top
                     if (initialBody) {
                         const selection = window.getSelection();
                         const range = document.createRange();
                         range.setStart(editorRef.current, 0);
                         range.collapse(true);
                         selection?.removeAllRanges();
                         selection?.addRange(range);
                     }
                 }
             }, 50);
        }
    }
  }, [show, initialTo, initialSubject, initialBody]);

  if (!show) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        const filesArray = Array.from(e.target.files);
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

  const execCmd = (cmd: string, val?: string) => {
      document.execCommand(cmd, false, val);
      if(editorRef.current) editorRef.current.focus();
  };

  const handleInsertImage = () => {
      const url = prompt("Enter Image URL:");
      if(url) execCmd('insertImage', url);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!editorRef.current) return;
    
    setSending(true);
    const htmlBody = editorRef.current.innerHTML;

    try {
      const attachmentPayload = await Promise.all(attachments.map(async (file) => ({
          filename: file.name,
          contentType: file.type,
          content: await fileToBase64(file)
      })));

      await api.post('/api/webmail/send', {
        to,
        cc,
        bcc,
        subject,
        htmlBody,
        attachments: attachmentPayload
      });
      
      onSuccess();
      onClose();
      addToast('Message sent successfully', 'success');
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Failed to send message', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-end sm:items-center justify-center p-0 sm:p-4 bg-gray-900/30 backdrop-blur-sm">
        <div className="bg-white w-full sm:max-w-3xl h-full sm:h-[85vh] sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-200">
            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-gray-50 flex-shrink-0">
                <h3 className="text-lg font-bold text-gray-900">New Message</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors bg-white rounded-full p-1 border border-gray-200">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            
            <form onSubmit={handleSend} className="flex-1 flex flex-col min-h-0">
                <div className="px-4 sm:px-6 py-4 space-y-4 overflow-y-auto flex-1">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                            <span className="text-sm font-semibold text-gray-500 w-10">To</span>
                            <input 
                                type="text" 
                                value={to} 
                                onChange={e => setTo(e.target.value)}
                                className="flex-1 outline-none text-sm text-gray-800"
                                placeholder="recipient@example.com"
                                required 
                            />
                            <div className="flex gap-2 text-xs text-gray-500">
                                <button type="button" onClick={() => setShowCc(!showCc)} className="hover:text-gray-800 hover:underline">Cc</button>
                                <button type="button" onClick={() => setShowBcc(!showBcc)} className="hover:text-gray-800 hover:underline">Bcc</button>
                            </div>
                        </div>
                        {showCc && <div className="flex items-center gap-2 border-b border-gray-100 pb-2 animate-in fade-in slide-in-from-top-1"><span className="text-sm font-semibold text-gray-500 w-10">Cc</span><input type="text" value={cc} onChange={e => setCc(e.target.value)} className="flex-1 outline-none text-sm text-gray-800" placeholder="cc@example.com"/></div>}
                        {showBcc && <div className="flex items-center gap-2 border-b border-gray-100 pb-2 animate-in fade-in slide-in-from-top-1"><span className="text-sm font-semibold text-gray-500 w-10">Bcc</span><input type="text" value={bcc} onChange={e => setBcc(e.target.value)} className="flex-1 outline-none text-sm text-gray-800" placeholder="bcc@example.com"/></div>}
                        <div className="flex items-center gap-2 border-b border-gray-100 pb-2"><span className="text-sm font-semibold text-gray-500 w-10">Subject</span><input type="text" value={subject} onChange={e => setSubject(e.target.value)} className="flex-1 outline-none text-sm text-gray-800 font-medium" placeholder="Subject"/></div>
                    </div>
                    
                    <div className="flex flex-col h-full min-h-[300px] border border-gray-200 rounded-lg overflow-hidden bg-white">
                        <RichTextToolbar onCmd={execCmd} onImage={handleInsertImage} />
                        <div ref={editorRef} contentEditable id="compose-editor" className="flex-1 p-4 outline-none overflow-y-auto text-sm font-sans" style={{ minHeight: '200px' }}></div>
                    </div>
                    
                    {attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                            {attachments.map((file, idx) => (
                                <div key={idx} className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full text-xs text-gray-700 border border-gray-200">
                                    <svg className="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                    <span className="max-w-[150px] truncate">{file.name}</span>
                                    <button type="button" onClick={() => removeAttachment(idx)} className="hover:text-red-500"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center pb-safe">
                    <div className="flex items-center gap-3">
                         <input type="file" multiple ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
                         <button type="button" onClick={() => fileInputRef.current?.click()} className="text-gray-500 hover:text-gray-900 hover:bg-gray-200 p-2 rounded-full transition-colors" title="Attach File"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg></button>
                    </div>
                    <div className="flex items-center gap-3">
                        <button type="button" onClick={onClose} className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors">Discard</button>
                        <button type="submit" disabled={sending} className="bg-green-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm">{sending && <Spinner />} Send</button>
                    </div>
                </div>
            </form>
        </div>
    </div>
  );
};

export default WebmailCompose;