import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';

import { MonthCalendar } from '@/components/calendar/MonthCalendar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  CalendarDays,
  List,
  Loader2,
  CheckCircle2,
  Clock,
  User,
  Video,
  ExternalLink,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAllMentorCalendarEvents } from '@/hooks/useSessions';
import { useUpcomingMentorBookings, usePastMentorBookings } from '@/hooks/useMentorBookings';
import { useCompleteBooking } from '@/hooks/useCancelBooking';
import { BOOKING_STATUS_CONFIG, type BookingWithDetails } from '@/types/booking';
import { formatInTz } from '@/lib/timezone';
import { useUserTimezone } from '@/hooks/useUserTimezone';
import type { CalendarEvent } from '@/types/calendar';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos os status' },
  { value: 'scheduled', label: 'Agendado' },
  { value: 'live', label: 'Ao Vivo' },
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'completed', label: 'Concluido' },
  { value: 'cancelled', label: 'Cancelado' },
];

const TYPE_OPTIONS = [
  { value: 'all', label: 'Todos os tipos' },
  { value: 'session', label: 'Sessoes em Grupo' },
  { value: 'booking', label: 'Bookings 1:1' },
];

export default function MentorAgenda() {
  const navigate = useNavigate();
  const tz = useUserTimezone();

  // Calendar data
  const { data: events, isLoading: eventsLoading } = useAllMentorCalendarEvents();
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Bookings list data
  const { data: upcoming, isLoading: loadingUpcoming } = useUpcomingMentorBookings();
  const { data: past, isLoading: loadingPast } = usePastMentorBookings();
  const [completeBooking, setCompleteBooking] = useState<BookingWithDetails | null>(null);
  const [completeNotes, setCompleteNotes] = useState('');
  const completeMutation = useCompleteBooking();

  const filteredEvents = useMemo(() => {
    if (!events) return [];
    return events.filter((event) => {
      if (selectedType !== 'all' && event.kind !== selectedType) return false;
      if (selectedStatus !== 'all') {
        const status = event.data.status;
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
        title: 'Link nao disponivel',
        description: 'Configure o link da reuniao nas configuracoes.',
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
        description: 'Materiais nao disponiveis para bookings 1:1.',
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
        title: 'Gravacao nao disponivel',
        description: 'Gravacoes nao estao disponiveis para bookings 1:1.',
        variant: 'destructive',
      });
    }
  };

  const upcomingCount = upcoming?.length ?? 0;
  const completedCount = past?.filter(b => b.status === 'completed').length ?? 0;
  const noShowCount = past?.filter(b => b.status === 'no_show').length ?? 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-foreground">Agenda</h1>
            <p className="text-gray-500 dark:text-muted-foreground text-sm">Todas as suas sessoes e encontros</p>
          </div>
          <Button
            onClick={() => navigate('/mentor/sessao/nova')}
            className="bg-indigo-600 hover:bg-indigo-700 rounded-full gap-2"
          >
            <Plus className="h-4 w-4" />
            Novo Evento
          </Button>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="calendario">
          <TabsList>
            <TabsTrigger value="calendario" className="gap-1.5">
              <CalendarDays className="h-4 w-4" />
              Calendario
            </TabsTrigger>
            <TabsTrigger value="agendamentos" className="gap-1.5">
              <List className="h-4 w-4" />
              Agendamentos
              {upcomingCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{upcomingCount}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Calendar Tab */}
          <TabsContent value="calendario" className="mt-4 space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-gradient-to-r from-indigo-500 to-purple-500 inline-block" />
                  Sessao em Grupo
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-gradient-to-r from-blue-500 to-cyan-500 inline-block" />
                  Booking 1:1
                </div>
              </div>
              {!eventsLoading && (
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

            {/* Calendar */}
            {eventsLoading ? (
              <div className="bg-white dark:bg-card rounded-[20px] border border-gray-100 dark:border-white/10 shadow-sm p-6">
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
          </TabsContent>

          {/* Bookings List Tab */}
          <TabsContent value="agendamentos" className="mt-4 space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold text-primary">{upcomingCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">Proximas</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold text-green-600">{completedCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">Concluidas</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold text-red-500">{noShowCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">No-shows</p>
                </CardContent>
              </Card>
            </div>

            {/* Bookings Sub-tabs */}
            <Tabs defaultValue="upcoming">
              <TabsList>
                <TabsTrigger value="upcoming">Proximos ({upcomingCount})</TabsTrigger>
                <TabsTrigger value="past">Anteriores</TabsTrigger>
              </TabsList>

              <TabsContent value="upcoming" className="mt-4 space-y-3">
                {loadingUpcoming ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : !upcoming?.length ? (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      Nenhum agendamento proximo
                    </CardContent>
                  </Card>
                ) : (
                  upcoming.map(booking => (
                    <BookingCardMentor
                      key={booking.id}
                      booking={booking}
                      onComplete={() => { setCompleteBooking(booking); setCompleteNotes(''); }}
                    />
                  ))
                )}
              </TabsContent>

              <TabsContent value="past" className="mt-4 space-y-3">
                {loadingPast ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : !past?.length ? (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      Nenhum agendamento anterior
                    </CardContent>
                  </Card>
                ) : (
                  past.map(booking => (
                    <BookingCardMentor key={booking.id} booking={booking} />
                  ))
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>

        {/* Complete Dialog */}
        <Dialog open={!!completeBooking} onOpenChange={(open) => !open && setCompleteBooking(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Concluir Sessao</DialogTitle>
              <DialogDescription>
                Marcar a sessao com {completeBooking?.student?.full_name} como concluida.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Notas da sessao (opcional)</Label>
                <Textarea
                  value={completeNotes}
                  onChange={e => setCompleteNotes(e.target.value)}
                  placeholder="Observacoes sobre a sessao, proximos passos..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCompleteBooking(null)}>Cancelar</Button>
              <Button
                onClick={() => {
                  if (!completeBooking) return;
                  completeMutation.mutate(
                    { booking_id: completeBooking.id, mentor_notes: completeNotes || undefined },
                    {
                      onSuccess: () => setCompleteBooking(null),
                    }
                  );
                }}
                disabled={completeMutation.isPending}
              >
                {completeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar Conclusao
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

// ============================================
// BOOKING CARD (mentor view)
// ============================================

function BookingCardMentor({
  booking,
  onComplete,
}: {
  booking: BookingWithDetails;
  onComplete?: () => void;
}) {
  const tz = useUserTimezone();
  const statusConf = BOOKING_STATUS_CONFIG[booking.status];

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex">
          {/* Date box */}
          <div className="flex flex-col items-center justify-center w-20 bg-primary/5 p-3 text-center flex-shrink-0">
            <span className="text-xs font-medium text-primary uppercase">
              {formatInTz(booking.scheduled_start, tz, 'EEE')}
            </span>
            <span className="text-2xl font-bold text-primary">
              {formatInTz(booking.scheduled_start, tz, 'd')}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatInTz(booking.scheduled_start, tz, 'MMM')}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-foreground">
                  {booking.service?.name || 'Sessao'}
                </h3>
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <User className="h-3.5 w-3.5" />
                  <span>{booking.student?.full_name || 'Aluno'}</span>
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {formatInTz(booking.scheduled_start, tz, 'HH:mm')}
                    {' — '}
                    {formatInTz(booking.scheduled_end, tz, 'HH:mm')}
                  </span>
                  <span>{booking.duration_minutes}min</span>
                </div>
                {booking.student_notes && (
                  <p className="mt-2 text-xs text-muted-foreground bg-gray-50 dark:bg-white/5 rounded px-2 py-1">
                    Nota do aluno: {booking.student_notes}
                  </p>
                )}
              </div>

              <div className="flex flex-col items-end gap-2">
                <Badge className={`${statusConf.bgColor} ${statusConf.color} ${statusConf.borderColor} border`}>
                  {statusConf.labelPt}
                </Badge>

                {booking.meeting_link && booking.status === 'confirmed' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(booking.meeting_link!, '_blank')}
                    className="gap-1"
                  >
                    <Video className="h-3.5 w-3.5" />
                    Entrar
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                )}

                {booking.status === 'confirmed' && onComplete && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onComplete}
                    className="gap-1 text-green-600 border-green-200 hover:bg-green-50"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Concluir
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
