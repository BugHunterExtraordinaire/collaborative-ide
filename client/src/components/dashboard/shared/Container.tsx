import type { DockerContainerProps } from "../../../types/interfaces";

export default function Container({ container, killContainerMutation }: DockerContainerProps) {
  return (
    <li className="p-3 bg-zinc-800 rounded border border-red-900/30 flex flex-col gap-2">
      <div className="flex justify-between items-start">
        <span className="text-xs font-mono text-zinc-300 break-all">{container.Id.substring(0, 12)}</span>
        <span className="text-[10px] bg-blue-900/50 text-blue-400 px-1.5 py-0.5 rounded uppercase">{container.State}</span>
      </div>
      <div className="text-sm font-bold text-white">{container.Image}</div>
      <div className="text-xs text-zinc-500">{container.Status}</div>
      <button
        onClick={() => killContainerMutation.mutate(container.Id)}
        disabled={killContainerMutation.isPending}
        className="mt-2 w-full py-1.5 bg-red-600/80 hover:bg-red-600 disabled:bg-zinc-600 disabled:cursor-not-allowed text-white text-xs font-bold rounded transition-colors"
      >
        {killContainerMutation.isPending ? 'Killing...' : 'SIGKILL Container'}
      </button>
    </li>
  );
}