import { type HeaderProps } from '../../../types/interfaces';

export default function DashboardHeader({ user, onLogout }: HeaderProps) {
  const badgeStyle = 
    user.role === 'System Administrator' ? 'bg-red-600/20 text-red-500 border-red-500/50' : 
    user.role === 'Instructor' ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50' : 
    'bg-green-500/20 text-green-500 border-green-500/50';

  return (
    <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4 border-b border-zinc-800 pb-6">
      <h2 className="text-3xl font-bold flex items-center gap-3">
        Welcome, {user.username} 
        <span className={`text-sm px-3 py-1 rounded-full uppercase tracking-wide font-bold border ${badgeStyle}`}>
          {user.role}
        </span>
      </h2>
      <button onClick={onLogout} className="px-5 py-2 bg-zinc-800 hover:bg-red-700 transition-colors text-white rounded font-medium border border-zinc-700">
        Secure Logout
      </button>
    </div>
  );
}