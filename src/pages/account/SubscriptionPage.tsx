import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Calendar,
  ArrowUpRight,
  Shield,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { usePlanAccess } from '@/hooks/usePlanAccess';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { CancellationFlow } from '@/components/subscription/CancellationFlow';
import { cn } from '@/lib/utils';
import type { SubscriptionEvent } from '@/types/plans';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  active: { label: 'Ativa', color: 'text-green-600 bg-green-50 border-green-200', icon: CheckCircle2 },
  trial: { label: 'Teste', color: 'text-blue-600 bg-blue-50 border-blue-200', icon: Clock },
  past_due: { label: 'Pagamento Pendente', color: 'text-amber-600 bg-amber-50 border-amber-200', icon: AlertTriangle },
  grace_period: { label: 'Período de Carência', color: 'text-orange-600 bg-orange-50 border-orange-200', icon: AlertTriangle },
  cancelled: { label: 'Cancelada', color: 'text-red-600 bg-red-50 border-red-200', icon: XCircle },
  inactive: { label: 'Inativa', color: 'text-gray-600 bg-gray-50 border-gray-200', icon: XCircle },
};

const EVENT_LABELS: Record<string, string> = {
  paid: 'Pagamento confirmado',
  approved: 'Pagamento aprovado',
  authorized: 'Pagamento autorizado',
  completed: 'Pagamento concluído',
  venda_realizada: 'Venda realizada',
  subscription_delayed: 'Falha no pagamento',
  subscription_canceled: 'Assinatura cancelada',
  refunded: 'Reembolso processado',
  chargedback: 'Chargeback recebido',
  trial_started: 'Período de teste iniciado',
  trial_ended: 'Período de teste encerrado',
  card_exchanged: 'Cartão atualizado',
};

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    planId,
    planName,
    subscriptionStatus,
    billingCycle,
    nextBillingDate,
    expiresAt,
    willCancelAtPeriodEnd,
    isDunning,
    tictoChangeCardUrl,
    planAccess,
    isLoading,
    refetch,
  } = usePlanAccess();

  const [events, setEvents] = useState<SubscriptionEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [showCancelFlow, setShowCancelFlow] = useState(false);

  useEffect(() => {
    async function fetchEvents() {
      if (!user?.id) return;

      const { data, error } = await supabase
        .from('subscription_events')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data) {
        setEvents(data as unknown as SubscriptionEvent[]);
      }
      setEventsLoading(false);
    }
    fetchEvents();
  }, [user?.id]);

  const statusConfig = STATUS_CONFIG[subscriptionStatus] || STATUS_CONFIG.inactive;
  const StatusIcon = statusConfig.icon;

  const formatDate = (date: string | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatCycle = (cycle: string | null) => {
    if (cycle === 'monthly') return 'Mensal';
    if (cycle === 'annual') return 'Anual';
    return '—';
  };

  const formatPrice = () => {
    if (!planAccess) return '—';
    if (planId === 'basic') return 'Grátis';
    if (billingCycle === 'annual' && planAccess.priceAnnual) {
      return `R$ ${planAccess.priceAnnual}/ano`;
    }
    return `R$ ${planAccess.priceMonthly}/mês`;
  };

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
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-black text-foreground">Minha Assinatura</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie seu plano, pagamentos e faturamento.
          </p>
        </div>

        {/* Current Plan Card */}
        <div className="bg-card rounded-[28px] border border-border p-6 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1">
                Plano Atual
              </p>
              <h2 className="text-2xl font-black text-foreground">{planName}</h2>
              <p className="text-lg font-bold text-muted-foreground mt-1">{formatPrice()}</p>
            </div>
            <div className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold', statusConfig.color)}>
              <StatusIcon className="w-3.5 h-3.5" />
              {statusConfig.label}
            </div>
          </div>

          {/* Plan Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-muted/50 rounded-xl p-3">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                Ciclo
              </p>
              <p className="text-sm font-bold text-foreground">{formatCycle(billingCycle)}</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-3">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                Próx. Cobrança
              </p>
              <p className="text-sm font-bold text-foreground">{formatDate(nextBillingDate)}</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-3">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                Válido Até
              </p>
              <p className="text-sm font-bold text-foreground">{formatDate(expiresAt)}</p>
            </div>
          </div>

          {/* Cancellation Notice */}
          {willCancelAtPeriodEnd && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-800">
                  Cancelamento agendado
                </p>
                <p className="text-sm text-amber-700 mt-1">
                  Seu plano permanece ativo até {formatDate(expiresAt)}. Após essa data, você será movido para o plano Básico.
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-2">
            {planId === 'basic' ? (
              <Button onClick={() => navigate('/pricing')} className="gap-2">
                <ArrowUpRight className="w-4 h-4" />
                Fazer Upgrade
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => navigate('/pricing')} className="gap-2">
                  <ArrowUpRight className="w-4 h-4" />
                  Mudar Plano
                </Button>
                {tictoChangeCardUrl && (
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => window.open(tictoChangeCardUrl, '_blank')}
                  >
                    <CreditCard className="w-4 h-4" />
                    Atualizar Cartão
                  </Button>
                )}
                {!willCancelAtPeriodEnd && subscriptionStatus !== 'cancelled' && (
                  <Button
                    variant="ghost"
                    className="text-destructive hover:text-destructive gap-2"
                    onClick={() => setShowCancelFlow(true)}
                  >
                    Cancelar Assinatura
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Payment Method */}
        {isDunning && tictoChangeCardUrl && (
          <div className="bg-card rounded-[28px] border border-border p-6">
            <h3 className="text-sm font-black text-foreground flex items-center gap-2 mb-4">
              <CreditCard className="w-4 h-4 text-primary" />
              Método de Pagamento
            </h3>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-800 font-medium">
                Seu pagamento falhou. Atualize seus dados de cartão para evitar a perda de acesso.
              </p>
              <Button
                size="sm"
                className="mt-3 gap-2"
                onClick={() => window.open(tictoChangeCardUrl, '_blank')}
              >
                <CreditCard className="w-4 h-4" />
                Atualizar Cartão
              </Button>
            </div>
          </div>
        )}

        {/* Billing History */}
        <div className="bg-card rounded-[28px] border border-border p-6">
          <h3 className="text-sm font-black text-foreground flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-primary" />
            Histórico de Eventos
          </h3>
          {eventsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : events.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum evento de assinatura registrado.
            </p>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn(
                      'w-2 h-2 rounded-full shrink-0',
                      ['paid', 'approved', 'authorized', 'completed', 'venda_realizada'].includes(event.eventType)
                        ? 'bg-green-500'
                        : ['subscription_delayed'].includes(event.eventType)
                        ? 'bg-amber-500'
                        : ['refunded', 'chargedback', 'subscription_canceled'].includes(event.eventType)
                        ? 'bg-red-500'
                        : 'bg-gray-400'
                    )} />
                    <span className="text-sm font-medium text-foreground truncate">
                      {EVENT_LABELS[event.eventType] || event.eventType}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 ml-4">
                    {new Date(event.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Security Notice */}
        <div className="flex items-start gap-3 px-4 py-3 text-xs text-muted-foreground">
          <Shield className="w-4 h-4 shrink-0 mt-0.5" />
          <p>
            Pagamentos processados com segurança pela Ticto. Seus dados financeiros não são
            armazenados em nossos servidores.
          </p>
        </div>
      </div>

      {/* Cancellation Flow Dialog */}
      <CancellationFlow
        open={showCancelFlow}
        onOpenChange={setShowCancelFlow}
        planName={planName}
        expiresAt={expiresAt}
        onCancelled={() => refetch()}
      />
    </DashboardLayout>
  );
}
