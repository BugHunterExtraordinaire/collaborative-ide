import DashboardHeader from './shared/DashboardHeader';
import SessionForms from './shared/SessionForms';
import SessionList from './shared/SessionList';

import type { UserDashboardProps } from '../../types/interfaces';

export default function UserDashboard({ user, onJoinRoom, onLogout, handleDeleteSession, handleCreateSession, sessions }: UserDashboardProps) {

  return (
    <div className="min-h-screen bg-black p-10 text-white font-sans overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <DashboardHeader user={user} onLogout={onLogout} />
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-1/3">
            <SessionForms
              createTitle="Create Session" createBtnText="Create Workspace"
              joinTitle="Join Session with Code" joinBtnText="Connect"
              onCreate={handleCreateSession}
              onJoin={onJoinRoom}
            />
          </div>
          <SessionList
            title="Your Active Sessions" sessions={sessions} currentUser={user}
            joinBtnText="Enter Room" onJoin={onJoinRoom} onDelete={handleDeleteSession}
          />
        </div>
      </div>
    </div>
  );
}