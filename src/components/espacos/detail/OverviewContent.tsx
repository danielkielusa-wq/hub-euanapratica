import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, FileText, Clock, Video, ChevronRight, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { SessionDiscussionButton } from '@/components/sessions/SessionDiscussionButton';

interface Session {
  id: string;
  title: string;
  datetime: string;
  meeting_link?: string | null;
  status?: string | null;
}

interface Assignment {
  id: string;
  title: string;
  due_date: string;
  status?: string | null;
  my_submission?: {
    status?: string | null;
  } | null;
}

interface OverviewContentProps {
  upcomingSessions: Session[];
  pendingAssignments: Assignment[];
  sessionsLoading?: boolean;
  assignmentsLoading?: boolean;
  onViewAllSessions: () => void;
  onViewAllAssignments: () => void;
  isMentor?: boolean;
  espacoId?: string;
}

export function OverviewContent({
  upcomingSessions,
  pendingAssignments,
  sessionsLoading,
  assignmentsLoading,
  onViewAllSessions,
  onViewAllAssignments,
  isMentor = false,
  espacoId,
}: OverviewContentProps) {
  const navigate = useNavigate();

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Upcoming Sessions */}
      <Card variant="glass" className="animate-fade-slide-up rounded-[24px]" style={{ animationDelay: '200ms' }}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              Próximas Sessões
            </CardTitle>
            <div className="flex items-center gap-1">
              {isMentor && espacoId && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate(`/mentor/sessao/nova?espaco=${espacoId}`)}
                  className="text-xs gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Nova
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onViewAllSessions} className="text-xs">
                Ver todas
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {sessionsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-16 rounded-xl" />
              <Skeleton className="h-16 rounded-xl" />
            </div>
          ) : upcomingSessions.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              Nenhuma sessão agendada
            </div>
          ) : (
            upcomingSessions.slice(0, 3).map((session, idx) => (
              <div
                key={session.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-xl",
                  "bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm text-foreground truncate">{session.title}</p>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                    <Clock className="h-3 w-3" />
                    {format(new Date(session.datetime), "dd/MM 'às' HH:mm", { locale: ptBR })}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <SessionDiscussionButton
                    sessionId={session.id}
                    sessionTitle={session.title}
                  />
                  {session.meeting_link && (
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-lg h-8 px-3"
                      asChild
                    >
                      <a href={session.meeting_link} target="_blank" rel="noopener noreferrer">
                        <Video className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Pending Assignments */}
      <Card variant="glass" className="animate-fade-slide-up rounded-[24px]" style={{ animationDelay: '250ms' }}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/10">
                <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              {isMentor ? 'Tarefas Ativas' : 'Tarefas Pendentes'}
            </CardTitle>
            <div className="flex items-center gap-1">
              {isMentor && espacoId && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate(`/mentor/tarefas/nova?espaco=${espacoId}`)}
                  className="text-xs gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Nova
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onViewAllAssignments} className="text-xs">
                Ver todas
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {assignmentsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-16 rounded-xl" />
              <Skeleton className="h-16 rounded-xl" />
            </div>
          ) : pendingAssignments.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground text-sm">
                {isMentor ? 'Nenhuma tarefa ativa' : 'Nenhuma tarefa pendente 🎉'}
              </p>
            </div>
          ) : (
            pendingAssignments.slice(0, 3).map((assignment) => {
              const dueDate = new Date(assignment.due_date);
              const isOverdue = dueDate < new Date();
              
              return (
                <div
                  key={assignment.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl",
                    "bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                  )}
                  onClick={() => {
                    if (isMentor) {
                      navigate(`/mentor/tarefas/${assignment.id}/submissoes`);
                    } else {
                      navigate(`/dashboard/tarefas/${assignment.id}`);
                    }
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm text-foreground truncate">{assignment.title}</p>
                    <div className={cn(
                      "flex items-center gap-1.5 text-xs mt-0.5",
                      isOverdue && !isMentor ? "text-destructive" : "text-muted-foreground"
                    )}>
                      <Clock className="h-3 w-3" />
                      {isOverdue && !isMentor ? 'Atrasada - ' : 'Prazo: '}
                      {format(dueDate, "dd/MM 'às' HH:mm", { locale: ptBR })}
                    </div>
                  </div>
                  <Badge 
                    variant={isOverdue && !isMentor ? "destructive" : "secondary"} 
                    className="shrink-0 ml-2"
                  >
                    {isMentor ? 'Ativa' : (isOverdue ? 'Atrasada' : 'Pendente')}
                  </Badge>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}