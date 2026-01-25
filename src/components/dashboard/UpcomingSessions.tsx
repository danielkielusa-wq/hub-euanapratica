import { Session } from '@/types/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Clock, Video, ChevronRight } from 'lucide-react';
import { format, differenceInHours, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface UpcomingSessionsProps {
  sessions: Session[];
  isLoading?: boolean;
  onViewAll?: () => void;
  hasMore?: boolean;
}

function getCountdownBadge(date: Date): { text: string; variant: 'pastelRose' | 'pastelAmber' | 'pastelSlate' } {
  const now = new Date();
  const hoursUntil = differenceInHours(date, now);
  const minutesUntil = differenceInMinutes(date, now);

  if (minutesUntil <= 30) {
    return { text: `Em ${minutesUntil}min`, variant: 'pastelRose' };
  } else if (hoursUntil <= 2) {
    return { text: `Em ${hoursUntil}h ${minutesUntil % 60}min`, variant: 'pastelRose' };
  } else if (hoursUntil <= 24) {
    return { text: `Em ${hoursUntil}h`, variant: 'pastelAmber' };
  } else {
    const days = Math.floor(hoursUntil / 24);
    return { text: `Em ${days} dia${days > 1 ? 's' : ''}`, variant: 'pastelSlate' };
  }
}

function getStatusBadge(status: Session['status']) {
  switch (status) {
    case 'in_progress':
      return { text: 'Em Andamento', variant: 'pastelEmerald' as const };
    case 'scheduled':
      return { text: 'Agendada', variant: 'pastelPurple' as const };
    case 'completed':
      return { text: 'Concluída', variant: 'pastelSlate' as const };
    case 'cancelled':
      return { text: 'Cancelada', variant: 'pastelRose' as const };
    default:
      return { text: status, variant: 'pastelSlate' as const };
  }
}

function SessionCard({ session }: { session: Session }) {
  const countdown = getCountdownBadge(session.date);
  const statusBadge = getStatusBadge(session.status);

  return (
    <div className="p-5 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur border border-slate-200/60 dark:border-slate-700/60 hover:shadow-lg transition-all duration-200">
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-slate-900 dark:text-slate-100 truncate">{session.title}</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400">{session.cohortName}</p>
          </div>
          <Badge variant={countdown.variant} className="shrink-0">
            {countdown.text}
          </Badge>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-slate-400 dark:text-slate-500">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>{format(session.date, "dd/MM/yyyy", { locale: ptBR })}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>{format(session.date, "HH:mm", { locale: ptBR })}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-1">
          <Badge variant={statusBadge.variant}>{statusBadge.text}</Badge>
          <Button variant="gradient" size="sm" className="gap-1.5">
            <Video className="w-4 h-4" />
            Acessar Encontro
          </Button>
        </div>
      </div>
    </div>
  );
}

function SessionSkeleton() {
  return (
    <div className="p-5 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur border border-slate-200/60 dark:border-slate-700/60">
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function UpcomingSessions({ sessions, isLoading, onViewAll, hasMore }: UpcomingSessionsProps) {
  return (
    <Card variant="glass">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40">
              <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            Próximas Sessões
          </CardTitle>
          {hasMore && onViewAll && (
            <Button variant="ghost" size="sm" onClick={onViewAll} className="gap-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700">
              Ver todas
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <>
            <SessionSkeleton />
            <SessionSkeleton />
            <SessionSkeleton />
          </>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhuma sessão agendada para os próximos 7 dias</p>
          </div>
        ) : (
          sessions.slice(0, 3).map((session) => (
            <SessionCard key={session.id} session={session} />
          ))
        )}
      </CardContent>
    </Card>
  );
}
