import { useState, useEffect } from 'react';
import axios from 'axios';
import { type DashboardProps } from '../types/interfaces';
import { type SessionsArray } from '../types/arrays';

export default function Dashboard({ user, onJoinRoom, onLogout }: DashboardProps) {
  const [sessions, setSessions] = useState<SessionsArray>([]);
  const [containers, setContainers] = useState<any[]>([]);
  const [newRoomName, setNewRoomName] = useState('');
  const [joinId, setJoinId] = useState('');

  useEffect(() => {
    const backendPort = new URLSearchParams(window.location.search).get('port') || '4000';
    const safeUsername = encodeURIComponent(user.username);
    const safeRole = encodeURIComponent(user.role);
    
    axios.get(`http://localhost:${backendPort}/api/sessions?username=${safeUsername}&role=${safeRole}`)
      .then(res => setSessions(res.data))
      .catch(err => console.error('Failed to load sessions', err));
  }, [user]);

  useEffect(() => {
    if (user.role !== 'System Administrator') return;

    const backendPort = new URLSearchParams(window.location.search).get('port') || '4000';
    
    const fetchContainers = () => {
      axios.get(`http://localhost:${backendPort}/api/system/containers`)
        .then(res => setContainers(res.data))
        .catch(err => console.error('Failed to load containers', err));
    };

    fetchContainers();
    const intervalId = setInterval(fetchContainers, 5000);

    return () => clearInterval(intervalId);
  }, [user]);

  const handleCreateSession = async (e: React.FormEvent) => {
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

  const handleJoinExisting = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinId.trim()) onJoinRoom(joinId.trim());
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!window.confirm(`WARNING: This will permanently delete session ${sessionId} and all its CRDT history. Continue?`)) return;
    
    try {
      const backendPort = new URLSearchParams(window.location.search).get('port') || '4000';
      await axios.delete(`http://localhost:${backendPort}/api/sessions/${sessionId}`, {
        data: { role: user.role }
      });
      setSessions(prev => prev.filter(s => s.session_id !== sessionId));
    } catch (error) {
      console.error('Failed to delete session', error);
      alert('Deletion failed. Check console for details.');
    }
  };

  const handleKillContainer = async (containerId: string) => {
    try {
      const backendPort = new URLSearchParams(window.location.search).get('port') || '4000';
      await axios.delete(`http://localhost:${backendPort}/api/system/containers/${containerId}`);
      setContainers(prev => prev.filter(c => c.Id !== containerId));
    } catch (error) {
      console.error('Failed to kill container', error);
      alert('Failed to kill container. It may have already exited.');
    }
  };

  return (
    <div className="min-h-screen bg-black p-10 text-white font-sans overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4 border-b border-zinc-800 pb-6">
          <h2 className="text-3xl font-bold flex items-center gap-3">
            Welcome, {user.username} 
            <span className={`text-sm px-3 py-1 rounded-full uppercase tracking-wide font-bold ${
              user.role === 'System Administrator' ? 'bg-red-600/20 text-red-500 border border-red-500/50' : 
              user.role === 'Instructor' ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/50' : 
              'bg-green-500/20 text-green-500 border border-green-500/50'
            }`}>
              {user.role}
            </span>
          </h2>
          <button onClick={onLogout} className="px-5 py-2 bg-zinc-800 hover:bg-red-700 transition-colors text-white rounded font-medium border border-zinc-700">
            Secure Logout
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          
          <div className="flex flex-col gap-6 w-full lg:w-1/3">
            
            <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 shadow-lg">
              <h3 className="mt-0 text-lg font-semibold text-blue-500 mb-4">Create New Session</h3>
              <form onSubmit={handleCreateSession} className="flex flex-col gap-3 mb-8">
                <input 
                  type="text" placeholder="e.g., Study Group" value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} required
                  className="w-full p-3 bg-zinc-800 text-white border-none rounded focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 transition-colors text-white font-bold rounded shadow-lg">Create Instance</button>
              </form>

              <h3 className="mt-0 text-lg font-semibold text-orange-500 mb-4">Join with Code</h3>
              <form onSubmit={handleJoinExisting} className="flex flex-col gap-3">
                <input 
                  type="text" placeholder="8-character Room ID" value={joinId} onChange={(e) => setJoinId(e.target.value)} required
                  className="w-full p-3 bg-zinc-800 text-white border-none rounded focus:ring-2 focus:ring-orange-500 outline-none uppercase font-mono"
                />
                <button type="submit" className="w-full py-3 bg-orange-500 hover:bg-orange-600 transition-colors text-white font-bold rounded shadow-lg">Connect</button>
              </form>
            </div>

            {user.role === 'System Administrator' && (
              <div className="bg-zinc-900 p-6 rounded-xl border border-red-900/50 shadow-lg flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="m-0 text-lg font-semibold text-red-500 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    Execution Layer Monitor
                  </h3>
                  <span className="text-xs text-zinc-500 font-mono">Live</span>
                </div>
                
                {containers.length === 0 ? (
                  <div className="p-4 bg-zinc-800/50 rounded border border-zinc-800 text-center text-sm text-green-500 font-mono">
                    System Optimal. No zombie containers detected.
                  </div>
                ) : (
                  <ul className="list-none p-0 m-0 flex flex-col gap-2 max-h-75 overflow-y-auto">
                    {containers.map(container => (
                      <li key={container.Id} className="p-3 bg-zinc-800 rounded border border-red-900/30 flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-mono text-zinc-300 break-all">{container.Id.substring(0, 12)}</span>
                          <span className="text-[10px] bg-blue-900/50 text-blue-400 px-1.5 py-0.5 rounded uppercase">{container.State}</span>
                        </div>
                        <div className="text-sm font-bold text-white">{container.Image}</div>
                        <div className="text-xs text-zinc-500">{container.Status}</div>
                        <button 
                          onClick={() => handleKillContainer(container.Id)}
                          className="mt-2 w-full py-1.5 bg-red-600/80 hover:bg-red-600 text-white text-xs font-bold rounded transition-colors"
                        >
                          SIGKILL Container
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
          
          <div className="flex-1 bg-zinc-900 p-8 rounded-xl border border-zinc-800 shadow-lg flex flex-col h-[calc(100vh-200px)]">
            <h3 className="mt-0 text-xl font-semibold mb-6 text-zinc-100 flex items-center justify-between border-b border-zinc-800 pb-4">
              {user.role === 'System Administrator' ? 'Global Platform Sessions' : 'Your Active Sessions'}
              {user.role === 'System Administrator' && (
                <span className="text-[10px] uppercase tracking-wider bg-red-600/20 text-red-500 px-2 py-1 rounded">Admin Access</span>
              )}
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
                        {session.owner !== user.username && user.role !== 'System Administrator' && (
                          <span className="text-[10px] font-normal text-zinc-400 bg-zinc-700 px-1.5 py-0.5 rounded">Joined</span>
                        )}
                        {user.role === 'System Administrator' && (
                          <span className="text-[10px] font-normal text-zinc-400 bg-zinc-700 px-1.5 py-0.5 rounded">Owner: {session.owner}</span>
                        )}
                      </div>
                      <div className="text-xs text-zinc-400 font-mono mt-1 select-all">ID: {session.session_id}</div>
                    </div>
                    
                    <div className="flex gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => onJoinRoom(session.session_id)} 
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 transition-colors text-white text-sm rounded font-medium shadow"
                      >
                        {user.role === 'System Administrator' ? 'Spy / Join' : 'Join'}
                      </button>
                      
                      {user.role === 'System Administrator' && (
                        <button 
                          onClick={() => handleDeleteSession(session.session_id)} 
                          className="px-3 py-2 bg-red-600 hover:bg-red-700 transition-colors text-white text-sm rounded font-medium shadow"
                          title="Permanently Delete Session"
                        >
                          Delete
                        </button>
                      )}
                    </div>
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