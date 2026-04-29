import { type TerminalPanelProps } from '../../types/interfaces';

export default function TerminalPanel({ output, isRunning, isPlaybackMode, onRunCode }: TerminalPanelProps) {
  return (
    <div className="h-1/2 flex flex-col border-b border-zinc-800">
      <div className="p-3 bg-zinc-800 border-b border-zinc-700 flex justify-between items-center">
        <h3 className="m-0 text-sm font-bold text-zinc-100 uppercase tracking-wider">Terminal Output</h3>
        <button
          onClick={onRunCode}
          disabled={isRunning || isPlaybackMode}
          className={`px-4 py-1.5 text-sm font-bold rounded transition-colors ${
            isRunning || isPlaybackMode 
              ? 'bg-zinc-600 cursor-not-allowed text-zinc-400' 
              : 'bg-blue-600 hover:bg-blue-700 cursor-pointer text-white'
          }`}
        >
          {isRunning ? 'Running...' : 'Run Code ▶'}
        </button>
      </div>
      <pre className="p-4 m-0 grow overflow-y-auto text-zinc-300 whitespace-pre-wrap font-mono text-sm bg-black">
        {output}
      </pre>
    </div>
  );
}