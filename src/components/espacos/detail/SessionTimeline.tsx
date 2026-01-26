import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SessionStatusBadge } from '@/components/sessions/SessionStatusBadge';
import { SessionDiscussionButton } from '@/components/sessions/SessionDiscussionButton';
import { Video, Clock, PlayCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Session {
  id: string;
  title: string;
  datetime: string;
  meeting_link?: string | null;
  recording_url?: string | null;
  status?: 'scheduled' | 'live' | 'completed' | 'cancelled' | null;
  description?: string | null;
}

interface SessionTimelineProps {
  sessions: Session[] | undefined;
  isLoading?: boolean;
}

export function SessionTimeline({ sessions, isLoading }: SessionTimelineProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4">
            <div className="w-4 flex flex-col items-center">
              <div className="w-4 h-4 rounded-full bg-muted" />
              <div className="flex-1 w-0.5 bg-muted mt-2" />
            </div>
            <div className="flex-1 h-28 rounded-2xl bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          <Clock className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground">Nenhuma sessão cadastrada neste espaço</p>
      </div>
    );
  }

  // Sort sessions by date, upcoming first
  const sortedSessions = [...sessions].sort((a, b) => 
    new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
  );

  const now = new Date();

  return (
    <div className="space-y-0">
      {sortedSessions.map((session, index) => {
        const sessionDate = new Date(session.datetime);
        const isPast = sessionDate < now || session.status === 'completed';
        const isLive = session.status === 'live';
        const isLast = index === sortedSessions.length - 1;

        return (
          <div key={session.id} className="flex gap-4 animate-fade-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
            {/* Timeline */}
            <div className="flex flex-col items-center w-4 shrink-0">
              {/* Node */}
              <div
                className={cn(
                  "w-4 h-4 rounded-full border-2 shrink-0 transition-all",
                  isPast || isLive
                    ? "bg-gradient-to-br from-primary to-secondary border-primary shadow-md"
                    : "bg-background border-border"
                )}
              />
              {/* Line */}
              {!isLast && (
                <div
                  className={cn(
                    "flex-1 w-0.5 min-h-[20px] mt-1",
                    isPast
                      ? "bg-gradient-to-b from-primary to-secondary"
                      : "border-l-2 border-dashed border-border"
                  )}
                />
              )}
            </div>

            {/* Session Card */}
            <div
              className={cn(
                "flex-1 mb-4 p-4 rounded-2xl cursor-pointer transition-all duration-200",
                "bg-card/70 dark:bg-card/50 backdrop-blur-sm",
                "border border-border/40",
                "hover:shadow-lg hover:border-primary/20",
                isLive && "ring-2 ring-primary/30"
              )}
              onClick={() => {/* Could navigate to session detail */}}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="font-semibold text-foreground line-clamp-1">{session.title}</h3>
                <SessionStatusBadge status={session.status} className="shrink-0" />
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                <Clock className="h-3.5 w-3.5" />
                <span>{format(sessionDate, "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}</span>
              </div>

              {session.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{session.description}</p>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                {session.meeting_link && !isPast && (
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-xl min-h-[40px]"
                    asChild
                  >
                    <a href={session.meeting_link} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                      <Video className="h-4 w-4 mr-1.5" />
                      Acessar Encontro
                    </a>
                  </Button>
                )}
                {session.recording_url && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl min-h-[40px]"
                    asChild
                  >
                    <a href={session.recording_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                      <PlayCircle className="h-4 w-4 mr-1.5" />
                      Assistir Gravação
                    </a>
                  </Button>
                )}
                <SessionDiscussionButton 
                  sessionId={session.id}
                  sessionTitle={session.title}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
