import axios from 'axios';
import { useQuery, useMutation } from '@tanstack/react-query';
import { type DashboardProps } from '../../types/interfaces';
import { type SessionsArray } from '../../types/arrays';
import DashboardHeader from './shared/DashboardHeader';
import SessionForms from './shared/SessionForms';
import SessionList from './shared/SessionList';

export default function StudentDashboard({ user, onJoinRoom, onLogout }: DashboardProps) {
  const backendPort = new URLSearchParams(window.location.search).get('port') || '80';

  const { data: sessions = [] } = useQuery<SessionsArray>({
    queryKey: ['sessions', user.username, user.role],
    queryFn: async () => {
      const res = await axios.get(`http://localhost:${backendPort}/api/sessions?username=${encodeURIComponent(user.username)}&role=${encodeURIComponent(user.role)}`);
      return res.data;
    }
  });

  const createSessionMutation = useMutation({
    mutationFn: async ({ name, language }: { name: string, language: string }) => {
      const res = await axios.post(`http://localhost:${backendPort}/api/sessions`, { name, owner: user.username, language });
      return res.data;
    },
    onSuccess: (data) => {
      onJoinRoom(data.session_id);
    }
  });

  return (
    <div className="min-h-screen bg-black p-10 text-white font-sans overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <DashboardHeader user={user} onLogout={onLogout} />
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-1/3">
            <SessionForms
              createTitle="Create Peer Session" createBtnText="Create Workspace"
              joinTitle="Join with Code" joinBtnText="Connect"
              onCreate={(name, language) => createSessionMutation.mutate({ name, language })}
              onJoin={onJoinRoom}
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