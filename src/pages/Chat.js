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
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadConversations();

    // Initialize Socket.IO connection
    const newSocket = io('http://127.0.0.1:5000');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to chat server');
    });

    newSocket.on('new_message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    return () => newSocket.close();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    try {
      const response = await chatAPI.getConversations();
      if (response.data.success) {
        setConversations(response.data.data.conversations);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectConversation = async (conversation) => {
    setSelectedConversation(conversation);

    // Load messages
    try {
      const response = await chatAPI.getMessages(conversation.relationship_id);
      if (response.data.success) {
        setMessages(response.data.data.messages);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    }

    // Join conversation room via WebSocket
    if (socket) {
      socket.emit('join_conversation', {
        relationship_id: conversation.relationship_id,
        user_id: user.id
      });
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    const messageData = {
      relationship_id: selectedConversation.relationship_id,
      sender_id: user.id,
      message: newMessage.trim()
    };

    // Send via WebSocket for real-time delivery
    if (socket) {
      socket.emit('send_message', messageData);
    }

    setNewMessage('');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '50px' }}>
        <p>Loading conversations...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '1200px', marginTop: '30px' }}>
      <h1>Messages</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', marginTop: '20px', height: '600px' }}>
        {/* Conversations List */}
        <div className="card" style={{ overflowY: 'auto', padding: '10px' }}>
          <h3 style={{ marginBottom: '15px' }}>Conversations</h3>
          {conversations.length === 0 ? (
            <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
              No conversations yet. Connect with a coach to start chatting!
            </p>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.relationship_id}
                onClick={() => selectConversation(conv)}
                style={{
                  padding: '15px',
                  borderRadius: '8px',
                  marginBottom: '10px',
                  cursor: 'pointer',
                  backgroundColor: selectedConversation?.relationship_id === conv.relationship_id ? '#e3f2fd' : '#f5f5f5',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>{conv.other_user.profile?.first_name || conv.other_user.email}</strong>
                  {conv.unread_count > 0 && (
                    <span style={{
                      backgroundColor: '#4CAF50',
                      color: 'white',
                      borderRadius: '50%',
                      padding: '4px 8px',
                      fontSize: '12px'
                    }}>
                      {conv.unread_count}
                    </span>
                  )}
                </div>
                <p style={{ color: '#666', fontSize: '14px', marginTop: '5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {conv.last_message?.message || 'No messages yet'}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Chat Area */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: 0 }}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div style={{ padding: '15px', borderBottom: '1px solid #eee' }}>
                <h3>{selectedConversation.other_user.profile?.first_name || selectedConversation.other_user.email}</h3>
                <p style={{ color: '#666', fontSize: '14px' }}>
                  {selectedConversation.other_user.type === 'coach' ? 'Your Coach' : 'Your Client'}
                </p>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      justifyContent: msg.sender_id === user.id ? 'flex-end' : 'flex-start',
                      marginBottom: '15px'
                    }}
                  >
                    <div style={{
                      maxWidth: '70%',
                      padding: '10px 15px',
                      borderRadius: '12px',
                      backgroundColor: msg.sender_id === user.id ? '#4CAF50' : '#f0f0f0',
                      color: msg.sender_id === user.id ? 'white' : '#333'
                    }}>
                      {msg.sender_id !== user.id && (
                        <p style={{ fontSize: '12px', marginBottom: '5px', opacity: 0.8 }}>
                          {msg.sender?.profile?.first_name || 'Coach'}
                        </p>
                      )}
                      <p style={{ margin: 0 }}>{msg.message}</p>
                      <p style={{ fontSize: '11px', marginTop: '5px', opacity: 0.7 }}>
                        {new Date(msg.sent_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form onSubmit={sendMessage} style={{ padding: '15px', borderTop: '1px solid #eee' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    className="input"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button type="submit" className="btn btn-primary">
                    Send
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <p style={{ color: '#666', fontSize: '18px' }}>
                Select a conversation to start messaging
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
