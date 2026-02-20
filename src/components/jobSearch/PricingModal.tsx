
import React from 'react';
import { X, Check, Crown, ArrowRight } from 'lucide-react';

interface PricingModalProps {
  currentPlan: 'free' | 'pro' | 'vip';
  onClose: () => void;
  onSelectPlan: (plan: 'free' | 'pro' | 'vip') => void;
}

const PLANS = [
  {
    id: 'free' as const,
    name: 'Básico',
    price: 'Grátis',
    priceSuffix: '',
    desc: 'Navegue pelas vagas e salve suas favoritas.',
    features: [
      'Navegação ilimitada de vagas',
      'Busca e filtros básicos',
      'Salvar vagas nos favoritos',
      'Alertas por email',
    ],
    unavailable: [
      'Aplicações a vagas',
      'Match score com IA',
    ],
    btn: 'Plano Atual',
    theme: 'gray',
  },
  {
    id: 'pro' as const,
    name: 'Pro',
    price: 'R$ 47',
    priceSuffix: '/mês',
    popular: true,
    desc: 'Ideal para quem está buscando ativamente.',
    features: [
      '10 análises de currículo/mês',
      'Power Verbs e melhorias',
      'Exportar PDF',
      'Biblioteca e Masterclass',
      'Hotseats mensais',
      '10% de desconto em serviços',
    ],
    unavailable: [
      'Job Concierge',
    ],
    btn: 'Fazer Upgrade',
    theme: 'blue',
  },
  {
    id: 'vip' as const,
    name: 'VIP',
    price: 'R$ 97',
    priceSuffix: '/mês',
    desc: 'Máximo impacto para candidatos ativos.',
    features: [
      'Análises ilimitadas',
      'Tudo do Pro incluído',
      'Cheat Sheet de Entrevista',
      'Job Concierge (20 consultas)',
      'Prioridade nos Hotseats',
      '20% de desconto em serviços',
    ],
    btn: 'Quero Ser VIP',
    theme: 'purple',
  },
];

const PricingModal: React.FC<PricingModalProps> = ({ currentPlan, onClose, onSelectPlan }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-6xl rounded-[48px] shadow-2xl overflow-hidden animate-fade-in-up">

        {/* Header */}
        <div className="p-8 md:p-12 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <div>
                <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">Potencialize sua busca.</h2>
                <p className="text-gray-500 mt-1 font-medium">Escolha o plano ideal para seus objetivos de carreira.</p>
            </div>
            <button onClick={onClose} className="p-3 hover:bg-gray-200 rounded-full text-gray-400 transition-all">
                <X size={24} />
            </button>
        </div>

        {/* Plans Grid */}
        <div className="p-8 md:p-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            {PLANS.map(plan => (
                <div
                  key={plan.id}
                  className={`
                    relative rounded-[40px] p-8 flex flex-col border-2 transition-all hover:scale-[1.02]
                    ${plan.popular ? 'border-brand-600 shadow-xl shadow-brand-600/10' : 'border-gray-100'}
                  `}
                >
                    {plan.popular && (
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1.5 bg-brand-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
                            <Crown className="inline w-3 h-3 mr-1" />
                            Popular
                        </div>
                    )}

                    <div className="mb-8">
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{plan.name}</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-black text-gray-900">{plan.price}</span>
                            {plan.priceSuffix && <span className="text-sm font-bold text-gray-400">{plan.priceSuffix}</span>}
                        </div>
                        <p className="text-sm font-medium text-gray-500 mt-4 leading-relaxed">{plan.desc}</p>
                    </div>

                    <div className="space-y-4 mb-10 flex-1">
                        {plan.features.map(f => (
                            <div key={f} className="flex items-center gap-3 text-sm font-bold text-gray-700">
                                <Check className="text-brand-600 shrink-0" size={18} />
                                {f}
                            </div>
                        ))}
                        {plan.unavailable?.map(f => (
                            <div key={f} className="flex items-center gap-3 text-sm font-bold text-gray-300">
                                <X className="shrink-0" size={18} />
                                {f}
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => onSelectPlan(plan.id)}
                        disabled={currentPlan === plan.id}
                        className={`
                            w-full py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2
                            ${plan.id === 'free' ? 'bg-gray-100 text-gray-400' :
                              plan.id === 'pro' ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-lg shadow-brand-600/20' :
                              'bg-gray-900 text-white hover:bg-black shadow-xl'}
                        `}
                    >
                        {currentPlan === plan.id ? 'Plano Atual' : plan.btn} {plan.id !== 'free' && currentPlan !== plan.id && <ArrowRight size={18} />}
                    </button>
                </div>
            ))}
        </div>

        {/* Footer Info */}
        <div className="p-8 bg-gray-50 text-center">
            <p className="text-sm text-gray-500 font-medium">Garantia de 30 dias. Cancele quando quiser.</p>
        </div>
      </div>
    </div>
  );
};

export default PricingModal;
