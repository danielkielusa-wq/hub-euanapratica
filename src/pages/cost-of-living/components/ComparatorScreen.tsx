import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, ArrowLeft, Search, ArrowRightLeft, Home, Coffee, Car, HeartPulse, Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import type { CityData, UserConfig, COLConfigs } from '../types';
import { calculateCityCosts } from '../utils/calculations';

interface ComparatorScreenProps {
  city: CityData;
  cities: CityData[];
  config: UserConfig;
  configs: COLConfigs;
  onBack: () => void;
}

const COST_ITEMS = [
  { key: 'rent' as const, label: 'Moradia', icon: Home },
  { key: 'food' as const, label: 'Alimentação', icon: Coffee },
  { key: 'transport' as const, label: 'Transporte', icon: Car },
  { key: 'health' as const, label: 'Saúde', icon: HeartPulse },
  { key: 'other' as const, label: 'Outros', icon: Wallet },
];

export default function ComparatorScreen({ city: initialCity, cities, config, configs, onBack }: ComparatorScreenProps) {
  const [city1Id, setCity1Id] = useState(initialCity.id);
  const [city2Id, setCity2Id] = useState(() => {
    if (initialCity.cheaper_alternative) {
      const alt = cities.find(c => c.slug === initialCity.cheaper_alternative);
      if (alt) return alt.id;
    }
    const other = cities.find(c => c.id !== initialCity.id);
    return other?.id || initialCity.id;
  });
  const [searchQuery, setSearchQuery] = useState('');

  const city1 = cities.find(c => c.id === city1Id) || initialCity;
  const city2 = cities.find(c => c.id === city2Id) || cities[0];

  const data1 = calculateCityCosts(city1, config, configs.familyMultipliers, configs.lifestyleMultipliers);
  const data2 = calculateCityCosts(city2, config, configs.familyMultipliers, configs.lifestyleMultipliers);

  const winner = data1.leftover > data2.leftover ? city1 : city2;
  const savingsAmount = Math.abs(data1.total - data2.total);

  const filteredCities = searchQuery
    ? cities.filter(c => c.id !== city1.id && c.city_name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const handleSwap = () => {
    setCity1Id(city2.id);
    setCity2Id(city1.id);
  };

  const renderCityCard = (city: CityData, data: typeof data1, isWinner: boolean, side: 'left' | 'right') => (
    <motion.div
      initial={{ opacity: 0, x: side === 'right' ? 20 : -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`bg-white border rounded-2xl p-6 relative overflow-hidden shadow-sm ${
        isWinner
          ? 'border-emerald-300 ring-1 ring-emerald-200'
          : data.leftover < 0
            ? 'border-rose-200'
            : 'border-slate-200'
      }`}
    >
      {isWinner && (
        <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl flex items-center gap-1 uppercase tracking-wide">
          <Trophy size={10} /> Melhor opção
        </div>
      )}
      {!isWinner && data.leftover < 0 && (
        <div className="absolute top-0 right-0 bg-rose-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wide">
          Acima do orçamento
        </div>
      )}

      <h2 className="text-2xl font-bold mb-1 text-slate-900">{city.city_name}, {city.state_code}</h2>

      {/* Leftover summary — clear message */}
      <div className="mb-5">
        {data.leftover >= 0 ? (
          <p className="text-sm text-emerald-600 font-medium flex items-center gap-1.5">
            <TrendingUp size={14} />
            Sobram <span className="font-bold font-mono">${data.leftover.toLocaleString()}</span>/mês do salário líquido
          </p>
        ) : (
          <p className="text-sm text-rose-600 font-medium flex items-center gap-1.5">
            <TrendingDown size={14} />
            Faltam <span className="font-bold font-mono">${Math.abs(data.leftover).toLocaleString()}</span>/mês para cobrir custos
          </p>
        )}
        <p className="text-[10px] text-slate-400 mt-1">Impostos: ~{data.tax.effectiveRate}% (federal + {city.state_code} + FICA)</p>
      </div>

      {/* Cost breakdown */}
      <div className="space-y-0 mb-4">
        {COST_ITEMS.map(item => {
          const value = data.costs[item.key];
          return (
            <div key={item.key} className="flex justify-between items-center py-2.5 border-b border-slate-100 last:border-0">
              <span className="text-slate-500 text-sm flex items-center gap-2">
                <item.icon size={14} className="text-slate-400" />
                {item.label}
              </span>
              <span className="font-mono text-slate-900 font-medium text-sm">${value.toLocaleString()}</span>
            </div>
          );
        })}
      </div>

      {/* Total */}
      <div className="flex justify-between items-center py-3 bg-slate-50 rounded-xl px-4 mb-4">
        <span className="text-slate-700 font-semibold text-sm">Total Mensal</span>
        <span className="font-mono text-slate-900 font-bold text-lg">${data.total.toLocaleString()}</span>
      </div>

      {/* Salary */}
      <div className="flex justify-between items-center py-3 bg-indigo-50 rounded-xl px-4">
        <div>
          <span className="text-indigo-600 text-sm font-medium block">Líquido Mensal</span>
          <span className="text-[10px] text-indigo-400">Bruto: ${data.monthlySalary.toLocaleString()}/mês</span>
        </div>
        <span className="font-mono text-indigo-700 font-bold">${data.netMonthlySalary.toLocaleString()}<span className="text-xs font-normal text-indigo-400">/mês</span></span>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8 overflow-y-auto">
      <div className="max-w-5xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors mb-6 text-sm font-medium">
          <ArrowLeft size={16} /> Voltar para o resultado
        </button>

        <header className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2 text-slate-900">Comparador de Cidades</h1>
          <p className="text-slate-500 text-sm">Veja qual cidade oferece o melhor custo-benefício para o seu perfil.</p>
        </header>

        {/* City selector row — outside cards */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center mb-6">
          <div className="text-center">
            <span className="text-sm font-semibold text-slate-700">{city1.city_name}, {city1.state_code}</span>
          </div>

          <button
            onClick={handleSwap}
            className="hidden md:flex w-10 h-10 bg-white border border-slate-200 rounded-full items-center justify-center shadow-sm hover:border-indigo-300 hover:text-indigo-600 transition-colors cursor-pointer mx-auto"
            title="Inverter cidades"
          >
            <ArrowRightLeft size={16} className="text-slate-400 hover:text-indigo-600" />
          </button>

          <div className="relative max-w-xs mx-auto w-full md:max-w-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Trocar cidade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm shadow-sm text-center"
            />
            {searchQuery && filteredCities.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xl z-50 max-h-48 overflow-y-auto">
                {filteredCities.map(c => (
                  <button
                    key={c.id}
                    onClick={() => { setCity2Id(c.id); setSearchQuery(''); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-sm text-slate-700 font-medium border-b border-slate-100 last:border-0"
                  >
                    {c.city_name}, {c.state_code}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cards side by side — symmetric */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {renderCityCard(city1, data1, winner.id === city1.id, 'left')}
          {renderCityCard(city2, data2, winner.id === city2.id, 'right')}
        </div>

        {/* Mobile swap button */}
        <div className="flex md:hidden justify-center mb-6">
          <button
            onClick={handleSwap}
            className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium text-slate-600 shadow-sm"
          >
            <ArrowRightLeft size={14} /> Inverter cidades
          </button>
        </div>

        {/* Winner verdict */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 max-w-2xl mx-auto text-center"
        >
          <h3 className="text-emerald-800 font-bold mb-1 flex items-center justify-center gap-2 text-sm">
            <Trophy size={16} className="text-emerald-600" /> {winner.city_name} é a melhor escolha para você
          </h3>
          <p className="text-emerald-700/80 text-sm">
            {savingsAmount > 0
              ? `Você economiza $${savingsAmount.toLocaleString()}/mês comparado a ${winner.id === city1.id ? city2.city_name : city1.city_name}, com base no seu perfil de ${config.field}.`
              : `Ambas as cidades têm custo de vida semelhante para o seu perfil.`}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
