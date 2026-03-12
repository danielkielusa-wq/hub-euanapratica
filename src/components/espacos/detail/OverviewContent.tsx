import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

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
  totalSessions?: number;
  completedSessions?: number;
  studentsCount?: number;
  /** Mentor-only: render a single card type for paired-row layout */
  variant?: 'sessions-only' | 'assignments-only';
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
  totalSessions = 0,
  completedSessions = 0,
  studentsCount = 0,
  variant,
}: OverviewContentProps) {
  const navigate = useNavigate();

  const getDayAbbr = (date: Date) => {
    const days = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
    return days[date.getDay()];
  };

  const progressPercent = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

  const sessionsCard = (
    <Card className="rounded-[20px] border-border/50 w-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Na sua agenda</CardTitle>
          <Button variant="ghost" size="sm" onClick={onViewAllSessions} className="text-primary text-sm">
            Ver todas
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 flex-1">
        {sessionsLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
        ) : upcomingSessions.length === 0 ? (
          <div className="flex items-center justify-center h-full min-h-[120px] text-muted-foreground text-sm">
            Nenhuma sessao agendada
          </div>
        ) : (
          upcomingSessions.slice(0, 3).map((session) => {
            const sessionDate = new Date(session.datetime);
            const dayAbbr = getDayAbbr(sessionDate);
            const dayNum = format(sessionDate, 'dd');
            const time = format(sessionDate, 'HH:mm');
            const isLive = session.status === 'live';

            return (
              <div
                key={session.id}
                className="flex items-center gap-4 p-4 rounded-[16px] bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex flex-col items-center justify-center w-12 h-14 rounded-xl bg-primary/10 text-primary shrink-0">
                  <span className="text-[10px] font-semibold uppercase">{dayAbbr}</span>
                  <span className="text-lg font-bold">{dayNum}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {isLive && (
                      <span className="px-2 py-0.5 text-[10px] font-semibold text-primary-foreground bg-primary rounded-full">
                        AO VIVO
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">{time}</span>
                  </div>
                  <p className="font-medium text-foreground truncate">{session.title}</p>
                </div>
                {session.meeting_link && (
                  <Button
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shrink-0"
                    asChild
                  >
                    <a href={session.meeting_link} target="_blank" rel="noopener noreferrer">
                      Participar
                    </a>
                  </Button>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );

  const assignmentsCard = (
    <Card className="rounded-[20px] border-border/50 w-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">
            {isMentor ? 'Tarefas publicadas' : 'Para entregar'}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onViewAllAssignments} className="text-primary text-sm">
            Ver todas
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        {assignmentsLoading ? (
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        ) : pendingAssignments.length === 0 ? (
          <div className="flex items-center justify-center h-full min-h-[120px]">
            <p className="text-muted-foreground text-sm">
              {isMentor ? 'Nenhuma tarefa publicada' : 'Nenhuma tarefa pendente'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {pendingAssignments.slice(0, 4).map((assignment) => {
              const dueDate = new Date(assignment.due_date);
              const isOverdue = dueDate < new Date();

              return (
                <Card
                  key={assignment.id}
                  className={cn(
                    "p-4 rounded-[16px] cursor-pointer transition-all hover:shadow-md",
                    isOverdue ? "border-destructive/50" : "border-border/50"
                  )}
                  onClick={() => navigate(
                    isMentor
                      ? `/mentor/tarefas/${assignment.id}`
                      : `/dashboard/tarefas/${assignment.id}`
                  )}
                >
                  <div className="flex flex-col h-full">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <h4 className="font-medium text-foreground text-sm line-clamp-2 mb-2 flex-1">
                      {assignment.title}
                    </h4>
                    <p className={cn(
                      "text-xs mb-3",
                      isOverdue ? "text-destructive" : "text-muted-foreground"
                    )}>
                      Vence: {format(dueDate, "dd/MM", { locale: ptBR })}
                    </p>
                    {!isMentor && (
                      <Button
                        size="sm"
                        variant={isOverdue ? "destructive" : "default"}
                        className="w-full rounded-xl"
                      >
                        Entregar
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Variant: render a single card for paired-row layout (mentor or student)
  if (variant === 'sessions-only') {
    return sessionsCard;
  }
  if (variant === 'assignments-only') {
    return assignmentsCard;
  }

  // Default fallback (both cards stacked)
  return (
    <div className="space-y-6">
      {sessionsCard}
      {assignmentsCard}
    </div>
  );
}
