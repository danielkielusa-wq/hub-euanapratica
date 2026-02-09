import { useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { DashboardTopHeader } from '@/components/dashboard/DashboardTopHeader';
import { BookingCard } from '@/components/booking/BookingCard';
import { EmptyBookings } from '@/components/booking/EmptyBookings';
import { RescheduleModal } from '@/components/booking/RescheduleModal';
import { CancelModal } from '@/components/booking/CancelModal';
import { useUpcomingBookings, usePastBookings, useBookingStats } from '@/hooks/useBookings';
import { useBookingLimits } from '@/hooks/useBookingPolicies';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, List, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BookingWithDetails } from '@/types/booking';

type Tab = 'upcoming' | 'past';
type ViewType = 'list' | 'calendar';

export default function StudentBookings() {
  const [activeTab, setActiveTab] = useState<Tab>('upcoming');
  const [viewType, setViewType] = useState<ViewType>('list');
  const [rescheduleBooking, setRescheduleBooking] = useState<BookingWithDetails | null>(null);
  const [cancelBooking, setCancelBooking] = useState<BookingWithDetails | null>(null);

  // Queries
  const { data: upcomingBookings, isLoading: loadingUpcoming } = useUpcomingBookings();
  const { data: pastBookings, isLoading: loadingPast } = usePastBookings();
  const { data: stats } = useBookingStats();

  const bookings = activeTab === 'upcoming' ? upcomingBookings : pastBookings;
  const isLoading = activeTab === 'upcoming' ? loadingUpcoming : loadingPast;

  const handleJoinMeeting = (booking: BookingWithDetails) => {
    if (booking.meeting_link) {
      window.open(booking.meeting_link, '_blank');
    }
  };

  return (
    <DashboardLayout>
      <DashboardTopHeader />

      <div className="flex-1 p-6 bg-gray-50/50">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                Meus Agendamentos
              </h1>
              <p className="text-gray-500 mt-1">
                Gerencie suas sessões de mentoria.
              </p>
            </div>

            <div className="flex gap-4 items-center">
              {/* View Toggle */}
              <div className="bg-gray-100 p-1 rounded-xl flex">
                <button
                  onClick={() => setViewType('list')}
                  className={cn(
                    'p-2 rounded-lg transition-all',
                    viewType === 'list'
                      ? 'bg-white shadow text-gray-900'
                      : 'text-gray-400 hover:text-gray-600'
                  )}
                >
                  <List className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewType('calendar')}
                  className={cn(
                    'p-2 rounded-lg transition-all',
                    viewType === 'calendar'
                      ? 'bg-white shadow text-gray-900'
                      : 'text-gray-400 hover:text-gray-600'
                  )}
                >
                  <Calendar className="h-5 w-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="bg-white p-1.5 rounded-full shadow-sm border border-gray-100 inline-flex">
                <button
                  onClick={() => setActiveTab('upcoming')}
                  className={cn(
                    'px-6 py-2.5 rounded-full text-sm font-bold transition-all',
                    activeTab === 'upcoming'
                      ? 'bg-gray-900 text-white shadow-md'
                      : 'text-gray-500 hover:text-gray-900'
                  )}
                >
                  Próximos
                  {stats?.upcoming_bookings ? (
                    <span className="ml-2 bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs">
                      {stats.upcoming_bookings}
                    </span>
                  ) : null}
                </button>
                <button
                  onClick={() => setActiveTab('past')}
                  className={cn(
                    'px-6 py-2.5 rounded-full text-sm font-bold transition-all',
                    activeTab === 'past'
                      ? 'bg-gray-900 text-white shadow-md'
                      : 'text-gray-500 hover:text-gray-900'
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
          ) : bookings && bookings.length > 0 ? (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <BookingCardWithLimits
                  key={booking.id}
                  booking={booking}
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

// Wrapper component to fetch limits for each booking
function BookingCardWithLimits({
  booking,
  onReschedule,
  onCancel,
  onJoinMeeting,
}: {
  booking: BookingWithDetails;
  onReschedule: (booking: BookingWithDetails) => void;
  onCancel: (booking: BookingWithDetails) => void;
  onJoinMeeting: (booking: BookingWithDetails) => void;
}) {
  const { data: limits } = useBookingLimits(booking);

  return (
    <BookingCard
      booking={booking}
      limits={limits}
      onReschedule={onReschedule}
      onCancel={onCancel}
      onJoinMeeting={onJoinMeeting}
    />
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
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    gray: 'bg-gray-50 text-gray-600 border-gray-200',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
  };

  return (
    <div
      className={cn(
        'p-4 rounded-xl border',
        colorClasses[color]
      )}
    >
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm opacity-75">{label}</p>
    </div>
  );
}
