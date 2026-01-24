import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { UpcomingSessions } from '@/components/dashboard/UpcomingSessions';
import { PendingTasks } from '@/components/dashboard/PendingTasks';
import { ProgressOverview } from '@/components/dashboard/ProgressOverview';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { StudentHeader } from '@/components/dashboard/StudentHeader';
import { Session, Task, CohortProgress } from '@/types/dashboard';
import { addDays, addHours } from 'date-fns';

// Mock data - will be replaced with API calls
const mockSessions: Session[] = [
  {
    id: '1',
    title: 'Preparação para Entrevistas Técnicas',
    date: addHours(new Date(), 2),
    status: 'scheduled',
    cohortName: 'Mentoria Intensiva - Turma 1',
    meetingUrl: 'https://meet.example.com/session-1',
  },
  {
    id: '2',
    title: 'LinkedIn Estratégico: Perfil que Atrai',
    date: addDays(new Date(), 1),
    status: 'scheduled',
    cohortName: 'Imersão Networking',
    meetingUrl: 'https://meet.example.com/session-2',
  },
  {
    id: '3',
    title: 'Negociação Salarial nos EUA',
    date: addDays(new Date(), 3),
    status: 'scheduled',
    cohortName: 'Mentoria Intensiva - Turma 1',
    meetingUrl: 'https://meet.example.com/session-3',
  },
];

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Atualizar currículo em inglês',
    cohortName: 'Mentoria Intensiva - Turma 1',
    dueDate: addHours(new Date(), 36),
    status: 'pending',
  },
  {
    id: '2',
    title: 'Gravar pitch de apresentação (2 min)',
    cohortName: 'Mentoria Intensiva - Turma 1',
    dueDate: addDays(new Date(), 5),
    status: 'pending',
  },
  {
    id: '3',
    title: 'Conectar com 10 profissionais no LinkedIn',
    cohortName: 'Imersão Networking',
    dueDate: addDays(new Date(), 7),
    status: 'pending',
  },
  {
    id: '4',
    title: 'Análise de vagas - 5 empresas',
    cohortName: 'Mentoria Intensiva - Turma 1',
    dueDate: addDays(new Date(), 2),
    status: 'pending',
  },
];

const mockCohortProgress: CohortProgress[] = [
  {
    id: '1',
    name: 'Mentoria Intensiva - Turma 1',
    completedSessions: 8,
    totalSessions: 12,
    percentComplete: 67,
  },
  {
    id: '2',
    name: 'Imersão Networking',
    completedSessions: 3,
    totalSessions: 10,
    percentComplete: 30,
  },
];

export default function StudentDashboard() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [cohortProgress, setCohortProgress] = useState<CohortProgress[]>([]);

  useEffect(() => {
    // Simulate API loading
    const loadData = async () => {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 800));
      setSessions(mockSessions);
      setTasks(mockTasks);
      setCohortProgress(mockCohortProgress);
      setIsLoading(false);
    };
    loadData();
  }, []);

  const handleViewAllSessions = () => {
    // Navigate to agenda
    window.location.href = '/dashboard/agenda';
  };

  const handleViewAllTasks = () => {
    // Navigate to tasks
    window.location.href = '/dashboard/tarefas';
  };

  const handleSubmitTask = (taskId: string) => {
    console.log('Submit task:', taskId);
    // TODO: Implement task submission
  };

  return (
    <DashboardLayout>
      {/* Desktop Header */}
      <StudentHeader />
      
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="pt-4 lg:pt-0">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            Olá, {user?.full_name.split(' ')[0]}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Continue sua jornada para trabalhar nos EUA
          </p>
        </div>

        {/* Quick Actions */}
        <QuickActions />

        {/* Main Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Upcoming Sessions - Priority */}
          <UpcomingSessions
            sessions={sessions}
            isLoading={isLoading}
            onViewAll={handleViewAllSessions}
            hasMore={sessions.length > 3}
          />

          {/* Pending Tasks */}
          <PendingTasks
            tasks={tasks}
            isLoading={isLoading}
            onViewAll={handleViewAllTasks}
            onSubmit={handleSubmitTask}
          />
        </div>

        {/* Progress Overview */}
        <ProgressOverview cohorts={cohortProgress} isLoading={isLoading} />
      </div>
    </DashboardLayout>
  );
}
