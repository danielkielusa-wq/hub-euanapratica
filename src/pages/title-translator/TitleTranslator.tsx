import { useState } from 'react';
import {
  Search,
  ArrowRight,
  Briefcase,
  DollarSign,
  Building2,
  CheckCircle2,
  Copy,
  Sparkles,
  AlertCircle,
  Loader2,
  Globe,
  TrendingUp,
  Award,
  Lock,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { UpgradeModal } from '@/components/curriculo/UpgradeModal';
import { useTitleTranslator, type Suggestion, type TranslationResult } from '@/hooks/useTitleTranslator';

const AREAS = [
  'Tecnologia',
  'Financas',
  'Marketing',
  'Operacoes',
  'Engenharia',
  'Saude',
  'Educacao',
  'Vendas',
  'Produto',
  'Design',
  'Outro',
];

export default function TitleTranslatorPage() {
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
    canTranslate,
  } = useTitleTranslator();

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const loading = status === 'loading';

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleTranslate = () => {
    if (!hasCredits) {
      setShowUpgradeModal(true);
      return;
    }
    translate();
  };

  const credits = quota?.remaining ?? 0;

  const renderForm = () => (
    <div className="bg-white rounded-[40px] p-8 md:p-10 border border-gray-100 shadow-sm max-w-3xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600">
          <Globe size={24} />
        </div>
        <div>
          <h2 className="text-xl font-black text-gray-900">Nova Traducao</h2>
          <p className="text-sm text-gray-500">Preencha os dados para analise da IA.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
            Titulo no Brasil *
          </label>
          <input
            type="text"
            placeholder="Ex: Coordenador de TI"
            value={formData.titleBr}
            onChange={(e) => updateForm({ titleBr: e.target.value })}
            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-gray-900 outline-none focus:bg-white focus:ring-2 focus:ring-brand-100 transition-all"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
            Area de Atuacao
          </label>
          <select
            value={formData.area}
            onChange={(e) => updateForm({ area: e.target.value })}
            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl font-medium text-gray-700 outline-none focus:bg-white focus:ring-2 focus:ring-brand-100 transition-all"
          >
            <option value="">Selecione...</option>
            {AREAS.map(area => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2 mb-6">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
          Principais Responsabilidades (Opcional)
        </label>
        <textarea
          placeholder="Ex: Lidero equipe de 5 devs, gerencio cronograma, faco code review..."
          value={formData.responsibilities}
          onChange={(e) => updateForm({ responsibilities: e.target.value })}
          className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl font-medium text-gray-700 outline-none focus:bg-white focus:ring-2 focus:ring-brand-100 transition-all h-32 resize-none"
        />
      </div>

      <div className="space-y-2 mb-8">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
          Anos de Experiencia
        </label>
        <input
          type="number"
          placeholder="Ex: 5"
          min={0}
          max={50}
          value={formData.years}
          onChange={(e) => updateForm({ years: e.target.value })}
          className="w-32 p-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-gray-900 outline-none focus:bg-white focus:ring-2 focus:ring-brand-100 transition-all"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold mb-6">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      <button
        onClick={handleTranslate}
        disabled={loading || !formData.titleBr.trim()}
        className="w-full py-5 bg-brand-600 hover:bg-brand-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-black rounded-2xl shadow-xl shadow-brand-600/20 transition-all flex items-center justify-center gap-3 text-sm uppercase tracking-widest"
      >
        {loading ? (
          <Loader2 className="animate-spin" />
        ) : !hasCredits ? (
          <>
            <Lock size={18} /> Limite Atingido - Faca Upgrade
          </>
        ) : (
          <>
            <Sparkles size={18} /> Traduzir Titulo (1 Credito)
          </>
        )}
      </button>
    </div>
  );

  const renderResults = () => {
    if (!result) return null;

    const recommended = result.suggestions.find(s => s.title_us === result.recommended);

    return (
      <div className="max-w-5xl mx-auto space-y-10 animate-fade-in-up">
        {/* Recommendation Hero */}
        {recommended && (
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-[40px] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-brand-600 opacity-20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3"></div>

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-500/20 border border-green-500/30 text-green-400 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">
                <CheckCircle2 size={14} /> Recomendacao da IA
              </div>

              <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
                {recommended.title_us}
              </h2>

              <div className="flex flex-col md:flex-row gap-8 mb-8">
                <div className="flex-1">
                  <p className="text-gray-300 text-lg leading-relaxed font-medium">
                    {result.reasoning}
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 min-w-[250px]">
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                        Media Salarial (Ano)
                      </p>
                      <p className="text-xl font-black text-white">{recommended.salary_range}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                        Confidence Score
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500"
                            style={{ width: `${recommended.confidence * 10}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-bold text-green-400">
                          {recommended.confidence}/10
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleCopy(recommended.title_us, 99)}
                className="bg-white text-gray-900 px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-gray-100 transition-all shadow-lg active:scale-95"
              >
                {copiedIndex === 99 ? (
                  <CheckCircle2 size={18} className="text-green-600" />
                ) : (
                  <Copy size={18} />
                )}
                {copiedIndex === 99 ? 'Copiado!' : 'Copiar Titulo'}
              </button>
            </div>
          </div>
        )}

        {/* Alternatives Grid */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <TrendingUp className="text-brand-600" /> Outras Opcoes de Mercado
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {result.suggestions.map((s, idx) => (
              <div
                key={idx}
                className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm flex flex-col h-full hover:border-brand-200 transition-all group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-brand-50 text-brand-600 rounded-xl">
                    <Briefcase size={20} />
                  </div>
                  <span className="px-3 py-1 bg-gray-50 text-gray-500 text-[10px] font-bold rounded-lg uppercase tracking-wide">
                    {s.confidence * 10}% Match
                  </span>
                </div>

                <h4 className="text-lg font-black text-gray-900 mb-2 leading-tight min-h-[56px]">
                  {s.title_us}
                </h4>

                <p className="text-xs text-gray-500 leading-relaxed mb-6 flex-1">
                  {s.explanation}
                </p>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                    <DollarSign size={14} className="text-emerald-500" />
                    {s.salary_range}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                    <Building2 size={14} className="text-brand-500" />
                    {s.example_companies.join(', ')}
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-xl mb-6">
                  <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Exemplo em JD:</p>
                  <p className="text-[11px] text-gray-500 italic leading-snug">
                    "{s.example_jd_snippet}"
                  </p>
                </div>

                <button
                  onClick={() => handleCopy(s.title_us, idx)}
                  className="w-full py-3 border border-gray-200 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 text-gray-600 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2"
                >
                  {copiedIndex === idx ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                  {copiedIndex === idx ? 'Copiado' : 'Copiar Titulo'}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={reset}
            className="text-gray-400 hover:text-brand-600 font-bold text-sm transition-colors"
          >
            Fazer Nova Traducao
          </button>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#F5F5F7] p-6 md:p-8">
        <div className="animate-fade-in pb-20">
          {/* Top Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 max-w-5xl mx-auto">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-50 text-brand-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-brand-100 mb-3">
                <Award size={14} /> Beta Tool
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
                Experience Translator
              </h1>
              <p className="text-gray-500 mt-2 text-lg">
                Traduza sua carreira para o padrao americano com IA.
              </p>
            </div>

            <div className="bg-white p-2 pr-6 rounded-full border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold">
                {credits}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-900">Creditos Disponiveis</span>
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="text-[10px] font-bold text-brand-600 hover:underline text-left"
                >
                  Recarregar agora
                </button>
              </div>
            </div>
          </div>

          {result ? renderResults() : renderForm()}
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
