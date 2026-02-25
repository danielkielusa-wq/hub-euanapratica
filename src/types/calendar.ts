import type { Session } from '@/hooks/useSessions';
import type { BookingWithDetails } from '@/types/booking';

export type CalendarEvent =
  | { kind: 'session'; data: Session; datetime: string }
  | { kind: 'booking'; data: BookingWithDetails; datetime: string };

// Minimal shape for DayCell pills
export interface CalendarEventMinimal {
  id: string;
  title: string;
  datetime: string;
  status: string | null;
  kind: 'session' | 'booking';
}
