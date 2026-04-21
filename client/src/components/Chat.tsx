import { useState, useEffect, useRef } from 'react';
import type { ChatProps, Message } from '../types/interfaces';
import { type ChatHistoryArray } from '../types/arrays';

export default function Chat({ currentRoom, username, socket }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!socket) return;

    socket.on('chat-history', (history: ChatHistoryArray) => {
      const formattedHistory = history.map((msg, index) => ({
        id: `history-${index}-${Date.now()}`,
        username: msg.username,
        text: msg.message,
        timestamp: msg.timestamp.toString()
      }));
      setMessages(formattedHistory);
    });

    socket.on('user-joined', (data: { username: string }) => {
      setMessages(prev => [...prev, {
        id: Date.now().toString() + Math.random(),
        username: 'System',
        text: `${data.username} joined the session.`,
        timestamp: new Date().toISOString(),
        isSystem: true
      }]);
    });

    socket.on('receive-message', (data: { username: string, message: string, timestamp: string }) => {
      setMessages(prev => [...prev, {
        id: Date.now().toString() + Math.random(),
        username: data.username,
        text: data.message,
        timestamp: data.timestamp
      }]);
    });

    socket.emit('join-session', currentRoom, username);

    return () => {
      socket.off('chat-history');
      socket.off('user-joined');
      socket.off('receive-message');
    };
  }, [socket, currentRoom, username]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !socket) return;

    socket.emit('send-message', {
      sessionId: currentRoom,
      message: input,
      username
    });
    setInput('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#1e1e1e', borderTop: '1px solid #333' }}>
      <div style={{ padding: '8px', backgroundColor: '#252526', borderBottom: '1px solid #333', fontSize: '14px', fontWeight: 'bold' }}>
        Session Chat
      </div>
      
      <div style={{ flexGrow: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {messages.map((msg) => (
          <div key={msg.id} style={{ fontSize: '13px', color: msg.isSystem ? '#888' : '#ddd' }}>
            <span style={{ fontWeight: 'bold', color: msg.isSystem ? '#888' : msg.username === username ? '#4caf50' : '#007acc' }}>
              {msg.username}: 
            </span> {msg.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} style={{ display: 'flex', padding: '10px', borderTop: '1px solid #333' }}>
        <input 
          type="text" 
          value={input} 
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          style={{ flexGrow: 1, padding: '8px', backgroundColor: '#333', border: 'none', color: '#fff', borderRadius: '4px 0 0 4px', outline: 'none' }}
        />
        <button type="submit" style={{ padding: '8px 12px', backgroundColor: '#007acc', border: 'none', color: '#fff', borderRadius: '0 4px 4px 0', cursor: 'pointer', fontWeight: 'bold' }}>
          Send
        </button>
      </form>
    </div>
  );
}