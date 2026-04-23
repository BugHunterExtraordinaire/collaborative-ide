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
    <div className="flex flex-col h-full bg-zinc-900 border-t border-zinc-800">
      
      <div className="p-3 bg-zinc-800 border-b border-zinc-700 text-sm font-bold text-zinc-100 uppercase tracking-wider flex items-center gap-2">
        <span>Session Chat</span>
      </div>
      
      <div className="grow overflow-y-auto p-4 flex flex-col gap-3">
        {messages.map((msg) => (
          <div key={msg.id} className="text-sm">
            {msg.isSystem ? (
              <div className="text-center text-xs text-zinc-500 italic my-2">
                — {msg.text} —
              </div>
            ) : (
              <div className={`flex flex-col ${msg.username === username ? 'items-end' : 'items-start'}`}>
                <span className="text-xs text-zinc-400 mb-1 ml-1">{msg.username}</span>
                <div className={`px-3 py-2 rounded-lg max-w-[85%] wrap-break-word ${
                  msg.username === username 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-zinc-700 text-zinc-100 rounded-bl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="flex p-3 bg-zinc-800 border-t border-zinc-700 gap-2">
        <input 
          type="text" 
          value={input} 
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="grow p-2.5 bg-zinc-900 border border-zinc-700 text-white rounded focus:ring-1 focus:ring-blue-500 outline-none transition-shadow"
        />
        <button type="submit" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 transition-colors border-none text-white rounded font-bold cursor-pointer shadow">
          Send
        </button>
      </form>
      
    </div>
  );
}