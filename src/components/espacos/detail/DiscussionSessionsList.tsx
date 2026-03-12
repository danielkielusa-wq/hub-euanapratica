import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { SessionDiscussionButton } from '@/components/sessions/SessionDiscussionButton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MessageCircle, Search } from 'lucide-react';

interface Session {
  id: string;
  title: string;
  datetime: string;
  status?: string | null;
  espaco_id?: string | null;
}

interface DiscussionSessionsListProps {
  sessions: Session[] | undefined;
  isLoading: boolean;
}

export function DiscussionSessionsList({ sessions, isLoading }: DiscussionSessionsListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSessions = useMemo(() => {
    if (!sessions) return [];
    if (!searchQuery.trim()) return sessions;
    const q = searchQuery.toLowerCase();
    return sessions.filter(s => s.title.toLowerCase().includes(q));
  }, [sessions, searchQuery]);

  const espacoId = sessions?.[0]?.espaco_id ?? undefined;

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-foreground">Discussões por Sessão</h3>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar sessão..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 rounded-xl h-9 text-sm"
          />
        </div>
      </div>

      {filteredSessions.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Nenhuma sessão encontrada para "{searchQuery}"
        </p>
      ) : (
        filteredSessions.map((session) => (
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
                espacoId={espacoId}
              />
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
