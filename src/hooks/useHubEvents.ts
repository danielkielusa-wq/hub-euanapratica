import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { addDays } from 'date-fns';

export interface HubEvent {
  id: string;
  title: string;
  description: string | null;
  datetime: string;
  duration_minutes: number;
  meeting_link: string | null;
  status: string;
  espaco_id: string;
  espaco_name: string;
  gradient_preset: string | null;
  // Access control
  requiredPlan: 'basic' | 'pro' | 'vip';
  canAccess: boolean;
  isLive: boolean;
}

const PLAN_ORDER: Record<string, number> = {
  basic: 0,
  pro: 1,
  vip: 2,
};

// Determine required plan based on espaco category or other criteria
function getRequiredPlan(espacoCategory: string | null): 'basic' | 'pro' | 'vip' {
  // Hot Seats and advanced sessions require Pro
  // VIP exclusive sessions require VIP
  // Default workshops are available for Basic
  switch (espacoCategory) {
    case 'masterclass':
    case 'hot_seat':
      return 'pro';
    case 'vip_exclusive':
      return 'vip';
    default:
      return 'basic';
  }
}

export function useHubEvents(limit = 6) {
  const { user } = useAuth();
  const { quota } = useSubscription();

  return useQuery({
    queryKey: ['hub-events', user?.id, limit],
    queryFn: async () => {
      const now = new Date().toISOString();
      const futureLimit = addDays(new Date(), 30).toISOString();

      // Fetch upcoming sessions from enrolled espacos
      const { data: enrolledEspacos, error: enrollError } = await supabase
        .from('user_espacos')
        .select('espaco_id')
        .eq('user_id', user?.id || '')
        .eq('status', 'active');

      if (enrollError) throw enrollError;

      const espacoIds = enrolledEspacos?.map(e => e.espaco_id) || [];

      if (espacoIds.length === 0) {
        return [];
      }

      // Fetch sessions from those espacos
      const { data: sessions, error: sessionsError } = await supabase
        .from('sessions')
        .select(`
          id,
          title,
          description,
          datetime,
          duration_minutes,
          meeting_link,
          status,
          espaco_id,
          gradient_preset,
          espacos!inner (
            id,
            name,
            category
          )
        `)
        .in('espaco_id', espacoIds)
        .in('status', ['scheduled', 'live'])
        .gte('datetime', now)
        .lte('datetime', futureLimit)
        .order('datetime', { ascending: true })
        .limit(limit);

      if (sessionsError) throw sessionsError;

      const userPlan = quota?.planId || 'basic';
      const userPlanLevel = PLAN_ORDER[userPlan] ?? 0;

      const events: HubEvent[] = (sessions || []).map((session: any) => {
        const espaco = session.espacos;
        const requiredPlan = getRequiredPlan(espaco?.category);
        const requiredLevel = PLAN_ORDER[requiredPlan] ?? 0;
        const canAccess = userPlanLevel >= requiredLevel;

        // Check if session is currently live
        const sessionStart = new Date(session.datetime);
        const sessionEnd = new Date(sessionStart.getTime() + (session.duration_minutes || 60) * 60 * 1000);
        const isLive = new Date() >= sessionStart && new Date() <= sessionEnd;

        return {
          id: session.id,
          title: session.title,
          description: session.description,
          datetime: session.datetime,
          duration_minutes: session.duration_minutes || 60,
          meeting_link: session.meeting_link,
          status: session.status,
          espaco_id: session.espaco_id,
          espaco_name: espaco?.name || 'Espaço',
          gradient_preset: session.gradient_preset,
          requiredPlan,
          canAccess,
          isLive: isLive || session.status === 'live',
        };
      });

      return events;
    },
    enabled: !!user?.id,
  });
}
