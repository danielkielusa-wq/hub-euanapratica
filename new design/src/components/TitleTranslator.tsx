import React, { useState } from 'react';
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
  History
} from 'lucide-react';

export default function TitleTranslator() {
  const [formData, setFormData] = useState({
    title: '',
    area: '',
    responsibilities: '',
    years: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [copied, setCopied] = useState(false);

  interface TranslationResult {
    usTitle: string;
    matchScore: number;
    alternatives: string[];
    explanation: string;
    salaryRange: string;
  }

  const handleTranslate = () => {
    if (!formData.title || !formData.area || !formData.years) return;
    
    setIsLoading(true);
    setResult(null);

    // Simulate AI processing
    setTimeout(() => {
      // Mock logic for demo purposes
      const mockResults: Record<string, TranslationResult> = {
        'default': {
          usTitle: 'Software Engineer',
          matchScore: 94,
          alternatives: ['Application Developer', 'Full Stack Developer'],
          explanation: 'O termo "Analista" é menos comum nos EUA para desenvolvimento. "Engineer" ou "Developer" são os padrões da indústria.',
          salaryRange: '$90k - $140k/ano'
        }
      };

      setResult(mockResults['default']);
      setIsLoading(false);
    }, 1500);
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result.usTitle);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-6 relative min-h-screen">
      
      {/* Header Section (Matching Prime Jobs) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-800">Title Translator</h1>
            <span className="bg-blue-100 text-blue-600 text-xs font-bold px-2 py-0.5 rounded border border-blue-200">BETA TOOL</span>
          </div>
          <p className="text-gray-500 text-sm">
            Descubra como seu cargo é conhecido no mercado americano e aumente suas chances.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600">
            Créditos: <span className="text-gray-900 font-bold">5</span>
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            <History className="w-4 h-4" />
            Histórico
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-blue-600 hover:bg-gray-50 transition-colors">
            Recarregar
          </button>
        </div>
      </div>

      {/* Main Form Container (Matching Prime Jobs Search Bar Style) */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
            <Globe className="w-4 h-4" />
          </div>
          <h2 className="font-bold text-gray-800">Nova Tradução</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Título no Brasil <span className="text-red-400">*</span>
            </label>
            <input 
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="Ex: Coordenador de TI"
              className="w-full px-4 py-3 bg-gray-50 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all border border-transparent focus:border-blue-200"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Área de Atuação
            </label>
            <div className="relative">
              <select 
                value={formData.area}
                onChange={(e) => setFormData({...formData, area: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all border border-transparent focus:border-blue-200 appearance-none cursor-pointer"
              >
                <option value="" disabled>Selecione...</option>
                <option value="tech">Tecnologia / TI</option>
                <option value="business">Negócios / Gestão</option>
                <option value="marketing">Marketing / Vendas</option>
                <option value="finance">Finanças</option>
                <option value="health">Saúde</option>
                <option value="engineering">Engenharia</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="space-y-2 mb-6">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Principais Responsabilidades (Opcional)
          </label>
          <textarea 
            value={formData.responsibilities}
            onChange={(e) => setFormData({...formData, responsibilities: e.target.value})}
            placeholder="Ex: Lidero equipe de 5 devs, gerencio cronograma, faço code review..."
            rows={3}
            className="w-full px-4 py-3 bg-gray-50 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all border border-transparent focus:border-blue-200 resize-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Anos de Experiência
            </label>
            <input 
              type="number"
              value={formData.years}
              onChange={(e) => setFormData({...formData, years: e.target.value})}
              placeholder="Ex: 5"
              className="w-full px-4 py-3 bg-gray-50 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all border border-transparent focus:border-blue-200"
            />
          </div>

          <button
            onClick={handleTranslate}
            disabled={isLoading || !formData.title || !formData.area || !formData.years}
            className={`
              w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all shadow-lg
              ${isLoading || !formData.title || !formData.area || !formData.years
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                : 'bg-[#2563eb] text-white hover:bg-blue-700 shadow-blue-200'
              }
            `}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                PROCESSANDO...
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
      {result && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Main Result Card */}
          <div className="md:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-6 relative">
            <div className="absolute top-0 right-0 bg-green-100 text-green-700 text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl">
              MATCH: {result.matchScore}%
            </div>
            
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Título Recomendado
                </h3>
                <h2 className="text-3xl font-bold text-[#2563eb] mb-2">
                  {result.usTitle}
                </h2>
              </div>
              <button 
                onClick={handleCopy}
                className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-blue-600 transition-colors"
                title="Copiar título"
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100 mb-6">
              <div className="flex gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-blue-800 text-sm leading-relaxed">
                  {result.explanation}
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                Variações Comuns
              </h4>
              <div className="flex flex-wrap gap-2">
                {result.alternatives.map((alt, idx) => (
                  <span 
                    key={idx}
                    className="px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg border border-gray-200 text-sm font-medium"
                  >
                    {alt}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Stats Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2 text-gray-500 text-xs font-bold uppercase tracking-wider">
                <Briefcase className="w-4 h-4" />
                Média Salarial
              </div>
              <div className="text-2xl font-bold text-gray-800">
                {result.salaryRange}
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100">
              <div className="flex items-center gap-2 mb-2 text-gray-500 text-xs font-bold uppercase tracking-wider">
                <TrendingUp className="w-4 h-4" />
                Demanda
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 w-[85%]"></div>
                </div>
                <span className="text-sm font-bold text-green-600">Alta</span>
              </div>
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
          bgIcon="bg-blue-50"
        />
        <InfoCard 
          icon={<TrendingUp className="w-5 h-5 text-indigo-500" />}
          title="Nível Senioridade"
          desc="Entenda se você é Junior, Mid-Level ou Senior no mercado americano."
          bgIcon="bg-indigo-50"
        />
        <InfoCard 
          icon={<Briefcase className="w-5 h-5 text-green-500" />}
          title="Salário Real"
          desc="Pesquise salários com base no cargo exato usado pelas empresas dos EUA."
          bgIcon="bg-green-50"
        />
      </div>
    </div>
  );
}

function InfoCard({ icon, title, desc, bgIcon }: { icon: React.ReactNode, title: string, desc: string, bgIcon: string }) {
  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className={`w-10 h-10 ${bgIcon} rounded-lg flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <h3 className="font-bold text-gray-800 mb-1">{title}</h3>
      <p className="text-xs text-gray-500 leading-relaxed">
        {desc}
      </p>
    </div>
  );
}
