import { useContext } from 'react';
import type { ChatInputProps, WorkspaceProps } from '../../types/interfaces';
import { WorkspaceContext } from '../../contexts/WorkspaceContext';

export default function ChatInput({ input, setInput, onSubmit }: ChatInputProps) {

  const { user } = useContext(WorkspaceContext) as WorkspaceProps;
  const isAdmin = user.role === "System Administrator";

  return (
    <form onSubmit={onSubmit} className="flex p-3 bg-zinc-800 border-t border-zinc-700 gap-2">
      <input 
        type="text" 
        value={input} 
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type a message..."
        className="grow p-2.5 bg-zinc-900 border border-zinc-700 text-white rounded focus:ring-1 focus:ring-blue-500 outline-none transition-shadow"
        disabled={isAdmin}
      />
      <button type="submit" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 transition-colors border-none text-white rounded font-bold cursor-pointer shadow">
        Send
      </button>
    </form>
  );
}