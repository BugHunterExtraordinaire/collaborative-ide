import axios from 'axios';

import { Toaster } from 'react-hot-toast';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';

import type { DashboardProps } from '../types/interfaces';
import type { SessionsArray } from '../types/arrays';

import UserDashboard from './dashboard/UserDashboard';
import AdminDashboard from './dashboard/AdminDashboard';

export default function Dashboard({ user, onJoinRoom, onLogout }: DashboardProps) {

  const queryClient = useQueryClient();

  const { data: sessions = [] } = useQuery<SessionsArray>({
    queryKey: ['sessions'],
    queryFn: async () => {
      const res = await axios.get("http://localhost:80/api/v1/sessions");
      return res.data;
    }
  });

  const createSessionMutation = useMutation({
    mutationFn: async ({ name, language }: { name: string, language: string }) => {
      const res = await axios.post("http://localhost:80/api/v1/sessions", { name, language });
      return res.data;
    },
    onSuccess: (data) => {
      onJoinRoom(data.sessionId);
    }
  });

  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      await axios.delete(`http://localhost:80/api/v1/sessions/${sessionId}`, { data: { role: user.role } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    }
  });

  const handleCreateSession = (name: string, language: string) => {
    createSessionMutation.mutate({ name, language });
  }

  const handleDeleteSession = (sessionId: string) => {
    if (window.confirm(`WARNING: This will permanently delete session ${sessionId}. Continue?`)) {
      deleteSessionMutation.mutate(sessionId);
    }
  };

  if (user.role === "System Administrator") {
    return (
      <>
        <Toaster position='top-center' reverseOrder={false} />
        <AdminDashboard
          user={user}
          onJoinRoom={onJoinRoom}
          onLogout={onLogout}
          handleDeleteSession={handleDeleteSession}
          handleCreateSession={handleCreateSession}
          sessions={sessions}
        />
      </>
    );
  } else {
    return (
      <>
        <Toaster position='top-center' reverseOrder={false} />
        <UserDashboard
          user={user}
          onJoinRoom={onJoinRoom}
          onLogout={onLogout}
          handleDeleteSession={handleDeleteSession}
          handleCreateSession={handleCreateSession}
          sessions={sessions}
        />
      </>
    );
  }

}