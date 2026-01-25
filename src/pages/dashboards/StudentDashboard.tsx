import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UpcomingSessions } from '@/components/dashboard/UpcomingSessions';
import { PendingTasks } from '@/components/dashboard/PendingTasks';
import { ProgressOverview } from '@/components/dashboard/ProgressOverview';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { StudentHeader } from '@/components/dashboard/StudentHeader';
import { Session, CohortProgress } from '@/types/dashboard';
import { addDays, addHours } from 'date-fns';

// Mock data for sessions - will be replaced with API calls
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
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [cohortProgress, setCohortProgress] = useState<CohortProgress[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 800));
      setSessions(mockSessions);
      setCohortProgress(mockCohortProgress);
      setIsLoading(false);
    };
    loadData();
  }, []);

  const handleViewAllSessions = () => {
    navigate('/dashboard/agenda');
  };

  const handleViewAllTasks = () => {
    navigate('/dashboard/tarefas');
  };

  return (
    <DashboardLayout>
      <StudentHeader />
      
      <div className="space-y-6">
        <div className="pt-4 lg:pt-0">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            Olá, {user?.full_name.split(' ')[0]}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Continue sua jornada para trabalhar nos EUA
          </p>
        </div>

        <QuickActions />

        <div className="grid lg:grid-cols-2 gap-6">
          <UpcomingSessions
            sessions={sessions}
            isLoading={isLoading}
            onViewAll={handleViewAllSessions}
            hasMore={sessions.length > 3}
          />

          <PendingTasks onViewAll={handleViewAllTasks} />
        </div>

        <ProgressOverview cohorts={cohortProgress} isLoading={isLoading} />
      </div>
    </DashboardLayout>
  );
}