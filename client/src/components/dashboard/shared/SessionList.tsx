import { useContext } from "react";

import Session from "./Session";

import { UserDashboardContext } from "../../../contexts/DashboardContext";

import type { UserDashboardProps } from "../../../types/interfaces";

export default function SessionList() {

  const { user, sessions } = useContext(UserDashboardContext) as UserDashboardProps;

  const isAdmin = user.role === 'System Administrator';

  const title = isAdmin ? "Global Platform Sessions" : "Your Active Sessions";
  const joinBtnText = isAdmin ? "Check / Join" : "Enter Room";

  return (
    <div className="flex-1 bg-zinc-900 p-8 rounded-xl border border-zinc-800 shadow-lg flex flex-col h-[calc(100vh-200px)]">
      <h3 className="mt-0 text-xl font-semibold mb-6 text-zinc-100 flex items-center justify-between border-b border-zinc-800 pb-4">
        {title}
        {isAdmin && <span className="text-[10px] uppercase tracking-wider bg-red-600/20 text-red-500 px-2 py-1 rounded">Admin Access</span>}
      </h3>
      
      {sessions.length === 0 ? (
        <p className="text-zinc-500 italic my-auto text-center">No active sessions found.</p>
      ) : (
        <ul className="list-none p-0 m-0 flex flex-col gap-3 overflow-y-auto pr-2">
          {sessions.map(session => (
            <Session 
              key={session.sessionId} 
              session={session} 
              isAdmin={isAdmin} 
              joinBtnText={joinBtnText} 
            />
          ))}
        </ul>
      )}
    </div>
  );
}