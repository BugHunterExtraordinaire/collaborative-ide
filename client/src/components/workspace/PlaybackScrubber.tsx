import { useContext } from 'react';
import type { WorkspaceProps } from '../../types/interfaces';
import { WorkspaceContext } from '../../contexts/WorkspaceContext';

export default function PlaybackScrubber() {

  const { historyLogs, playbackIndex, setPlaybackIndex } = useContext(WorkspaceContext) as WorkspaceProps;

  if (historyLogs.length === 0) return null;

  return (
    <div className="p-4 bg-zinc-900 border-b border-zinc-800">
      <input
        type="range"
        min="0"
        max={historyLogs.length - 1}
        value={playbackIndex}
        onChange={(e) => setPlaybackIndex(Number(e.target.value))}
        className="w-full cursor-pointer accent-orange-500"
      />
      <div className="text-center text-sm mt-2 text-zinc-400">
        Viewing Snapshot: <strong className="text-orange-400">
          {new Date(historyLogs[playbackIndex].timestamp).toLocaleTimeString()}
        </strong>
      </div>
    </div>
  );
}