import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SessionDiscussionButton } from '@/components/sessions/SessionDiscussionButton';
import { useState } from 'react';
import { Video, Clock, Download, Calendar, Copy, Check, Edit3, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { CalendarActions } from '@/components/sessions/CalendarActions';

interface Session {
  id: string;
  title: string;
  datetime: string;
  duration_minutes?: number | null;
  meeting_link?: string | null;
  recording_url?: string | null;
  summary?: string | null;
  summary_visible?: boolean;
  status?: 'scheduled' | 'live' | 'completed' | 'cancelled' | null;
  description?: string | null;
  espaco_id?: string | null;
}

interface SessionTimelineProps {
  sessions: Session[] | undefined;
  isLoading?: boolean;
  isMentor?: boolean;
}

export function SessionTimeline({ sessions, isLoading, isMentor = false }: SessionTimelineProps) {
  const navigate = useNavigate();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedSummary, setExpandedSummary] = useState<string | null>(null);

  const handleCopyLink = (id: string, link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

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
                        <>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-xl px-2"
                                onClick={() => handleCopyLink(session.id, session.meeting_link!)}
                              >
                                {copiedId === session.id
                                  ? <Check className="h-4 w-4 text-emerald-500" />
                                  : <Copy className="h-4 w-4" />
                                }
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Copiar link da sessão</TooltipContent>
                          </Tooltip>
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
                        </>
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
                        espacoId={session.espaco_id ?? undefined}
                      />
                      {!isPast && (
                        <CalendarActions session={session} />
                      )}
                      {isMentor && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-xl gap-1.5"
                              onClick={() => navigate(`/mentor/sessao/${session.id}`)}
                            >
                              <Edit3 className="h-4 w-4" />
                              Editar
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Editar sessão</TooltipContent>
                        </Tooltip>
                      )}
                    </div>

                    {/* Summary Section — visible to students when published */}
                    {isPast && session.summary && session.summary_visible && (
                      <div className="mt-3">
                        <button
                          type="button"
                          className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                          onClick={() => setExpandedSummary(
                            expandedSummary === session.id ? null : session.id
                          )}
                        >
                          <FileText className="h-3.5 w-3.5" />
                          Resumo da Sessão
                          {expandedSummary === session.id ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )}
                        </button>
                        {expandedSummary === session.id && (
                          <div className="mt-2 p-3 rounded-lg bg-muted/50 text-sm text-foreground whitespace-pre-wrap">
                            {session.summary}
                          </div>
                        )}
                      </div>
                    )}
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
