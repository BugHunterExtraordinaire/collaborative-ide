import { useState, useEffect } from 'react';
import axios from 'axios';
import { type DashboardProps, type DockerContainer } from '../types/interfaces';
import { type SessionsArray } from '../types/arrays';
import DashboardHeader from './dashboard/DashboardHeader';
import SessionForms from './dashboard/SessionForms';
import SessionList from './dashboard/SessionList';

export default function AdminDashboard({ user, onJoinRoom, onLogout }: DashboardProps) {
  const [sessions, setSessions] = useState<SessionsArray>([]);
  const [containers, setContainers] = useState<DockerContainer[]>([]);

  useEffect(() => {
    const backendPort = new URLSearchParams(window.location.search).get('port') || '4000';
    axios.get(`http://localhost:${backendPort}/api/sessions?username=${encodeURIComponent(user.username)}&role=${encodeURIComponent(user.role)}`)
      .then(res => setSessions(res.data))
      .catch(err => console.error(err));
  }, [user]);

  useEffect(() => {
    const backendPort = new URLSearchParams(window.location.search).get('port') || '4000';
    const fetchContainers = () => {
      axios.get(`http://localhost:${backendPort}/api/system/containers`)
        .then(res => setContainers(res.data))
        .catch(err => console.error(err));
    };

    fetchContainers();
    const intervalId = setInterval(fetchContainers, 5000);
    return () => clearInterval(intervalId);
  }, []);

  const handleCreateSession = async (name: string) => {
    const backendPort = new URLSearchParams(window.location.search).get('port') || '4000';
    const res = await axios.post(`http://localhost:${backendPort}/api/sessions`, { name, owner: user.username });
    onJoinRoom(res.data.session_id);
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!window.confirm(`WARNING: This will permanently delete session ${sessionId}. Continue?`)) return;
    const backendPort = new URLSearchParams(window.location.search).get('port') || '4000';
    await axios.delete(`http://localhost:${backendPort}/api/sessions/${sessionId}`, { data: { role: user.role } });
    setSessions(prev => prev.filter(s => s.session_id !== sessionId));
  };

  const handleKillContainer = async (containerId: string) => {
    const backendPort = new URLSearchParams(window.location.search).get('port') || '4000';
    await axios.delete(`http://localhost:${backendPort}/api/system/containers/${containerId}`);
    setContainers(prev => prev.filter(c => c.Id !== containerId));
  };

  return (
    <div className="min-h-screen bg-black p-10 text-white font-sans overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <DashboardHeader user={user} onLogout={onLogout} />
        
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex flex-col gap-6 w-full lg:w-1/3">
            <SessionForms 
              createTitle="Create Admin Session" createBtnText="Create Instance"
              joinTitle="Spy on Session" joinBtnText="Connect"
              onCreate={handleCreateSession} onJoin={onJoinRoom} 
            />

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
                  System Optimal. No zombie containers.
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
                      <button onClick={() => handleKillContainer(container.Id)} className="mt-2 w-full py-1.5 bg-red-600/80 hover:bg-red-600 text-white text-xs font-bold rounded transition-colors">
                        SIGKILL Container
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          
          <SessionList 
            title="Global Platform Sessions" sessions={sessions} currentUser={user} 
            joinBtnText="Spy / Join" onJoin={onJoinRoom} onDelete={handleDeleteSession}
          />
        </div>
      </div>
    </div>
  );
}