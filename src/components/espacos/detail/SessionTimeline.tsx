import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SessionDiscussionButton } from '@/components/sessions/SessionDiscussionButton';
import { Video, Clock, Download, Calendar } from 'lucide-react';
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
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-[20px] bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          <Calendar className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground">Nenhuma sessão cadastrada neste espaço</p>
      </div>
    );
  }

  // Sort sessions by date
  const sortedSessions = [...sessions].sort((a, b) => 
    new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
  );

  const now = new Date();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Cronograma Completo</h2>
        <Button variant="outline" size="sm" className="rounded-xl gap-2">
          <Download className="h-4 w-4" />
          Baixar PDF
        </Button>
      </div>

      {/* Sessions List */}
      <div className="space-y-4">
        {sortedSessions.map((session, index) => {
          const sessionDate = new Date(session.datetime);
          const isPast = sessionDate < now || session.status === 'completed';
          const isLive = session.status === 'live';

          return (
            <Card 
              key={session.id}
              className={cn(
                "rounded-[20px] border-border/50 overflow-hidden transition-all hover:shadow-md",
                isLive && "ring-2 ring-primary/30"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Video Icon */}
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                    isPast ? "bg-muted" : isLive ? "bg-primary" : "bg-primary/10"
                  )}>
                    <Video className={cn(
                      "h-5 w-5",
                      isPast ? "text-muted-foreground" : isLive ? "text-primary-foreground" : "text-primary"
                    )} />
                  </div>

                  {/* Session Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{session.title}</h3>
                      {isLive && (
                        <Badge className="bg-primary text-primary-foreground shrink-0">
                          Ao Vivo
                        </Badge>
                      )}
                      {isPast && !isLive && (
                        <Badge variant="secondary" className="shrink-0">
                          Concluída
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{format(sessionDate, "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}</span>
                    </div>

                    {session.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {session.description}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {session.meeting_link && !isPast && (
                        <Button
                          size="sm"
                          className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
                          asChild
                        >
                          <a href={session.meeting_link} target="_blank" rel="noopener noreferrer">
                            <Video className="h-4 w-4 mr-1.5" />
                            Participar da Sessão
                          </a>
                        </Button>
                      )}
                      {session.recording_url && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-xl"
                          asChild
                        >
                          <a href={session.recording_url} target="_blank" rel="noopener noreferrer">
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
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
