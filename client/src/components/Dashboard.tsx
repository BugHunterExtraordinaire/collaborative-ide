import axios from 'axios';
import toast from 'react-hot-toast';

import { useContext } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';

import UserDashboard from './dashboard/UserDashboard';
import AdminDashboard from './dashboard/AdminDashboard';

import { DashboardContext, UserDashboardContext } from '../contexts/DashboardContext';

import type { DashboardProps } from '../types/interfaces';
import type { SessionsArray } from '../types/arrays';

export default function Dashboard() {

  const queryClient = useQueryClient();

  const { user, onJoinRoom, onLogout } = useContext(DashboardContext) as DashboardProps;

  const isAdmin = user.role === "System Administrator";

  const { data: sessions = [] } = useQuery<SessionsArray>({
    queryKey: ['sessions'],
    queryFn: async () => {
      const res = await axios.get("/sessions");
      return res.data;
    }
  });

  const createSessionMutation = useMutation({
    mutationFn: async ({ name, language }: { name: string, language: string }) => {
      const res = await axios.post("/sessions", { name, language });
      return res.data;
    },
    onSuccess: (data) => {
      onJoinRoom(data.session.sessionId);
      toast.success("Session created successfully!");
    },
    onError: (err) => {
      toast.error(`${err.message}`)
    },
  });

  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      await axios.delete(`/sessions/${sessionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      toast.success("Session deleted successfully!");
    },
    onError: () => {
      toast.error(<b>Error while deleting session</b>)
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

  return (
    <UserDashboardContext.Provider value={{
      user,
      onJoinRoom,
      onLogout,
      handleDeleteSession,
      handleCreateSession,
      sessions,
    }}>
      {isAdmin ? <AdminDashboard /> : <UserDashboard />}
    </UserDashboardContext.Provider>
  );
}