import { useState, useEffect, useRef, useContext } from 'react';
import type { Message, WorkspaceProps } from '../../types/interfaces';
import { type ChatHistoryArray } from '../../types/arrays';
import MessageBubble from '../chat/MessageBubble';
import ChatInput from '../chat/ChatInput';
import { WorkspaceContext } from '../../contexts/WorkspaceContext';

export default function Chat() {

  const { socket, currentRoom, user } = useContext(WorkspaceContext) as WorkspaceProps;

  const username = user.username;

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

    socket.on('user-left', (data: { username: string }) => {
      setMessages(prev => [...prev, {
        id: Date.now().toString() + Math.random(),
        username: 'System',
        text: `${data.username} left the session.`,
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

    if (user.role !== "System Administrator") {  
      socket.emit('join-session', currentRoom, user);
    }

    return () => {
      socket.off('chat-history');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('receive-message');
    };
  }, [socket, currentRoom, username, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage: React.SubmitEventHandler<HTMLFormElement> = (e) => {
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
    <aside className="flex flex-col h-full bg-zinc-900 border-t border-zinc-800" aria-labelledby='chat-heading'>
      <h3 className="p-3 bg-zinc-800 border-b border-zinc-700 text-sm font-bold text-zinc-100 uppercase tracking-wider flex items-center gap-2" id="chat-heading">
        Chat
      </h3>
      
      <ol 
        className="grow overflow-y-auto p-4 flex flex-col gap-3 list-none m-0" 
        role="log" 
        aria-live="polite"
        aria-label="Chat messages"
      >
        {messages.map((msg) => (
          <li key={msg.id} className="w-full">
            <MessageBubble msg={msg} currentUser={username} />
          </li>
        ))}
        <div ref={messagesEndRef} aria-hidden="true" />
      </ol>

      <ChatInput input={input} setInput={setInput} onSubmit={sendMessage} />
    </aside>
  );
}