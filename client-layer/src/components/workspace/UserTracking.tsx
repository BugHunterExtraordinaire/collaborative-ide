import type { UserTrackingProps } from "../../types/interfaces";

export default function UserTracking({ username, stats }: UserTrackingProps) {
  return (
    <li className="flex justify-between items-center p-2 bg-zinc-900 rounded border border-zinc-800">
      <p className="font-bold text-blue-400" aria-hidden='true'>{username}</p>
      
      <div className="flex gap-4 text-sm">
        <span className="sr-only">Statistics for {username} </span>
        <span className="text-zinc-300">Runs: <strong className="font-bold">{stats.total}</strong>, </span>
        <span className="text-green-400">Success: <strong className="font-bold">{stats.success}</strong>, </span>
        <span className="text-red-400">Errors: <strong className="font-bold">{stats.errors}</strong></span>
      </div>
    </li>
  );
}