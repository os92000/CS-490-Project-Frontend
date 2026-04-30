import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { chatAPI } from '../services/api';
import io from 'socket.io-client';

const ChatPanel = ({ initialClientId } = {}) => {
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
  const activeConversationIdRef = useRef(null);

  const isNearBottom = (el, threshold = 80) => (
    el.scrollHeight - el.scrollTop - el.clientHeight <= threshold
  );

  const scrollToBottom = (behavior = 'auto') => {
    if (!messagesEndRef.current) return;
    messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
  };

  const appendMessageIfMissing = (message) => {
    setMessages(prev => (
      prev.some(existing => existing.id === message.id) ? prev : [...prev, message]
    ));
  };

  const updateConversationPreview = (message, isActiveConversation) => {
    setConversations(prev => {
      const idx = prev.findIndex(conv => conv.relationship_id === message.relationship_id);
      if (idx === -1) return prev;

      const current = prev[idx];
      const unreadCount = isActiveConversation || message.sender_id === user.id
        ? 0
        : (current.unread_count || 0) + 1;

      const updated = { ...current, last_message: message, unread_count: unreadCount };
      return [updated, ...prev.slice(0, idx), ...prev.slice(idx + 1)];
    });
  };

  useEffect(() => {
    loadConversations();
    const sock = io(process.env.REACT_APP_SOCKET_URL || window.location.origin, { path: '/socket.io' });
    setSocket(sock);

    sock.on('connect', () => {
      if (user?.id) sock.emit('register_user', { user_id: user.id });
    });

    const handleNewMessage = (msg) => {
      const isActiveConversation = activeConversationIdRef.current === msg.relationship_id;
      updateConversationPreview(msg, isActiveConversation);
      if (isActiveConversation) appendMessageIfMissing(msg);
    };

    sock.on('new_message', handleNewMessage);
    return () => { sock.off('new_message', handleNewMessage); sock.close(); };
  }, []);

  useEffect(() => {
    activeConversationIdRef.current = selectedConversation?.relationship_id ?? null;
  }, [selectedConversation?.relationship_id]);

  useEffect(() => {
    if (!socket || !selectedConversation || !user?.id) return;
    const relationship_id = selectedConversation.relationship_id;
    socket.emit('join_conversation', { relationship_id, user_id: user.id });
    return () => { socket.emit('leave_conversation', { relationship_id }); };
  }, [socket, selectedConversation?.relationship_id, user?.id]);

  useEffect(() => {
    const el = messagesListRef.current;
    if (!el) return;
    if (shouldAutoScrollRef.current || isNearBottom(el)) scrollToBottom('auto');
  }, [messages]);

  useEffect(() => {
    shouldAutoScrollRef.current = true;
    scrollToBottom('auto');
  }, [selectedConversation?.relationship_id]);

  const loadConversations = async () => {
    try {
      const r = await chatAPI.getConversations();
      if (r.data.success) {
        const convs = r.data.data.conversations;
        setConversations(convs);
        if (initialClientId) {
          const target = convs.find(c => c.other_user?.id === initialClientId);
          if (target) selectConversation(target);
        }
      }
    } catch {} finally { setLoading(false); }
  };

  const selectConversation = async (conv) => {
    setSelectedConversation(conv);
    try {
      const r = await chatAPI.getMessages(conv.relationship_id);
      if (r.data.success) setMessages(r.data.data.messages);
    } catch {}
    setConversations(prev => prev.map(item => (
      item.relationship_id === conv.relationship_id ? { ...item, unread_count: 0 } : item
    )));
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;
    try {
      const response = await chatAPI.sendMessage({
        relationship_id: selectedConversation.relationship_id,
        message: newMessage.trim(),
      });
      if (response.data.success) {
        const sentMessage = response.data.data;
        appendMessageIfMissing(sentMessage);
        updateConversationPreview(sentMessage, true);
        shouldAutoScrollRef.current = true;
      }
      setNewMessage('');
    } catch {}
  };

  const reportConversation = async () => {
    if (!selectedConversation || !reportReason.trim()) return;
    try {
      await chatAPI.reportConversation({
        relationship_id: selectedConversation.relationship_id,
        reason: reportReason,
      });
      setReportReason('');
      alert('Reported.');
    } catch { alert('Failed to report.'); }
  };

  const otherName = (conv) => conv.other_user?.profile?.first_name || conv.other_user?.email || 'User';
  const otherInitial = (conv) => (otherName(conv)[0] || '?').toUpperCase();

  const handleMessagesScroll = () => {
    const el = messagesListRef.current;
    if (!el) return;
    shouldAutoScrollRef.current = isNearBottom(el);
  };

  if (loading) return <div className="loading">Loading conversations…</div>;

  return (
    <div className="chat-layout">
      {/* SIDEBAR */}
      <div className="chat-sidebar">
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
          <h4>Conversations</h4>
        </div>
        {conversations.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center' }}>
            <p className="muted-text" style={{ fontSize: 13 }}>No conversations yet.</p>
          </div>
        ) : conversations.map(conv => (
          <div
            key={conv.relationship_id}
            className={`chat-item ${selectedConversation?.relationship_id === conv.relationship_id ? 'active' : ''}`}
            onClick={() => selectConversation(conv)}
          >
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
        {selectedConversation ? (
          <>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div className="flex items-center gap-10">
                <div className="nav-avatar" style={{ width: 36, height: 36, fontSize: 15 }}>{otherInitial(selectedConversation)}</div>
                <div>
                  <strong style={{ fontSize: 15 }}>{otherName(selectedConversation)}</strong>
                  <p style={{ fontSize: 12, color: 'var(--text-3)' }}>
                    {selectedConversation.other_user?.type === 'coach' ? 'Your Coach' : 'Your Client'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <input type="text" value={reportReason} onChange={e => setReportReason(e.target.value)} placeholder="Report reason…" style={{ width: 160, fontSize: 13 }} />
                <button className="btn btn-danger btn-sm" onClick={reportConversation}>Report</button>
              </div>
            </div>

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

            <form className="chat-input-row" onSubmit={sendMessage}>
              <input type="text" placeholder="Type a message…" value={newMessage} onChange={e => setNewMessage(e.target.value)} style={{ flex: 1 }} />
              <button type="submit" className="btn btn-primary btn-sm">Send</button>
            </form>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
            <p style={{ fontSize: 32 }}>💬</p>
            <h3 style={{ color: 'var(--text-2)' }}>Select a conversation</h3>
            <p className="muted-text">Choose a conversation from the sidebar to start messaging.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPanel;
