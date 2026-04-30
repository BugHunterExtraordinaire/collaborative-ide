import { type ListProps } from '../../../types/interfaces';

export default function SessionList({ title, sessions, currentUser, joinBtnText, onJoin, onDelete }: ListProps) {
  const isAdmin = currentUser.role === 'System Administrator';

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
            <li key={session.session_id} className="p-4 bg-zinc-800/50 hover:bg-zinc-800 transition-colors rounded-lg flex justify-between items-center border border-zinc-800/50 group">
              <div>
                <div className="font-bold text-lg text-white flex items-center gap-2">
                  {session.name}
                  {session.owner !== currentUser.username && !isAdmin && (
                    <span className="text-[10px] font-normal text-zinc-400 bg-zinc-700 px-1.5 py-0.5 rounded">Joined</span>
                  )}
                  {isAdmin && (
                    <span className="text-[10px] font-normal text-zinc-400 bg-zinc-700 px-1.5 py-0.5 rounded">Owner: {session.owner}</span>
                  )}
                </div>
                <div className="text-xs text-zinc-400 font-mono mt-1 select-all">ID: {session.session_id}</div>
              </div>
              
              <div className="flex gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                <button onClick={() => onJoin(session.session_id)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 transition-colors text-white text-sm rounded font-medium shadow">
                  {joinBtnText}
                </button>
                {(isAdmin || (session.owner === currentUser.username)) && onDelete && (
                  <button onClick={() => onDelete(session.session_id)} className="px-3 py-2 bg-red-600 hover:bg-red-700 transition-colors text-white text-sm rounded font-medium shadow">
                    Delete
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}