import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { DashboardTopHeader } from '@/components/dashboard/DashboardTopHeader';
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
      <DashboardTopHeader />
      
      <div className="flex-1 p-6 bg-gray-50/50">
        {/* Header Row */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
          <div className="flex items-start gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
              <p className="text-gray-500">Gerencie suas sessões e encontros</p>
            </div>
            <Button 
              onClick={() => navigate('/mentor/sessao/nova')} 
              className="bg-indigo-600 hover:bg-indigo-700 rounded-full gap-2"
            >
              <Plus className="h-4 w-4" />
              Nova Sessão
            </Button>
          </div>
          
          {/* Filters */}
          {isLoading ? (
            <div className="flex gap-3">
              <Skeleton className="h-10 w-[180px]" />
              <Skeleton className="h-10 w-[160px]" />
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
        </div>

        {/* Calendar */}
        {isLoading ? (
          <div className="bg-white rounded-[20px] border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <Skeleton className="h-10 w-[150px]" />
              <Skeleton className="h-6 w-[120px]" />
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }).map((_, i) => (
                <Skeleton key={i} className="h-[100px] lg:h-[120px] rounded-lg" />
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
      </div>
    </DashboardLayout>
  );
}
