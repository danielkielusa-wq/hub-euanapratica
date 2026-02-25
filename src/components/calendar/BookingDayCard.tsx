import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format, differenceInMinutes, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, Video, User } from 'lucide-react';
import { BOOKING_STATUS_CONFIG } from '@/types/booking';
import type { BookingWithDetails } from '@/types/booking';

interface BookingDayCardProps {
  booking: BookingWithDetails;
  perspective: 'mentor' | 'student';
}

export function BookingDayCard({ booking, perspective }: BookingDayCardProps) {
  const startDate = new Date(booking.scheduled_start);
  const endDate = new Date(booking.scheduled_end);
  const now = new Date();
  const minutesUntil = differenceInMinutes(startDate, now);
  const canJoin = minutesUntil <= 15 && minutesUntil >= -120;
  const statusConf = BOOKING_STATUS_CONFIG[booking.status];

  const personName = perspective === 'mentor'
    ? (booking.student?.full_name ?? 'Aluno')
    : (booking.mentor?.full_name ?? 'Mentor');

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-lg font-semibold">
              {booking.service?.name ?? 'Sessão 1:1'}
            </CardTitle>
            <Badge variant="outline" className="font-normal text-blue-600 border-blue-200">
              1:1
            </Badge>
          </div>
          <Badge className={`${statusConf.bgColor} ${statusConf.color} ${statusConf.borderColor} border`}>
            {statusConf.labelPt}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Person */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="h-4 w-4" />
          <span>{personName}</span>
        </div>

        {/* Time */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>
            {format(startDate, "EEEE, d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
            {' — '}
            {format(endDate, 'HH:mm')}
          </span>
          <span className="text-muted-foreground/60">
            ({booking.duration_minutes} min)
          </span>
        </div>

        {/* Notes */}
        {booking.student_notes && (
          <p className="text-sm text-muted-foreground bg-gray-50 rounded px-3 py-2">
            {booking.student_notes}
          </p>
        )}

        {/* Join button */}
        {canJoin && booking.meeting_link && (
          <div className="rounded-lg bg-accent/10 p-3 text-sm border border-accent/20">
            <p className="text-accent font-medium">🟢 A sessão está disponível para acesso!</p>
          </div>
        )}

        {!isPast(startDate) && minutesUntil > 15 && (
          <div className="rounded-lg bg-muted/50 p-3 text-sm">
            <p className="text-muted-foreground">
              O botão para acessar a reunião ficará disponível{' '}
              <span className="font-medium text-foreground">15 minutos antes</span> do início.
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          {canJoin && booking.meeting_link && (
            <Button
              onClick={() => window.open(booking.meeting_link!, '_blank')}
              className="gap-2 bg-accent hover:bg-accent/90"
            >
              <Video className="h-4 w-4" />
              Acessar Reunião
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
