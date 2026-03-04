import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Check } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePlanAccess } from '@/hooks/usePlanAccess';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { BillingCycle } from '@/types/plans';

// UPDATE THESE AS FOUNDER SPOTS ARE FILLED
const FOUNDER_SPOTS: Record<string, { total: number; remaining: number }> = {
  blue:   { total: 100, remaining: 27 }, // Pro  (73 vendidas)
  purple: { total: 50,  remaining: 12 }, // VIP (38 vendidas)
};

// Future regular prices shown as crossed-out anchor
const FUTURE_PRICES: Record<string, { monthly: number; annualMonthly: number }> = {
  blue:   { monthly: 67,  annualMonthly: 54  }, // Pro
  purple: { monthly: 147, annualMonthly: 122 }, // VIP
};

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

function getPlanIcon(theme: string | null): string {
  switch (theme) {
    case 'purple': return '/images/landing/icons/shuttle-rocket.png';
    case 'blue':   return '/images/landing/icons/plane.png';
    default:       return '/images/landing/icons/paper-airplane.png';
  }
}

function getPlanBadge(plan: PlanData): { text: string; color: 'primary' | 'purple' } | null {
  if (plan.theme === 'purple') return { text: 'Programa Completo', color: 'purple' };
  if (plan.is_popular) return { text: 'Mais Popular', color: 'primary' };
  return null;
}

export default function PricingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { planId: currentPlanId, subscriptionStatus } = usePlanAccess();
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('annual');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [awaitingPayment, setAwaitingPayment] = useState(false);

  const isAnnual = billingCycle === 'annual';

  useEffect(() => {
    async function fetchPlans() {
      const { data, error } = await supabase
        .from('plans')
        .select('id, name, description, price, price_annual, monthly_limit, theme, features, display_features, is_popular, cta_text, ticto_checkout_url_monthly, ticto_checkout_url_annual, is_active')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) {
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

    if (user?.id) {
      const { error: termsError } = await supabase.rpc('accept_subscription_terms', {
        p_plan_id: plan.id,
        p_billing_cycle: billingCycle,
        p_terms_version: 'v1.0-2026-02',
      });
      if (termsError) {
      }
    }

    const url = new URL(checkoutUrl);
    if (user?.email) url.searchParams.set('email', user.email);

    setAwaitingPayment(true);
    window.open(url.toString(), '_blank');
  };

  const getPrice = (plan: PlanData) => {
    if (plan.price === 0) return '0';
    if (isAnnual && plan.price_annual) {
      return `${Math.round(plan.price_annual / 12)}`;
    }
    return `${plan.price}`;
  };

  const getAnnualTotal = (plan: PlanData) => {
    if (plan.price === 0 || !plan.price_annual || !isAnnual) return null;
    return `R$${plan.price_annual} / ano`;
  };

  const getAnnualSavingPercent = () => {
    let maxPercent = 0;
    for (const plan of plans) {
      if (plan.price > 0 && plan.price_annual) {
        const monthlyTotal = plan.price * 12;
        const percent = Math.round(((monthlyTotal - plan.price_annual) / monthlyTotal) * 100);
        if (percent > maxPercent) maxPercent = percent;
      }
    }
    return maxPercent;
  };

  const isCurrentPlan = (plan: PlanData) =>
    plan.id === currentPlanId && subscriptionStatus === 'active';

  const savingPercent = getAnnualSavingPercent();

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
      <div className="min-h-screen p-6 md:p-8">
        <div className="max-w-6xl mx-auto animate-fade-in">

          {/* Header */}
          <div className="text-center mb-4">
            <span className="inline-block rounded-md bg-landing-primary/10 px-3 py-1 text-sm font-medium text-landing-primary mb-3">
              Planos
            </span>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Planos pensados para você
            </h1>
            <p className="text-muted-foreground mt-1 max-w-lg mx-auto">
              Todas as ferramentas de IA para impulsionar sua carreira internacional.
              <br />Escolha o plano ideal para seus objetivos.
            </p>
          </div>

          {/* Founder scarcity banner */}
          <div className="max-w-xl mx-auto mb-6">
            <div className="flex items-center justify-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse shrink-0" />
              <p className="text-sm text-amber-800 font-medium text-center">
                <span className="font-bold">Oferta de Fundador</span>
                {' '}·{' '}
                <span className="text-amber-700">
                  {FOUNDER_SPOTS.blue.remaining} vagas Pro · {FOUNDER_SPOTS.purple.remaining} vagas VIP restantes
                </span>
                {' '}· Preço garantido para sempre
              </p>
            </div>
          </div>

          {/* Billing Toggle — same style as landing */}
          <div className="text-center mb-10">
            <div className="relative inline-flex items-center pt-3 md:pt-0">
              <span className={cn('text-sm mr-3', !isAnnual && 'font-semibold')}>Mensal</span>
              <button
                onClick={() => setBillingCycle(isAnnual ? 'monthly' : 'annual')}
                className={cn(
                  'relative w-11 h-6 rounded-full transition-colors',
                  isAnnual ? 'bg-landing-primary' : 'bg-gray-300'
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm',
                    isAnnual && 'translate-x-5'
                  )}
                />
              </button>
              <span className={cn('text-sm ml-3', isAnnual && 'font-semibold')}>Anual</span>
              {savingPercent > 0 && (
                <div className="absolute -right-28 -top-2 hidden md:flex items-start">
                  <img
                    src="/images/landing/icons/pricing-plans-arrow.png"
                    alt=""
                    className="h-8"
                  />
                  <span className="text-sm font-medium mt-2 ml-1">Economize {savingPercent}%</span>
                </div>
              )}
            </div>
          </div>

          {/* Awaiting Payment Overlay */}
          {awaitingPayment && (
            <div className="mb-8 bg-amber-50 border border-amber-200 rounded-lg p-6 text-center animate-fade-in">
              <Loader2 className="h-6 w-6 animate-spin text-amber-600 mx-auto mb-3" />
              <p className="font-semibold text-amber-800">Aguardando confirmação de pagamento...</p>
              <p className="text-sm text-amber-600 mt-1">
                Complete o pagamento na aba do Ticto. Esta página será atualizada automaticamente.
              </p>
            </div>
          )}

          {/* Plans Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-0 lg:pt-5 mb-10">
            {plans.map((plan) => {
              const isCurrent = isCurrentPlan(plan);
              const isVip = plan.theme === 'purple';
              const annualTotal = getAnnualTotal(plan);
              const badge = getPlanBadge(plan);
              const founderSpots = plan.theme ? FOUNDER_SPOTS[plan.theme] : null;
              const futurePrices = plan.theme ? FUTURE_PRICES[plan.theme] : null;

              return (
                <div
                  key={plan.id}
                  className={cn(
                    'bg-white rounded-lg relative',
                    plan.is_popular && 'border-2 border-landing-primary shadow-xl shadow-landing-primary/10',
                    isVip && 'border-2 border-purple-400 shadow-xl shadow-purple-400/10',
                    !plan.is_popular && !isVip && 'border border-gray-200 shadow-sm'
                  )}
                >
                  {/* Badge */}
                  {badge && (
                    <div className="absolute top-0 right-5 -translate-y-1/2">
                      <span className={cn(
                        'text-xs font-semibold px-3 py-1 rounded-full',
                        badge.color === 'primary' && 'bg-landing-primary text-white',
                        badge.color === 'purple' && 'bg-purple-500 text-white',
                      )}>
                        {badge.text}
                      </span>
                    </div>
                  )}

                  <div className="pt-8 pb-4 px-6">
                    <div className="text-center">
                      <img src={getPlanIcon(plan.theme)} alt="" className="h-16 mx-auto mb-6" />
                      <h4 className="text-xl font-semibold mb-1">{plan.name}</h4>
                      <p className="text-gray-500 text-sm mb-4">{plan.description}</p>

                      {/* Founder label + crossed-out future price */}
                      {futurePrices && (
                        <div className="mb-1 flex items-center justify-center gap-2">
                          <span className="text-xs text-gray-400 line-through">
                            R${isAnnual ? futurePrices.annualMonthly : futurePrices.monthly}/mês
                          </span>
                          <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                            Preço Fundador
                          </span>
                        </div>
                      )}

                      {/* Price */}
                      <div className="flex items-end justify-center gap-0.5">
                        <span className="text-gray-400 text-sm mb-1">R$</span>
                        <span className={cn(
                          'text-4xl font-extrabold leading-none',
                          isVip ? 'text-purple-500' : 'text-landing-primary'
                        )}>
                          {getPrice(plan)}
                        </span>
                        <span className="text-gray-500 text-sm mb-1">/mês</span>
                      </div>
                      {annualTotal && (
                        <div className="text-gray-400 text-sm mt-1">{annualTotal}</div>
                      )}

                      {/* Spots progress bar */}
                      {founderSpots && (
                        <div className="mt-4">
                          <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span>{founderSpots.remaining} vagas restantes</span>
                            <span>de {founderSpots.total}</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full',
                                isVip ? 'bg-purple-400' : 'bg-landing-primary'
                              )}
                              style={{
                                width: `${((founderSpots.total - founderSpots.remaining) / founderSpots.total) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="px-6 pb-8">
                    <ul className="space-y-3 mb-8">
                      {plan.display_features.map((feature) => (
                        <li key={feature} className="flex items-center gap-3">
                          <span
                            className={cn(
                              'flex items-center justify-center w-5 h-5 rounded-full shrink-0',
                              isVip
                                ? 'bg-purple-100 text-purple-500'
                                : plan.is_popular
                                  ? 'bg-landing-primary text-white'
                                  : 'bg-landing-primary/10 text-landing-primary'
                            )}
                          >
                            <Check className="h-3 w-3" />
                          </span>
                          <span className="text-sm font-medium text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => handleSubscribe(plan)}
                      disabled={isCurrent || plan.price === 0}
                      className={cn(
                        'w-full py-2.5 rounded-lg font-medium transition-all text-sm',
                        isCurrent
                          ? 'border-2 border-green-500 bg-green-50 text-green-600 cursor-default'
                          : plan.price === 0
                            ? 'bg-landing-primary/10 text-landing-primary hover:bg-landing-primary/20 cursor-not-allowed'
                            : isVip
                              ? 'bg-purple-500 hover:bg-purple-600 text-white'
                              : plan.is_popular
                                ? 'bg-landing-primary hover:bg-landing-primary-dark text-white'
                                : 'bg-landing-primary/10 text-landing-primary hover:bg-landing-primary/20'
                      )}
                    >
                      {isCurrent
                        ? 'Plano Atual'
                        : plan.price === 0
                          ? 'Começar Grátis'
                          : 'Garantir Vaga de Fundador'}
                    </button>

                    {founderSpots && (
                      <p className="text-center text-xs text-gray-400 mt-2">
                        Preço garantido para sempre
                      </p>
                    )}
                  </div>
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
                  className="text-landing-primary underline font-medium"
                >
                  Termos de Assinatura
                </a>
                , a{' '}
                <a
                  href="/politica-cancelamento"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-landing-primary underline font-medium"
                >
                  Política de Cancelamento
                </a>{' '}
                e a{' '}
                <a
                  href="/privacidade"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-landing-primary underline font-medium"
                >
                  Política de Privacidade
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
