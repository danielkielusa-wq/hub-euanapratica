import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// UPDATE THESE AS FOUNDER SPOTS ARE FILLED
const FOUNDER_SPOTS = {
  pro: { total: 100, remaining: 73 },
  vip: { total: 50, remaining: 38 },
} as const;

const plans = [
  {
    id: 'basic',
    name: 'Básico',
    description: 'Explore as ferramentas sem compromisso.',
    icon: '/images/landing/icons/paper-airplane.png',
    monthlyPrice: 'R$0',
    yearlyPrice: 'R$0',
    yearlyTotal: null,
    originalPrice: null,
    highlighted: false,
    founderSpots: null,
    badge: null,
    badgeColor: null,
    features: [
      '5 créditos por mês',
      'Análise de currículo básica',
      'Score de compatibilidade',
      'Relatório de diagnóstico parcial',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Ferramentas completas para quem busca ativamente.',
    icon: '/images/landing/icons/plane.png',
    monthlyPrice: 'R$48',
    yearlyPrice: 'R$39',
    yearlyTotal: 'R$468 / ano',
    originalPrice: 'R$67',
    highlighted: true,
    founderSpots: FOUNDER_SPOTS.pro,
    badge: 'Mais Popular',
    badgeColor: 'primary' as const,
    features: [
      '30 créditos por mês',
      'Até 15 análises de currículo',
      'Title Translator ilimitado',
      'Hotseats mensais',
      'Relatório de diagnóstico completo',
      '10% desconto em serviços',
    ],
  },
  {
    id: 'vip',
    name: 'Programa VIP',
    description: 'O programa completo de aceleração de carreira.',
    icon: '/images/landing/icons/shuttle-rocket.png',
    monthlyPrice: 'R$97',
    yearlyPrice: 'R$81',
    yearlyTotal: 'R$972 / ano',
    originalPrice: 'R$147',
    highlighted: false,
    founderSpots: FOUNDER_SPOTS.vip,
    badge: 'Programa Completo',
    badgeColor: 'purple' as const,
    features: [
      'Sessões live mensais ✨',
      'Hotseats com prioridade garantida',
      'Vagas exclusivas Prime Jobs 🔥',
      '80 créditos por mês',
      'Até 40 análises de currículo',
      '15% Off Mentoria em Grupo',
      '10% Off Mentoria Individual',
      '20% desconto em serviços',
    ],
  },
];

export default function PricingSection() {
  const [annual, setAnnual] = useState(true);

  return (
    <section id="landingPricing" className="py-12 md:py-20 lg:py-24 bg-gray-50/50">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="text-center mb-4">
          <span className="inline-block rounded-md bg-landing-primary/10 px-3 py-1 text-sm font-medium text-landing-primary">
            Planos
          </span>
        </div>
        <h4 className="text-center text-2xl md:text-3xl font-bold mb-1">
          <span className="relative font-extrabold z-10">
            Planos pensados
            <img
              src="/images/landing/icons/section-title-icon.png"
              alt=""
              className="absolute bottom-0 left-0 right-0 -z-10 object-contain w-full"
            />
          </span>
          {' '}para você
        </h4>
        <p className="text-center text-gray-500 pb-2 mb-6 max-w-lg mx-auto">
          Todas as ferramentas de IA para impulsionar sua carreira internacional.
          <br />Escolha o plano ideal para seus objetivos.
        </p>

        {/* Founder scarcity banner */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex items-center justify-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse shrink-0" />
            <p className="text-sm text-amber-800 font-medium text-center">
              <span className="font-bold">Oferta de Fundador</span>
              {' '}·{' '}
              <span className="text-amber-700">
                {FOUNDER_SPOTS.pro.remaining} vagas Pro · {FOUNDER_SPOTS.vip.remaining} vagas VIP restantes
              </span>
              {' '}· Preço garantido para sempre
            </p>
          </div>
        </div>

        {/* Toggle */}
        <div className="text-center mb-12">
          <div className="relative inline-flex items-center pt-3 md:pt-0">
            <span className={cn('text-sm mr-3', !annual && 'font-semibold')}>Mensal</span>
            <button
              onClick={() => setAnnual(!annual)}
              className={cn(
                'relative w-11 h-6 rounded-full transition-colors',
                annual ? 'bg-landing-primary' : 'bg-gray-300'
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm',
                  annual && 'translate-x-5'
                )}
              />
            </button>
            <span className={cn('text-sm ml-3', annual && 'font-semibold')}>Anual</span>
            <div className="absolute -right-28 -top-2 hidden md:flex items-start">
              <img
                src="/images/landing/icons/pricing-plans-arrow.png"
                alt=""
                className="h-8"
              />
              <span className="text-sm font-medium mt-2 ml-1">Economize 19%</span>
            </div>
          </div>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-0 lg:pt-5">
          {plans.map((plan) => {
            const displayPrice = annual ? plan.yearlyPrice : plan.monthlyPrice;
            const isVip = plan.id === 'vip';

            return (
              <div
                key={plan.id}
                className={cn(
                  'bg-white rounded-lg relative',
                  plan.highlighted && 'border-2 border-landing-primary shadow-xl shadow-landing-primary/10',
                  isVip && 'border-2 border-purple-400 shadow-xl shadow-purple-400/10',
                  !plan.highlighted && !isVip && 'border border-gray-200 shadow-sm'
                )}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className="absolute top-0 right-5 -translate-y-1/2">
                    <span className={cn(
                      'text-xs font-semibold px-3 py-1 rounded-full',
                      plan.badgeColor === 'primary' && 'bg-landing-primary text-white',
                      plan.badgeColor === 'purple' && 'bg-purple-500 text-white',
                    )}>
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="pt-8 pb-4 px-6">
                  <div className="text-center">
                    <img src={plan.icon} alt="" className="h-16 mx-auto mb-6" />
                    <h4 className="text-xl font-semibold mb-1">{plan.name}</h4>
                    <p className="text-gray-500 text-sm mb-4">{plan.description}</p>

                    {/* Founder price label */}
                    {plan.originalPrice && (
                      <div className="mb-1 flex items-center justify-center gap-2">
                        <span className="text-xs text-gray-400 line-through">
                          {plan.originalPrice}/mês
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
                        {displayPrice.replace('R$', '')}
                      </span>
                      <span className="text-gray-500 text-sm mb-1">/mês</span>
                    </div>
                    {annual && plan.yearlyTotal && (
                      <div className="text-gray-400 text-sm mt-1">{plan.yearlyTotal}</div>
                    )}

                    {/* Spots progress bar */}
                    {plan.founderSpots && (
                      <div className="mt-4">
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                          <span>{plan.founderSpots.remaining} vagas restantes</span>
                          <span>de {plan.founderSpots.total}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full',
                              isVip ? 'bg-purple-400' : 'bg-landing-primary'
                            )}
                            style={{
                              width: `${((plan.founderSpots.total - plan.founderSpots.remaining) / plan.founderSpots.total) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-6 pb-8">
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-center gap-3">
                        <span
                          className={cn(
                            'flex items-center justify-center w-5 h-5 rounded-full shrink-0',
                            isVip
                              ? 'bg-purple-100 text-purple-500'
                              : plan.highlighted
                                ? 'bg-landing-primary text-white'
                                : 'bg-landing-primary/10 text-landing-primary'
                          )}
                        >
                          <Check className="h-3 w-3" />
                        </span>
                        <span className="text-sm font-medium">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/register" className="block">
                    <Button
                      className={cn(
                        'w-full',
                        isVip
                          ? 'bg-purple-500 hover:bg-purple-600 text-white'
                          : plan.highlighted
                            ? 'bg-landing-primary hover:bg-landing-primary-dark text-white'
                            : 'bg-landing-primary/10 text-landing-primary hover:bg-landing-primary/20'
                      )}
                    >
                      {plan.id === 'basic' ? 'Começar Grátis' : 'Garantir Vaga de Fundador'}
                    </Button>
                  </Link>
                  {plan.founderSpots && (
                    <p className="text-center text-xs text-gray-400 mt-2">
                      Preço garantido para sempre
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
