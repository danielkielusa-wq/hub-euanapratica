import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, subDays, startOfWeek, startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

// ─── Types ────────────────────────────────────────────────────────────

export interface CostSummary {
  today: number;
  thisWeek: number;
  thisMonth: number;
  lastMonth: number;
  totalRequests: number;
}

export interface DailyCostPoint {
  date: string;
  cost: number;
  requests: number;
}

export interface CostByFunction {
  edge_function: string;
  cost: number;
  requests: number;
  avg_cost: number;
}

export interface CostByProvider {
  provider: string;
  cost: number;
  requests: number;
  input_tokens: number;
  output_tokens: number;
}

export interface TopUserCost {
  user_id: string;
  full_name: string | null;
  email: string | null;
  cost: number;
  requests: number;
}

export type PeriodPreset = 'today' | '7d' | '30d';

// ─── Hook ─────────────────────────────────────────────────────────────

export function useAdminCosts() {
  const [period, setPeriod] = useState<PeriodPreset>('30d');

  const getDateRange = () => {
    const now = new Date();
    switch (period) {
      case 'today':
        return { from: startOfDay(now), to: now };
      case '7d':
        return { from: subDays(now, 7), to: now };
      case '30d':
        return { from: subDays(now, 30), to: now };
    }
  };

  // 1. Summary cards
  const summaryQuery = useQuery<CostSummary>({
    queryKey: ['admin-costs-summary'],
    queryFn: async () => {
      const now = new Date();
      const todayStart = startOfDay(now).toISOString();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 }).toISOString();
      const monthStart = startOfMonth(now).toISOString();
      const lastMonthStart = startOfMonth(subMonths(now, 1)).toISOString();
      const lastMonthEnd = endOfMonth(subMonths(now, 1)).toISOString();

      const { data: logs } = await supabase
        .from('api_cost_logs')
        .select('cost_usd, created_at')
        .gte('created_at', lastMonthStart)
        .order('created_at', { ascending: false });

      const items = (logs || []) as { cost_usd: number | null; created_at: string }[];
      const sumCost = (filtered: typeof items) =>
        filtered.reduce((sum, l) => sum + (Number(l.cost_usd) || 0), 0);

      return {
        today: sumCost(items.filter(l => l.created_at >= todayStart)),
        thisWeek: sumCost(items.filter(l => l.created_at >= weekStart)),
        thisMonth: sumCost(items.filter(l => l.created_at >= monthStart)),
        lastMonth: sumCost(items.filter(l => l.created_at >= lastMonthStart && l.created_at <= lastMonthEnd)),
        totalRequests: items.filter(l => l.created_at >= monthStart).length,
      };
    },
    staleTime: 60_000,
  });

  // 2. Daily cost trend
  const range = getDateRange();
  const dailyQuery = useQuery<DailyCostPoint[]>({
    queryKey: ['admin-costs-daily', period],
    queryFn: async () => {
      const { data: logs } = await supabase
        .from('api_cost_logs')
        .select('cost_usd, created_at')
        .gte('created_at', range.from.toISOString())
        .lte('created_at', range.to.toISOString())
        .order('created_at');

      const dayMap: Record<string, { cost: number; requests: number }> = {};
      ((logs || []) as { cost_usd: number | null; created_at: string }[]).forEach(l => {
        const day = format(new Date(l.created_at), 'yyyy-MM-dd');
        if (!dayMap[day]) dayMap[day] = { cost: 0, requests: 0 };
        dayMap[day].cost += Number(l.cost_usd) || 0;
        dayMap[day].requests += 1;
      });

      return Object.entries(dayMap)
        .map(([date, v]) => ({ date, ...v }))
        .sort((a, b) => a.date.localeCompare(b.date));
    },
  });

  // 3. By function
  const byFunctionQuery = useQuery<CostByFunction[]>({
    queryKey: ['admin-costs-by-function', period],
    queryFn: async () => {
      const { data: logs } = await supabase
        .from('api_cost_logs')
        .select('edge_function, cost_usd')
        .gte('created_at', range.from.toISOString())
        .lte('created_at', range.to.toISOString());

      const map: Record<string, { cost: number; requests: number }> = {};
      ((logs || []) as { edge_function: string; cost_usd: number | null }[]).forEach(l => {
        if (!map[l.edge_function]) map[l.edge_function] = { cost: 0, requests: 0 };
        map[l.edge_function].cost += Number(l.cost_usd) || 0;
        map[l.edge_function].requests += 1;
      });

      return Object.entries(map)
        .map(([edge_function, v]) => ({
          edge_function,
          cost: v.cost,
          requests: v.requests,
          avg_cost: v.requests > 0 ? v.cost / v.requests : 0,
        }))
        .sort((a, b) => b.cost - a.cost);
    },
  });

  // 4. By provider
  const byProviderQuery = useQuery<CostByProvider[]>({
    queryKey: ['admin-costs-by-provider', period],
    queryFn: async () => {
      const { data: logs } = await supabase
        .from('api_cost_logs')
        .select('provider, cost_usd, input_tokens, output_tokens')
        .gte('created_at', range.from.toISOString())
        .lte('created_at', range.to.toISOString());

      const map: Record<string, CostByProvider> = {};
      ((logs || []) as { provider: string; cost_usd: number | null; input_tokens: number | null; output_tokens: number | null }[]).forEach(l => {
        if (!map[l.provider]) map[l.provider] = { provider: l.provider, cost: 0, requests: 0, input_tokens: 0, output_tokens: 0 };
        map[l.provider].cost += Number(l.cost_usd) || 0;
        map[l.provider].requests += 1;
        map[l.provider].input_tokens += l.input_tokens || 0;
        map[l.provider].output_tokens += l.output_tokens || 0;
      });

      return Object.values(map).sort((a, b) => b.cost - a.cost);
    },
  });

  // 5. Top users
  const topUsersQuery = useQuery<TopUserCost[]>({
    queryKey: ['admin-costs-top-users', period],
    queryFn: async () => {
      const { data: logs } = await supabase
        .from('api_cost_logs')
        .select('user_id, cost_usd')
        .gte('created_at', range.from.toISOString())
        .lte('created_at', range.to.toISOString())
        .not('user_id', 'is', null);

      const map: Record<string, { cost: number; requests: number }> = {};
      ((logs || []) as { user_id: string | null; cost_usd: number | null }[]).forEach(l => {
        if (!l.user_id) return;
        if (!map[l.user_id]) map[l.user_id] = { cost: 0, requests: 0 };
        map[l.user_id].cost += Number(l.cost_usd) || 0;
        map[l.user_id].requests += 1;
      });

      const topEntries = Object.entries(map)
        .sort(([, a], [, b]) => b.cost - a.cost)
        .slice(0, 10);

      if (topEntries.length === 0) return [];

      const userIds = topEntries.map(([uid]) => uid);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

      return topEntries.map(([user_id, v]) => ({
        user_id,
        full_name: (profileMap.get(user_id) as any)?.full_name || null,
        email: (profileMap.get(user_id) as any)?.email || null,
        ...v,
      }));
    },
  });

  const refetchAll = () => {
    summaryQuery.refetch();
    dailyQuery.refetch();
    byFunctionQuery.refetch();
    byProviderQuery.refetch();
    topUsersQuery.refetch();
  };

  return {
    period,
    setPeriod,
    summary: summaryQuery.data ?? null,
    isLoadingSummary: summaryQuery.isLoading,
    dailyCosts: dailyQuery.data ?? [],
    isLoadingDaily: dailyQuery.isLoading,
    byFunction: byFunctionQuery.data ?? [],
    isLoadingByFunction: byFunctionQuery.isLoading,
    byProvider: byProviderQuery.data ?? [],
    isLoadingByProvider: byProviderQuery.isLoading,
    topUsers: topUsersQuery.data ?? [],
    isLoadingTopUsers: topUsersQuery.isLoading,
    refetchAll,
  };
}
