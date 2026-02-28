import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAppConfigs } from '@/hooks/useAppConfigs';
import type { HubService } from '@/types/hub';
import type { Job } from '@/types/jobs';

// ── Config ────────────────────────────────────────────────────

export interface JobUpsellConfig {
  enabled: boolean;
  eligible_service_ids: string[];
  sidebar_service_id: string | null;
  post_apply_service_id: string | null;
}

const DEFAULT_CONFIG: JobUpsellConfig = {
  enabled: false,
  eligible_service_ids: [],
  sidebar_service_id: null,
  post_apply_service_id: null,
};

export function useJobUpsellConfig(): JobUpsellConfig {
  const { getConfigValue, isLoading } = useAppConfigs();
  if (isLoading) return DEFAULT_CONFIG;

  const raw = getConfigValue('prime_jobs_upsell_config');
  if (!raw) return DEFAULT_CONFIG;

  try {
    const parsed = JSON.parse(raw);
    return {
      enabled: parsed.enabled ?? false,
      eligible_service_ids: parsed.eligible_service_ids ?? [],
      sidebar_service_id: parsed.sidebar_service_id ?? null,
      post_apply_service_id: parsed.post_apply_service_id ?? null,
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

// ── Service fetching ──────────────────────────────────────────

export function useUpsellServices(serviceIds: string[]) {
  return useQuery({
    queryKey: ['upsell-services', serviceIds.join(',')],
    queryFn: async () => {
      if (serviceIds.length === 0) return [] as HubService[];
      const { data, error } = await supabase
        .from('hub_services')
        .select('*')
        .in('id', serviceIds)
        .eq('is_visible_in_hub', true);
      if (error) throw error;
      // Preserve order from serviceIds
      const map = new Map((data as HubService[]).map((s) => [s.id, s]));
      return serviceIds.map((id) => map.get(id)).filter(Boolean) as HubService[];
    },
    enabled: serviceIds.length > 0,
    staleTime: 5 * 60_000,
  });
}

export function useUpsellServiceById(serviceId: string | null) {
  return useQuery({
    queryKey: ['upsell-service', serviceId],
    queryFn: async () => {
      if (!serviceId) return null;
      const { data, error } = await supabase
        .from('hub_services')
        .select('*')
        .eq('id', serviceId)
        .maybeSingle();
      if (error) throw error;
      return data as HubService | null;
    },
    enabled: !!serviceId,
    staleTime: 5 * 60_000,
  });
}

// ── Matching logic ────────────────────────────────────────────

export function matchServicesToJob(
  job: Job,
  services: HubService[],
  max = 2
): HubService[] {
  if (services.length === 0) return [];
  if (!job.ai_enrichment) return services.slice(0, max);

  const enrichment = job.ai_enrichment;

  const scored = services.map((service) => {
    let score = 0;
    const searchText = `${service.name} ${service.description ?? ''}`.toLowerCase();

    // English level match
    const englishLevel = enrichment.english_level_required?.toLowerCase() ?? '';
    const needsHighEnglish =
      englishLevel.includes('c1') ||
      englishLevel.includes('c2') ||
      englishLevel.includes('advanced') ||
      englishLevel.includes('fluent') ||
      englishLevel.includes('avançado');
    const isEnglishService =
      searchText.includes('english') ||
      searchText.includes('inglês') ||
      searchText.includes('ingles') ||
      searchText.includes('idioma');
    if (needsHighEnglish && isEnglishService) score += 3;

    // missing_skills_hint keyword match
    if (enrichment.missing_skills_hint) {
      const words = enrichment.missing_skills_hint
        .toLowerCase()
        .split(/[\s,;.]+/)
        .filter((w) => w.length > 3);
      for (const word of words) {
        if (searchText.includes(word)) score += 1;
      }
    }

    // key_skills match
    if (enrichment.key_skills?.length) {
      for (const skill of enrichment.key_skills) {
        if (searchText.includes(skill.toLowerCase())) score += 1;
      }
    }

    // Senior/lead/executive + mentoring service
    const isSeniorRole = ['senior', 'lead', 'executive'].includes(job.experience_level ?? '');
    const isMentoringService =
      service.service_type === 'live_mentoring' ||
      searchText.includes('mentoria') ||
      searchText.includes('coaching') ||
      searchText.includes('1:1');
    if (isSeniorRole && isMentoringService) score += 2;

    return { service, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map((s) => s.service);
}

// ── localStorage dismiss ──────────────────────────────────────

const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function isDismissed(jobId: string, serviceId: string): boolean {
  try {
    const key = `job_upsell_dismissed_${jobId}_${serviceId}`;
    const ts = localStorage.getItem(key);
    if (!ts) return false;
    return Date.now() - parseInt(ts, 10) < DISMISS_DURATION_MS;
  } catch {
    return false;
  }
}

export function dismissUpsell(jobId: string, serviceId: string): void {
  try {
    const key = `job_upsell_dismissed_${jobId}_${serviceId}`;
    localStorage.setItem(key, String(Date.now()));
  } catch {
    // ignore
  }
}
