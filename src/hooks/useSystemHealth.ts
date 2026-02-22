import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ─── Types (mirror the health-check Edge Function) ───────────────────
export interface CheckResult {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  duration: number;
  details?: Record<string, unknown>;
  error?: string;
}

export interface HealthReport {
  timestamp: string;
  environment: string;
  total_checks: number;
  passed: number;
  warned: number;
  failed: number;
  total_duration_ms: number;
  status: 'healthy' | 'degraded' | 'down';
  checks: CheckResult[];
}

export interface ApiIntegration {
  api_key: string;
  name: string;
  is_active: boolean;
  testResult?: { success: boolean; message: string } | null;
  isTesting?: boolean;
}

export interface EmailMetrics {
  sent24h: number;
  failed24h: number;
  skipped24h: number;
  sent7d: number;
  failed7d: number;
  successRate: number;
  byTemplate: { template_name: string; sent: number; failed: number }[];
}

export interface WebhookMetrics {
  received24h: number;
  processed24h: number;
  errors24h: number;
  byEventType: { event_type: string; count: number }[];
  recentEvents: { id: string; event_type: string; status: string; created_at: string }[];
}

// ─── Hook ────────────────────────────────────────────────────────────

export function useSystemHealth() {
  const [apiTests, setApiTests] = useState<Record<string, ApiIntegration['testResult']>>({});
  const [testingApi, setTestingApi] = useState<string | null>(null);

  // 1. Health check via existing Edge Function
  //    Uses raw fetch because the function returns 207 (degraded) or 503 (down)
  //    and supabase.functions.invoke treats non-2xx as errors, discarding the body.
  //    Health-check doesn't require user auth, so we always use the anon key
  //    (avoids 401 when the session JWT is expired).
  const healthQuery = useQuery<HealthReport | null>({
    queryKey: ['system-health-check'],
    queryFn: async () => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const res = await fetch(`${supabaseUrl}/functions/v1/health-check`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${anonKey}`,
          'apikey': anonKey,
          'Content-Type': 'application/json',
        },
      });

      const body = await res.json().catch(() => null);
      if (!body || typeof body !== 'object' || !body.checks) {
        throw new Error(
          body?.message
            ? `Health check: ${body.message}`
            : `Health check retornou resposta inválida (HTTP ${res.status})`
        );
      }
      return body as HealthReport;
    },
    staleTime: 5 * 60 * 1000, // 5 min cache
    retry: false,
    enabled: false, // manual trigger only
  });

  // 2. API integrations list from existing api_configs table
  const apisQuery = useQuery<ApiIntegration[]>({
    queryKey: ['system-health-apis'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_configs')
        .select('api_key, name, is_active')
        .order('name');
      if (error) throw error;
      return (data || []) as ApiIntegration[];
    },
  });

  // 3. Email metrics from new email_logs table
  const emailQuery = useQuery<EmailMetrics>({
    queryKey: ['system-health-emails'],
    queryFn: async () => {
      const now = new Date();
      const h24 = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      // Single query for 7d (includes 24h subset)
      const { data: logs7d } = await supabase
        .from('email_logs')
        .select('status, template_name, created_at')
        .gte('created_at', d7);

      const all = logs7d || [];
      const logs24h = all.filter(l => l.created_at >= h24);

      const sent24h = logs24h.filter(l => l.status === 'sent').length;
      const failed24h = logs24h.filter(l => l.status === 'failed').length;
      const skipped24h = logs24h.filter(l => l.status === 'skipped').length;

      const sent7d = all.filter(l => l.status === 'sent').length;
      const failed7d = all.filter(l => l.status === 'failed').length;
      const total7d = sent7d + failed7d;
      const successRate = total7d > 0 ? Math.round((sent7d / total7d) * 100) : 100;

      // By template (last 7d)
      const tMap: Record<string, { sent: number; failed: number }> = {};
      all.forEach((l: any) => {
        if (!tMap[l.template_name]) tMap[l.template_name] = { sent: 0, failed: 0 };
        if (l.status === 'sent') tMap[l.template_name].sent++;
        if (l.status === 'failed') tMap[l.template_name].failed++;
      });

      const byTemplate = Object.entries(tMap)
        .map(([template_name, counts]) => ({ template_name, ...counts }))
        .sort((a, b) => (b.sent + b.failed) - (a.sent + a.failed));

      return { sent24h, failed24h, skipped24h, sent7d, failed7d, successRate, byTemplate };
    },
  });

  // 4. Webhook / payment metrics from existing payment_logs table
  const webhookQuery = useQuery<WebhookMetrics>({
    queryKey: ['system-health-webhooks'],
    queryFn: async () => {
      const h24 = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { data: logs24h } = await supabase
        .from('payment_logs')
        .select('id, event_type, status, created_at')
        .gte('created_at', h24)
        .order('created_at', { ascending: false });

      const items = logs24h || [];
      const received24h = items.length;
      const processed24h = items.filter((l: any) => l.status === 'processed').length;
      const errors24h = items.filter((l: any) => ['error_no_email', 'partial'].includes(l.status)).length;

      // By event type
      const etMap: Record<string, number> = {};
      items.forEach((l: any) => {
        etMap[l.event_type] = (etMap[l.event_type] || 0) + 1;
      });
      const byEventType = Object.entries(etMap)
        .map(([event_type, count]) => ({ event_type, count }))
        .sort((a, b) => b.count - a.count);

      // Recent 10
      const recentEvents = items.slice(0, 10).map((l: any) => ({
        id: l.id,
        event_type: l.event_type,
        status: l.status,
        created_at: l.created_at,
      }));

      return { received24h, processed24h, errors24h, byEventType, recentEvents };
    },
  });

  // Test individual API connection via existing test-api-connection Edge Function
  //   Uses raw fetch (invoke can discard non-2xx bodies / return Blob).
  //   Requires admin auth — refreshSession() ensures a fresh JWT.
  const testApiConnection = useCallback(async (apiKey: string) => {
    setTestingApi(apiKey);
    try {
      // refreshSession() forces a token refresh (avoids stale/expired JWTs)
      const { data: { session } } = await supabase.auth.refreshSession();
      const token = session?.access_token;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      if (!token) {
        setApiTests(prev => ({ ...prev, [apiKey]: { success: false, message: 'Sessão expirada. Faça login novamente.' } }));
        return;
      }

      const res = await fetch(`${supabaseUrl}/functions/v1/test-api-connection`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': anonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ api_key: apiKey }),
      });

      const body = await res.json().catch(() => null);

      if (!body || typeof body !== 'object') {
        setApiTests(prev => ({ ...prev, [apiKey]: { success: false, message: `HTTP ${res.status} — resposta inválida` } }));
      } else if (res.ok) {
        setApiTests(prev => ({
          ...prev,
          [apiKey]: {
            success: Boolean(body.success),
            message: String(body.message || 'Sem mensagem'),
          },
        }));
      } else {
        setApiTests(prev => ({
          ...prev,
          [apiKey]: {
            success: false,
            message: String(body.error || body.message || `HTTP ${res.status}`),
          },
        }));
      }
    } catch (err) {
      setApiTests(prev => ({
        ...prev,
        [apiKey]: { success: false, message: err instanceof Error ? err.message : 'Erro desconhecido' },
      }));
    } finally {
      setTestingApi(null);
    }
  }, []);

  const runHealthCheck = useCallback(() => {
    healthQuery.refetch();
  }, [healthQuery]);

  const refetchAll = useCallback(() => {
    emailQuery.refetch();
    webhookQuery.refetch();
    apisQuery.refetch();
  }, [emailQuery, webhookQuery, apisQuery]);

  return {
    // Health check
    healthReport: healthQuery.data ?? null,
    isLoadingHealth: healthQuery.isFetching,
    healthError: healthQuery.error ? (healthQuery.error as Error).message : null,
    runHealthCheck,

    // APIs
    apis: apisQuery.data ?? [],
    isLoadingApis: apisQuery.isLoading,
    apiTests,
    testingApi,
    testApiConnection,

    // Email metrics
    emailMetrics: emailQuery.data ?? null,
    isLoadingEmails: emailQuery.isLoading,

    // Webhook metrics
    webhookMetrics: webhookQuery.data ?? null,
    isLoadingWebhooks: webhookQuery.isLoading,

    // Global
    refetchAll,
  };
}
