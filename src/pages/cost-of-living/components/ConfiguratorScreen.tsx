import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, User, Users, UsersRound, ChevronRight, Briefcase, DollarSign, ArrowLeft, Home, Coffee, Car, ArrowRight, Info, HeartPulse } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import type { CityData, UserConfig } from '../types';

interface ConfiguratorScreenProps {
  city: CityData;
  fields: string[];
  onCalculate: (config: UserConfig) => void;
  onBack: () => void;
}

export default function ConfiguratorScreen({ city, fields, onCalculate, onBack }: ConfiguratorScreenProps) {
  const [salary, setSalary] = useState(65000);
  const [familySize, setFamilySize] = useState<UserConfig['familySize']>('single');
  const [children, setChildren] = useState(0);
  const [lifestyle, setLifestyle] = useState<UserConfig['lifestyle']>('moderate');
  const [field, setField] = useState(fields[0] || 'Tech');

  const availableFields = fields.length > 0 ? fields : Object.keys(city.salaries_by_field);
  const baseTotal = city.base_rent + city.base_food + city.base_transport + city.base_health + city.base_other;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-5xl relative z-10">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors mb-6 text-sm font-medium w-fit"
        >
          <ArrowLeft size={16} /> Voltar para o mapa
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200/60 overflow-hidden flex flex-col lg:flex-row"
        >
          {/* Left Panel: City Summary */}
          <div className="w-full lg:w-2/5 bg-slate-50/50 border-b lg:border-b-0 lg:border-r border-slate-200/60 p-8 lg:p-12 flex flex-col relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 blur-[60px] rounded-full pointer-events-none" />

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 text-xs font-semibold tracking-wide uppercase mb-6 w-fit shadow-sm">
              <MapPin size={14} className="text-indigo-500" />
              <span>Destino Selecionado</span>
            </div>

            <h2 className="text-4xl font-bold tracking-tight mb-2 text-slate-900">{city.city_name}</h2>
            <p className="text-slate-500 text-lg mb-10">{city.state_code}</p>

            <div className="space-y-6 flex-1">
              <div className="mb-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-400 uppercase tracking-wider">
                  <Info size={16} /> Custo Base Mensal
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Valores para 1 pessoa, estilo moderado. Fontes: Zillow, BLS e Numbeo (2025). Ajustados pelo seu perfil ao calcular.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white border border-slate-200/60 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <Home size={16} className="text-indigo-400" />
                    <span className="text-sm font-medium">Moradia</span>
                  </div>
                  <div className="text-lg font-semibold text-slate-800">${city.base_rent.toLocaleString()}</div>
                </div>
                <div className="bg-white border border-slate-200/60 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <Coffee size={16} className="text-orange-400" />
                    <span className="text-sm font-medium">Alimentação</span>
                  </div>
                  <div className="text-lg font-semibold text-slate-800">${city.base_food.toLocaleString()}</div>
                </div>
                <div className="bg-white border border-slate-200/60 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <Car size={16} className="text-emerald-400" />
                    <span className="text-sm font-medium">Transporte</span>
                  </div>
                  <div className="text-lg font-semibold text-slate-800">${city.base_transport.toLocaleString()}</div>
                </div>
                <div className="bg-white border border-slate-200/60 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <HeartPulse size={16} className="text-rose-400" />
                    <span className="text-sm font-medium">Saúde</span>
                  </div>
                  <div className="text-lg font-semibold text-slate-800">${city.base_health.toLocaleString()}</div>
                </div>
                <div className="col-span-2 bg-white border border-slate-200/60 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <DollarSign size={16} className="text-blue-400" />
                    <span className="text-sm font-medium">Outros</span>
                  </div>
                  <div className="text-lg font-semibold text-slate-800">${city.base_other.toLocaleString()}</div>
                </div>
              </div>

              <div className="mt-6 bg-indigo-600 rounded-2xl p-6 flex items-center justify-between text-white shadow-lg shadow-indigo-500/20">
                <span className="font-medium text-indigo-100">Total Base</span>
                <span className="text-3xl font-bold">${baseTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Right Panel: Configuration Form */}
          <div className="w-full lg:w-3/5 p-8 lg:p-12 bg-white">
            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight mb-2 text-slate-900">Configure seu perfil</h2>
              <p className="text-slate-500 text-sm">Ajuste os valores para uma simulação mais precisa da sua realidade.</p>
            </div>

            <div className="space-y-8">
              {/* Salary */}
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <label className="text-sm font-semibold text-slate-700">Salário Anual (USD)</label>
                  <span className="text-2xl font-bold text-indigo-600">${salary.toLocaleString()}</span>
                </div>
                <Slider
                  defaultValue={[65000]}
                  max={250000}
                  min={30000}
                  step={1000}
                  value={[salary]}
                  onValueChange={(val) => setSalary(val[0])}
                  className="py-2"
                />
              </div>

              {/* Family Size */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-700">Situação familiar</label>
                <div className="grid grid-cols-3 gap-3">
                  {([
                    { id: 'single' as const, label: 'Sozinho', icon: User },
                    { id: 'couple' as const, label: 'Casal', icon: Users },
                    { id: 'family' as const, label: 'Família', icon: UsersRound },
                  ]).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => { setFamilySize(item.id); if (item.id !== 'family') setChildren(0); }}
                      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        familySize === item.id
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                          : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <item.icon size={24} className={familySize === item.id ? 'text-indigo-600' : 'text-slate-400'} />
                      <span className="font-medium text-sm">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Children */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-700">Filhos</label>
                  <div className="flex gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
                    {[0, 1, 2, 3].map((num) => (
                      <button
                        key={num}
                        onClick={() => setChildren(num)}
                        disabled={familySize !== 'family'}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                          familySize !== 'family' ? 'opacity-40 cursor-not-allowed' : ''
                        } ${
                          children === num && familySize === 'family'
                            ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                            : 'text-slate-500 hover:text-slate-700 border border-transparent'
                        }`}
                      >
                        {num}{num === 3 ? '+' : ''}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lifestyle */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-700">Estilo de vida</label>
                  <div className="flex gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
                    {([
                      { id: 'economic' as const, label: 'Econômico' },
                      { id: 'moderate' as const, label: 'Moderado' },
                      { id: 'high' as const, label: 'Alto' },
                    ]).map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setLifestyle(item.id)}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                          lifestyle === item.id
                            ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                            : 'text-slate-500 hover:text-slate-700 border border-transparent'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Field */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-700">Sua área de atuação</label>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <select
                    value={field}
                    onChange={(e) => setField(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-11 pr-10 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none font-medium text-sm"
                  >
                    {availableFields.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                  <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" size={18} />
                </div>
              </div>

              <button
                onClick={() => onCalculate({ salary, familySize, children, lifestyle, field })}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-base py-4 rounded-xl transition-all flex items-center justify-center gap-2 mt-6 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5"
              >
                Calcular meu custo de vida
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
