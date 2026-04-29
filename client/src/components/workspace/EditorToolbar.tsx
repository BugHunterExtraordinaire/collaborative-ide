import { type EditorToolbarProps } from '../../types/interfaces';

export default function EditorToolbar({
  currentRoom, language, setLanguage, isPlaybackMode, setIsPlaybackMode,
  historyLength, setPlaybackIndex, user, onLeaveRoom
}: EditorToolbarProps) {
  return (
    <div className="p-3 bg-zinc-800 flex justify-between items-center border-b border-zinc-700">
      <div className="flex items-center gap-4">
        <h3 className="m-0 text-md font-bold text-zinc-100 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          Collab-IDE <span className="text-zinc-400 text-sm font-mono">({currentRoom})</span>
        </h3>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="p-1.5 bg-zinc-700 text-white border-none outline-none rounded text-sm cursor-pointer hover:bg-zinc-600 transition-colors"
          disabled={isPlaybackMode}
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python 3</option>
          <option value="cpp">C++</option>
        </select>
      </div>

      <div className="flex items-center gap-4">
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
  );
}