import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { User, EmailMessage } from '../types';
import { useToast } from '../components/ToastContext';

// Components
import WebmailSidebar from './webmail/WebmailSidebar';
import WebmailMessageList from './webmail/WebmailMessageList';
import WebmailReadingPane from './webmail/WebmailReadingPane';
import WebmailCompose from './webmail/WebmailCompose';
import WebmailSettings from './webmail/WebmailSettings';

interface WebmailViewProps {
    user: User;
    onLogout: () => void;
    onAdminPanel?: () => void;
}

const WebmailView = ({ user, onLogout, onAdminPanel }: WebmailViewProps) => {
  const { addToast } = useToast();
  
  // Data State
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [selectedMsg, setSelectedMsg] = useState<EmailMessage | null>(null);
  
  // View State
  const [view, setView] = useState<'inbox' | 'sent' | 'drafts'>('inbox');
  const [loading, setLoading] = useState(false);
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  
  // Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // UI State
  const [showCompose, setShowCompose] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Compose State
  const [composeData, setComposeData] = useState({ to: '', subject: '', body: '', draftId: undefined as string | undefined });

  // Fetch Messages
  const fetchMessages = useCallback(async (isPolling = false) => {
    if (!isPolling) setLoading(true);
    try {
      const res = await api.get('/api/webmail/messages', {
        params: { folder: view, page, limit: 20 }
      });
      setMessages(res.data.messages);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      if (!isPolling) setLoading(false);
    }
  }, [view, page]);

  // Initial Load & Polling
  useEffect(() => {
    fetchMessages();
    let interval: any;
    if (page === 1) {
        interval = setInterval(() => fetchMessages(true), 10000);
    }
    return () => clearInterval(interval);
  }, [fetchMessages, page]);

  // Reset Selection on View Change
  useEffect(() => {
      setPage(1);
      setSelectedIds(new Set());
      setSelectedMsg(null);
      setMobileMenuOpen(false);
  }, [view]);

  // -- Handlers --

  const handleSelectMessage = async (msg: EmailMessage) => {
    if (msg.folder === 'drafts') {
        setComposeData({
            to: msg.to,
            subject: msg.subject,
            body: msg.html_body || msg.text_body,
            draftId: msg._id
        });
        setShowCompose(true);
        return;
    }

    setSelectedMsg(msg);
    // Mark as read locally immediately for UI snap
    if (!msg.is_read) {
        setMessages(prev => prev.map(m => m._id === msg._id ? { ...m, is_read: true } : m));
        try { await api.patch(`/api/webmail/messages/${msg._id}/read`); } catch (err) {}
    }
  };

  const handleCompose = () => {
      setComposeData({ to: '', subject: '', body: '', draftId: undefined });
      setShowCompose(true);
  };

  const handleReply = () => {
    if (!selectedMsg) return;
    const replyTo = view === 'inbox' ? selectedMsg.from : selectedMsg.to;
    const cleanFrom = selectedMsg.from.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const replyBody = `<p><br></p><blockquote style="border-left: 2px solid #ccc; margin-left: 0; padding-left: 10px; color: #666;">On ${new Date(selectedMsg.created_at).toLocaleString()}, ${cleanFrom} wrote:<br>${selectedMsg.html_body || selectedMsg.text_body}</blockquote>`;
    
    setComposeData({
        to: replyTo,
        subject: selectedMsg.subject.startsWith('Re:') ? selectedMsg.subject : `Re: ${selectedMsg.subject}`,
        body: replyBody,
        draftId: undefined
    });
    setShowCompose(true);
  };

  const handleDelete = async (id: string) => {
    if(!confirm('Delete this message?')) return;
    try {
        await api.delete(`/api/webmail/messages/${id}`);
        setMessages(prev => prev.filter(m => m._id !== id));
        if (selectedMsg?._id === id) setSelectedMsg(null);
        addToast('Message deleted', 'success');
    } catch(err) {
        addToast('Failed to delete', 'error');
    }
  };

  // Batch Selection Logic
  const toggleSelection = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const next = new Set(selectedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setSelectedIds(next);
  };

  return (
    <div className="flex h-screen bg-black text-slate-200 overflow-hidden font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      
      {/* 1. Sidebar (Navigation) */}
      <WebmailSidebar 
        user={user}
        view={view}
        unreadCount={messages.filter(m => m.folder === 'inbox' && !m.is_read).length}
        onCompose={handleCompose}
        onViewChange={setView}
        onSettings={() => setShowSettings(true)}
        onLogout={onLogout}
        onAdminPanel={onAdminPanel}
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
      />

      {/* 2. Message List (The Feed) */}
      <WebmailMessageList 
        messages={messages}
        selectedMsg={selectedMsg}
        selectedIds={selectedIds}
        loading={loading}
        view={view}
        onSelect={handleSelectMessage}
        onToggleSelect={toggleSelection}
        onRefresh={() => fetchMessages()}
        onMobileMenu={() => setMobileMenuOpen(true)}
        pagination={{
            page,
            totalPages: pagination.pages,
            next: () => setPage(p => p + 1),
            prev: () => setPage(p => Math.max(1, p - 1))
        }}
      />

      {/* 3. Reading Pane (The Content) */}
      <WebmailReadingPane 
        message={selectedMsg}
        onClose={() => setSelectedMsg(null)}
        onDelete={() => selectedMsg && handleDelete(selectedMsg._id)}
        onReply={handleReply}
      />

      {/* Modals */}
      <WebmailCompose 
        show={showCompose}
        onClose={() => setShowCompose(false)}
        onSuccess={() => { fetchMessages(); }}
        data={composeData}
        user={user}
      />

      {showSettings && (
          <WebmailSettings user={user} onClose={() => setShowSettings(false)} onLogout={onLogout} />
      )}
    </div>
  );
};

export default WebmailView;