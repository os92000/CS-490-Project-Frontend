import React from 'react';
import ChatPanel from '../components/ChatPanel';

const Chat = () => (
  <div className="container page-shell">
    <div className="page-hero fade-up" style={{ padding: '24px 32px' }}>
      <div className="hero-copy">
        <p className="eyebrow">Messaging</p>
        <h1>Messages</h1>
        <p className="page-copy">Real-time chat with your connected coaches and clients.</p>
      </div>
    </div>

    <div className="fade-up fade-up-1">
      <ChatPanel />
    </div>
  </div>
);

export default Chat;
