import type { UserTrackingProps } from "../../types/interfaces";

export default function UserTracking({ username, stats }: UserTrackingProps) {
  return (
    <div className="flex justify-between items-center p-2 bg-zinc-900 rounded border border-zinc-800">
      <span className="font-bold text-blue-400">{username}</span>
      <div className="flex gap-4 text-sm">
        <span className="text-zinc-300">Runs: <b>{stats.total}</b></span>
        <span className="text-green-400">Success: <b>{stats.success}</b></span>
        <span className="text-red-400">Errors: <b>{stats.errors}</b></span>
      </div>
    </div>
  );
}