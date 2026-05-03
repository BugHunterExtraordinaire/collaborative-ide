import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import type { AnalyticsModalProps, ExecutionStats } from '../../types/interfaces';

export default function InstructorAnalyticsModal({ currentRoom, onClose }: AnalyticsModalProps) {
  const backendPort = new URLSearchParams(window.location.search).get('port') || '80';

  const { data, isLoading, isError } = useQuery({
    queryKey: ['session-analytics', currentRoom],
    queryFn: async () => {
      const res = await axios.get(`http://localhost:${backendPort}/api/sessions/${currentRoom}/analytics`);
      return res.data;
    },
    enabled: !!currentRoom,
    refetchOnWindowFocus: false, 
  });

  const handleExportData = () => {
    if (!data) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `session-${currentRoom}-export.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 w-150 shadow-2xl flex flex-col max-h-[80vh]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Pedagogical Tracking & Export</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white font-bold cursor-pointer">✕</button>
        </div>

        {isLoading ? (
          <div className="text-zinc-400 animate-pulse text-center py-10">Compiling Analytics...</div>
        ) : isError ? (
          <div className="text-red-400 text-center py-10">Failed to load session analytics.</div>
        ) : (
          <div className="flex flex-col gap-6 overflow-y-auto pr-2">
            
            <div className="bg-zinc-950 border border-zinc-800 rounded p-4">
              <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider mb-3">Execution Contributions</h3>
              {Object.keys(data?.pedagogicalTracking || {}).length === 0 ? (
                <div className="text-zinc-500 text-sm italic">No executions recorded yet.</div>
              ) : (
                <div className="flex flex-col gap-2">
                  {/* THE FIX: Cast the entries array to the strict type before mapping */}
                  {(Object.entries(data.pedagogicalTracking) as [string, ExecutionStats][]).map(([username, stats]) => (
                    <div key={username} className="flex justify-between items-center p-2 bg-zinc-900 rounded border border-zinc-800">
                      <span className="font-bold text-blue-400">{username}</span>
                      <div className="flex gap-4 text-sm">
                        <span className="text-zinc-300">Runs: <b>{stats.total}</b></span>
                        <span className="text-green-400">Success: <b>{stats.success}</b></span>
                        <span className="text-red-400">Errors: <b>{stats.errors}</b></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-zinc-950 border border-zinc-800 rounded p-4 text-sm text-zinc-300">
              <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider mb-3">Session Data Captured</h3>
              <ul className="list-disc list-inside flex flex-col gap-1">
                <li>Total Executions Logged: <b>{data?.rawExecutionLogs?.length || 0}</b></li>
                <li>Chat Messages Logged: <b>{data?.sessionDetails?.chatHistory?.length || 0}</b></li>
              </ul>
            </div>

          </div>
        )}

        <div className="mt-6 flex justify-end gap-3 border-t border-zinc-800 pt-4">
          <button 
            onClick={onClose} 
            className="px-4 py-2 rounded text-zinc-300 hover:bg-zinc-800 transition-colors text-sm font-bold cursor-pointer"
          >
            Close
          </button>
          <button 
            onClick={handleExportData}
            disabled={isLoading || !data || isError}
            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white transition-colors text-sm font-bold disabled:opacity-50 cursor-pointer"
          >
            Download Raw JSON Data
          </button>
        </div>
      </div>
    </div>
  );
}