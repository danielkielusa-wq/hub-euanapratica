import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, FileText, Clock, Video, ChevronRight, Plus, MessageCircle, ExternalLink } from 'lucide-react';
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
  totalSessions = 12,
  completedSessions = 2,
  studentsCount = 32,
}: OverviewContentProps) {
  const navigate = useNavigate();

  // Get day abbreviation (TER, QUA, QUI, etc.)
  const getDayAbbr = (date: Date) => {
    const days = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
    return days[date.getDay()];
  };

  // Calculate progress
  const progressPercent = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Left Column - Sessions & Assignments */}
      <div className="lg:col-span-2 space-y-6">
        {/* Sessions Section */}
        <Card className="rounded-[20px] border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Na sua agenda</CardTitle>
              <Button variant="ghost" size="sm" onClick={onViewAllSessions} className="text-primary text-sm">
                Ver todas
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {sessionsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-20 rounded-xl" />
                <Skeleton className="h-20 rounded-xl" />
              </div>
            ) : upcomingSessions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Nenhuma sessão agendada
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
                    {/* Day Badge */}
                    <div className="flex flex-col items-center justify-center w-12 h-14 rounded-xl bg-primary/10 text-primary shrink-0">
                      <span className="text-[10px] font-semibold uppercase">{dayAbbr}</span>
                      <span className="text-lg font-bold">{dayNum}</span>
                    </div>

                    {/* Session Info */}
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

                    {/* Action Button */}
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

        {/* Assignments Section */}
        <Card className="rounded-[20px] border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Para entregar</CardTitle>
              <Button variant="ghost" size="sm" onClick={onViewAllAssignments} className="text-primary text-sm">
                Ver todas
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {assignmentsLoading ? (
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-32 rounded-xl" />
                <Skeleton className="h-32 rounded-xl" />
              </div>
            ) : pendingAssignments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm">Nenhuma tarefa pendente 🎉</p>
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
                      onClick={() => navigate(`/dashboard/tarefas/${assignment.id}`)}
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
                        <Button 
                          size="sm" 
                          variant={isOverdue ? "destructive" : "default"}
                          className="w-full rounded-xl"
                        >
                          Entregar
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Column - Progress & Community */}
      <div className="space-y-6">
        {/* Progress Card */}
        <Card className="rounded-[20px] border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Seu Progresso</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center py-4">
            {/* Circular Progress */}
            <div className="relative w-32 h-32 mb-4">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="12"
                  className="text-muted"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="12"
                  strokeDasharray={`${progressPercent * 3.52} 352`}
                  strokeLinecap="round"
                  className="text-primary"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-foreground">{progressPercent}%</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {completedSessions} de {totalSessions} Módulos
            </p>
          </CardContent>
        </Card>

        {/* Telegram Group Card */}
        <Card className="rounded-[20px] border-border/50 bg-gradient-to-br from-[#0088cc]/10 to-[#0088cc]/5">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#0088cc] flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Grupo do Telegram</h4>
                <p className="text-xs text-muted-foreground">Comunidade exclusiva</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Conecte-se com {studentsCount} alunos da turma e tire suas dúvidas em tempo real.
            </p>
            <Button className="w-full bg-[#0088cc] hover:bg-[#0088cc]/90 text-white rounded-xl">
              <ExternalLink className="h-4 w-4 mr-2" />
              Acessar Grupo
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
