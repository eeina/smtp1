import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { User, EmailMessage } from '../types';
import { useToast } from '../components/ToastContext';

// Import New Modular Components
import WebmailSidebar from './webmail/WebmailSidebar';
import WebmailMessageList from './webmail/WebmailMessageList';
import WebmailReadingPane from './webmail/WebmailReadingPane';
import WebmailMobileNav from './webmail/WebmailMobileNav';
import WebmailCompose from './webmail/WebmailCompose';
import WebmailSettings from './webmail/WebmailSettings';

const WebmailView = ({ user, onLogout }: { user: User, onLogout: () => void }) => {
  const { addToast } = useToast();
  
  // Data State
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [selectedMsg, setSelectedMsg] = useState<EmailMessage | null>(null);
  
  // View State
  const [view, setView] = useState<'inbox' | 'sent'>('inbox');
  const [loadingMessages, setLoadingMessages] = useState(false);
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMessages, setTotalMessages] = useState(0);
  
  // Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Modals State
  const [showCompose, setShowCompose] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Compose Pre-fill State (for replies)
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');

  // Fetch Messages
  const fetchMessages = useCallback(async (isPolling = false) => {
    if (!isPolling) setLoadingMessages(true);
    try {
      const res = await api.get('/api/webmail/messages', {
        params: { folder: view, page, limit: 20 }
      });
      setMessages(res.data.messages);
      setTotalPages(res.data.pagination.pages);
      setTotalMessages(res.data.pagination.total);
    } catch (err) {
      console.error(err);
    } finally {
      if (!isPolling) setLoadingMessages(false);
    }
  }, [view, page]);

  useEffect(() => {
    fetchMessages();
    let int: any;
    if (page === 1) {
        int = setInterval(() => fetchMessages(true), 15000);
    }
    return () => clearInterval(int);
  }, [fetchMessages, page]);

  // Reset state on view change
  useEffect(() => {
      setPage(1);
      setSelectedIds(new Set());
      setSelectedMsg(null);
  }, [view]);

  // Handlers
  const handleSelectMessage = async (msg: EmailMessage) => {
    setSelectedMsg(msg);
    if (!msg.is_read) {
        setMessages(prev => prev.map(m => m._id === msg._id ? { ...m, is_read: true } : m));
        try { await api.patch(`/api/webmail/messages/${msg._id}/read`); } catch (err) {}
    }
  };

  const toggleSelection = (id: string, e: React.SyntheticEvent) => {
    e.stopPropagation();
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === messages.length) {
        setSelectedIds(new Set());
    } else {
        setSelectedIds(new Set(messages.map(m => m._id)));
    }
  };

  const handleBatchDelete = async () => {
    if(!confirm(`Delete ${selectedIds.size} messages?`)) return;
    try {
        await api.post('/api/webmail/messages/batch-delete', { ids: Array.from(selectedIds) });
        addToast('Messages deleted', 'success');
        setSelectedIds(new Set());
        fetchMessages();
        if (selectedMsg && selectedIds.has(selectedMsg._id)) {
            setSelectedMsg(null);
        }
    } catch (err) {
        addToast('Failed to delete messages', 'error');
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if(!confirm('Delete this message?')) return;
    try {
        await api.delete(`/api/webmail/messages/${id}`);
        setMessages(prev => prev.filter(m => m._id !== id));
        if (selectedMsg?._id === id) setSelectedMsg(null);
        addToast('Message deleted', 'success');
    } catch(err) {
        addToast('Failed to delete message', 'error');
        fetchMessages();
    }
  };

  const handleReply = () => {
    if (!selectedMsg) return;
    const replyTo = view === 'inbox' ? selectedMsg.from : selectedMsg.to;
    const replySubject = selectedMsg.subject.startsWith('Re:') ? selectedMsg.subject : `Re: ${selectedMsg.subject}`;
    
    // Injecting content into the compose window via DOM manipulation is tricky with state separation.
    // We will pass the subject/to and let the user type. 
    // In a full implementation, we'd pass the html body to the compose component.
    // For now, let's keep it simple as requested for structure.
    
    setComposeTo(replyTo);
    setComposeSubject(replySubject);
    setShowCompose(true);
    
    // Hack to inject quote if needed, or we rely on user manually quoting for now.
    // The Compose component handles fresh state.
    
    // We can try to update the content after render, but let's stick to clean props first.
    setTimeout(() => {
        const editor = document.getElementById('compose-editor');
        if (editor) {
            const quoteHtml = `<br><br><blockquote style="border-left: 2px solid #ccc; padding-left: 10px; margin-left: 5px; color: #666;">
            On ${new Date(selectedMsg.created_at).toLocaleString()}, <strong>${selectedMsg.from}</strong> wrote:<br>
            ${selectedMsg.html_body || selectedMsg.text_body}
            </blockquote><br>`;
            editor.innerHTML = quoteHtml;
            // focus logic if needed
        }
    }, 100);
  };

  const handleCompose = () => {
      setComposeTo('');
      setComposeSubject('');
      setShowCompose(true);
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      
      {/* 1. Desktop Sidebar */}
      <WebmailSidebar 
        user={user}
        view={view}
        messages={messages}
        onCompose={handleCompose}
        onViewChange={(v) => { setView(v); setSelectedMsg(null); }}
        onSettings={() => setShowSettings(true)}
        onLogout={onLogout}
      />

      {/* 2. Message List */}
      <WebmailMessageList 
        user={user}
        messages={messages}
        selectedMsg={selectedMsg}
        onSelect={handleSelectMessage}
        view={view}
        loading={loadingMessages}
        onRefresh={() => fetchMessages()}
        selectedIds={selectedIds}
        toggleSelectAll={toggleSelectAll}
        toggleSelection={toggleSelection}
        onBatchDelete={handleBatchDelete}
        page={page}
        totalPages={totalPages}
        setPage={setPage}
        totalMessages={totalMessages}
      />

      {/* 3. Reading Pane */}
      <WebmailReadingPane 
        selectedMsg={selectedMsg}
        onBack={() => setSelectedMsg(null)}
        onDelete={handleDelete}
        onReply={handleReply}
      />

      {/* 4. Mobile Bottom Navigation */}
      {/* Hide nav if reading a message to allow full screen reading */}
      {!selectedMsg && (
          <WebmailMobileNav 
            view={view}
            onViewChange={(v) => { setView(v); setSelectedMsg(null); }}
            onCompose={handleCompose}
            onSettings={() => setShowSettings(true)}
            showSettings={showSettings}
          />
      )}

      {/* 5. Compose Modal */}
      <WebmailCompose 
        show={showCompose}
        onClose={() => setShowCompose(false)}
        initialTo={composeTo}
        initialSubject={composeSubject}
        onSuccess={() => {
            if (view === 'sent') fetchMessages();
        }}
      />

      {/* 6. Settings Modal */}
      {showSettings && (
        <WebmailSettings 
            user={user}
            onClose={() => setShowSettings(false)}
            onLogout={onLogout}
        />
      )}

    </div>
  );
};

export default WebmailView;