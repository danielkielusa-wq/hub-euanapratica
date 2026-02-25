import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePlanAccess } from '@/hooks/usePlanAccess';
import type {
  HubService,
  MyHubItem,
  HubSection,
  ComputedStatus,
  AccessSource,
} from '@/types/hub';
import type { BookingWithDetails } from '@/types/booking';

// ============================================
// Raw row from user_hub_services + hub_services join
// ============================================
interface UserHubServiceRow {
  id: string;
  user_id: string;
  service_id: string;
  status: string;
  access_source: AccessSource;
  sessions_total: number | null;
  sessions_used: number;
  metadata: Record<string, unknown>;
  started_at: string | null;
  expires_at: string | null;
  hub_services: HubService;
}

// ============================================
// Compute status per service_type
// ============================================
function computeStatus(
  row: UserHubServiceRow,
  booking: BookingWithDetails | undefined,
  nextSessionDatetime: string | undefined
): ComputedStatus {
  const { service_type } = row.hub_services;

  switch (service_type) {
    case 'consulting': {
      const hasSessions = (row.sessions_total ?? 1) > row.sessions_used;
      if (!hasSessions) return 'completed';
      if (!booking || booking.status === 'cancelled') return 'needs_action';
      if (booking.status === 'completed') return 'completed';
      if (booking.status === 'confirmed') return 'scheduled';
      return 'needs_action';
    }

    case 'live_mentoring':
      return 'active';

    case 'live_event': {
      const sessionDatetime = row.metadata?.session_datetime as string | undefined;
      if (!sessionDatetime) return 'upcoming';
      return new Date(sessionDatetime) > new Date() ? 'upcoming' : 'completed';
    }

    case 'recorded_course': {
      const progress = (row.metadata?.progress_percent as number) ?? 0;
      if (progress >= 100) return 'completed';
      if (progress > 0) return 'active';
      return 'not_started';
    }

    case 'ai_tool':
      return 'active';

    default:
      return 'active';
  }
}

// ============================================
// Assign to section based on computed_status
// ============================================
function assignSection(status: ComputedStatus): 'needs_action' | 'active' | 'upcoming' | 'history' {
  if (status === 'needs_action' || status === 'not_started') return 'needs_action';
  if (status === 'scheduled' || status === 'active') return 'active';
  if (status === 'upcoming') return 'upcoming';
  return 'history';
}

// ============================================
// Main hook: useMyHub
// ============================================
export function useMyHub() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-hub', user?.id],
    queryFn: async (): Promise<HubSection[]> => {
      if (!user?.id) return [];

      // 1. Fetch user_hub_services + service details
      const { data: userServices, error: servicesError } = await supabase
        .from('user_hub_services')
        .select(`
          id,
          user_id,
          service_id,
          status,
          access_source,
          sessions_total,
          sessions_used,
          metadata,
          started_at,
          expires_at,
          hub_services (*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (servicesError) throw servicesError;
      if (!userServices?.length) return [];

      const rows = userServices as unknown as UserHubServiceRow[];

      // 2. Fetch latest non-cancelled booking per consulting service
      const consultingServiceIds = rows
        .filter((r) => r.hub_services.service_type === 'consulting')
        .map((r) => r.service_id);

      const bookingMap = new Map<string, BookingWithDetails>();
      if (consultingServiceIds.length > 0) {
        const { data: bookings } = await supabase
          .from('bookings')
          .select(`
            *,
            service:hub_services!bookings_service_id_fkey(id, name, description, icon_name),
            mentor:profiles!bookings_mentor_id_fkey(id, full_name, email, profile_photo_url)
          `)
          .eq('student_id', user.id)
          .in('service_id', consultingServiceIds)
          .neq('status', 'cancelled')
          .order('created_at', { ascending: false });

        if (bookings) {
          // Keep only the latest booking per service_id
          for (const b of bookings) {
            if (!bookingMap.has(b.service_id)) {
              bookingMap.set(b.service_id, b as BookingWithDetails);
            }
          }
        }
      }

      // 3. Fetch next session for live_mentoring items
      const mentoringServiceIds = rows
        .filter((r) => r.hub_services.service_type === 'live_mentoring')
        .map((r) => r.hub_services.espaco_id)
        .filter(Boolean) as string[];

      const nextSessionMap = new Map<string, string>();
      if (mentoringServiceIds.length > 0) {
        const { data: sessions } = await supabase
          .from('sessions')
          .select('id, espaco_id, datetime')
          .in('espaco_id', mentoringServiceIds)
          .gte('datetime', new Date().toISOString())
          .in('status', ['scheduled', 'live'])
          .order('datetime', { ascending: true });

        if (sessions) {
          for (const s of sessions) {
            if (s.espaco_id && !nextSessionMap.has(s.espaco_id)) {
              nextSessionMap.set(s.espaco_id, s.datetime);
            }
          }
        }
      }

      // 4. Build MyHubItem[] with computed status
      const items: MyHubItem[] = rows.map((row) => {
        const booking = bookingMap.get(row.service_id);
        const nextSessionDatetime = row.hub_services.espaco_id
          ? nextSessionMap.get(row.hub_services.espaco_id)
          : undefined;
        const computed_status = computeStatus(row, booking, nextSessionDatetime);

        return {
          user_service_id: row.id,
          service: row.hub_services,
          access_source: row.access_source ?? 'purchase',
          sessions_total: row.sessions_total,
          sessions_used: row.sessions_used ?? 0,
          computed_status,
          booking,
          next_session_datetime: nextSessionDatetime,
          metadata: row.metadata ?? {},
        };
      });

      // 5. Group into sections (only non-empty sections returned)
      const sectionDefs: { id: HubSection['id']; label: string }[] = [
        { id: 'needs_action', label: 'Ação Necessária' },
        { id: 'active', label: 'Em Andamento' },
        { id: 'upcoming', label: 'Próximos Eventos' },
        { id: 'history', label: 'Histórico' },
      ];

      return sectionDefs
        .map((def) => ({
          ...def,
          items: items.filter((item) => assignSection(item.computed_status) === def.id),
        }))
        .filter((section) => section.items.length > 0);
    },
    enabled: !!user?.id,
    staleTime: 30_000,
  });
}

// ============================================
// Plan tools hook: returns hub_services linked to active plan features
// ============================================
export interface PlanTool {
  service: HubService;
  credits_total: number;
  credits_used: number;
  credits_remaining: number;
  is_unlimited: boolean;
}

const FEATURE_KEY_CREDIT_MAP: Record<
  string,
  { totalKey: 'monthlyLimit'; usedKey: 'usedThisMonth'; remainingKey: 'remaining' } | null
> = {
  resume_pass: { totalKey: 'monthlyLimit', usedKey: 'usedThisMonth', remainingKey: 'remaining' },
  title_translator: null, // check hasFeature only — no credit tracking in usePlanAccess
};

export function usePlanTools() {
  const { user } = useAuth();
  const planAccess = usePlanAccess();

  return useQuery({
    queryKey: ['plan-tools', user?.id, planAccess.planId],
    queryFn: async (): Promise<PlanTool[]> => {
      if (!user?.id) return [];

      // Fetch all hub_services with plan_feature_key set
      const { data: services, error } = await supabase
        .from('hub_services')
        .select('*')
        .not('plan_feature_key', 'is', null)
        .eq('is_visible_in_hub', true);

      if (error) throw error;
      if (!services?.length) return [];

      // Filter to those where the user's plan has the feature enabled
      const tools: PlanTool[] = (services as HubService[])
        .filter((s) => {
          if (!s.plan_feature_key) return false;
          return planAccess.hasFeature(s.plan_feature_key as Parameters<typeof planAccess.hasFeature>[0]);
        })
        .map((s) => {
          const featureKey = s.plan_feature_key!;

          // resume_pass: use full credit tracking from planAccess
          if (featureKey === 'resume_pass') {
            const total = planAccess.getLimit('resume_pass');
            const used = planAccess.getUsage('resume_pass');
            const remaining = planAccess.getRemaining('resume_pass');
            return {
              service: s,
              credits_total: total,
              credits_used: used,
              credits_remaining: remaining,
              is_unlimited: total >= 999,
            };
          }

          // title_translator: unlimited once plan enables it
          return {
            service: s,
            credits_total: 0,
            credits_used: 0,
            credits_remaining: 0,
            is_unlimited: true,
          };
        });

      return tools;
    },
    enabled: !!user?.id && !planAccess.isLoading,
    staleTime: 60_000,
  });
}
