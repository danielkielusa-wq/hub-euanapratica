import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { BookingCard } from '@/components/booking/BookingCard';
import { LiveEventCard } from '@/components/booking/LiveEventCard';
import { EmptyBookings } from '@/components/booking/EmptyBookings';
import { RescheduleModal } from '@/components/booking/RescheduleModal';
import { CancelModal } from '@/components/booking/CancelModal';
import { useBookings, useBookingStats } from '@/hooks/useBookings';
import { useMyLives } from '@/hooks/useMyLives';
import { useStudentSessions } from '@/hooks/useStudentSessions';
import { SessionEventCard } from '@/components/booking/SessionEventCard';
import {
  useBookingPoliciesMap,
  resolvePolicyForBooking,
  computeBookingLimits,
} from '@/hooks/useBookingPolicies';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameDay, addMonths, subMonths, format,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { BookingWithDetails, BookingStatus } from '@/types/booking';
import type { Live } from '@/types/live';
import type { Session as DashboardSession } from '@/types/dashboard';

type StatusFilter = 'all' | BookingStatus | 'live' | 'session';

type UnifiedItem =
  | { type: 'booking'; data: BookingWithDetails; date: Date }
  | { type: 'live'; data: Live; date: Date }
  | { type: 'session'; data: DashboardSession; date: Date };

const PAGE_SIZE = 3;

export default function StudentBookings() {
  const [rescheduleBooking, setRescheduleBooking] = useState<BookingWithDetails | null>(null);
  const [cancelBooking, setCancelBooking] = useState<BookingWithDetails | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Data hooks
  const { data: upcomingBookings, isLoading: loadingUpcoming } = useBookings('upcoming');
  const { data: pastBookings } = useBookings('past');
  const { data: stats } = useBookingStats();
  const { data: policiesMap } = useBookingPoliciesMap();
  const { data: myLives, isLoading: loadingLives } = useMyLives();
  const { data: espacoSessions, isLoading: loadingSessions } = useStudentSessions();

  // Merge upcoming + past for the full list
  const allBookings = useMemo(() => {
    const upcoming = upcomingBookings || [];
    const past = pastBookings || [];
    return [...upcoming, ...past];
  }, [upcomingBookings, pastBookings]);

  // Unified list: bookings + lives + espaco sessions sorted by date
  const allItems = useMemo<UnifiedItem[]>(() => {
    const items: UnifiedItem[] = allBookings.map(b => ({
      type: 'booking' as const,
      data: b,
      date: new Date(b.scheduled_start),
    }));
    (myLives || []).forEach(ml => {
      items.push({
        type: 'live' as const,
        data: ml.live,
        date: new Date(ml.live.scheduled_at),
      });
    });
    (espacoSessions || []).forEach(s => {
      items.push({
        type: 'session' as const,
        data: s,
        date: s.date,
      });
    });
    items.sort((a, b) => b.date.getTime() - a.date.getTime());
    return items;
  }, [allBookings, myLives, espacoSessions]);

  const isLoading = loadingUpcoming || loadingLives || loadingSessions;

  // Filter unified items
  const filteredItems = useMemo(() => {
    let result = allItems;

    // Status filter
    if (statusFilter === 'live') {
      result = result.filter(item => item.type === 'live');
    } else if (statusFilter === 'session') {
      result = result.filter(item => item.type === 'session');
    } else if (statusFilter !== 'all') {
      result = result.filter(item =>
        item.type === 'booking' && item.data.status === statusFilter
      );
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(item => {
        if (item.type === 'booking') {
          return (
            item.data.service?.name?.toLowerCase().includes(q) ||
            item.data.mentor?.full_name?.toLowerCase().includes(q)
          );
        }
        if (item.type === 'session') {
          return (
            item.data.title.toLowerCase().includes(q) ||
            item.data.cohortName.toLowerCase().includes(q)
          );
        }
        return item.data.title.toLowerCase().includes(q);
      });
    }

    // Date filter from calendar
    if (selectedCalendarDate) {
      result = result.filter(item => isSameDay(item.date, selectedCalendarDate));
    }

    return result;
  }, [allItems, statusFilter, searchQuery, selectedCalendarDate]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredItems.slice(start, start + PAGE_SIZE);
  }, [filteredItems, currentPage]);

  // Reset page when filters change
  const resetPage = () => setCurrentPage(1);

  // Calendar days with events
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(calendarMonth);
    const monthEnd = endOfMonth(calendarMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [calendarMonth]);

  const eventDates = useMemo(() => {
    const dates = new Set<string>();
    allItems.forEach(item => {
      dates.add(item.date.toDateString());
    });
    return dates;
  }, [allItems]);

  // Filter counts
  const filterCounts = useMemo(() => {
    const counts = { all: allItems.length, confirmed: 0, completed: 0, cancelled: 0, no_show: 0, live: 0, session: 0 };
    allItems.forEach(item => {
      if (item.type === 'booking' && item.data.status in counts) {
        counts[item.data.status as BookingStatus]++;
      }
      if (item.type === 'live') {
        counts.live++;
      }
      if (item.type === 'session') {
        counts.session++;
      }
    });
    return counts;
  }, [allItems]);

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

  const monthLabel = format(calendarMonth, 'MMMM yyyy', { locale: ptBR });

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-6">

        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-foreground">Meus Agendamentos</h2>
          <p className="text-gray-500 dark:text-muted-foreground text-sm">Gerencie suas sessões e mentorias</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">

          {/* Left Column: Calendar & Filters */}
          <div className="xl:col-span-1 space-y-6">

            {/* Mini Calendar */}
            <div className="bg-white dark:bg-card rounded-xl shadow-sm border border-gray-100 dark:border-white/10 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-gray-800 dark:text-foreground capitalize">{monthLabel}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCalendarMonth(prev => subMonths(prev, 1))}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full text-gray-500 dark:text-muted-foreground"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCalendarMonth(prev => addMonths(prev, 1))}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full text-gray-500 dark:text-muted-foreground"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-2 text-center mb-2">
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
                  <div key={i} className="text-xs font-medium text-gray-400 dark:text-muted-foreground py-1">{day}</div>
                ))}
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {calendarDays.map((date) => {
                  const isCurrentMonth = date.getMonth() === calendarMonth.getMonth();
                  const isToday = isSameDay(date, new Date());
                  const hasEvent = eventDates.has(date.toDateString());
                  const isSelected = selectedCalendarDate ? isSameDay(date, selectedCalendarDate) : false;

                  return (
                    <button
                      key={date.toISOString()}
                      onClick={() => { setSelectedCalendarDate(isSelected ? null : date); resetPage(); }}
                      className={cn(
                        'h-8 w-8 rounded-full text-sm flex items-center justify-center relative transition-all mx-auto',
                        !isCurrentMonth && 'text-gray-300 dark:text-gray-600',
                        isCurrentMonth && !isSelected && 'text-gray-700 dark:text-foreground hover:bg-gray-50 dark:hover:bg-white/10',
                        isSelected && 'bg-[#7367F0] text-white shadow-md shadow-indigo-200 dark:shadow-none',
                        isToday && !isSelected && 'font-bold text-[#7367F0]'
                      )}
                    >
                      {date.getDate()}
                      {hasEvent && !isSelected && (
                        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#7367F0] rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-card rounded-xl shadow-sm border border-gray-100 dark:border-white/10 p-4">
              <h3 className="text-xs font-semibold text-gray-400 dark:text-muted-foreground uppercase tracking-wider mb-3 px-2">Filtros</h3>
              <div className="space-y-1">
                <FilterItem
                  label="Todos os Agendamentos"
                  count={filterCounts.all}
                  active={statusFilter === 'all'}
                  onClick={() => { setStatusFilter('all'); resetPage(); }}
                />
                <FilterItem
                  label="Confirmados"
                  count={filterCounts.confirmed}
                  colorDot="bg-green-500"
                  active={statusFilter === 'confirmed'}
                  onClick={() => { setStatusFilter('confirmed'); resetPage(); }}
                />
                <FilterItem
                  label="Concluídos"
                  count={filterCounts.completed}
                  colorDot="bg-blue-500"
                  active={statusFilter === 'completed'}
                  onClick={() => { setStatusFilter('completed'); resetPage(); }}
                />
                <FilterItem
                  label="Cancelados"
                  count={filterCounts.cancelled}
                  colorDot="bg-red-500"
                  active={statusFilter === 'cancelled'}
                  onClick={() => { setStatusFilter('cancelled'); resetPage(); }}
                />
                <FilterItem
                  label="Sessões de Espaço"
                  count={filterCounts.session}
                  colorDot="bg-indigo-500"
                  active={statusFilter === 'session'}
                  onClick={() => { setStatusFilter('session'); resetPage(); }}
                />
                <FilterItem
                  label="Lives"
                  count={filterCounts.live}
                  colorDot="bg-purple-500"
                  active={statusFilter === 'live'}
                  onClick={() => { setStatusFilter('live'); resetPage(); }}
                />
              </div>
            </div>
          </div>

          {/* Right Column: Appointment List */}
          <div className="xl:col-span-2 bg-white dark:bg-card rounded-xl shadow-sm border border-gray-100 dark:border-white/10 flex flex-col">

            {/* List Header */}
            <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="font-semibold text-gray-800 dark:text-foreground text-lg">
                {selectedCalendarDate
                  ? format(selectedCalendarDate, "d 'de' MMMM", { locale: ptBR })
                  : 'Próximos Eventos'}
              </h3>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); resetPage(); }}
                  className="pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-full sm:w-56 transition-all bg-white dark:bg-card dark:text-foreground dark:placeholder:text-muted-foreground"
                />
              </div>
            </div>

            {/* List Content */}
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-28 w-full rounded-lg" />
                ))}
              </div>
            ) : filteredItems.length > 0 ? (
              <div className="divide-y divide-gray-50 dark:divide-white/5">
                {paginatedItems.map(item =>
                  item.type === 'booking' ? (
                    <BookingCard
                      key={`booking-${item.data.id}`}
                      booking={item.data}
                      limits={getLimits(item.data)}
                      onReschedule={setRescheduleBooking}
                      onCancel={setCancelBooking}
                      onJoinMeeting={handleJoinMeeting}
                    />
                  ) : item.type === 'session' ? (
                    <SessionEventCard key={`session-${item.data.id}`} session={item.data} />
                  ) : (
                    <LiveEventCard key={`live-${item.data.id}`} live={item.data} />
                  )
                )}
              </div>
            ) : (
              <EmptyBookings type={statusFilter === 'cancelled' || statusFilter === 'completed' ? 'past' : 'upcoming'} />
            )}

            {/* Pagination */}
            {filteredItems.length > PAGE_SIZE && (
              <div className="p-4 border-t border-gray-100 dark:border-white/10 flex items-center justify-between">
                <span className="text-xs text-gray-400 dark:text-muted-foreground">
                  {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredItems.length)} de {filteredItems.length}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg text-gray-500 dark:text-muted-foreground hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={cn(
                        'w-8 h-8 rounded-lg text-sm font-medium transition-colors',
                        page === currentPage
                          ? 'bg-[#7367F0] text-white shadow-sm'
                          : 'text-gray-600 dark:text-muted-foreground hover:bg-gray-100 dark:hover:bg-white/10'
                      )}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg text-gray-500 dark:text-muted-foreground hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Show all link when filtering by date */}
            {selectedCalendarDate && filteredItems.length > 0 && (
              <div className="p-4 border-t border-gray-100 dark:border-white/10 flex justify-center">
                <button
                  onClick={() => { setSelectedCalendarDate(null); resetPage(); }}
                  className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
                >
                  Ver todos os agendamentos
                </button>
              </div>
            )}
          </div>

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

// Filter sidebar item
function FilterItem({
  label,
  count,
  active,
  colorDot,
  onClick,
}: {
  label: string;
  count: number;
  active?: boolean;
  colorDot?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors',
        active
          ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-medium'
          : 'text-gray-600 dark:text-muted-foreground hover:bg-gray-50 dark:hover:bg-white/5'
      )}
    >
      <div className="flex items-center gap-2">
        {colorDot && <span className={cn('w-2 h-2 rounded-full', colorDot)} />}
        <span>{label}</span>
      </div>
      <span className={cn(
        'text-xs px-2 py-0.5 rounded-full',
        active
          ? 'bg-white dark:bg-card text-indigo-600 dark:text-indigo-400'
          : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-muted-foreground'
      )}>
        {count}
      </span>
    </button>
  );
}
