import { useContext, useState } from 'react';

import CreateSessionForm from './CreateSessionForm';
import JoinSessionForm from './JoinSessionForm';

import { UserDashboardContext } from '../../../contexts/DashboardContext';

import type { UserDashboardProps } from '../../../types/interfaces';

export default function SessionForms() {
  const [newRoomName, setNewRoomName] = useState('');
  const [language, setLanguage] = useState('JavaScript');
  const [joinId, setJoinId] = useState('');

  const { user, handleCreateSession, onJoinRoom } = useContext(UserDashboardContext) as UserDashboardProps;

  const isAdmin = user.role === "System Administrator";

  const createTitle = isAdmin ? "Create Admin Session" : "Create Session";
  const createBtnText = isAdmin ? "Create Instance" : "Create Workspace";
  const joinTitle = isAdmin ? "Spy on Session" : "Join Session with Code";
  const joinBtnText = "Connect";

  const handleCreate: React.SubmitEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    handleCreateSession(newRoomName, language);
    setNewRoomName('');
  };

  const handleJoin: React.SubmitEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    if (joinId.trim()) onJoinRoom(joinId.trim());
    setJoinId('');
  };

  return (
    <aside className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 shadow-lg mb-6">
      <h3 className="mt-0 text-lg font-semibold text-blue-500 mb-4">{createTitle}</h3>
      <CreateSessionForm
        handleCreate={handleCreate}
        newRoomName={newRoomName}
        setNewRoomName={setNewRoomName}
        language={language}
        setLanguage={setLanguage}
        createBtnText={createBtnText}
      />

      <h3 className="mt-0 text-lg font-semibold text-orange-500 mb-4">{joinTitle}</h3>
      <JoinSessionForm
        handleJoin={handleJoin}
        joinId={joinId}
        setJoinId={setJoinId}
        joinBtnText={joinBtnText}
      />
    </aside>
  );
}