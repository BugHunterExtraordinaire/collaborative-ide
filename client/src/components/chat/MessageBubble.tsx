import { type MessageBubbleProps } from '../../types/interfaces';

export default function MessageBubble({ msg, currentUser }: MessageBubbleProps) {
  if (msg.isSystem) {
    return (
      <div className="text-center text-xs text-zinc-500 italic my-2">
        — {msg.text} —
      </div>
    );
  }

  const isMe = msg.username === currentUser;

  return (
    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
      <span className="text-xs text-zinc-400 mb-1 ml-1">{msg.username}</span>
      <div className={`px-3 py-2 rounded-lg max-w-[85%] wrap-break-word ${
        isMe 
          ? 'bg-blue-600 text-white rounded-br-none' 
          : 'bg-zinc-700 text-zinc-100 rounded-bl-none'
      }`}>
        {msg.text}
      </div>
    </div>
  );
}