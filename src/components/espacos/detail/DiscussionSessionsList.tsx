import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { SessionDiscussionButton } from '@/components/sessions/SessionDiscussionButton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MessageCircle } from 'lucide-react';

interface Session {
  id: string;
  title: string;
  datetime: string;
  status?: string | null;
}

interface DiscussionSessionsListProps {
  sessions: Session[] | undefined;
  isLoading: boolean;
}

export function DiscussionSessionsList({ sessions, isLoading }: DiscussionSessionsListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 rounded-[24px]" />
        ))}
      </div>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <MessageCircle className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground font-medium">
          Nenhuma sessão disponível para discussão.
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          As discussões aparecem aqui quando houver sessões.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Discussões por Sessão</h3>
      {sessions.map((session) => (
        <Card 
          key={session.id} 
          className="p-4 rounded-[24px] bg-card/70 backdrop-blur-sm border border-border/40"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h4 className="font-medium text-foreground truncate">{session.title}</h4>
              <p className="text-sm text-muted-foreground">
                {format(new Date(session.datetime), "dd 'de' MMMM, HH:mm", { locale: ptBR })}
              </p>
            </div>
            <SessionDiscussionButton 
              sessionId={session.id} 
              sessionTitle={session.title} 
            />
          </div>
        </Card>
      ))}
    </div>
  );
}
