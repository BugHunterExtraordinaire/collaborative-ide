import { type DashboardProps } from '../types/interfaces';
import StudentDashboard from './dashboards/StudentDashboard';
import InstructorDashboard from './dashboards/InstructorDashboard';
import AdminDashboard from './dashboards/AdminDashboard';

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