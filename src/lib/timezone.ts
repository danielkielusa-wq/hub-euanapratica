import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import { ptBR } from 'date-fns/locale';

/** Default timezone when no user profile is available */
export const DEFAULT_TIMEZONE = 'America/Sao_Paulo';

/** Timezone options shared by ProfilePage dropdown and dynamic notices */
export const TIMEZONE_OPTIONS = [
  { value: 'America/Sao_Paulo', label: 'São Paulo (BRT)', abbr: 'BRT' },
  { value: 'America/New_York', label: 'Nova York (EST/EDT)', abbr: 'EST' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PST/PDT)', abbr: 'PST' },
  { value: 'Europe/London', label: 'Londres (GMT/BST)', abbr: 'GMT' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)', abbr: 'CET' },
] as const;

// ── DISPLAY ──────────────────────────────────────────

/**
 * Format a date/ISO string in a specific timezone.
 * Replaces `format(new Date(iso), pattern, { locale: ptBR })`.
 * Always uses ptBR locale.
 */
export function formatInTz(
  date: Date | string,
  tz: string,
  pattern: string,
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return formatInTimeZone(d, tz, pattern, { locale: ptBR });
}

/** "27/02/26 14:30" — replaces toLocaleDateString patterns in admin tables */
export function formatDateTimeBr(date: Date | string, tz: string): string {
  return formatInTz(date, tz, 'dd/MM/yy HH:mm');
}

/** "14:30" */
export function formatTimeBr(date: Date | string, tz: string): string {
  return formatInTz(date, tz, 'HH:mm');
}

// ── INPUT ────────────────────────────────────────────

/**
 * Convert a `datetime-local` input value to a UTC ISO string,
 * interpreting the input as being in the given timezone.
 *
 * Replaces: `new Date(value).toISOString()` and
 *           `fromZonedTime(value, 'America/Sao_Paulo').toISOString()`
 */
export function localInputToUTC(localValue: string, tz: string): string {
  return fromZonedTime(localValue, tz).toISOString();
}

// ── LABELS ───────────────────────────────────────────

/** "São Paulo (BRT)" */
export function getTimezoneLabel(tz: string): string {
  return TIMEZONE_OPTIONS.find((o) => o.value === tz)?.label ?? tz;
}

/** "BRT" */
export function getTimezoneAbbr(tz: string): string {
  return TIMEZONE_OPTIONS.find((o) => o.value === tz)?.abbr ?? tz;
}
