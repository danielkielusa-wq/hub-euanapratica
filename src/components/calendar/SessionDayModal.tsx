import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { SessionDetailCard } from '@/components/sessions/SessionDetailCard';
import { BookingDayCard } from './BookingDayCard';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Session } from '@/hooks/useSessions';
import type { CalendarEvent } from '@/types/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SessionDayModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | null;
  events: CalendarEvent[];
  perspective: 'mentor' | 'student';
  onJoinMeeting: (event: CalendarEvent) => void;
  onViewMaterials: (event: CalendarEvent) => void;
  onViewRecording: (event: CalendarEvent) => void;
}

export function SessionDayModal({
  open,
  onOpenChange,
  date,
  events,
  perspective,
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
          {events.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum evento neste dia</p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => {
                if (event.kind === 'session') {
                  const session = event.data as Session;
                  return (
                    <SessionDetailCard
                      key={`session-${session.id}`}
                      session={session}
                      onJoinMeeting={() => onJoinMeeting(event)}
                      onViewMaterials={() => onViewMaterials(event)}
                      onViewRecording={() => onViewRecording(event)}
                    />
                  );
                }
                return (
                  <BookingDayCard
                    key={`booking-${event.data.id}`}
                    booking={event.data}
                    perspective={perspective}
                  />
                );
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
