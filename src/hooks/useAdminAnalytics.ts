import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, subDays, format } from 'date-fns';

// ─── Types ────────────────────────────────────────────────────────────

export type AnalyticsPeriod = 'today' | '7d' | '30d' | '90d';

export interface GrowthSeries {
  date: string;
  leads: number;
  signups: number;
}

export interface AnalyticsGrowth {
  dailySeries: GrowthSeries[];
  totalLeads: number;
  totalSignups: number;
}

export interface PlanBreakdown {
  plan: string;
  count: number;
  revenue: number;
}

export interface AnalyticsRevenue {
  activeSubscriptions: number;
  mrrEstimate: number;
  churnPercent30d: number;
  churnCount30d: number;
  newSubsToday: number;
  byPlan: PlanBreakdown[];
}

export interface ToolUsageItem {
  appId: string;
  label: string;
  count: number;
  credits: number;
}

export interface AnalyticsToolUsage {
  totalCredits: number;
  byApp: ToolUsageItem[];
}

export interface TemperatureItem {
  temperature: string;
  count: number;
}

export interface AnalyticsOps {
  whatsappOutbound: number;
  whatsappInbound: number;
  whatsappOptouts: number;
  emailSent: number;
  emailSuccessRate: number;
  bookingsTotal: number;
  bookingsCompleted: number;
  bookingsNoShowRate30d: number;
  communityPosts: number;
  communityComments: number;
  communityLikes: number;
}

export interface TopPageItem {
  path: string;
  count: number;
}

export interface RecentActivityItem {
  type: 'lead' | 'signup' | 'booking' | 'subscription';
  label: string;
  time: string;
  rawTime: string;
}

export interface DailySnapshot {
  id: string;
  snapshot_date: string;
  status: string;
  ai_summary: string | null;
  created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────

const APP_LABELS: Record<string, string> = {
  curriculo_usa: 'ResumePass AI',
  title_translator: 'Tradutor de Títulos',
  prime_jobs: 'Prime Jobs',
};

function getDateRange(period: AnalyticsPeriod) {
  const now = new Date();
  switch (period) {
    case 'today':
      return { from: startOfDay(now), to: now };
    case '7d':
      return { from: subDays(now, 7), to: now };
    case '30d':
      return { from: subDays(now, 30), to: now };
    case '90d':
      return { from: subDays(now, 90), to: now };
  }
}

function groupByDay(items: { created_at: string }[], key: string) {
  const map: Record<string, number> = {};
  for (const item of items) {
    const day = format(new Date(item.created_at), 'yyyy-MM-dd');
    map[day] = (map[day] || 0) + 1;
  }
  return map;
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

// ─── Hook ─────────────────────────────────────────────────────────────

export function useAdminAnalytics() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('7d');

  const range = getDateRange(period);
  const fromISO = range.from.toISOString();
  const toISO = range.to.toISOString();

  // Q1: Growth — leads + signups daily series
  const growthQuery = useQuery<AnalyticsGrowth>({
    queryKey: ['admin-analytics-growth', period],
    queryFn: async () => {
      const [leadsResult, signupsResult] = await Promise.all([
        supabase.from('career_evaluations')
          .select('created_at')
          .gte('created_at', fromISO)
          .lte('created_at', toISO)
          .order('created_at'),
        supabase.from('profiles')
          .select('created_at')
          .gte('created_at', fromISO)
          .lte('created_at', toISO)
          .order('created_at'),
      ]);

      const leadsData = leadsResult.data || [];
      const signupsData = signupsResult.data || [];

      const leadsByDay = groupByDay(leadsData, 'created_at');
      const signupsByDay = groupByDay(signupsData, 'created_at');

      const allDays = new Set([...Object.keys(leadsByDay), ...Object.keys(signupsByDay)]);
      const dailySeries = Array.from(allDays)
        .sort()
        .map(date => ({
          date,
          leads: leadsByDay[date] || 0,
          signups: signupsByDay[date] || 0,
        }));

      return {
        dailySeries,
        totalLeads: leadsData.length,
        totalSignups: signupsData.length,
      };
    },
    staleTime: 120_000,
  });

  // Q2: Revenue — active subscriptions, MRR, churn
  const revenueQuery = useQuery<AnalyticsRevenue>({
    queryKey: ['admin-analytics-revenue'],
    queryFn: async () => {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();

      const [activeSubs, plans, newSubsToday, cancelledSubs] = await Promise.all([
        supabase.from('user_subscriptions')
          .select('plan_id, billing_cycle')
          .eq('status', 'active'),
        supabase.from('plans')
          .select('id, name, price, price_annual'),
        supabase.from('user_subscriptions')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active')
          .gte('starts_at', startOfDay(new Date()).toISOString()),
        supabase.from('user_subscriptions')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'cancelled')
          .gte('canceled_at', thirtyDaysAgo),
      ]);

      const planMap: Record<string, { name: string; price: number; priceAnnual: number | null }> = {};
      for (const p of plans.data || []) {
        planMap[p.id] = { name: p.name, price: p.price || 0, priceAnnual: p.price_annual };
      }

      let mrr = 0;
      const byPlanMap: Record<string, { count: number; revenue: number }> = {};

      for (const sub of activeSubs.data || []) {
        const plan = planMap[sub.plan_id];
        if (!plan) continue;
        const monthly = sub.billing_cycle === 'annual' && plan.priceAnnual
          ? plan.priceAnnual / 12
          : plan.price;
        mrr += monthly;
        if (!byPlanMap[plan.name]) byPlanMap[plan.name] = { count: 0, revenue: 0 };
        byPlanMap[plan.name].count++;
        byPlanMap[plan.name].revenue += monthly;
      }

      const activeTotal = activeSubs.data?.length ?? 0;
      const cancelledTotal = cancelledSubs.count ?? 0;
      const churnPercent = activeTotal + cancelledTotal > 0
        ? Math.round((cancelledTotal / (activeTotal + cancelledTotal)) * 1000) / 10
        : 0;

      return {
        activeSubscriptions: activeTotal,
        mrrEstimate: Math.round(mrr * 100) / 100,
        churnPercent30d: churnPercent,
        churnCount30d: cancelledTotal,
        newSubsToday: newSubsToday.count ?? 0,
        byPlan: Object.entries(byPlanMap).map(([plan, v]) => ({ plan, ...v })),
      };
    },
    staleTime: 120_000,
  });

  // Q3: Tool usage by app_id
  const toolUsageQuery = useQuery<AnalyticsToolUsage>({
    queryKey: ['admin-analytics-tools', period],
    queryFn: async () => {
      const { data } = await supabase
        .from('usage_logs')
        .select('app_id, credits_used')
        .gte('created_at', fromISO)
        .lte('created_at', toISO);

      const byApp: Record<string, { count: number; credits: number }> = {};
      let total = 0;
      for (const row of data || []) {
        const appId = row.app_id || 'unknown';
        if (!byApp[appId]) byApp[appId] = { count: 0, credits: 0 };
        byApp[appId].count++;
        const credits = (row as any).credits_used || 1;
        byApp[appId].credits += credits;
        total += credits;
      }

      return {
        totalCredits: total,
        byApp: Object.entries(byApp)
          .map(([appId, v]) => ({ appId, label: APP_LABELS[appId] || appId, ...v }))
          .sort((a, b) => b.credits - a.credits),
      };
    },
    staleTime: 120_000,
  });

  // Q4: Lead temperature distribution
  const temperatureQuery = useQuery<TemperatureItem[]>({
    queryKey: ['admin-analytics-temp', period],
    queryFn: async () => {
      const { data } = await supabase
        .from('career_evaluations')
        .select('lead_temperature')
        .eq('processing_status', 'completed')
        .gte('created_at', fromISO)
        .lte('created_at', toISO)
        .not('lead_temperature', 'is', null);

      const counts: Record<string, number> = {};
      for (const row of data || []) {
        const temp = row.lead_temperature || 'unknown';
        counts[temp] = (counts[temp] || 0) + 1;
      }

      const order = ['muito-quente', 'quente', 'morno', 'frio'];
      return order
        .filter(t => counts[t])
        .map(temperature => ({ temperature, count: counts[temperature] }));
    },
    staleTime: 120_000,
  });

  // Q5: Operations — WhatsApp + Email + Bookings + Community
  const opsQuery = useQuery<AnalyticsOps>({
    queryKey: ['admin-analytics-ops', period],
    queryFn: async () => {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();

      const [waLogs, emailLogs, bookings, bookings30d, posts, comments, likes] = await Promise.all([
        supabase.from('whatsapp_logs').select('direction')
          .gte('created_at', fromISO).lte('created_at', toISO),
        supabase.from('email_logs').select('status')
          .gte('created_at', fromISO).lte('created_at', toISO),
        supabase.from('bookings').select('status')
          .gte('created_at', fromISO).lte('created_at', toISO),
        supabase.from('bookings').select('status')
          .gte('created_at', thirtyDaysAgo),
        supabase.from('community_posts').select('id', { count: 'exact', head: true })
          .gte('created_at', fromISO).lte('created_at', toISO),
        supabase.from('community_comments').select('id', { count: 'exact', head: true })
          .gte('created_at', fromISO).lte('created_at', toISO),
        supabase.from('community_likes').select('id', { count: 'exact', head: true })
          .gte('created_at', fromISO).lte('created_at', toISO),
      ]);

      const waData = waLogs.data || [];
      const emailData = emailLogs.data || [];
      const bookingsData = bookings.data || [];
      const bookings30dData = bookings30d.data || [];

      const emailSent = emailData.length;
      const emailSuccess = emailData.filter((e: any) => e.status === 'sent' || e.status === 'success').length;
      const noShow30d = bookings30dData.filter((b: any) => b.status === 'no_show').length;

      // WhatsApp optouts in period
      const { count: optoutsCount } = await supabase
        .from('whatsapp_optouts')
        .select('phone', { count: 'exact', head: true })
        .gte('opted_out_at', fromISO)
        .lte('opted_out_at', toISO);

      return {
        whatsappOutbound: waData.filter((w: any) => w.direction === 'outbound').length,
        whatsappInbound: waData.filter((w: any) => w.direction === 'inbound').length,
        whatsappOptouts: optoutsCount ?? 0,
        emailSent,
        emailSuccessRate: emailSent > 0 ? Math.round((emailSuccess / emailSent) * 1000) / 10 : 100,
        bookingsTotal: bookingsData.length,
        bookingsCompleted: bookingsData.filter((b: any) => b.status === 'completed').length,
        bookingsNoShowRate30d: bookings30dData.length > 0
          ? Math.round((noShow30d / bookings30dData.length) * 1000) / 10
          : 0,
        communityPosts: posts.count ?? 0,
        communityComments: comments.count ?? 0,
        communityLikes: likes.count ?? 0,
      };
    },
    staleTime: 120_000,
  });

  // Q6: Top pages from analytics_events
  const topPagesQuery = useQuery<TopPageItem[]>({
    queryKey: ['admin-analytics-pages', period],
    queryFn: async () => {
      const { data } = await supabase
        .from('analytics_events')
        .select('metadata')
        .eq('event_type', 'page_view')
        .gte('created_at', fromISO)
        .lte('created_at', toISO)
        .limit(2000);

      const counts: Record<string, number> = {};
      for (const row of data || []) {
        const meta = row.metadata as any;
        const path = meta?.path || meta?.page || 'unknown';
        counts[path] = (counts[path] || 0) + 1;
      }

      return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([path, count]) => ({ path, count }));
    },
    staleTime: 120_000,
  });

  // Q7: Recent activity feed (last 20 across sources)
  const activityQuery = useQuery<RecentActivityItem[]>({
    queryKey: ['admin-analytics-activity'],
    queryFn: async () => {
      const [leads, signups, bookingsRecent, subsRecent] = await Promise.all([
        supabase.from('career_evaluations')
          .select('name, created_at')
          .order('created_at', { ascending: false })
          .limit(10),
        supabase.from('profiles')
          .select('full_name, created_at')
          .order('created_at', { ascending: false })
          .limit(10),
        supabase.from('bookings')
          .select('status, created_at')
          .order('created_at', { ascending: false })
          .limit(10),
        supabase.from('user_subscriptions')
          .select('status, created_at')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      const items: RecentActivityItem[] = [];

      for (const l of leads.data || []) {
        items.push({
          type: 'lead',
          label: `Novo lead: ${l.name || 'Anônimo'}`,
          time: formatRelativeTime(l.created_at),
          rawTime: l.created_at,
        });
      }
      for (const s of signups.data || []) {
        items.push({
          type: 'signup',
          label: `Cadastro: ${s.full_name || 'Usuário'}`,
          time: formatRelativeTime(s.created_at),
          rawTime: s.created_at,
        });
      }
      for (const b of bookingsRecent.data || []) {
        items.push({
          type: 'booking',
          label: `Agendamento ${b.status}`,
          time: formatRelativeTime(b.created_at),
          rawTime: b.created_at,
        });
      }
      for (const sub of subsRecent.data || []) {
        items.push({
          type: 'subscription',
          label: 'Nova assinatura ativa',
          time: formatRelativeTime(sub.created_at),
          rawTime: sub.created_at,
        });
      }

      return items
        .sort((a, b) => new Date(b.rawTime).getTime() - new Date(a.rawTime).getTime())
        .slice(0, 20);
    },
    staleTime: 60_000,
  });

  // Q8: Last daily snapshot (AI summary)
  const snapshotQuery = useQuery<DailySnapshot | null>({
    queryKey: ['admin-analytics-snapshot'],
    queryFn: async () => {
      const { data } = await supabase
        .from('daily_analytics_snapshots')
        .select('id, snapshot_date, status, ai_summary, created_at')
        .eq('status', 'completed')
        .order('snapshot_date', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data ?? null;
    },
    staleTime: 300_000,
  });

  const refetchAll = () => {
    growthQuery.refetch();
    revenueQuery.refetch();
    toolUsageQuery.refetch();
    temperatureQuery.refetch();
    opsQuery.refetch();
    topPagesQuery.refetch();
    activityQuery.refetch();
    snapshotQuery.refetch();
  };

  return {
    period,
    setPeriod,
    growth: growthQuery.data ?? null,
    isLoadingGrowth: growthQuery.isLoading,
    revenue: revenueQuery.data ?? null,
    isLoadingRevenue: revenueQuery.isLoading,
    toolUsage: toolUsageQuery.data ?? null,
    isLoadingTools: toolUsageQuery.isLoading,
    temperature: temperatureQuery.data ?? [],
    isLoadingTemp: temperatureQuery.isLoading,
    ops: opsQuery.data ?? null,
    isLoadingOps: opsQuery.isLoading,
    topPages: topPagesQuery.data ?? [],
    isLoadingPages: topPagesQuery.isLoading,
    activity: activityQuery.data ?? [],
    isLoadingActivity: activityQuery.isLoading,
    lastSnapshot: snapshotQuery.data ?? null,
    refetchAll,
  };
}
