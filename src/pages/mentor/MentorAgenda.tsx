import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';

import { MonthCalendar } from '@/components/calendar/MonthCalendar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAllMentorCalendarEvents } from '@/hooks/useSessions';
import { Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { CalendarEvent } from '@/types/calendar';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos os status' },
  { value: 'scheduled', label: 'Agendado' },
  { value: 'live', label: 'Ao Vivo' },
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'completed', label: 'Concluído' },
  { value: 'cancelled', label: 'Cancelado' },
];

const TYPE_OPTIONS = [
  { value: 'all', label: 'Todos os tipos' },
  { value: 'session', label: 'Sessões em Grupo' },
  { value: 'booking', label: 'Bookings 1:1' },
];

export default function MentorAgenda() {
  const navigate = useNavigate();
  const { data: events, isLoading } = useAllMentorCalendarEvents();

  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const filteredEvents = useMemo(() => {
    if (!events) return [];

    return events.filter((event) => {
      if (selectedType !== 'all' && event.kind !== selectedType) return false;
      if (selectedStatus !== 'all') {
        const status = event.kind === 'session' ? event.data.status : event.data.status;
        if (status !== selectedStatus) return false;
      }
      return true;
    });
  }, [events, selectedType, selectedStatus]);

  const handleJoinMeeting = (event: CalendarEvent) => {
    const link = event.data.meeting_link;
    if (link) {
      window.open(link, '_blank');
    } else {
      toast({
        title: 'Link não disponível',
        description: 'Configure o link da reunião nas configurações.',
        variant: 'destructive',
      });
    }
  };

  const handleViewMaterials = (event: CalendarEvent) => {
    if (event.kind === 'session') {
      navigate(`/mentor/sessao/${event.data.id}`);
    } else {
      toast({
        title: 'Materiais',
        description: 'Materiais não disponíveis para bookings 1:1.',
      });
    }
  };

  const handleViewRecording = (event: CalendarEvent) => {
    if (event.kind === 'session' && event.data.recording_url) {
      window.open(event.data.recording_url, '_blank');
    } else if (event.kind === 'session') {
      navigate(`/mentor/sessao/${event.data.id}`);
    } else {
      toast({
        title: 'Gravação não disponível',
        description: 'Gravações não estão disponíveis para bookings 1:1.',
        variant: 'destructive',
      });
    }
  };

  return (
    <DashboardLayout>
      <div>
        {/* Header Row */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
          <div className="flex items-start gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
              <p className="text-gray-500">Todas as suas sessões e encontros</p>
            </div>
            <Button
              onClick={() => navigate('/mentor/sessao/nova')}
              className="bg-indigo-600 hover:bg-indigo-700 rounded-full gap-2"
            >
              <Plus className="h-4 w-4" />
              Novo Evento
            </Button>
          </div>

          {/* Filters */}
          {isLoading ? (
            <div className="flex gap-3">
              <Skeleton className="h-10 w-[180px]" />
              <Skeleton className="h-10 w-[160px]" />
            </div>
          ) : (
            <div className="flex gap-3 flex-wrap">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Legend */}
        {!isLoading && (
          <div className="flex items-center gap-4 mb-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-gradient-to-r from-indigo-500 to-purple-500 inline-block" />
              Sessão em Grupo
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-gradient-to-r from-blue-500 to-cyan-500 inline-block" />
              Booking 1:1
            </div>
          </div>
        )}

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
            events={filteredEvents}
            perspective="mentor"
            onJoinMeeting={handleJoinMeeting}
            onViewMaterials={handleViewMaterials}
            onViewRecording={handleViewRecording}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
