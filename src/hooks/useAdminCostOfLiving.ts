import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { CityData } from '@/pages/cost-of-living/types';

interface COLLead {
  id: string;
  name: string | null;
  email: string;
  city_slug: string | null;
  salary: number | null;
  family_size: string | null;
  children: number;
  lifestyle: string | null;
  field: string | null;
  result_leftover: number | null;
  result_coverage: number | null;
  created_at: string;
}

export function useAdminCostOfLiving() {
  const { toast } = useToast();
  const [cities, setCities] = useState<CityData[]>([]);
  const [leads, setLeads] = useState<COLLead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);
  const [isSaving, setIsSaving] = useState<string | null>(null);

  // ── Fetch all cities (admin sees disabled too) ──
  const fetchCities = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('cost_of_living_cities')
      .select('*')
      .order('city_name');

    if (error) {
      toast({ title: 'Erro ao carregar cidades', description: error.message, variant: 'destructive' });
    } else if (data) {
      setCities(data.map(c => ({
        ...c,
        base_rent: Number(c.base_rent),
        base_food: Number(c.base_food),
        base_transport: Number(c.base_transport),
        base_other: Number(c.base_other),
        latitude: Number(c.latitude),
        longitude: Number(c.longitude),
        salaries_by_field: (c.salaries_by_field || {}) as Record<string, number>,
      })));
    }
    setIsLoading(false);
  }, [toast]);

  // ── Create city ──
  const createCity = useCallback(async (city: Omit<CityData, 'id' | 'enabled'>) => {
    setIsSaving('new');
    const { error } = await supabase
      .from('cost_of_living_cities')
      .insert({ ...city, enabled: true });

    if (error) {
      toast({ title: 'Erro ao criar cidade', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Cidade criada com sucesso' });
      await fetchCities();
    }
    setIsSaving(null);
  }, [fetchCities, toast]);

  // ── Update city ──
  const updateCity = useCallback(async (id: string, updates: Partial<CityData>) => {
    setIsSaving(id);
    const { error } = await supabase
      .from('cost_of_living_cities')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast({ title: 'Erro ao atualizar cidade', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Cidade atualizada' });
      await fetchCities();
    }
    setIsSaving(null);
  }, [fetchCities, toast]);

  // ── Delete city ──
  const deleteCity = useCallback(async (id: string) => {
    setIsSaving(id);
    const { error } = await supabase
      .from('cost_of_living_cities')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: 'Erro ao excluir cidade', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Cidade excluída' });
      await fetchCities();
    }
    setIsSaving(null);
  }, [fetchCities, toast]);

  // ── Toggle enabled ──
  const toggleCity = useCallback(async (id: string, enabled: boolean) => {
    await updateCity(id, { enabled } as any);
  }, [updateCity]);

  // ── Fetch leads ──
  const fetchLeads = useCallback(async (filters?: { search?: string; citySlug?: string; dateFrom?: string; dateTo?: string }) => {
    setIsLoadingLeads(true);
    let query = supabase
      .from('cost_of_living_leads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);

    if (filters?.search) {
      query = query.or(`email.ilike.%${filters.search}%,name.ilike.%${filters.search}%`);
    }
    if (filters?.citySlug) {
      query = query.eq('city_slug', filters.citySlug);
    }
    if (filters?.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }
    if (filters?.dateTo) {
      query = query.lte('created_at', filters.dateTo + 'T23:59:59');
    }

    const { data, error } = await query;

    if (error) {
      toast({ title: 'Erro ao carregar leads', description: error.message, variant: 'destructive' });
    } else {
      setLeads((data || []) as COLLead[]);
    }
    setIsLoadingLeads(false);
  }, [toast]);

  // ── Update app_configs ──
  const updateConfig = useCallback(async (key: string, value: any) => {
    setIsSaving(key);
    const { error } = await supabase
      .from('app_configs')
      .update({ value: JSON.stringify(value) })
      .eq('key', key);

    if (error) {
      toast({ title: 'Erro ao atualizar configuração', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Configuração atualizada' });
    }
    setIsSaving(null);
  }, [toast]);

  useEffect(() => { fetchCities(); }, [fetchCities]);

  return {
    cities, leads,
    isLoading, isLoadingLeads, isSaving,
    fetchCities, createCity, updateCity, deleteCity, toggleCity,
    fetchLeads, updateConfig,
  };
}
