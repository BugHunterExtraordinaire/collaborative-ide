import { useContext } from 'react';
import type { WorkspaceProps } from '../../types/interfaces';
import { WorkspaceContext } from '../../contexts/WorkspaceContext';

export default function PlaybackScrubber() {

  const { historyLogs, playbackIndex, setPlaybackIndex } = useContext(WorkspaceContext) as WorkspaceProps;

  if (historyLogs.length === 0) return null;

  return (
    <article className="p-4 bg-zinc-900 border-b border-zinc-800">
      <input
        type="range"
        min={0}
        max={historyLogs.length - 1}
        value={playbackIndex}
        onChange={(e) => setPlaybackIndex(Number(e.target.value))}
        aria-label="Session Playback Timeline"
        aria-valuemin={0}
        aria-valuemax={historyLogs.length - 1}
        aria-valuenow={playbackIndex}
        aria-valuetext={`Viewing execution step ${playbackIndex + 1} of ${historyLogs.length}`}
        className="w-full cursor-pointer"
      />
      <p className="text-center text-sm mt-2 text-zinc-400">
        Viewing Snapshot: <strong className="text-orange-400">
          {new Date(historyLogs[playbackIndex].timestamp).toLocaleTimeString()}
        </strong>
      </p>
    </article>
  );
}