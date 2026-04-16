import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { chatAPI } from '../services/api';
import io from 'socket.io-client';

const Chat = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const messagesEndRef = useRef(null);
  const messagesListRef = useRef(null);
  const shouldAutoScrollRef = useRef(true);

  const isNearBottom = (el, threshold = 80) => (
    el.scrollHeight - el.scrollTop - el.clientHeight <= threshold
  );

  const scrollToBottom = (behavior = 'auto') => {
    if (!messagesEndRef.current) return;
    messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
  };

  useEffect(() => {
    loadConversations();
    const sock = io(window.location.origin, { path: '/socket.io' });
    setSocket(sock);
    sock.on('new_message', msg => setMessages(prev => [...prev, msg]));
    return () => sock.close();
  }, []);

  useEffect(() => {
    const el = messagesListRef.current;
    if (!el) return;

    // Keep new messages pinned to bottom only when the user is already near bottom.
    if (shouldAutoScrollRef.current || isNearBottom(el)) {
      scrollToBottom('auto');
    }
  }, [messages]);

  useEffect(() => {
    // Always jump to bottom when switching conversations.
    shouldAutoScrollRef.current = true;
    scrollToBottom('auto');
  }, [selectedConversation?.relationship_id]);

  const loadConversations = async () => {
    try {
      const r = await chatAPI.getConversations();
      if (r.data.success) setConversations(r.data.data.conversations);
    } catch {} finally { setLoading(false); }
  };

  const selectConversation = async (conv) => {
    setSelectedConversation(conv);
    try {
      const r = await chatAPI.getMessages(conv.relationship_id);
      if (r.data.success) setMessages(r.data.data.messages);
    } catch {}
    if (socket) socket.emit('join_conversation', { relationship_id: conv.relationship_id, user_id: user.id });
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;
    try {
      await chatAPI.sendMessage({ relationship_id: selectedConversation.relationship_id, message: newMessage.trim() });
      setNewMessage('');
    } catch {}
  };

  const reportConversation = async () => {
    if (!selectedConversation || !reportReason.trim()) return;
    try {
      await chatAPI.reportConversation({ relationship_id: selectedConversation.relationship_id, reason: reportReason });
      setReportReason(''); alert('Reported.');
    } catch { alert('Failed to report.'); }
  };

  if (loading) return <div className="loading">Loading conversations…</div>;

  const otherName = (conv) => conv.other_user?.profile?.first_name || conv.other_user?.email || 'User';
  const otherInitial = (conv) => (otherName(conv)[0] || '?').toUpperCase();
  const handleMessagesScroll = () => {
    const el = messagesListRef.current;
    if (!el) return;
    shouldAutoScrollRef.current = isNearBottom(el);
  };

  return (
    <div className="container page-shell">
      <div className="page-hero fade-up" style={{ padding: '24px 32px' }}>
        <div className="hero-copy">
          <p className="eyebrow">Messaging</p>
          <h1>Messages</h1>
          <p className="page-copy">Real-time chat with your connected coaches and clients.</p>
        </div>
      </div>

      <div className="chat-layout fade-up fade-up-1">
        {/* SIDEBAR */}
        <div className="chat-sidebar">
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
            <h4>Conversations</h4>
          </div>
          {conversations.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center' }}>
              <p className="muted-text" style={{ fontSize: 13 }}>No conversations yet. Connect with a coach to start chatting.</p>
            </div>
          ) : conversations.map(conv => (
            <div key={conv.relationship_id} className={`chat-item ${selectedConversation?.relationship_id === conv.relationship_id ? 'active' : ''}`}
              onClick={() => selectConversation(conv)}>
              <div className="flex items-center gap-10">
                <div className="nav-avatar" style={{ width: 32, height: 32, fontSize: 13 }}>{otherInitial(conv)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="flex justify-between items-center">
                    <strong style={{ fontSize: 14 }}>{otherName(conv)}</strong>
                    {conv.unread_count > 0 && <span className="badge badge-green" style={{ fontSize: 11 }}>{conv.unread_count}</span>}
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {conv.last_message?.message || 'No messages yet'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* MAIN */}
        <div className="chat-main">
          {selectedConversation ? (<>
            {/* Header */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div className="flex items-center gap-10">
                <div className="nav-avatar" style={{ width: 36, height: 36, fontSize: 15 }}>{otherInitial(selectedConversation)}</div>
                <div>
                  <strong style={{ fontSize: 15 }}>{otherName(selectedConversation)}</strong>
                  <p style={{ fontSize: 12, color: 'var(--text-3)' }}>{selectedConversation.other_user?.type === 'coach' ? 'Your Coach' : 'Your Client'}</p>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <input type="text" value={reportReason} onChange={e => setReportReason(e.target.value)} placeholder="Report reason…" style={{ width: 160, fontSize: 13 }} />
                <button className="btn btn-danger btn-sm" onClick={reportConversation}>Report</button>
              </div>
            </div>

            {/* Messages */}
            <div className="chat-messages" ref={messagesListRef} onScroll={handleMessagesScroll}>
              {messages.length === 0 && <p className="muted-text text-center" style={{ margin: 'auto' }}>No messages yet. Say hello!</p>}
              {messages.map(msg => (
                <div key={msg.id} className={`msg-bubble ${msg.sender_id === user.id ? 'msg-mine' : 'msg-theirs'}`}>
                  {msg.sender_id !== user.id && <p style={{ fontSize: 11, marginBottom: 3, opacity: 0.7 }}>{msg.sender?.profile?.first_name || 'User'}</p>}
                  <p>{msg.message}</p>
                  <p style={{ fontSize: 11, marginTop: 4, opacity: 0.6 }}>{new Date(msg.sent_at).toLocaleTimeString()}</p>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form className="chat-input-row" onSubmit={sendMessage}>
              <input type="text" placeholder="Type a message…" value={newMessage} onChange={e => setNewMessage(e.target.value)} style={{ flex: 1 }} />
              <button type="submit" className="btn btn-primary btn-sm">Send</button>
            </form>
          </>) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
              <p style={{ fontSize: 32 }}>💬</p>
              <h3 style={{ color: 'var(--text-2)' }}>Select a conversation</h3>
              <p className="muted-text">Choose a conversation from the sidebar to start messaging.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
