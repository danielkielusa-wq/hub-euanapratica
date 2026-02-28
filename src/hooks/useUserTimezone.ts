import { useAuth } from '@/contexts/AuthContext';
import { DEFAULT_TIMEZONE } from '@/lib/timezone';

/**
 * Returns the current user's timezone from their profile,
 * falling back to 'America/Sao_Paulo' if not logged in or not set.
 */
export function useUserTimezone(): string {
  const { user } = useAuth();
  return user?.timezone ?? DEFAULT_TIMEZONE;
}
