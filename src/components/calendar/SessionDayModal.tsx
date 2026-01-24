import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { SessionDetailCard } from '@/components/sessions/SessionDetailCard';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Session } from '@/hooks/useSessions';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SessionDayModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | null;
  sessions: Session[];
  onJoinMeeting: (session: Session) => void;
  onViewMaterials: (session: Session) => void;
  onViewRecording: (session: Session) => void;
}

export function SessionDayModal({
  open,
  onOpenChange,
  date,
  sessions,
  onJoinMeeting,
  onViewMaterials,
  onViewRecording,
}: SessionDayModalProps) {
  if (!date) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="capitalize">
            {format(date, "EEEE, d 'de' MMMM", { locale: ptBR })}
          </SheetTitle>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-120px)] mt-6 pr-4">
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhuma sessão neste dia</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <SessionDetailCard
                  key={session.id}
                  session={session}
                  onJoinMeeting={() => onJoinMeeting(session)}
                  onViewMaterials={() => onViewMaterials(session)}
                  onViewRecording={() => onViewRecording(session)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
