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
      <div className="p-3 bg-zinc-800 flex justify-between items-center border-b border-zinc-700">
        <div className="flex items-center gap-4">
          <h3 className="m-0 text-md font-bold text-zinc-100 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Collab-IDE <span className="text-zinc-400 text-sm font-mono">({currentRoom})</span>
          </h3>
          <div className="px-3 py-1 bg-zinc-700/50 text-blue-400 border border-zinc-600 rounded text-xs font-bold uppercase tracking-wider">
            {language}
          </div>
        </div>

        <div className="flex items-center gap-4">
          
          {isPrivileged && (
            <button
              onClick={() => setShowAnalytics(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded transition-colors cursor-pointer"
            >
              📊 Session Data
            </button>
          )}

          <button
            onClick={() => {
              setIsPlaybackMode(!isPlaybackMode);
              setPlaybackIndex(Math.max(0, historyLength - 1));
            }}
            className={`px-3 py-1.5 text-sm font-bold rounded transition-colors ${
              isPlaybackMode ? 'bg-orange-500 hover:bg-orange-600' : 'bg-zinc-700 hover:bg-zinc-600'
            } text-white border-none cursor-pointer`}
          >
            {isPlaybackMode ? 'Exit Playback' : '⏪ Playback Mode'}
          </button>
          
          <span className="text-zinc-300 text-sm">
            {user.username} <span className="text-green-500">({user.role})</span>
          </span>
          
          <button
            onClick={onLeaveRoom}
            className="px-3 py-1.5 bg-red-600/80 hover:bg-red-600 text-white text-sm rounded transition-colors cursor-pointer"
          >
            Leave Room
          </button>
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