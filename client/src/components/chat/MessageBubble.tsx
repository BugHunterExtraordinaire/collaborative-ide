import { type MessageBubbleProps } from '../../types/interfaces';

export default function MessageBubble({ msg, currentUser }: MessageBubbleProps) {
  
  if (msg.isSystem) {
    return (
      <div 
        role="status" 
        className="text-center text-xs text-zinc-500 italic my-2 w-full"
      >
        <span className="sr-only">System notification: </span>
        — {msg.text} —
      </div>
    );
  }

  const isMe = msg.username === currentUser;

  return (
    <article className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} w-full`}>
      
      <span className="text-xs text-zinc-400 mb-1 ml-1" aria-hidden="true">
        {msg.username}
      </span>
      
      <span className="sr-only">
        {isMe ? 'You said:' : `${msg.username} said:`}
      </span>

      <div className={`px-3 py-2 rounded-lg max-w-[85%] break-words ${
        isMe 
          ? 'bg-blue-600 text-white rounded-br-none' 
          : 'bg-zinc-700 text-zinc-100 rounded-bl-none'
      }`}>
        {msg.text}
      </div>
      
    </article>
  );
}