import { type DashboardProps } from '../types/interfaces';
import StudentDashboard from './dashboard/StudentDashboard';
import InstructorDashboard from './dashboard/InstructorDashboard';
import AdminDashboard from './dashboard/AdminDashboard';

export default function Dashboard(props: DashboardProps) {
  switch (props.user.role) {
    case 'System Administrator':
      return <AdminDashboard {...props} />;
    case 'Instructor':
      return <InstructorDashboard {...props} />;
    case 'Student':
    default:
      return <StudentDashboard {...props} />;
  }
}