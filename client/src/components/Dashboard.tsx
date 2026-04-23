import { useState, useEffect } from 'react';
import axios from 'axios';
import { type DashboardProps } from '../types/interfaces';
import { type SessionsArray } from '../types/arrays';

export default function Dashboard({ user, onJoinRoom, onLogout }: DashboardProps) {
  const [sessions, setSessions] = useState<SessionsArray>([]);
  const [newRoomName, setNewRoomName] = useState('');
  const [joinId, setJoinId] = useState('');

  useEffect(() => {
    const backendPort = new URLSearchParams(window.location.search).get('port') || '4000';
    axios.get(`http://localhost:${backendPort}/api/sessions?owner=${user.username}`)
      .then(res => setSessions(res.data))
      .catch(err => console.error('Failed to load sessions', err));
  }, [user]);

  const handleCreateSession: React.SubmitEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    try {
      const backendPort = new URLSearchParams(window.location.search).get('port') || '4000';
      const res = await axios.post(`http://localhost:${backendPort}/api/sessions`, {
        name: newRoomName,
        owner: user.username
      });
      onJoinRoom(res.data.session_id);
    } catch (error) {
      console.error('Failed to create session', error);
    }
  };

  const handleJoinExisting: React.SubmitEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    if (joinId.trim()) {
      onJoinRoom(joinId.trim());
    }
  };

  return (
    <div className="min-h-screen bg-black p-10 text-white font-sans">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
          <h2 className="text-3xl font-bold">
            Welcome, {user.username} <span className="text-sm text-green-500 bg-green-500/10 px-2 py-1 rounded-full uppercase tracking-wide">({user.role})</span>
          </h2>
          <button onClick={onLogout} className="px-5 py-2 bg-red-600 hover:bg-red-700 transition-colors text-white rounded font-medium">
            Logout
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 bg-zinc-900 p-8 rounded-xl border border-zinc-800 shadow-lg">
            
            <h3 className="mt-0 text-xl font-semibold text-blue-500 mb-4">Create New Session</h3>
            <form onSubmit={handleCreateSession} className="flex gap-3 mb-8">
              <input 
                type="text" placeholder="e.g., Study Group" value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} required
                className="grow p-3 bg-zinc-800 text-white border-none rounded focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <button type="submit" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 transition-colors text-white font-bold rounded">Create</button>
            </form>

            <h3 className="mt-0 text-xl font-semibold text-orange-500 mb-4">Join with Code</h3>
            <form onSubmit={handleJoinExisting} className="flex gap-3">
              <input 
                type="text" placeholder="Paste 8-character Room ID" value={joinId} onChange={(e) => setJoinId(e.target.value)} required
                className="grow p-3 bg-zinc-800 text-white border-none rounded focus:ring-2 focus:ring-orange-500 outline-none"
              />
              <button type="submit" className="px-6 py-3 bg-orange-500 hover:bg-orange-600 transition-colors text-white font-bold rounded">Join</button>
            </form>
            
          </div>
          
          <div className="flex-1 bg-zinc-900 p-8 rounded-xl border border-zinc-800 shadow-lg flex flex-col">
            <h3 className="mt-0 text-xl font-semibold mb-4 text-zinc-100">Your Active Sessions</h3>
            {sessions.length === 0 ? (
              <p className="text-zinc-500 italic my-auto text-center">You have not created any sessions yet.</p>
            ) : (
              <ul className="list-none p-0 m-0 flex flex-col gap-3 overflow-y-auto max-h-75 pr-2">
                {sessions.map(session => (
                  <li key={session.session_id} className="p-4 bg-zinc-800/50 hover:bg-zinc-800 transition-colors rounded-lg flex justify-between items-center border border-zinc-800/50">
                    <div>
                      <div className="font-bold text-lg text-white">{session.name}</div>
                      <div className="text-xs text-zinc-400 font-mono mt-1">ID: {session.session_id}</div>
                    </div>
                    <button onClick={() => onJoinRoom(session.session_id)} className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 transition-colors text-white rounded font-medium">
                      Join
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}