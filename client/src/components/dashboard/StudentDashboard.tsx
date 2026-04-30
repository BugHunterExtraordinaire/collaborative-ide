import { useState, useEffect } from 'react';
import axios from 'axios';
import { type DashboardProps } from '../../types/interfaces';
import { type SessionsArray } from '../../types/arrays';
import DashboardHeader from './shared/DashboardHeader';
import SessionForms from './shared/SessionForms';
import SessionList from './shared/SessionList';

export default function StudentDashboard({ user, onJoinRoom, onLogout }: DashboardProps) {
  const [sessions, setSessions] = useState<SessionsArray>([]);

  useEffect(() => {
    const backendPort = new URLSearchParams(window.location.search).get('port') || '4000';
    axios.get(`http://localhost:${backendPort}/api/sessions?username=${encodeURIComponent(user.username)}&role=${encodeURIComponent(user.role)}`)
      .then(res => setSessions(res.data))
      .catch(err => console.error(err));
  }, [user]);

  const handleCreateSession = async (name: string) => {
    const backendPort = new URLSearchParams(window.location.search).get('port') || '4000';
    const res = await axios.post(`http://localhost:${backendPort}/api/sessions`, { name, owner: user.username });
    onJoinRoom(res.data.session_id);
  };

  return (
    <div className="min-h-screen bg-black p-10 text-white font-sans overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <DashboardHeader user={user} onLogout={onLogout} />
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-1/3">
            <SessionForms 
              createTitle="Create Peer Session" createBtnText="Create Workspace"
              joinTitle="Join with Code" joinBtnText="Connect"
              onCreate={handleCreateSession} onJoin={onJoinRoom} 
            />
          </div>
          <SessionList 
            title="Your Workspaces" sessions={sessions} currentUser={user} 
            joinBtnText="Join" onJoin={onJoinRoom} 
          />
        </div>
      </div>
    </div>
  );
}