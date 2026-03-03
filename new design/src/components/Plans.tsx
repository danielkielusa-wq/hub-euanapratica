import React, { useState } from 'react';
import { Check, X, ArrowRight, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function Plans() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const plans = [
    {
      name: 'BÁSICO',
      price: 'Grátis',
      period: '',
      description: 'Comece a explorar sua carreira nos EUA.',
      isPopular: false,
      isVip: false,
      buttonText: 'Plano Gratuito',
      buttonStyle: 'secondary',
      features: [
        { text: '1 análise por mês', included: true },
        { text: 'Score de compatibilidade', included: true },
        { text: 'Métricas principais', included: true },
        { text: '10 análises de currículos por mês', included: false },
        { text: '5 creditos para Title Translator', included: false },
        { text: 'Acesso a hotseats mensais', included: false },
        { text: 'Modelos de documentos', included: false },
        { text: '10% Desconto em Servicos', included: false },
        { text: 'Acesso Full na Plataforma', included: false },
        { text: '25 análises de currículos por mês', included: false },
        { text: '15 analises do Title Translator', included: false },
        { text: 'Prioridade em hotseats', included: false },
        { text: 'Vagas exclusivas Prime Jobs 🔥', included: false },
        { text: '20% Desconto em Servicos', included: false },
        { text: '15% Off na Mentoria em Grupo', included: false },
        { text: '10% Off na Mentoria Individual', included: false },
      ]
    },
    {
      name: 'PRO',
      price: billingCycle === 'monthly' ? 'R$ 48' : 'R$ 40',
      period: '/mês',
      description: 'Ideal para quem está buscando ativamente.',
      isPopular: true,
      isVip: false,
      buttonText: 'Assinar Pro',
      buttonStyle: 'secondary',
      features: [
        { text: '10 análises de currículos por mês', included: true },
        { text: '5 creditos para Title Translator', included: true },
        { text: 'Acesso a hotseats mensais', included: true },
        { text: 'Modelos de documentos', included: true },
        { text: '10% Desconto em Servicos', included: true },
        { text: 'Acesso Full na Plataforma', included: false },
        { text: '25 análises de currículos por mês', included: false },
        { text: '15 analises do Title Translator', included: false },
        { text: 'Prioridade em hotseats', included: false },
        { text: 'Vagas exclusivas Prime Jobs 🔥', included: false },
        { text: '20% Desconto em Servicos', included: false },
        { text: '15% Off na Mentoria em Grupo', included: false },
        { text: '10% Off na Mentoria Individual', included: false },
      ]
    },
    {
      name: 'VIP',
      price: billingCycle === 'monthly' ? 'R$ 97' : 'R$ 80',
      period: '/mês',
      description: 'Máximo impacto para candidatos ativos.',
      isPopular: false,
      isVip: true,
      buttonText: 'Quero Ser VIP',
      buttonStyle: 'primary',
      features: [
        { text: 'Acesso Full na Plataforma', included: true },
        { text: '25 análises de currículos por mês', included: true },
        { text: '15 analises do Title Translator', included: true },
        { text: 'Prioridade em hotseats', included: true },
        { text: 'Vagas exclusivas Prime Jobs 🔥', included: true },
        { text: '20% Desconto em Servicos', included: true },
        { text: '15% Off na Mentoria em Grupo', included: true },
        { text: '10% Off na Mentoria Individual', included: true },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
            Potencialize sua carreira.
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Escolha o plano ideal para seus objetivos de carreira nos EUA.
          </p>
        </motion.div>

        {/* Billing Toggle */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex justify-center mb-16"
        >
          <div className="bg-gray-100 p-1 rounded-full inline-flex items-center relative">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                billingCycle === 'monthly' 
                  ? 'bg-gray-900 text-white shadow-md' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                billingCycle === 'yearly' 
                  ? 'bg-gray-900 text-white shadow-md' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Anual
            </button>
            <motion.span 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
              className="absolute -right-24 top-1/2 -translate-y-1/2 bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-full border border-green-200"
            >
              2 MESES GRÁTIS
            </motion.span>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div 
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + (index * 0.1) }}
              className={`relative bg-white rounded-3xl p-8 flex flex-col transition-all duration-300 ${
                plan.isPopular 
                  ? 'border-2 border-blue-500 shadow-xl scale-105 z-10' 
                  : plan.isVip
                    ? 'border border-purple-200 shadow-lg hover:shadow-xl hover:border-purple-300'
                    : 'border border-gray-200 shadow-sm hover:shadow-md'
              }`}
            >
              {plan.isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-bold flex items-center gap-1 shadow-lg">
                  <span className="text-xs">👑</span> POPULAR
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <motion.span 
                    key={plan.price} // Animate price change
                    initial={{ opacity: 0.5, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl font-extrabold text-gray-900 tracking-tight"
                  >
                    {plan.price}
                  </motion.span>
                  {plan.period && (
                    <span className="text-gray-500 font-medium">{plan.period}</span>
                  )}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {plan.description}
                </p>
              </div>

              {/* Features List */}
              <div className="flex-1 space-y-4 mb-8">
                {plan.features.map((feature, i) => (
                  <div 
                    key={i} 
                    className={`flex items-start gap-3 text-sm ${
                      feature.included ? 'text-gray-900' : 'text-gray-400'
                    }`}
                  >
                    {feature.included ? (
                      <Check className="w-5 h-5 text-blue-600 shrink-0" />
                    ) : (
                      <X className="w-5 h-5 text-gray-300 shrink-0" />
                    )}
                    <span className={feature.included ? 'font-medium' : ''}>
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              <button
                className={`w-full py-3.5 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
                  plan.buttonStyle === 'primary'
                    ? 'bg-gray-900 text-white hover:bg-black shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                {plan.buttonText}
                {plan.buttonStyle === 'primary' && <ArrowRight className="w-4 h-4" />}
              </button>
            </motion.div>
          ))}
        </div>

        {/* Footer / Terms */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-16 max-w-2xl mx-auto text-center space-y-6"
        >
          <div className="flex items-start justify-center gap-3">
            <div className="relative flex items-center">
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </div>
            <label htmlFor="terms" className="text-sm text-gray-600 text-left cursor-pointer select-none">
              Li e aceito os <a href="#" className="text-blue-600 hover:underline font-medium">Termos de Assinatura</a>, a <a href="#" className="text-blue-600 hover:underline font-medium">Política de Cancelamento</a> e a <a href="#" className="text-blue-600 hover:underline font-medium">Política de Privacidade</a>.
            </label>
          </div>
          
          <p className="text-xs text-gray-400">
            Garantia de 7 dias. Cancele quando quiser. Pagamento processado pela Ticto.
          </p>
        </motion.div>

      </div>
    </div>
  );
}
