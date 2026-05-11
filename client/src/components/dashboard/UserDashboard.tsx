import DashboardHeader from './shared/DashboardHeader';
import SessionForms from './shared/SessionForms';
import SessionList from './shared/SessionList';

export default function UserDashboard() {

  return (
    <main className="min-h-screen bg-black p-10 text-white font-sans overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <DashboardHeader />
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-1/3">
            <SessionForms />
          </div>
          <SessionList />
        </div>
      </div>
    </main>
  );
}