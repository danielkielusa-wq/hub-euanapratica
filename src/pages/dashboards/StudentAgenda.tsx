import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { MonthCalendar } from '@/components/calendar/MonthCalendar';
import { SessionFilters } from '@/components/sessions/SessionFilters';
import { Skeleton } from '@/components/ui/skeleton';
import { useSessions, type Session } from '@/hooks/useSessions';
import { useEspacos } from '@/hooks/useEspacos';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

export default function StudentAgenda() {
  const navigate = useNavigate();
  const { data: sessions, isLoading: sessionsLoading } = useSessions();
  const { data: espacos, isLoading: espacosLoading } = useEspacos();
  
  const [selectedEspacoId, setSelectedEspacoId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const filteredSessions = useMemo(() => {
    if (!sessions) return [];
    
    return sessions.filter((session) => {
      if (selectedEspacoId && session.espaco_id !== selectedEspacoId) {
        return false;
      }
      if (selectedStatus && session.status !== selectedStatus) {
        return false;
      }
      return true;
    });
  }, [sessions, selectedEspacoId, selectedStatus]);

  const handleJoinMeeting = (session: Session) => {
    if (session.meeting_link) {
      window.open(session.meeting_link, '_blank');
    } else {
      toast({
        title: 'Link não disponível',
        description: 'O link da reunião ainda não foi configurado.',
        variant: 'destructive',
      });
    }
  };

  const handleViewMaterials = (session: Session) => {
    toast({
      title: 'Materiais',
      description: `Materiais da sessão "${session.title}" serão exibidos aqui.`,
    });
  };

  const handleViewRecording = (session: Session) => {
    if (session.recording_url) {
      window.open(session.recording_url, '_blank');
    } else {
      toast({
        title: 'Gravação não disponível',
        description: 'A gravação desta sessão ainda não foi disponibilizada.',
        variant: 'destructive',
      });
    }
  };

  const isLoading = sessionsLoading || espacosLoading;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            Agenda
          </h1>
          <p className="text-muted-foreground mt-1">
            Visualize e acompanhe suas sessões
          </p>
        </div>

        {/* Filters */}
        {isLoading ? (
          <div className="flex gap-3">
            <Skeleton className="h-10 w-[200px]" />
            <Skeleton className="h-10 w-[180px]" />
          </div>
        ) : (
          <SessionFilters
            espacos={espacos || []}
            selectedEspacoId={selectedEspacoId}
            selectedStatus={selectedStatus}
            onEspacoChange={setSelectedEspacoId}
            onStatusChange={setSelectedStatus}
          />
        )}

        {/* Calendar */}
        {isLoading ? (
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-10 w-[150px]" />
              <Skeleton className="h-6 w-[120px]" />
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }).map((_, i) => (
                <Skeleton key={i} className="h-20 lg:h-24" />
              ))}
            </div>
          </div>
        ) : (
          <MonthCalendar
            sessions={filteredSessions}
            onJoinMeeting={handleJoinMeeting}
            onViewMaterials={handleViewMaterials}
            onViewRecording={handleViewRecording}
          />
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-primary" />
            Agendada
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
            Ao Vivo
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-muted-foreground" />
            Concluída
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-destructive" />
            Cancelada
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
