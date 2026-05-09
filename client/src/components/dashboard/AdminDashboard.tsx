import axios from 'axios';

import { useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import DashboardHeader from './shared/DashboardHeader';
import SessionForms from './shared/SessionForms';
import SessionList from './shared/SessionList';
import Container from './shared/Container';

import { UserDashboardContext } from '../../contexts/DashboardContext';

import type { UserDashboardProps } from '../../types/interfaces';
import type { ContainerArray } from '../../types/arrays';

export default function AdminDashboard() {
  const queryClient = useQueryClient();

  const { user } = useContext(UserDashboardContext) as UserDashboardProps;

  const { data: containers = [] } = useQuery<ContainerArray>({
    queryKey: ['docker-containers'],
    queryFn: async () => {
      const res = await axios.get("/system/containers");
      return res.data;
    },
    refetchInterval: 5000,
    enabled: user.role === 'System Administrator'
  });

  const killContainerMutation = useMutation({
    mutationFn: async (containerId: string) => {
      await axios.delete(`/system/containers/${containerId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['docker-containers'] });
    }
  });

  return (
    <div className="min-h-screen bg-black p-10 text-white font-sans overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <DashboardHeader />
        
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex flex-col gap-6 w-full lg:w-1/3">
            <SessionForms />

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
                    <Container 
                      key={container.Id} 
                      container={container}
                      killContainerMutation={killContainerMutation}
                    />
                  ))}
                </ul>
              )}
            </div>
          </div>
          
          <SessionList />
        </div>
      </div>
    </div>
  );
}