import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Sparkles,
  Copy,
  Check,
  TrendingUp,
  Briefcase,
  Info,
  Globe,
  ChevronDown,
  History,
  Lock,
  AlertCircle,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { UpgradeModal } from '@/components/curriculo/UpgradeModal';
import { useTitleTranslator } from '@/hooks/useTitleTranslator';

const AREAS = [
  { value: 'Tecnologia', label: 'Tecnologia / TI' },
  { value: 'Financas', label: 'Finanças' },
  { value: 'Marketing', label: 'Marketing / Vendas' },
  { value: 'Operacoes', label: 'Negócios / Gestão' },
  { value: 'Engenharia', label: 'Engenharia' },
  { value: 'Saude', label: 'Saúde' },
  { value: 'Educacao', label: 'Educação' },
  { value: 'Vendas', label: 'Vendas' },
  { value: 'Produto', label: 'Produto' },
  { value: 'Design', label: 'Design' },
  { value: 'Outro', label: 'Outro' },
];

export default function TitleTranslatorPage() {
  const navigate = useNavigate();
  const {
    status,
    result,
    error,
    formData,
    updateForm,
    translate,
    reset,
    quota,
    hasCredits,
  } = useTitleTranslator();

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const loading = status === 'loading';
  const credits = quota?.remaining ?? 0;

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleTranslate = () => {
    if (!hasCredits) {
      navigate('/pricing');
      return;
    }
    translate();
  };

  // Map production result to demo display format
  const recommended = result?.suggestions.find(s => s.title_us === result.recommended);
  const matchScore = recommended ? recommended.confidence * 10 : 0;
  const alternatives = result?.suggestions
    .filter(s => s.title_us !== result.recommended)
    .map(s => s.title_us) ?? [];
  const explanation = result?.reasoning || recommended?.explanation || '';
  const salaryRange = recommended?.salary_range || '';
  const demandPercent = matchScore;

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-6 relative min-h-screen">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-foreground">Title Translator</h1>
              <span className="bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold px-2 py-0.5 rounded border border-blue-200 dark:border-blue-500/20">BETA TOOL</span>
            </div>
            <p className="text-gray-500 dark:text-muted-foreground text-sm">
              Descubra como seu cargo é conhecido no mercado americano e aumente suas chances.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white dark:bg-card px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-sm font-medium text-gray-600 dark:text-muted-foreground">
              Créditos: <span className="text-gray-900 dark:text-foreground font-bold">{credits}</span>
            </div>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-card border border-gray-200 dark:border-white/10 rounded-lg text-sm font-medium text-gray-600 dark:text-muted-foreground hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
              <History className="w-4 h-4" />
              Histórico
            </button>
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-card border border-gray-200 dark:border-white/10 rounded-lg text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              Recarregar
            </button>
          </div>
        </div>

        {/* Main Form Container */}
        <div className="bg-white dark:bg-card p-6 rounded-xl shadow-sm border border-gray-200 dark:border-white/10">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100 dark:border-white/5">
            <div className="w-8 h-8 bg-blue-50 dark:bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Globe className="w-4 h-4" />
            </div>
            <h2 className="font-bold text-gray-800 dark:text-foreground">Nova Tradução</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 dark:text-muted-foreground uppercase tracking-wider">
                Título no Brasil <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.titleBr}
                onChange={(e) => updateForm({ titleBr: e.target.value })}
                placeholder="Ex: Coordenador de TI"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 rounded-lg text-gray-700 dark:text-foreground placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-white/10 transition-all border border-transparent focus:border-blue-200 dark:focus:border-blue-500/30"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 dark:text-muted-foreground uppercase tracking-wider">
                Área de Atuação
              </label>
              <div className="relative">
                <select
                  value={formData.area}
                  onChange={(e) => updateForm({ area: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 rounded-lg text-gray-700 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-white/10 transition-all border border-transparent focus:border-blue-200 dark:focus:border-blue-500/30 appearance-none cursor-pointer"
                >
                  <option value="" disabled>Selecione...</option>
                  {AREAS.map(area => (
                    <option key={area.value} value={area.value}>{area.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="space-y-2 mb-6">
            <label className="text-xs font-bold text-gray-500 dark:text-muted-foreground uppercase tracking-wider">
              Principais Responsabilidades (Opcional)
            </label>
            <textarea
              value={formData.responsibilities}
              onChange={(e) => updateForm({ responsibilities: e.target.value })}
              placeholder="Ex: Lidero equipe de 5 devs, gerencio cronograma, faço code review..."
              rows={3}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 rounded-lg text-gray-700 dark:text-foreground placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-white/10 transition-all border border-transparent focus:border-blue-200 dark:focus:border-blue-500/30 resize-none"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg text-sm font-bold mb-6">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 dark:text-muted-foreground uppercase tracking-wider">
                Anos de Experiência
              </label>
              <input
                type="number"
                value={formData.years}
                onChange={(e) => updateForm({ years: e.target.value })}
                placeholder="Ex: 5"
                min={0}
                max={50}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 rounded-lg text-gray-700 dark:text-foreground placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-white/10 transition-all border border-transparent focus:border-blue-200 dark:focus:border-blue-500/30"
              />
            </div>

            <button
              onClick={handleTranslate}
              disabled={loading || !formData.titleBr.trim()}
              className={`
                w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all shadow-lg
                ${loading || !formData.titleBr.trim()
                  ? 'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-500 cursor-not-allowed shadow-none'
                  : !hasCredits
                  ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30 cursor-pointer shadow-none hover:bg-amber-200'
                  : 'bg-[#2563eb] text-white hover:bg-blue-700 shadow-blue-200 dark:shadow-blue-900/30'
                }
              `}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  PROCESSANDO...
                </>
              ) : !hasCredits ? (
                <>
                  <Lock className="w-4 h-4" />
                  SEM CRÉDITOS — VER PLANOS
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  TRADUZIR AGORA
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Section */}
        {result && recommended && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Main Result Card */}
            <div className="md:col-span-2 bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-white/10 shadow-sm p-6 relative">
              <div className="absolute top-0 right-0 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl">
                MATCH: {matchScore}%
              </div>

              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xs font-bold text-gray-500 dark:text-muted-foreground uppercase tracking-wider mb-1">
                    Título Recomendado
                  </h3>
                  <h2 className="text-3xl font-bold text-[#2563eb]">
                    {recommended.title_us}
                  </h2>
                </div>
                <button
                  onClick={() => handleCopy(recommended.title_us, 99)}
                  className="p-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  title="Copiar título"
                >
                  {copiedIndex === 99 ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>

              <div className="bg-blue-50 dark:bg-blue-500/10 rounded-lg p-4 border border-blue-100 dark:border-blue-500/20 mb-6">
                <div className="flex gap-3">
                  <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-blue-800 dark:text-blue-300 text-sm leading-relaxed">
                    {explanation}
                  </p>
                </div>
              </div>

              {alternatives.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-gray-500 dark:text-muted-foreground uppercase tracking-wider mb-3">
                    Variações Comuns
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {alternatives.map((alt, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-white/10 text-sm font-medium"
                      >
                        {alt}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Stats Card */}
            <div className="bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-white/10 shadow-sm p-6 space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2 text-gray-500 dark:text-muted-foreground text-xs font-bold uppercase tracking-wider">
                  <Briefcase className="w-4 h-4" />
                  Média Salarial
                </div>
                <div className="text-2xl font-bold text-gray-800 dark:text-foreground">
                  {salaryRange}
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 dark:border-white/5">
                <div className="flex items-center gap-2 mb-2 text-gray-500 dark:text-muted-foreground text-xs font-bold uppercase tracking-wider">
                  <TrendingUp className="w-4 h-4" />
                  Demanda
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all duration-700"
                      style={{ width: `${demandPercent}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-green-600 dark:text-green-400">
                    {demandPercent >= 70 ? 'Alta' : demandPercent >= 40 ? 'Média' : 'Baixa'}
                  </span>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 dark:border-white/5">
                <button
                  onClick={reset}
                  className="w-full py-2.5 rounded-lg text-sm font-bold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                >
                  Nova Tradução
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Info Cards (Bottom) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InfoCard
            icon={<Search className="w-5 h-5 text-blue-500" />}
            title="SEO Otimizado"
            desc="Use o título correto para ser encontrado por recrutadores e sistemas de ATS."
            bgIcon="bg-blue-50 dark:bg-blue-500/10"
          />
          <InfoCard
            icon={<TrendingUp className="w-5 h-5 text-indigo-500" />}
            title="Nível Senioridade"
            desc="Entenda se você é Junior, Mid-Level ou Senior no mercado americano."
            bgIcon="bg-indigo-50 dark:bg-indigo-500/10"
          />
          <InfoCard
            icon={<Briefcase className="w-5 h-5 text-green-500" />}
            title="Salário Real"
            desc="Pesquise salários com base no cargo exato usado pelas empresas dos EUA."
            bgIcon="bg-green-50 dark:bg-green-500/10"
          />
        </div>
      </div>

      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        currentPlanId={quota?.planId}
        reason="limit_reached"
      />
    </DashboardLayout>
  );
}

function InfoCard({ icon, title, desc, bgIcon }: { icon: React.ReactNode; title: string; desc: string; bgIcon: string }) {
  return (
    <div className="bg-white dark:bg-card p-5 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow">
      <div className={`w-10 h-10 ${bgIcon} rounded-lg flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <h3 className="font-bold text-gray-800 dark:text-foreground mb-1">{title}</h3>
      <p className="text-xs text-gray-500 dark:text-muted-foreground leading-relaxed">
        {desc}
      </p>
    </div>
  );
}
