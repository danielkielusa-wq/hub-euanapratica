import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, Crown, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePlanAccess } from '@/hooks/usePlanAccess';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { BillingCycle } from '@/types/plans';

interface PlanData {
  id: string;
  name: string;
  description: string;
  price: number;
  price_annual: number | null;
  monthly_limit: number;
  theme: string | null;
  features: Record<string, unknown>;
  display_features: string[];
  is_popular: boolean;
  cta_text: string;
  ticto_checkout_url_monthly: string | null;
  ticto_checkout_url_annual: string | null;
  is_active: boolean;
}

/**
 * Compute excluded features for each plan by collecting features
 * from higher-priced plans that this plan doesn't have.
 */
function getExcludedFeatures(plan: PlanData, allPlans: PlanData[]): string[] {
  const included = new Set(plan.display_features);
  const excluded: string[] = [];
  const seen = new Set<string>();

  // Higher-priced plans come after this one (sorted by price)
  const higherPlans = allPlans.filter(p => p.price > plan.price);
  for (const hp of higherPlans) {
    for (const f of hp.display_features) {
      if (!included.has(f) && !seen.has(f)) {
        excluded.push(f);
        seen.add(f);
      }
    }
  }
  return excluded;
}

function getThemeStyles(theme: string | null) {
  switch (theme) {
    case 'purple':
      return {
        border: 'border-purple-200',
        bg: 'bg-gray-900',
        btnBg: 'bg-gray-900 hover:bg-black text-white shadow-xl',
        tag: 'bg-purple-100 text-purple-700',
      };
    case 'blue':
      return {
        border: 'border-brand-600 shadow-xl shadow-brand-600/10',
        bg: 'bg-brand-600',
        btnBg: 'bg-brand-600 hover:bg-brand-700 text-white shadow-lg shadow-brand-600/20',
        tag: 'bg-blue-100 text-blue-700',
      };
    default:
      return {
        border: 'border-gray-100',
        bg: 'bg-gray-100',
        btnBg: 'bg-gray-100 text-gray-400',
        tag: 'bg-gray-100 text-gray-500',
      };
  }
}

export default function PricingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { planId: currentPlanId, subscriptionStatus } = usePlanAccess();
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [awaitingPayment, setAwaitingPayment] = useState(false);

  useEffect(() => {
    async function fetchPlans() {
      const { data, error } = await supabase
        .from('plans')
        .select('id, name, description, price, price_annual, monthly_limit, theme, features, display_features, is_popular, cta_text, ticto_checkout_url_monthly, ticto_checkout_url_annual, is_active')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) {
        console.error('Error fetching plans:', error);
        return;
      }

      setPlans((data || []).map(p => ({
        ...p,
        description: (p as any).description || '',
        display_features: Array.isArray(p.display_features) ? p.display_features as string[] : [],
      })) as PlanData[]);
      setIsLoading(false);
    }
    fetchPlans();
  }, []);

  // Listen for subscription activation via Realtime
  useEffect(() => {
    if (!awaitingPayment || !user?.id) return;

    const channel = supabase
      .channel('subscription-activation')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_subscriptions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newRecord = payload.new as Record<string, unknown>;
          if (newRecord?.status === 'active') {
            setAwaitingPayment(false);
            toast({ title: 'Assinatura ativada!', description: 'Bem-vindo ao seu novo plano.' });
            navigate('/dashboard/hub');
          }
        }
      )
      .subscribe();

    // Timeout fallback after 60s
    const timeout = setTimeout(() => {
      if (awaitingPayment) {
        setAwaitingPayment(false);
        toast({
          title: 'Pagamento sendo processado',
          description: 'Você receberá uma confirmação por email quando sua assinatura for ativada.',
        });
      }
    }, 60000);

    return () => {
      supabase.removeChannel(channel);
      clearTimeout(timeout);
    };
  }, [awaitingPayment, user?.id, navigate, toast]);

  const handleSubscribe = async (plan: PlanData) => {
    if (plan.price === 0) return;

    if (!termsAccepted) {
      toast({
        title: 'Aceite os termos',
        description: 'Para continuar, aceite os Termos de Assinatura.',
        variant: 'destructive',
      });
      return;
    }

    const checkoutUrl =
      billingCycle === 'monthly'
        ? plan.ticto_checkout_url_monthly
        : plan.ticto_checkout_url_annual;

    if (!checkoutUrl) {
      toast({
        title: 'Indisponível',
        description: 'O checkout para este plano ainda não está configurado. Entre em contato com o suporte.',
        variant: 'destructive',
      });
      return;
    }

    // Record terms acceptance
    if (user?.id) {
      await supabase.from('user_subscriptions').upsert(
        {
          user_id: user.id,
          plan_id: plan.id,
          status: 'inactive',
          billing_cycle: billingCycle,
          terms_accepted_at: new Date().toISOString(),
          terms_version: 'v1.0-2026-02',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );
    }

    // Build checkout URL with pre-filled email
    const url = new URL(checkoutUrl);
    if (user?.email) url.searchParams.set('email', user.email);

    setAwaitingPayment(true);
    window.open(url.toString(), '_blank');
  };

  const getPrice = (plan: PlanData) => {
    if (plan.price === 0) return 'Grátis';
    if (billingCycle === 'annual' && plan.price_annual) {
      return `R$ ${Math.round(plan.price_annual / 12)}`;
    }
    return `R$ ${plan.price}`;
  };

  const getPriceSuffix = (plan: PlanData) => {
    if (plan.price === 0) return '';
    return '/mês';
  };

  const getAnnualSaving = (plan: PlanData) => {
    if (plan.price === 0 || !plan.price_annual || billingCycle !== 'annual') return null;
    const monthlyTotal = plan.price * 12;
    const saving = monthlyTotal - plan.price_annual;
    if (saving <= 0) return null;
    return `Economia de R$ ${saving}/ano`;
  };

  const isCurrentPlan = (plan: PlanData) => {
    return plan.id === currentPlanId && subscriptionStatus === 'active';
  };

  const getButtonLabel = (plan: PlanData) => {
    if (isCurrentPlan(plan)) return 'Plano Atual';
    if (plan.price === 0) return 'Plano Gratuito';
    return plan.cta_text || 'Assinar Agora';
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-muted/30 p-6 md:p-8">
        <div className="max-w-6xl mx-auto animate-fade-in">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">
              Potencialize sua carreira.
            </h1>
            <p className="text-muted-foreground mt-2 font-medium max-w-lg mx-auto">
              Escolha o plano ideal para seus objetivos de carreira nos EUA.
            </p>
          </div>

          {/* Billing Toggle */}
          <div className="flex justify-center mb-10">
            <div className="bg-card border border-border rounded-2xl p-1.5 flex gap-1">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={cn(
                  'px-6 py-2.5 rounded-xl text-sm font-bold transition-all',
                  billingCycle === 'monthly'
                    ? 'bg-foreground text-background shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Mensal
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={cn(
                  'px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2',
                  billingCycle === 'annual'
                    ? 'bg-foreground text-background shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Anual
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                  2 MESES GRÁTIS
                </span>
              </button>
            </div>
          </div>

          {/* Awaiting Payment Overlay */}
          {awaitingPayment && (
            <div className="mb-8 bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center animate-fade-in">
              <Loader2 className="h-6 w-6 animate-spin text-amber-600 mx-auto mb-3" />
              <p className="font-bold text-amber-800">Aguardando confirmação de pagamento...</p>
              <p className="text-sm text-amber-600 mt-1">
                Complete o pagamento na aba do Ticto. Esta página será atualizada automaticamente.
              </p>
            </div>
          )}

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
            {plans.map((plan) => {
              const styles = getThemeStyles(plan.theme);
              const excluded = getExcludedFeatures(plan, plans);
              const saving = getAnnualSaving(plan);
              const isCurrent = isCurrentPlan(plan);

              return (
                <div
                  key={plan.id}
                  className={cn(
                    'relative rounded-[40px] p-8 flex flex-col border-2 transition-all hover:scale-[1.02] bg-card',
                    styles.border
                  )}
                >
                  {plan.is_popular && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1.5 bg-brand-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg flex items-center gap-1">
                      <Crown className="w-3 h-3" />
                      Popular
                    </div>
                  )}

                  <div className="mb-8">
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1">
                      {plan.name}
                    </p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-foreground">{getPrice(plan)}</span>
                      {getPriceSuffix(plan) && (
                        <span className="text-sm font-bold text-muted-foreground">{getPriceSuffix(plan)}</span>
                      )}
                    </div>
                    {saving && (
                      <p className="text-xs font-bold text-green-600 mt-1 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        {saving}
                      </p>
                    )}
                    {billingCycle === 'annual' && plan.price_annual ? (
                      <p className="text-xs text-muted-foreground mt-1">
                        R$ {plan.price_annual} cobrado anualmente
                      </p>
                    ) : null}
                    <p className="text-sm font-medium text-muted-foreground mt-4 leading-relaxed">
                      {plan.description}
                    </p>
                  </div>

                  <div className="space-y-4 mb-10 flex-1">
                    {plan.display_features.map((f) => (
                      <div key={f} className="flex items-center gap-3 text-sm font-bold text-foreground">
                        <Check className="text-brand-600 shrink-0" size={18} />
                        {f}
                      </div>
                    ))}
                    {excluded.map((f) => (
                      <div key={f} className="flex items-center gap-3 text-sm font-bold text-muted-foreground/40">
                        <X className="shrink-0" size={18} />
                        {f}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handleSubscribe(plan)}
                    disabled={isCurrent || plan.price === 0}
                    className={cn(
                      'w-full py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2',
                      isCurrent || plan.price === 0
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : styles.btnBg
                    )}
                  >
                    {getButtonLabel(plan)}
                    {!isCurrent && plan.price > 0 && <ArrowRight size={18} />}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Terms Acceptance */}
          <div className="max-w-lg mx-auto text-center space-y-4">
            <label className="flex items-start gap-3 justify-center cursor-pointer">
              <Checkbox
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                className="mt-0.5"
              />
              <span className="text-sm text-muted-foreground text-left">
                Li e aceito os{' '}
                <a
                  href="/termos-assinatura"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-600 underline font-medium"
                >
                  Termos de Assinatura
                </a>{' '}
                e a{' '}
                <a
                  href="/termos-assinatura"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-600 underline font-medium"
                >
                  Política de Cancelamento
                </a>
                .
              </span>
            </label>

            <p className="text-xs text-muted-foreground">
              Garantia de 7 dias. Cancele quando quiser. Pagamento processado pela Ticto.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
