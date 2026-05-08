import axios from 'axios';
import { useState } from 'react';

import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Workspace from './components/Workspace';

import { DashboardContext } from './contexts/DashboardContext';

import { type UserObject } from './types/interfaces';

axios.defaults.withCredentials = true;

export default function App() {
  const [user, setUser] = useState<UserObject | null>(() => {
    const savedUser = sessionStorage.getItem('ide_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [currentRoom, setCurrentRoom] = useState<string | null>(null);

  const handleLoginSuccess = (userData: UserObject) => {
    setUser(userData);
    sessionStorage.setItem('ide_user', JSON.stringify(userData));
  };

  const handleLogout = async () => {
    try {
      await axios.post("http://localhost:80/api/v1/auth/logout");
    } catch (error) {
      console.error("Logout failed", error);
    }
    setUser(null);
    sessionStorage.removeItem('ide_user');
  };

  if (!user) return <Login onLoginSuccess={handleLoginSuccess} />;

  if (!currentRoom) {
    return (
      <DashboardContext.Provider value={{
        user,
        onJoinRoom: (sessionId: string) => setCurrentRoom(sessionId),
        onLogout: handleLogout
      }}>
        <Dashboard />
      </DashboardContext.Provider>
    );
  };

  return <Workspace currentRoom={currentRoom} user={user} setCurrentRoom={setCurrentRoom} />;
}