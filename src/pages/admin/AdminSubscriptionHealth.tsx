import { useState, useEffect } from 'react';
import {
  Activity,
  Users,
  AlertTriangle,
  TrendingDown,
  DollarSign,
  RefreshCw,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface HealthStats {
  active: number;
  trial: number;
  past_due: number;
  grace_period: number;
  cancelled: number;
  inactive: number;
  total: number;
  mrr: number;
  churnRate: number;
}

interface ReconcileResult {
  success: boolean;
  processed: number;
  overdue_to_past_due: number;
  grace_period_expired: number;
  cancelled_expired: number;
  errors: string[];
}

export default function AdminSubscriptionHealth() {
  const { toast } = useToast();
  const [stats, setStats] = useState<HealthStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReconciling, setIsReconciling] = useState(false);
  const [lastReconcile, setLastReconcile] = useState<ReconcileResult | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    setIsLoading(true);

    // Fetch all subscriptions with plan prices
    const { data: subs, error } = await supabase
      .from('user_subscriptions')
      .select('status, plan_id, billing_cycle');

    if (error) {
      console.error('Error fetching stats:', error);
      setIsLoading(false);
      return;
    }

    // Fetch plan prices for MRR calculation
    const { data: plans } = await supabase
      .from('plans')
      .select('id, price, price_annual');

    const planPrices: Record<string, { monthly: number; annual: number }> = {};
    (plans || []).forEach((p: any) => {
      planPrices[p.id] = { monthly: Number(p.price) || 0, annual: Number(p.price_annual) || 0 };
    });

    const counts = {
      active: 0,
      trial: 0,
      past_due: 0,
      grace_period: 0,
      cancelled: 0,
      inactive: 0,
    };

    let mrr = 0;

    (subs || []).forEach((sub: any) => {
      const status = sub.status as keyof typeof counts;
      if (status in counts) counts[status]++;

      // MRR: count active + past_due + grace_period + trial
      if (['active', 'past_due', 'grace_period', 'trial'].includes(sub.status)) {
        const prices = planPrices[sub.plan_id];
        if (prices) {
          if (sub.billing_cycle === 'annual') {
            mrr += prices.annual / 12;
          } else {
            mrr += prices.monthly;
          }
        }
      }
    });

    const total = Object.values(counts).reduce((sum, c) => sum + c, 0);
    const paying = counts.active + counts.past_due + counts.grace_period + counts.trial;
    const churnRate = paying > 0 ? (counts.cancelled / (paying + counts.cancelled)) * 100 : 0;

    setStats({
      ...counts,
      total,
      mrr: Math.round(mrr),
      churnRate: Math.round(churnRate * 10) / 10,
    });
    setIsLoading(false);
  }

  async function handleReconcile() {
    setIsReconciling(true);
    setLastReconcile(null);

    try {
      const response = await supabase.functions.invoke('reconcile-subscriptions');

      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data as ReconcileResult;
      setLastReconcile(result);

      toast({
        title: 'Reconciliação concluída',
        description: `${result.processed} assinatura(s) processada(s).`,
      });

      // Refresh stats
      await fetchStats();
    } catch (err) {
      toast({
        title: 'Erro na reconciliação',
        description: 'Não foi possível executar a reconciliação.',
        variant: 'destructive',
      });
    } finally {
      setIsReconciling(false);
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
              <Activity className="w-6 h-6 text-primary" />
              Saúde das Assinaturas
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Visão geral do estado das assinaturas e reconciliação manual.
            </p>
          </div>
          <Button
            onClick={handleReconcile}
            disabled={isReconciling}
            className="gap-2"
          >
            {isReconciling ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Reconciliar
          </Button>
        </div>

        {/* Key Metrics */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              label="MRR"
              value={`R$ ${stats.mrr.toLocaleString('pt-BR')}`}
              icon={DollarSign}
              color="text-green-600 bg-green-50"
            />
            <MetricCard
              label="Assinantes Ativos"
              value={String(stats.active + stats.trial)}
              icon={Users}
              color="text-blue-600 bg-blue-50"
            />
            <MetricCard
              label="Em Dunning"
              value={String(stats.past_due + stats.grace_period)}
              icon={AlertTriangle}
              color={stats.past_due + stats.grace_period > 0 ? 'text-amber-600 bg-amber-50' : 'text-gray-600 bg-gray-50'}
            />
            <MetricCard
              label="Churn Rate"
              value={`${stats.churnRate}%`}
              icon={TrendingDown}
              color={stats.churnRate > 10 ? 'text-red-600 bg-red-50' : 'text-gray-600 bg-gray-50'}
            />
          </div>
        )}

        {/* Status Breakdown */}
        {stats && (
          <div className="bg-card rounded-[28px] border border-border p-6">
            <h3 className="text-sm font-black text-foreground mb-4">Status por Categoria</h3>
            <div className="space-y-3">
              <StatusRow label="Ativas" count={stats.active} total={stats.total} color="bg-green-500" />
              <StatusRow label="Trial" count={stats.trial} total={stats.total} color="bg-blue-500" />
              <StatusRow label="Past Due" count={stats.past_due} total={stats.total} color="bg-amber-500" />
              <StatusRow label="Grace Period" count={stats.grace_period} total={stats.total} color="bg-orange-500" />
              <StatusRow label="Canceladas" count={stats.cancelled} total={stats.total} color="bg-red-500" />
              <StatusRow label="Inativas" count={stats.inactive} total={stats.total} color="bg-gray-400" />
            </div>
          </div>
        )}

        {/* Reconciliation Results */}
        {lastReconcile && (
          <div className="bg-card rounded-[28px] border border-border p-6 animate-fade-in">
            <h3 className="text-sm font-black text-foreground flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              Resultado da Reconciliação
            </h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-muted/50 rounded-xl p-3 text-center">
                <p className="text-2xl font-black text-foreground">{lastReconcile.overdue_to_past_due}</p>
                <p className="text-xs text-muted-foreground font-medium">Marcadas Past Due</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-3 text-center">
                <p className="text-2xl font-black text-foreground">{lastReconcile.grace_period_expired}</p>
                <p className="text-xs text-muted-foreground font-medium">Grace Expiradas</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-3 text-center">
                <p className="text-2xl font-black text-foreground">{lastReconcile.cancelled_expired}</p>
                <p className="text-xs text-muted-foreground font-medium">Canceladas Expiradas</p>
              </div>
            </div>
            {lastReconcile.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-xs font-bold text-red-800 mb-1">Erros:</p>
                {lastReconcile.errors.map((err, i) => (
                  <p key={i} className="text-xs text-red-700">{err}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-card rounded-[20px] border border-border p-5">
      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-3', color)}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-black text-foreground">{value}</p>
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">{label}</p>
    </div>
  );
}

function StatusRow({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-4">
      <span className="text-sm font-medium text-muted-foreground w-28">{label}</span>
      <div className="flex-1 bg-muted rounded-full h-2.5 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', color)}
          style={{ width: `${Math.max(pct, 1)}%` }}
        />
      </div>
      <span className="text-sm font-bold text-foreground w-12 text-right">{count}</span>
    </div>
  );
}
