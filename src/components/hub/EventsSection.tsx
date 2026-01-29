import { Link } from 'react-router-dom';
import { Calendar, Mic2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useHubEvents } from '@/hooks/useHubEvents';
import { EventCard } from './EventCard';
import { useState } from 'react';
import { UpgradeModal } from '@/components/curriculo/UpgradeModal';

export function EventsSection() {
  const { data: events, isLoading } = useHubEvents(6);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  if (isLoading) {
    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mic2 className="h-5 w-5 text-primary" />
            <Skeleton className="h-6 w-48" />
          </div>
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-56 rounded-[24px]" />
          ))}
        </div>
      </section>
    );
  }

  if (!events || events.length === 0) {
    return (
      <section className="rounded-[32px] border border-dashed bg-muted/30 p-8 text-center">
        <Calendar className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
        <h3 className="mb-1 font-semibold text-foreground">Nenhum evento agendado</h3>
        <p className="text-sm text-muted-foreground">
          Seus próximos workshops e hot seats aparecerão aqui.
        </p>
      </section>
    );
  }

  return (
    <>
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mic2 className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Eventos & Hot Seats</h2>
          </div>
          <Link 
            to="/dashboard/agenda" 
            className="text-sm font-medium text-primary hover:underline"
          >
            Ver Calendário Completo →
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard 
              key={event.id} 
              event={event} 
              onUpgradeClick={() => setShowUpgradeModal(true)}
            />
          ))}
        </div>
      </section>

      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        reason="upgrade"
      />
    </>
  );
}
