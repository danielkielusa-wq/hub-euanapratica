import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';
import { Lock, Unlock, Share2, Map, Target, Info, Briefcase, Check, HelpCircle, DollarSign, Home, Coffee, Car, HeartPulse, Wallet } from 'lucide-react';
import type { CityData, UserConfig, COLConfigs } from '../types';
import { calculateCityCosts, rankCities } from '../utils/calculations';
import { useCostOfLivingLead } from '@/hooks/useCostOfLiving';

interface ResultScreenProps {
  city: CityData;
  cities: CityData[];
  config: UserConfig;
  configs: COLConfigs;
  onBack: () => void;
  onCompare: () => void;
}

export default function ResultScreen({ city, cities, config, configs, onBack, onCompare }: ResultScreenProps) {
  const [unlocked, setUnlocked] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [animatedLeftover, setAnimatedLeftover] = useState(0);
  const [animatedCoverage, setAnimatedCoverage] = useState(0);
  const [copied, setCopied] = useState(false);
  const { saveLead, isSaving } = useCostOfLivingLead();
  const animRef = useRef<number>();

  const { costs, total, monthlySalary, netMonthlySalary, tax, leftover, coverage } = calculateCityCosts(
    city, config, configs.familyMultipliers, configs.lifestyleMultipliers,
  );

  const allRanked = rankCities(cities, config, configs.familyMultipliers, configs.lifestyleMultipliers);
  const top3 = allRanked.slice(0, 3);
  const selectedRankIndex = allRanked.findIndex(c => c.city.id === city.id);
  const isInTop3 = selectedRankIndex < 3;

  const gaugeData = [
    { name: 'bg', value: 200, fill: '#f1f5f9' },
    { name: 'coverage', value: coverage, fill: leftover >= 0 ? '#10b981' : '#ef4444' },
  ];

  const barData = [
    { name: 'Moradia', label: 'Aluguel + condomínio', value: costs.rent, fill: '#6366f1', icon: Home },
    { name: 'Alimentação', label: 'Mercado + restaurantes', value: costs.food, fill: '#2dd4bf', icon: Coffee },
    { name: 'Transporte', label: 'Carro + seguro + gasolina', value: costs.transport, fill: '#f59e0b', icon: Car },
    { name: 'Saúde', label: 'Plano de saúde (premium mensal)', value: costs.health, fill: '#ef4444', icon: HeartPulse },
    { name: 'Outros', label: 'Lazer, serviços, imprevistos', value: costs.other, fill: '#8b5cf6', icon: Wallet },
  ];

  // Count-up animation
  useEffect(() => {
    const start = performance.now();
    const duration = 2000;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4);
      setAnimatedLeftover(Math.round(leftover * ease));
      setAnimatedCoverage(Math.round(coverage * ease));
      if (progress < 1) animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [leftover, coverage]);

  useEffect(() => {
    const stored = sessionStorage.getItem('col_unlocked');
    if (stored) setUnlocked(true);
  }, []);

  const handleUnlock = async () => {
    if (!email.includes('@')) return;
    const { error } = await saveLead({
      name: name || undefined,
      email,
      city_slug: city.slug,
      salary: config.salary,
      family_size: config.familySize,
      children: config.children,
      lifestyle: config.lifestyle,
      field: config.field,
      result_leftover: leftover,
      result_coverage: coverage,
    });
    if (!error) {
      setUnlocked(true);
      sessionStorage.setItem('col_unlocked', '1');
    }
  };

  const handleShare = async () => {
    const params = new URLSearchParams({
      city: city.slug,
      salary: String(config.salary),
      family: config.familySize,
      children: String(config.children),
      lifestyle: config.lifestyle,
      field: config.field,
    });
    const shareUrl = `${window.location.origin}/custo-de-vida?${params}`;

    const familyLabel = config.familySize === 'single' ? 'Sozinho' : config.familySize === 'couple' ? 'Casal' : `Família (${config.children} filhos)`;
    const lifestyleLabel = config.lifestyle === 'economic' ? 'Econômico' : config.lifestyle === 'moderate' ? 'Moderado' : 'Alto';
    const text = `Meu Custo de Vida nos EUA\n${city.city_name}, ${city.state_code} | ${familyLabel} | ${lifestyleLabel}\n\nCusto: $${total.toLocaleString()}/mês\nLíquido: $${netMonthlySalary.toLocaleString()}/mês\n${leftover >= 0 ? 'Sobra' : 'Falta'}: $${Math.abs(leftover).toLocaleString()}/mês\n\nDescubra o seu: ${shareUrl}`;

    try {
      if (navigator.share) {
        await navigator.share({ title: 'Meu Custo de Vida nos EUA', text, url: shareUrl });
      } else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch { /* user cancelled */ }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-6 lg:p-8 overflow-y-auto flex flex-col">
      <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col">
        <header className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3 text-slate-900">
              {city.city_name}, {city.state_code}
            </h1>
            <div className="flex flex-wrap gap-2 text-xs font-mono text-slate-600">
              <span className="bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                {config.familySize === 'single' ? 'Sozinho' : config.familySize === 'couple' ? 'Casal' : 'Família'}
              </span>
              {config.familySize === 'family' && (
                <span className="bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">{config.children} filho(s)</span>
              )}
              <span className="bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                Estilo {config.lifestyle === 'economic' ? 'Econômico' : config.lifestyle === 'moderate' ? 'Moderado' : 'Alto'}
              </span>
              <span className="bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100 text-indigo-600 font-semibold">{config.field}</span>
            </div>
          </div>
          <button
            onClick={onBack}
            className="text-slate-500 hover:text-indigo-600 transition-colors text-sm font-medium flex items-center gap-1.5 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm"
          >
            ← Refazer cálculo
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
          {/* Left Column: Combined Result Card */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-slate-200 rounded-3xl p-5 relative shadow-sm flex-1 flex flex-col"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent rounded-t-3xl" />

              {/* Gauge — compact */}
              <div className="flex flex-col items-center mb-1">
                <div className="h-24 w-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart cx="50%" cy="95%" innerRadius="68%" outerRadius="95%" barSize={12} data={gaugeData} startAngle={180} endAngle={0}>
                      <RadialBar background dataKey="value" cornerRadius={10} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                </div>
                <span className="text-2xl md:text-3xl font-bold font-mono tracking-tighter -mt-1" style={{ color: gaugeData[1].fill }}>
                  {animatedLeftover >= 0 ? '+' : '-'}${Math.abs(animatedLeftover).toLocaleString()}/mês
                </span>
                <p className="text-slate-400 text-xs mt-1 text-center">
                  {leftover >= 0
                    ? `Sobra dinheiro! Seu salário líquido cobre ${animatedCoverage}% do custo.`
                    : `Seu salário líquido cobre ${animatedCoverage}% do custo. Faltam $${Math.abs(leftover).toLocaleString()}.`}
                </p>
              </div>

              {/* Salary vs Cost summary row */}
              <div className="grid grid-cols-3 gap-2 mt-4 mb-4">
                <div className="bg-slate-50 border border-slate-100 rounded-xl px-2 py-2.5 text-center group relative">
                  <p className="text-[10px] text-slate-500 uppercase font-semibold mb-0.5 flex items-center justify-center gap-1">
                    Bruto <HelpCircle size={8} className="text-slate-400" />
                  </p>
                  <p className="text-sm font-mono font-bold text-slate-500 line-through decoration-slate-300">${monthlySalary.toLocaleString()}</p>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 bg-slate-800 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    Salário bruto: ${config.salary.toLocaleString()}/ano ÷ 12
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
                  </div>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-2 py-2.5 text-center group relative">
                  <p className="text-[10px] text-emerald-600 uppercase font-semibold mb-0.5 flex items-center justify-center gap-1">
                    Líquido <HelpCircle size={8} className="text-emerald-400" />
                  </p>
                  <p className="text-sm font-mono font-bold text-emerald-700">${netMonthlySalary.toLocaleString()}</p>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 bg-slate-800 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 w-48 text-center">
                    <p className="font-semibold mb-1">Impostos estimados ({tax.effectiveRate}%)</p>
                    <p>Federal: ${Math.round(tax.federalTax / 12).toLocaleString()}/mês</p>
                    <p>Estadual ({city.state_code}): ${Math.round(tax.stateTax / 12).toLocaleString()}/mês</p>
                    <p>FICA (SS+Medicare): ${Math.round(tax.fica / 12).toLocaleString()}/mês</p>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
                  </div>
                </div>
                <div className="bg-rose-50 border border-rose-100 rounded-xl px-2 py-2.5 text-center group relative">
                  <p className="text-[10px] text-rose-600 uppercase font-semibold mb-0.5 flex items-center justify-center gap-1">
                    Custos <HelpCircle size={8} className="text-rose-400" />
                  </p>
                  <p className="text-sm font-mono font-bold text-rose-700">${total.toLocaleString()}</p>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 bg-slate-800 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    Moradia + alimentação + transporte + saúde + outros
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-slate-100 pt-4 flex-1 flex flex-col">
                <h3 className="text-slate-500 text-[10px] uppercase tracking-wider font-semibold mb-3">Para onde vai seu dinheiro</h3>

                {/* Stacked bar */}
                <div className="h-6 w-full flex rounded-full overflow-hidden mb-3 bg-slate-100">
                  {barData.map((item, i) => (
                    <motion.div
                      key={item.name}
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.value / total) * 100}%` }}
                      transition={{ duration: 1, delay: 0.3 + i * 0.1 }}
                      className="h-full"
                      style={{ backgroundColor: item.fill }}
                    />
                  ))}
                </div>

                {/* Cost items with icons and tooltips */}
                <div className="grid grid-cols-2 gap-2 mt-auto">
                  {barData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2 bg-slate-50 rounded-lg px-2.5 py-2 border border-slate-100 group relative">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${item.fill}15` }}>
                        <item.icon size={14} style={{ color: item.fill }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] text-slate-400 font-semibold leading-none mb-0.5 flex items-center gap-1">
                          {item.name}
                          <HelpCircle size={9} className="text-slate-300 shrink-0" />
                        </p>
                        <p className="font-mono text-slate-900 font-semibold text-sm leading-none">${item.value.toLocaleString()}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{Math.round((item.value / total) * 100)}%</span>
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 bg-slate-800 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                        {item.label}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Helper tip card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-indigo-50/50 border border-indigo-100 rounded-2xl px-4 py-3 flex items-start gap-2.5"
            >
              <Info size={14} className="text-indigo-400 mt-0.5 shrink-0" />
              <p className="text-xs text-slate-600 leading-relaxed">
                <span className="font-semibold text-indigo-700">Como ler este resultado:</span>{' '}
                {leftover >= 0
                  ? `Com o perfil selecionado, você teria $${leftover.toLocaleString()} de folga por mês em ${city.city_name}. Já descontados ~${tax.effectiveRate}% de impostos (federal + ${city.state_code} + FICA).`
                  : `Com o perfil selecionado, seu salário líquido não cobre 100% dos custos em ${city.city_name}. Considere ajustar o estilo de vida ou explorar cidades mais acessíveis no comparador.`}
              </p>
            </motion.div>
          </div>

          {/* Right Column: Locked Section */}
          <div className="lg:col-span-7">
            <div className="relative rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-sm h-full flex flex-col">
              <div className={`p-6 md:p-8 flex-1 flex flex-col transition-all duration-1000 ${!unlocked ? 'filter blur-md opacity-40 select-none pointer-events-none' : ''}`}>
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-900">
                  <Unlock className="text-indigo-500" size={20} />
                  Insights Premium Desbloqueados
                </h3>

                <div className="flex-1 flex flex-col gap-6">
                  {/* Ranking */}
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      Ranking Personalizado
                      <span className="group relative cursor-help">
                        <HelpCircle size={11} className="text-slate-400" />
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 bg-slate-800 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 font-normal normal-case tracking-normal">
                          Cidades ordenadas por quanto sobra/falta no seu perfil e salário
                          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
                        </span>
                      </span>
                    </h4>
                    <p className="text-[10px] text-slate-400 mb-4">Baseado no seu salário de ${config.salary.toLocaleString()}/ano em {config.field}</p>
                    <div className="space-y-3">
                      {top3.map((item, index) => (
                        <div key={item.city.id} className="flex justify-between items-center">
                          <span className="font-medium text-slate-900 flex items-center gap-2 text-sm">
                            {['🥇', '🥈', '🥉'][index]} {item.city.city_name}, {item.city.state_code}
                          </span>
                          <span className={`text-xs font-mono font-medium ${item.leftover >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {item.leftover >= 0 ? 'Sobra' : 'Falta'} ${Math.abs(item.leftover).toLocaleString()}/mês
                          </span>
                        </div>
                      ))}

                      {!isInTop3 && (
                        <>
                          <div className="border-t border-slate-200 my-2 pt-2" />
                          <div className="flex justify-between items-center bg-indigo-50 p-2.5 rounded-xl border border-indigo-100">
                            <span className="font-medium text-indigo-900 flex items-center gap-2 text-sm">
                              <span className="text-slate-400 text-xs w-4 text-center">{selectedRankIndex + 1}.</span> {city.city_name}, {city.state_code}
                            </span>
                            <span className={`text-xs font-mono font-medium ${leftover >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {leftover >= 0 ? 'Sobra' : 'Falta'} ${Math.abs(leftover).toLocaleString()}/mês
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Data & Tips */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col justify-center group relative">
                      <p className="text-slate-500 text-[10px] mb-1 uppercase font-semibold flex items-center gap-1">
                        Salário Médio ({config.field}) <HelpCircle size={9} className="text-slate-400" />
                      </p>
                      <p className="text-xl font-mono font-bold text-indigo-600">${(city.salaries_by_field[config.field] || 0).toLocaleString()}<span className="text-xs font-normal text-slate-400">/ano</span></p>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 bg-slate-800 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                        Mediana salarial anual para {config.field} em {city.city_name} (fonte: BLS OES)
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
                      </div>
                    </div>
                    {city.ranking && (
                      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col justify-center group relative">
                        <p className="text-slate-500 text-[10px] mb-1 uppercase font-semibold flex items-center gap-1">
                          Ranking Nacional <HelpCircle size={9} className="text-slate-400" />
                        </p>
                        <p className="text-xl font-bold text-slate-900">{city.ranking}ª <span className="text-xs font-normal text-slate-500">mais cara</span></p>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 bg-slate-800 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                          Posição entre as maiores cidades dos EUA por custo de vida geral
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
                        </div>
                      </div>
                    )}
                  </div>

                  {city.cheaper_alternative && (
                    <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100">
                      <p className="text-indigo-600 text-xs mb-1.5 flex items-center gap-1.5 font-semibold"><Info size={14} /> Dica de Ouro</p>
                      <p className="text-slate-700 text-sm leading-relaxed">
                        Você pesquisou <span className="font-semibold">{city.city_name}</span>, mas{' '}
                        <span className="font-semibold capitalize">{city.cheaper_alternative.split('-').slice(0, -1).join(' ')}</span>{' '}
                        te dá <span className="font-bold text-indigo-600">{city.cheaper_alternative_pct}% a mais</span> de folga no orçamento.
                      </p>
                    </div>
                  )}
                </div>

                {/* CTAs */}
                <div className="mt-6 flex flex-col gap-3">
                  <a
                    href={`/avaliar?source=custo-de-vida&cidade=${city.slug}&cargo=${encodeURIComponent(config.field)}&salario=${config.salary}`}
                    className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm text-base"
                  >
                    <Target size={18} /> Montar plano pra {city.city_name}
                  </a>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={handleShare}
                      className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium py-2.5 px-2 rounded-xl transition-colors flex items-center justify-center gap-1.5 text-xs"
                    >
                      {copied ? <Check size={14} className="text-emerald-600" /> : <Share2 size={14} />}
                      {copied ? 'Copiado!' : 'Compartilhar'}
                    </button>
                    <button
                      onClick={onCompare}
                      className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium py-2.5 px-2 rounded-xl transition-colors flex items-center justify-center gap-1.5 text-xs"
                    >
                      <Map size={14} /> Comparar
                    </button>
                    <a
                      href={`/prime-jobs?location=${encodeURIComponent(city.city_name)}`}
                      className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium py-2.5 px-2 rounded-xl transition-colors flex items-center justify-center gap-1.5 text-xs"
                    >
                      <Briefcase size={14} /> Vagas
                    </a>
                  </div>
                </div>
              </div>

              {/* Email Gate */}
              {!unlocked && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 bg-slate-50/80 backdrop-blur-sm">
                  <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-xl max-w-sm w-full text-center">
                    <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-5 border border-indigo-100">
                      <Lock className="text-indigo-500" size={24} />
                    </div>
                    <h4 className="text-xl font-bold mb-2 text-slate-900">Veja o ranking completo</h4>
                    <p className="text-slate-500 text-sm mb-6">
                      Descubra quais cidades dos EUA fazem seu salário render mais e veja dicas de alternativas mais baratas.
                    </p>
                    <div className="flex flex-col gap-3">
                      <input
                        type="text"
                        placeholder="Seu nome"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
                      />
                      <input
                        type="email"
                        placeholder="Seu melhor e-mail"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
                      />
                      <button
                        onClick={handleUnlock}
                        disabled={isSaving || !email.includes('@')}
                        className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors shadow-sm text-sm"
                      >
                        {isSaving ? 'Salvando...' : 'Desbloquear grátis'}
                      </button>
                    </div>
                    <p className="text-xs text-slate-400 mt-4">Zero spam. Cancele quando quiser.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
