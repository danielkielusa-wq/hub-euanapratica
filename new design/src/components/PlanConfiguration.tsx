import React, { useState } from 'react';
import { 
  Check, 
  Plus, 
  X, 
  Save, 
  HelpCircle, 
  RefreshCw, 
  CreditCard,
  Zap,
  Crown,
  Info
} from 'lucide-react';

interface PlanFeature {
  id: string;
  text: string;
}

interface Plan {
  id: string;
  name: string;
  active: boolean;
  monthlyPrice: number;
  annualPrice: number;
  description: string;
  features: PlanFeature[];
  credits: number;
  color: string;
  badge?: string;
}

const INITIAL_PLANS: Plan[] = [
  {
    id: 'basic',
    name: 'Básico',
    active: true,
    monthlyPrice: 0,
    annualPrice: 0,
    description: 'Comece a explorar sua carreira nos EUA.',
    features: [
      { id: '1', text: '1 análise por mês' },
      { id: '2', text: 'Score de compatibilidade' },
      { id: '3', text: 'Métricas principais' }
    ],
    credits: 5,
    color: 'bg-gray-50 border-gray-200'
  },
  {
    id: 'pro',
    name: 'Pro',
    active: true,
    monthlyPrice: 48,
    annualPrice: 470,
    description: 'Ideal para quem está buscando ativamente.',
    features: [
      { id: '1', text: '10 análises de currículos por mês' },
      { id: '2', text: '5 creditos para Title Translator' },
      { id: '3', text: 'Acesso a hotseats mensais' },
      { id: '4', text: 'Modelos de documentos' },
      { id: '5', text: '10% Desconto em Servicos' }
    ],
    credits: 30,
    color: 'bg-blue-50 border-blue-200',
    badge: 'POPULAR'
  },
  {
    id: 'vip',
    name: 'VIP',
    active: true,
    monthlyPrice: 97,
    annualPrice: 970,
    description: 'Máximo impacto para candidatos ativos.',
    features: [
      { id: '1', text: 'Acesso Full na Plataforma' },
      { id: '2', text: '25 análises de currículos por mês' },
      { id: '3', text: '15 analises do Title Translator' },
      { id: '4', text: 'Prioridade em hotseats' },
      { id: '5', text: 'Vagas exclusivas Prime Jobs 🔥' },
      { id: '6', text: '20% Desconto em Servicos' },
      { id: '7', text: '15% Off na Mentoria em Grupo' },
      { id: '8', text: '10% Off na Mentoria Individual' }
    ],
    credits: 100,
    color: 'bg-purple-50 border-purple-200',
    badge: 'MELHOR VALOR'
  }
];

export default function PlanConfiguration() {
  const [plans, setPlans] = useState<Plan[]>(INITIAL_PLANS);

  const updatePlan = (id: string, field: keyof Plan, value: any) => {
    setPlans(plans.map(plan => 
      plan.id === id ? { ...plan, [field]: value } : plan
    ));
  };

  const addFeature = (planId: string) => {
    const newFeature = { id: Date.now().toString(), text: '' };
    setPlans(plans.map(plan => 
      plan.id === planId 
        ? { ...plan, features: [...plan.features, newFeature] }
        : plan
    ));
  };

  const updateFeature = (planId: string, featureId: string, text: string) => {
    setPlans(plans.map(plan => 
      plan.id === planId 
        ? { 
            ...plan, 
            features: plan.features.map(f => 
              f.id === featureId ? { ...f, text } : f
            ) 
          }
        : plan
    ));
  };

  const removeFeature = (planId: string, featureId: string) => {
    setPlans(plans.map(plan => 
      plan.id === planId 
        ? { ...plan, features: plan.features.filter(f => f.id !== featureId) }
        : plan
    ));
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">
            Gestão de Planos
          </h1>
          <p className="text-gray-500 text-lg">
            Configure preços, limites e benefícios de cada nível de assinatura.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <HelpCircle className="w-4 h-4" />
            Documentação
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div 
            key={plan.id} 
            className={`
              relative rounded-2xl border transition-all duration-300 flex flex-col
              ${plan.active ? 'bg-white shadow-sm hover:shadow-md' : 'bg-gray-50 border-gray-200 opacity-75'}
              ${plan.id === 'pro' ? 'border-blue-200 ring-1 ring-blue-100' : 
                plan.id === 'vip' ? 'border-purple-200 ring-1 ring-purple-100' : 'border-gray-200'}
            `}
          >
            {/* Header Card */}
            <div className={`
              p-6 rounded-t-2xl border-b
              ${plan.id === 'basic' ? 'bg-gray-50/50 border-gray-100' : 
                plan.id === 'pro' ? 'bg-blue-50/50 border-blue-100' : 
                'bg-purple-50/50 border-purple-100'}
            `}>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className={`text-xl font-bold ${
                      plan.id === 'pro' ? 'text-blue-700' : 
                      plan.id === 'vip' ? 'text-purple-700' : 'text-gray-900'
                    }`}>
                      {plan.name}
                    </h2>
                    {plan.badge && (
                      <span className={`
                        text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide
                        ${plan.id === 'pro' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}
                      `}>
                        {plan.badge}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${plan.active ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {plan.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>
                
                {/* Toggle Switch */}
                <button 
                  onClick={() => updatePlan(plan.id, 'active', !plan.active)}
                  className={`
                    w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                    ${plan.active 
                      ? (plan.id === 'pro' ? 'bg-blue-600' : plan.id === 'vip' ? 'bg-purple-600' : 'bg-gray-900') 
                      : 'bg-gray-200'}
                  `}
                >
                  <div className={`
                    w-4 h-4 rounded-full bg-white shadow transform transition-transform duration-200 ease-in-out
                    ${plan.active ? 'translate-x-6' : 'translate-x-0'}
                  `} />
                </button>
              </div>

              {/* Pricing Inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                    Mensal (R$)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={plan.monthlyPrice}
                      onChange={(e) => updatePlan(plan.id, 'monthlyPrice', Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                    Anual (R$)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={plan.annualPrice}
                      onChange={(e) => updatePlan(plan.id, 'annualPrice', Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                    {plan.monthlyPrice > 0 && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                        -{Math.round((1 - (plan.annualPrice / (plan.monthlyPrice * 12))) * 100)}%
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-6 flex-1 flex flex-col gap-6">
              {/* Description */}
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
                  <Info className="w-3 h-3" />
                  Descrição do Plano
                </label>
                <textarea
                  value={plan.description}
                  onChange={(e) => updatePlan(plan.id, 'description', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-all"
                />
              </div>

              {/* Features List */}
              <div className="flex-1">
                <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
                  <Zap className="w-3 h-3" />
                  Features de Exibição
                </label>
                <div className="space-y-2 mb-3">
                  {plan.features.map((feature) => (
                    <div key={feature.id} className="flex gap-2 group">
                      <input
                        type="text"
                        value={feature.text}
                        onChange={(e) => updateFeature(plan.id, feature.id, e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-md text-sm text-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        placeholder="Descreva o benefício..."
                      />
                      <button 
                        onClick={() => removeFeature(plan.id, feature.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => addFeature(plan.id)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 px-2 py-1 rounded hover:bg-indigo-50 transition-colors w-fit"
                >
                  <Plus className="w-3 h-3" />
                  Adicionar Feature
                </button>
              </div>

              {/* Credits Pool */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
                  <CreditCard className="w-3 h-3" />
                  Créditos Mensais (Pool)
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      value={plan.credits}
                      onChange={(e) => updatePlan(plan.id, 'credits', Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-center"
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-500">créditos/mês</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">
                  Pool compartilhado entre todos os apps. Custos configuráveis em Configurações Globais.
                </p>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
              <button className={`
                w-full py-2.5 rounded-lg text-sm font-bold text-white shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2
                ${plan.id === 'pro' ? 'bg-blue-600 hover:bg-blue-700' : 
                  plan.id === 'vip' ? 'bg-purple-600 hover:bg-purple-700' : 
                  'bg-gray-900 hover:bg-gray-800'}
              `}>
                <Save className="w-4 h-4" />
                Salvar Alterações
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
