import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';

import { BookingCard } from '@/components/booking/BookingCard';
import { EmptyBookings } from '@/components/booking/EmptyBookings';
import { RescheduleModal } from '@/components/booking/RescheduleModal';
import { CancelModal } from '@/components/booking/CancelModal';
import { MonthCalendar } from '@/components/calendar/MonthCalendar';
import { useBookings, useBookingStats } from '@/hooks/useBookings';
import {
  useBookingPoliciesMap,
  resolvePolicyForBooking,
  computeBookingLimits,
} from '@/hooks/useBookingPolicies';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, List } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BookingWithDetails } from '@/types/booking';
import type { CalendarEvent } from '@/types/calendar';

type Tab = 'upcoming' | 'past';
type ViewType = 'list' | 'calendar';

export default function StudentBookings() {
  const [activeTab, setActiveTab] = useState<Tab>('upcoming');
  const [viewType, setViewType] = useState<ViewType>('list');
  const [rescheduleBooking, setRescheduleBooking] = useState<BookingWithDetails | null>(null);
  const [cancelBooking, setCancelBooking] = useState<BookingWithDetails | null>(null);

  // All queries fire in parallel; past bookings deferred until tab is active
  const { data: upcomingBookings, isLoading: loadingUpcoming } = useBookings('upcoming');
  const { data: pastBookings, isLoading: loadingPast } = useBookings('past', {
    enabled: activeTab === 'past',
  });
  const { data: stats } = useBookingStats();
  const { data: policiesMap } = useBookingPoliciesMap();

  const bookings = activeTab === 'upcoming' ? upcomingBookings : pastBookings;
  const isLoading = activeTab === 'upcoming' ? loadingUpcoming : loadingPast;

  const getLimits = (booking: BookingWithDetails) => {
    if (!policiesMap || !stats) return null;
    const policy = resolvePolicyForBooking(booking, policiesMap);
    if (!policy) return null;
    return computeBookingLimits(booking, policy, stats);
  };

  const handleJoinMeeting = (booking: BookingWithDetails) => {
    if (booking.meeting_link) {
      window.open(booking.meeting_link, '_blank');
    }
  };

  const calendarEvents = useMemo<CalendarEvent[]>(() => {
    if (!bookings) return [];
    return bookings.map(b => ({
      kind: 'booking' as const,
      data: b,
      datetime: b.scheduled_start,
    }));
  }, [bookings]);

  const handleCalendarJoinMeeting = (event: CalendarEvent) => {
    if (event.kind === 'booking' && event.data.meeting_link) {
      window.open(event.data.meeting_link, '_blank');
    }
  };

  return (
    <DashboardLayout>

      <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-black text-foreground tracking-tight">
                Meus Agendamentos
              </h1>
              <p className="text-muted-foreground mt-1">
                Gerencie suas sessões de mentoria.
              </p>
            </div>

            <div className="flex gap-4 items-center">
              {/* View Toggle */}
              <div className="bg-muted p-1 rounded-xl flex">
                <button
                  onClick={() => setViewType('list')}
                  className={cn(
                    'p-2 rounded-lg transition-all',
                    viewType === 'list'
                      ? 'bg-card shadow text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <List className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewType('calendar')}
                  className={cn(
                    'p-2 rounded-lg transition-all',
                    viewType === 'calendar'
                      ? 'bg-card shadow text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Calendar className="h-5 w-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="bg-card p-1.5 rounded-full shadow-sm border border-border/40 inline-flex">
                <button
                  onClick={() => setActiveTab('upcoming')}
                  className={cn(
                    'px-6 py-2.5 rounded-full text-sm font-bold transition-all',
                    activeTab === 'upcoming'
                      ? 'bg-foreground text-background shadow-md'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Próximos
                  {stats?.upcoming_bookings ? (
                    <span className="ml-2 bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">
                      {stats.upcoming_bookings}
                    </span>
                  ) : null}
                </button>
                <button
                  onClick={() => setActiveTab('past')}
                  className={cn(
                    'px-6 py-2.5 rounded-full text-sm font-bold transition-all',
                    activeTab === 'past'
                      ? 'bg-foreground text-background shadow-md'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Anteriores
                </button>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="Próximas"
                value={stats.upcoming_bookings}
                color="indigo"
              />
              <StatCard
                label="Concluídas"
                value={stats.completed_bookings}
                color="green"
              />
              <StatCard
                label="Canceladas"
                value={stats.cancelled_bookings}
                color="gray"
              />
              <StatCard
                label="Vagas disponíveis"
                value={stats.remaining_slots}
                color="blue"
              />
            </div>
          )}

          {/* Content */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-36 rounded-[24px]" />
              ))}
            </div>
          ) : viewType === 'calendar' ? (
            <MonthCalendar
              events={calendarEvents}
              perspective="student"
              onJoinMeeting={handleCalendarJoinMeeting}
              onViewMaterials={() => {}}
              onViewRecording={() => {}}
            />
          ) : bookings && bookings.length > 0 ? (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  limits={getLimits(booking)}
                  onReschedule={setRescheduleBooking}
                  onCancel={setCancelBooking}
                  onJoinMeeting={handleJoinMeeting}
                />
              ))}
            </div>
          ) : (
            <EmptyBookings type={activeTab} />
          )}
      </div>

      {/* Modals */}
      <RescheduleModal
        booking={rescheduleBooking}
        open={!!rescheduleBooking}
        onOpenChange={(open) => !open && setRescheduleBooking(null)}
      />
      <CancelModal
        booking={cancelBooking}
        open={!!cancelBooking}
        onOpenChange={(open) => !open && setCancelBooking(null)}
      />
    </DashboardLayout>
  );
}

// Stat card component
function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: 'indigo' | 'green' | 'gray' | 'blue';
}) {
  const colorClasses = {
    indigo: 'bg-primary/5 text-primary border-primary/10',
    green: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/30',
    gray: 'bg-muted text-muted-foreground border-border/40',
    blue: 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/30',
  };

  return (
    <div
      className={cn(
        'p-4 rounded-2xl border shadow-sm hover:shadow-md transition-all',
        colorClasses[color]
      )}
    >
      <p className="text-3xl font-black">{value}</p>
      <p className="text-sm opacity-75 mt-1">{label}</p>
    </div>
  );
}
