import { useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import { useSession } from '@/hooks/useSessions';
import {
  useSessionAttendance,
  useMarkAttendance,
  calculateAttendanceStats,
  type AttendanceStatus,
} from '@/hooks/useAttendance';
import { AttendanceTable } from '@/components/attendance/AttendanceTable';
import { AttendanceStats } from '@/components/attendance/AttendanceStats';
import { ExportButton } from '@/components/attendance/ExportButton';
import { SessionStatusBadge } from '@/components/sessions/SessionStatusBadge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function SessionAttendance() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: session, isLoading: sessionLoading } = useSession(id || '');
  const { data: attendanceRecords, isLoading: attendanceLoading } = useSessionAttendance(
    id || ''
  );
  const markAttendance = useMarkAttendance();

  const handleMarkAttendance = (userId: string, status: AttendanceStatus) => {
    if (!id) return;
    markAttendance.mutate({ session_id: id, user_id: userId, status });
  };

  const isLoading = sessionLoading || attendanceLoading;
  const stats = attendanceRecords ? calculateAttendanceStats(attendanceRecords) : null;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      </DashboardLayout>
    );
  }

  if (!session) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">Sessão não encontrada</h2>
          <Button onClick={() => navigate('/mentor/agenda')} className="mt-4">
            Voltar para Agenda
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">Presença</h1>
                <SessionStatusBadge status={session.status} />
              </div>
              <p className="text-muted-foreground">{session.title}</p>
            </div>
          </div>
          <ExportButton
            records={attendanceRecords || []}
            sessionTitle={session.title}
          />
        </div>

        {/* Session Info */}
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-wrap gap-6 text-sm">
              <div>
                <span className="text-muted-foreground">Data:</span>{' '}
                <span className="font-medium">
                  {format(new Date(session.datetime), "d 'de' MMMM 'de' yyyy", {
                    locale: ptBR,
                  })}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Horário:</span>{' '}
                <span className="font-medium">
                  {format(new Date(session.datetime), 'HH:mm')}
                </span>
              </div>
              {session.espacos && (
                <div>
                  <span className="text-muted-foreground">Espaço:</span>{' '}
                  <span className="font-medium">{session.espacos.name}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        {stats && <AttendanceStats stats={stats} />}

        {/* Attendance Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Presença</CardTitle>
          </CardHeader>
          <CardContent>
            <AttendanceTable
              records={attendanceRecords || []}
              onMarkAttendance={handleMarkAttendance}
              isLoading={markAttendance.isPending}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
