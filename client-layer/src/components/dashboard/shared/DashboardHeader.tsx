import { useContext } from "react";

import { UserDashboardContext } from "../../../contexts/DashboardContext";

import type { UserDashboardProps } from "../../../types/interfaces";

export default function DashboardHeader() {

  const { user, onLogout } = useContext(UserDashboardContext) as UserDashboardProps;
  
  return (
    <header className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4 border-b border-zinc-800 pb-6">
      <h2 className="text-3xl font-bold flex items-center gap-3">
        Welcome, {user.username}
      </h2>
      <button onClick={onLogout} className="px-5 py-2 bg-zinc-800 hover:bg-red-700 transition-colors text-white rounded font-medium border border-zinc-700">
        Logout
      </button>
    </header>
  );
}