import { useContext } from "react";

import { UserDashboardContext } from "../../../contexts/DashboardContext";

import type { SessionProps, UserDashboardProps } from "../../../types/interfaces";

export default function Session({ session, isAdmin, joinBtnText }: SessionProps) {

  const { user, onJoinRoom, handleDeleteSession } = useContext(UserDashboardContext) as UserDashboardProps;

  return (
    <li className="p-4 bg-zinc-800/50 hover:bg-zinc-800 transition-colors rounded-lg flex justify-between items-center border border-zinc-800/50 group">
      <div>
        <div className="font-bold text-lg text-white flex items-center gap-2">
          {session.name}
          {session.ownerId !== user.userId && !isAdmin && (
            <span className="text-[10px] font-normal text-zinc-400 bg-zinc-700 px-1.5 py-0.5 rounded">Joined | Owner: {session.owner}</span>
          )}
          {isAdmin && (
            <span className="text-[10px] font-normal text-zinc-400 bg-zinc-700 px-1.5 py-0.5 rounded">Owner: {session.owner} | Owner ID: {session.ownerId}</span>
          )}
          {session.ownerId === user.userId && (
            <span className="text-[10px] font-normal text-zinc-400 bg-zinc-700 px-1.5 py-0.5 rounded">Owned</span>
          )}
        </div>
        <div className="text-xs text-zinc-400 font-mono mt-1 select-all">Session ID: {session.sessionId}</div>
      </div>

      <div className="flex gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
        <button onClick={() => onJoinRoom(session.sessionId)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 transition-colors text-white text-sm rounded font-medium shadow">
          {joinBtnText}
        </button>
        {(isAdmin || (session.ownerId === user.userId)) && (
          <button onClick={() => handleDeleteSession(session.sessionId)} className="px-3 py-2 bg-red-600 hover:bg-red-700 transition-colors text-white text-sm rounded font-medium shadow">
            Delete
          </button>
        )}
      </div>
    </li>
  );
}