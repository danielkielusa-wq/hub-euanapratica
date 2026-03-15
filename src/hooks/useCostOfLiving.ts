import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { CityData, COLConfigs, FamilyMultipliers, LifestyleMultipliers, SaoPauloBaseline } from '@/pages/cost-of-living/types';

// ── Fetch enabled cities (public) ──
export function useCostOfLivingCities() {
  const [cities, setCities] = useState<CityData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCities = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('cost_of_living_cities')
      .select('*')
      .eq('enabled', true)
      .order('city_name');

    if (!error && data) {
      setCities(data.map(c => ({
        ...c,
        base_rent: Number(c.base_rent),
        base_food: Number(c.base_food),
        base_transport: Number(c.base_transport),
        base_health: Number(c.base_health),
        base_other: Number(c.base_other),
        latitude: Number(c.latitude),
        longitude: Number(c.longitude),
        salaries_by_field: (c.salaries_by_field || {}) as Record<string, number>,
      })));
    }
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchCities(); }, [fetchCities]);

  return { cities, isLoading, refetch: fetchCities };
}

// ── Fetch configs from app_configs (public) ──
export function useCostOfLivingConfigs() {
  const [configs, setConfigs] = useState<COLConfigs | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const keys = ['col_family_multipliers', 'col_lifestyle_multipliers', 'col_fields', 'col_sao_paulo_baseline'];
      const { data, error } = await supabase
        .from('app_configs')
        .select('key, value')
        .in('key', keys);

      if (!error && data) {
        const map: Record<string, any> = {};
        data.forEach(row => {
          try { map[row.key] = typeof row.value === 'string' ? JSON.parse(row.value) : row.value; }
          catch { map[row.key] = row.value; }
        });

        setConfigs({
          familyMultipliers: map.col_family_multipliers as FamilyMultipliers,
          lifestyleMultipliers: map.col_lifestyle_multipliers as LifestyleMultipliers,
          fields: (map.col_fields || []) as string[],
          saoPauloBaseline: map.col_sao_paulo_baseline as SaoPauloBaseline,
        });
      }
      setIsLoading(false);
    }
    load();
  }, []);

  return { configs, isLoading };
}

// ── Save lead (public, no auth required) ──
export function useCostOfLivingLead() {
  const [isSaving, setIsSaving] = useState(false);

  const saveLead = useCallback(async (lead: {
    name?: string;
    email: string;
    city_slug: string;
    salary: number;
    family_size: string;
    children: number;
    lifestyle: string;
    field: string;
    result_leftover: number;
    result_coverage: number;
  }) => {
    setIsSaving(true);
    try {
      // Capture UTM params from URL
      const params = new URLSearchParams(window.location.search);
      const { error } = await supabase
        .from('cost_of_living_leads')
        .insert({
          ...lead,
          utm_source: params.get('utm_source') || null,
          utm_medium: params.get('utm_medium') || null,
          utm_campaign: params.get('utm_campaign') || null,
        });
      return { error };
    } finally {
      setIsSaving(false);
    }
  }, []);

  return { saveLead, isSaving };
}
