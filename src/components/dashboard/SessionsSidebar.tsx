import { Clock, Video, MoreVertical } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useStudentUpcomingSessions } from '@/hooks/useStudentSessions';
import { Skeleton } from '@/components/ui/skeleton';
import { format, differenceInMinutes } from 'date-fns';
import type { Session } from '@/types/dashboard';

function LiveSessionCard({ session }: { session: Session }) {
  const sessionDate = session.date;
  const minutesUntil = differenceInMinutes(sessionDate, new Date());
  const endTime = new Date(sessionDate.getTime() + 90 * 60000); // Assume 90 min

  return (
    <div className="p-4 rounded-[16px] bg-gradient-to-br from-primary to-purple-600 text-primary-foreground mb-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        <span className="text-xs font-medium">
          {minutesUntil <= 0 ? 'AO VIVO' : `AO VIVO • EM ${minutesUntil} MIN`}
        </span>
      </div>
      <h3 className="font-semibold">{session.title}</h3>
      <div className="flex items-center justify-between mt-2 text-sm opacity-90">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {format(sessionDate, 'HH:mm')} - {format(endTime, 'HH:mm')}
        </span>
        <Video className="h-5 w-5" />
      </div>
    </div>
  );
}

function SessionItem({ session }: { session: Session }) {
  const sessionDate = session.date;
  const day = format(sessionDate, 'd');

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer">
      <span className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
        {day}
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-foreground truncate">{session.title}</p>
        <p className="text-xs text-muted-foreground truncate">
          {session.cohortName} • {format(sessionDate, 'HH:mm')}
        </p>
      </div>
    </div>
  );
}

export function SessionsSidebar() {
  const navigate = useNavigate();
  const { data: sessions, isLoading } = useStudentUpcomingSessions(5);

  // Find session happening today or very soon (within 60 min)
  const now = new Date();
  const liveSession = sessions?.find(session => {
    const sessionDate = session.date;
    const minutesUntil = differenceInMinutes(sessionDate, now);
    return minutesUntil <= 60 && minutesUntil >= -90; // Within 60 min or started within 90 min
  });

  const otherSessions = sessions?.filter(s => s.id !== liveSession?.id).slice(0, 3) || [];

  // Fallback data
  const fallbackSessions: Session[] = [
    { 
      id: '1', 
      title: 'Mock Interview Prática', 
      date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), 
      status: 'scheduled',
      cohortName: 'Mentoria Elite'
    },
    { 
      id: '2', 
      title: 'Career Coaching Session', 
      date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), 
      status: 'scheduled',
      cohortName: 'Elite Track'
    },
  ];

  const displaySessions = otherSessions.length > 0 ? otherSessions : fallbackSessions;

  return (
    <Card className="p-4 rounded-[24px] border border-border bg-card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-foreground">Próximas Sessões</h2>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 rounded-[16px]" />
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
      ) : (
        <>
          {liveSession && <LiveSessionCard session={liveSession} />}
          
          <div className="space-y-1">
            {displaySessions.map(session => (
              <SessionItem key={session.id} session={session} />
            ))}
          </div>

          {(!sessions || sessions.length === 0) && !liveSession && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma sessão agendada
            </p>
          )}
        </>
      )}

      <Button 
        variant="outline" 
        className="w-full mt-4 rounded-xl"
        onClick={() => navigate('/dashboard/agenda')}
      >
        Ver Calendário Completo
      </Button>
    </Card>
  );
}
