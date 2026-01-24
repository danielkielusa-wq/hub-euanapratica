// Dashboard Types for Student Dashboard

export interface Session {
  id: string;
  title: string;
  date: Date;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  cohortName: string;
  meetingUrl?: string;
}

export interface Task {
  id: string;
  title: string;
  cohortName: string;
  dueDate: Date;
  status: 'pending' | 'submitted' | 'graded';
  isUrgent?: boolean;
}

export interface CohortProgress {
  id: string;
  name: string;
  completedSessions: number;
  totalSessions: number;
  percentComplete: number;
}

export interface DashboardData {
  upcomingSessions: Session[];
  pendingTasks: Task[];
  cohortProgress: CohortProgress[];
}
