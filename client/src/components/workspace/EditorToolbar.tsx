import { useState } from 'react';
import { type EditorToolbarProps } from '../../types/interfaces';
import InstructorAnalyticsModal from './InstructorAnalyticsModal';

export default function EditorToolbar({
  currentRoom, language, isPlaybackMode, setIsPlaybackMode,
  historyLength, setPlaybackIndex, user, onLeaveRoom
}: EditorToolbarProps) {
  
  const [showAnalytics, setShowAnalytics] = useState(false);
  const isPrivileged = user.role === 'Instructor' || user.role === 'System Administrator';

  return (
    <>
      <div className="px-5 py-2.5 bg-zinc-950 flex justify-between items-center border-b border-zinc-800">
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 pr-4 border-r border-zinc-800">
            <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></span>
            <h3 className="m-0 text-sm font-bold text-zinc-100 tracking-wide">Collab-IDE</h3>
          </div>
          
          <span className="text-zinc-500 text-xs font-mono bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
            ID: {currentRoom}
          </span>
          
          <span className="text-blue-400 text-[10px] font-bold uppercase tracking-wider border border-blue-900/50 bg-blue-900/20 px-2 py-1 rounded">
            {language}
          </span>
        </div>

        <div className="flex items-center gap-3">
          
          {isPrivileged && (
            <button
              onClick={() => setShowAnalytics(true)}
              className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold rounded border border-zinc-700 transition-all cursor-pointer flex items-center gap-2"
            >
              <span className="text-blue-400">📊</span> Session Data
            </button>
          )}

          <button
            onClick={() => {
              setIsPlaybackMode(!isPlaybackMode);
              setPlaybackIndex(Math.max(0, historyLength - 1));
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-all cursor-pointer border ${
              isPlaybackMode 
                ? 'bg-orange-500/10 text-orange-400 border-orange-500/30 hover:bg-orange-500/20' 
                : 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            {isPlaybackMode ? '⏹ Exit Playback' : '▶ Playback Mode'}
          </button>
          
          <div className="ml-2 pl-4 border-l border-zinc-800 flex items-center gap-3">
            <div className="flex flex-col items-end justify-center">
              <span className="text-zinc-200 text-xs font-medium leading-none">{user.username}</span>
              <span className="text-zinc-500 text-[9px] uppercase font-bold tracking-widest mt-1">{user.role}</span>
            </div>
            
            <button
              onClick={onLeaveRoom}
              className="px-3 py-1.5 bg-red-900/20 text-red-400 hover:bg-red-600 hover:text-white border border-red-900/50 text-xs font-bold rounded transition-all cursor-pointer"
            >
              Leave
            </button>
          </div>
        </div>
      </div>

      {showAnalytics && (
        <InstructorAnalyticsModal 
          currentRoom={currentRoom} 
          onClose={() => setShowAnalytics(false)} 
        />
      )}
    </>
  );
}