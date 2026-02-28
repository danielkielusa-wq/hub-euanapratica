import { useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { DashboardTopHeader } from '@/components/dashboard/DashboardTopHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  CalendarCheck,
  Loader2,
  CheckCircle2,
  Clock,
  User,
  Video,
  ExternalLink,
} from 'lucide-react';
import { useUpcomingMentorBookings, usePastMentorBookings } from '@/hooks/useMentorBookings';
import { useCompleteBooking } from '@/hooks/useCancelBooking';
import { BOOKING_STATUS_CONFIG, type BookingWithDetails } from '@/types/booking';
import { formatInTz } from '@/lib/timezone';
import { useUserTimezone } from '@/hooks/useUserTimezone';

export default function MentorAgendamentos() {
  const { data: upcoming, isLoading: loadingUpcoming } = useUpcomingMentorBookings();
  const { data: past, isLoading: loadingPast } = usePastMentorBookings();

  const [completeBooking, setCompleteBooking] = useState<BookingWithDetails | null>(null);
  const [completeNotes, setCompleteNotes] = useState('');
  const completeMutation = useCompleteBooking();

  const tz = useUserTimezone();
  const isLoading = loadingUpcoming || loadingPast;

  const formatDate = (iso: string) => formatInTz(iso, tz, 'EEE, dd MMM');
  const formatTime = (iso: string) => formatInTz(iso, tz, 'HH:mm');

  const upcomingCount = upcoming?.length ?? 0;
  const completedCount = past?.filter(b => b.status === 'completed').length ?? 0;
  const noShowCount = past?.filter(b => b.status === 'no_show').length ?? 0;

  return (
    <DashboardLayout>
      <DashboardTopHeader />
      <div className="flex-1 p-6 bg-gray-50/50 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <CalendarCheck className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Meus Agendamentos</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie suas sessões com alunos
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-primary">{upcomingCount}</p>
              <p className="text-xs text-muted-foreground mt-1">Próximas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-green-600">{completedCount}</p>
              <p className="text-xs text-muted-foreground mt-1">Concluídas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-red-500">{noShowCount}</p>
              <p className="text-xs text-muted-foreground mt-1">No-shows</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="upcoming">
          <TabsList>
            <TabsTrigger value="upcoming">Próximos ({upcomingCount})</TabsTrigger>
            <TabsTrigger value="past">Anteriores</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-4 space-y-3">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : !upcoming?.length ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Nenhum agendamento próximo
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

        {/* Complete Dialog */}
        <Dialog open={!!completeBooking} onOpenChange={(open) => !open && setCompleteBooking(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Concluir Sessão</DialogTitle>
              <DialogDescription>
                Marcar a sessão com {completeBooking?.student?.full_name} como concluída.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Notas da sessão (opcional)</Label>
                <Textarea
                  value={completeNotes}
                  onChange={e => setCompleteNotes(e.target.value)}
                  placeholder="Observações sobre a sessão, próximos passos..."
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
                Confirmar Conclusão
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
                <h3 className="font-semibold text-gray-900">
                  {booking.service?.name || 'Sessão'}
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
                  <p className="mt-2 text-xs text-muted-foreground bg-gray-50 rounded px-2 py-1">
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
