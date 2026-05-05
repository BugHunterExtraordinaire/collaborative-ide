import axios from 'axios';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import DashboardHeader from './shared/DashboardHeader';
import SessionForms from './shared/SessionForms';
import SessionList from './shared/SessionList';

import type { UserDashboardProps } from '../../types/interfaces';
import type { ContainerArray } from '../../types/arrays';

export default function AdminDashboard({ user, onJoinRoom, onLogout, handleDeleteSession, handleCreateSession, sessions }: UserDashboardProps) {
  const queryClient = useQueryClient();

  const { data: containers = [] } = useQuery<ContainerArray>({
    queryKey: ['docker-containers'],
    queryFn: async () => {
      const res = await axios.get("http://localhost:80/api/v1/system/containers");
      return res.data;
    },
    refetchInterval: 5000,
    enabled: user.role === 'System Administrator'
  });

  const killContainerMutation = useMutation({
    mutationFn: async (containerId: string) => {
      await axios.delete(`http://localhost:80/api/v1/system/containers/${containerId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['docker-containers'] });
    }
  });

  return (
    <div className="min-h-screen bg-black p-10 text-white font-sans overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <DashboardHeader user={user} onLogout={onLogout} />
        
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex flex-col gap-6 w-full lg:w-1/3">
            <SessionForms 
              createTitle="Create Admin Session" createBtnText="Create Instance"
              joinTitle="Spy on Session" joinBtnText="Connect"
              onCreate={handleCreateSession} 
              onJoin={onJoinRoom} 
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
                      <button 
                        onClick={() => killContainerMutation.mutate(container.Id)} 
                        disabled={killContainerMutation.isPending}
                        className="mt-2 w-full py-1.5 bg-red-600/80 hover:bg-red-600 disabled:bg-zinc-600 disabled:cursor-not-allowed text-white text-xs font-bold rounded transition-colors"
                      >
                        {killContainerMutation.isPending ? 'Killing...' : 'SIGKILL Container'}
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