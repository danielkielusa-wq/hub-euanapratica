import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { MonthCalendar } from '@/components/calendar/MonthCalendar';
import { SessionFilters } from '@/components/sessions/SessionFilters';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useSessions, type Session } from '@/hooks/useSessions';
import { useEspacos } from '@/hooks/useEspacos';
import { Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function MentorAgenda() {
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
        description: 'Configure o link da reunião nas configurações da sessão.',
        variant: 'destructive',
      });
    }
  };

  const handleViewMaterials = (session: Session) => {
    navigate(`/mentor/sessao/${session.id}`);
  };

  const handleViewRecording = (session: Session) => {
    if (session.recording_url) {
      window.open(session.recording_url, '_blank');
    } else {
      navigate(`/mentor/sessao/${session.id}`);
    }
  };

  const isLoading = sessionsLoading || espacosLoading;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              Agenda
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie suas sessões e encontros
            </p>
          </div>
          <Button onClick={() => navigate('/mentor/sessao/nova')} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Sessão
          </Button>
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
