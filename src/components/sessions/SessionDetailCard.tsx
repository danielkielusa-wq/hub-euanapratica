import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SessionStatusBadge } from './SessionStatusBadge';
import { CalendarActions } from './CalendarActions';
import { format, differenceInMinutes, isPast, isFuture } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, Video, FileText, Play, Users } from 'lucide-react';
import type { Session } from '@/hooks/useSessions';

interface SessionDetailCardProps {
  session: Session;
  onJoinMeeting?: () => void;
  onViewMaterials?: () => void;
  onViewRecording?: () => void;
  showAttendance?: boolean;
}

export function SessionDetailCard({
  session,
  onJoinMeeting,
  onViewMaterials,
  onViewRecording,
  showAttendance = false,
}: SessionDetailCardProps) {
  const sessionDate = new Date(session.datetime);
  const now = new Date();
  const minutesUntilSession = differenceInMinutes(sessionDate, now);
  const canJoinMeeting = minutesUntilSession <= 15 && minutesUntilSession >= -120;
  const isUpcoming = isFuture(sessionDate) && minutesUntilSession > 15;
  const hasEnded = isPast(sessionDate) && minutesUntilSession < -120;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-lg font-semibold">{session.title}</CardTitle>
            {session.espacos && (
              <Badge variant="outline" className="font-normal">
                {session.espacos.name}
              </Badge>
            )}
          </div>
          <SessionStatusBadge status={session.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Date and Time */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>
            {format(sessionDate, "EEEE, d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
          </span>
          <span className="text-muted-foreground/60">
            ({session.duration_minutes || 60} min)
          </span>
        </div>

        {/* Description */}
        {session.description && (
          <p className="text-sm text-muted-foreground">{session.description}</p>
        )}

        {/* Countdown or Status Message */}
        {isUpcoming && (
          <div className="rounded-lg bg-muted/50 p-3 text-sm">
            <p className="text-muted-foreground">
              O botão para acessar a reunião ficará disponível{' '}
              <span className="font-medium text-foreground">15 minutos antes</span> do início.
            </p>
          </div>
        )}

        {canJoinMeeting && session.meeting_link && (
          <div className="rounded-lg bg-accent/10 p-3 text-sm border border-accent/20">
            <p className="text-accent font-medium">
              🟢 A sessão está disponível para acesso!
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-2">
          {canJoinMeeting && session.meeting_link && (
            <Button 
              onClick={onJoinMeeting}
              className="gap-2 bg-accent hover:bg-accent/90"
            >
              <Video className="h-4 w-4" />
              Acessar Encontro
            </Button>
          )}

          {hasEnded && session.recording_url && (
            <Button variant="outline" onClick={onViewRecording} className="gap-2">
              <Play className="h-4 w-4" />
              Ver Gravação
            </Button>
          )}

          <Button variant="outline" onClick={onViewMaterials} className="gap-2">
            <FileText className="h-4 w-4" />
            Materiais
          </Button>

          {showAttendance && (
            <Button variant="outline" className="gap-2">
              <Users className="h-4 w-4" />
              Presença
            </Button>
          )}

          <CalendarActions session={session} />
        </div>
      </CardContent>
    </Card>
  );
}
