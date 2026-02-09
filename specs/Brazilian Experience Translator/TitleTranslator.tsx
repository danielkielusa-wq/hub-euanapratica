
import React, { useState } from 'react';
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
  Award
} from 'lucide-react';

interface Suggestion {
  title_us: string;
  confidence: number;
  explanation: string;
  why_this_fits: string;
  example_companies: string[];
  salary_range: string;
  example_jd_snippet: string;
}

interface TranslationResult {
  suggestions: Suggestion[];
  recommended: string;
  reasoning: string;
}

const AREAS = [
  'Tecnologia', 
  'Finanças', 
  'Marketing', 
  'Operações', 
  'Engenharia', 
  'Saúde', 
  'Educação', 
  'Vendas',
  'Produto',
  'Design',
  'Outro'
];

const TitleTranslator: React.FC = () => {
  // State
  const [credits, setCredits] = useState(3);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [error, setError] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    titleBr: '',
    area: '',
    responsibilities: '',
    years: ''
  });

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleTranslate = () => {
    if (!formData.titleBr) {
      setError('Por favor, informe seu título atual.');
      return;
    }
    if (credits <= 0) {
      setError('Você não tem créditos suficientes. Recarregue sua carteira.');
      return;
    }

    setError('');
    setLoading(true);

    // Simulate AI Call
    setTimeout(() => {
      setCredits(prev => prev - 1);
      
      // Mock Response based on specification
      const mockResult: TranslationResult = {
        recommended: "Senior Technical Program Manager",
        reasoning: "Given your experience managing cross-functional teams and technical delivery (as implied by 'Coordenador de TI'), 'Technical Program Manager' carries more weight in Big Techs than 'Coordinator'.",
        suggestions: [
          {
            title_us: "Senior Technical Program Manager",
            confidence: 9.2,
            explanation: "Focuses on execution, delivery, and cross-team alignment.",
            why_this_fits: "Fits your description of managing timelines and technical blockers.",
            example_companies: ["Amazon", "Google", "Uber"],
            salary_range: "$160,000 - $220,000",
            example_jd_snippet: "Drive technical programs from inception to delivery, managing complex dependencies and communicating progress to stakeholders."
          },
          {
            title_us: "IT Systems Manager",
            confidence: 8.5,
            explanation: "More traditional corporate IT role, focusing on internal infrastructure.",
            why_this_fits: "Good fit if your focus is more on internal tools and hardware/software upkeep.",
            example_companies: ["Deloitte", "Walmart", "Bank of America"],
            salary_range: "$130,000 - $170,000",
            example_jd_snippet: "Oversee the maintenance and implementation of IT systems, ensuring high availability and security compliance."
          },
          {
            title_us: "Engineering Team Lead",
            confidence: 7.8,
            explanation: "Emphasizes people management within a software engineering context.",
            why_this_fits: "Appropriate if you spend >50% of time on people management and code reviews.",
            example_companies: ["Spotify", "Shopify", "Atlassian"],
            salary_range: "$170,000 - $240,000",
            example_jd_snippet: "Lead a squad of engineers, fostering a culture of technical excellence and career growth."
          }
        ]
      };

      setResult(mockResult);
      setLoading(false);
    }, 2500);
  };

  const renderForm = () => (
    <div className="bg-white rounded-[40px] p-8 md:p-10 border border-gray-100 shadow-sm max-w-3xl mx-auto animate-fade-in">
        <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600">
                <Globe size={24} />
            </div>
            <div>
                <h2 className="text-xl font-black text-gray-900">Nova Tradução</h2>
                <p className="text-sm text-gray-500">Preencha os dados para análise da IA.</p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Título no Brasil *</label>
                <input 
                    type="text" 
                    placeholder="Ex: Coordenador de TI"
                    value={formData.titleBr}
                    onChange={(e) => setFormData({...formData, titleBr: e.target.value})}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-gray-900 outline-none focus:bg-white focus:ring-2 focus:ring-brand-100 transition-all"
                />
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Área de Atuação</label>
                <select 
                    value={formData.area}
                    onChange={(e) => setFormData({...formData, area: e.target.value})}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl font-medium text-gray-700 outline-none focus:bg-white focus:ring-2 focus:ring-brand-100 transition-all"
                >
                    <option value="">Selecione...</option>
                    {AREAS.map(area => <option key={area} value={area}>{area}</option>)}
                </select>
            </div>
        </div>

        <div className="space-y-2 mb-6">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Principais Responsabilidades (Opcional)</label>
            <textarea 
                placeholder="Ex: Lidero equipe de 5 devs, gerencio cronograma, faço code review..."
                value={formData.responsibilities}
                onChange={(e) => setFormData({...formData, responsibilities: e.target.value})}
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl font-medium text-gray-700 outline-none focus:bg-white focus:ring-2 focus:ring-brand-100 transition-all h-32 resize-none"
            />
        </div>

        <div className="space-y-2 mb-8">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Anos de Experiência</label>
            <input 
                type="number" 
                placeholder="Ex: 5"
                value={formData.years}
                onChange={(e) => setFormData({...formData, years: e.target.value})}
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
            disabled={loading || !formData.titleBr}
            className="w-full py-5 bg-brand-600 hover:bg-brand-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-black rounded-2xl shadow-xl shadow-brand-600/20 transition-all flex items-center justify-center gap-3 text-sm uppercase tracking-widest"
        >
            {loading ? <Loader2 className="animate-spin" /> : <><Sparkles size={18} /> Traduzir Título (1 Crédito)</>}
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
                            <CheckCircle2 size={14} /> Recomendação da IA
                        </div>
                        
                        <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">{recommended.title_us}</h2>
                        
                        <div className="flex flex-col md:flex-row gap-8 mb-8">
                            <div className="flex-1">
                                <p className="text-gray-300 text-lg leading-relaxed font-medium">
                                    {result.reasoning}
                                </p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 min-w-[250px]">
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Média Salarial (Ano)</p>
                                        <p className="text-xl font-black text-white">{recommended.salary_range}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Confidence Score</p>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                                                <div className="h-full bg-green-500" style={{ width: `${recommended.confidence * 10}%` }}></div>
                                            </div>
                                            <span className="text-sm font-bold text-green-400">{recommended.confidence}/10</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={() => handleCopy(recommended.title_us, 99)}
                            className="bg-white text-gray-900 px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-gray-100 transition-all shadow-lg active:scale-95"
                        >
                            {copiedIndex === 99 ? <CheckCircle2 size={18} className="text-green-600"/> : <Copy size={18} />}
                            {copiedIndex === 99 ? 'Copiado!' : 'Copiar Título'}
                        </button>
                    </div>
                </div>
            )}

            {/* Alternatives Grid */}
            <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <TrendingUp className="text-brand-600" /> Outras Opções de Mercado
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {result.suggestions.map((s, idx) => (
                        <div key={idx} className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm flex flex-col h-full hover:border-brand-200 transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-brand-50 text-brand-600 rounded-xl">
                                    <Briefcase size={20} />
                                </div>
                                <span className="px-3 py-1 bg-gray-50 text-gray-500 text-[10px] font-bold rounded-lg uppercase tracking-wide">
                                    {s.confidence * 10}% Match
                                </span>
                            </div>

                            <h4 className="text-lg font-black text-gray-900 mb-2 leading-tight min-h-[56px]">{s.title_us}</h4>
                            
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
                                <p className="text-[11px] text-gray-500 italic leading-snug">"{s.example_jd_snippet}"</p>
                            </div>

                            <button 
                                onClick={() => handleCopy(s.title_us, idx)}
                                className="w-full py-3 border border-gray-200 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 text-gray-600 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2"
                            >
                                {copiedIndex === idx ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                                {copiedIndex === idx ? 'Copiado' : 'Copiar Título'}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="text-center">
                <button 
                    onClick={() => { setResult(null); setFormData({ ...formData, titleBr: '' }); }}
                    className="text-gray-400 hover:text-brand-600 font-bold text-sm transition-colors"
                >
                    Fazer Nova Tradução
                </button>
            </div>
        </div>
      );
  };

  return (
    <div className="animate-fade-in pb-20">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 max-w-5xl mx-auto">
        <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-50 text-brand-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-brand-100 mb-3">
               <Award size={14} /> Beta Tool
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">Experience Translator™</h1>
            <p className="text-gray-500 mt-2 text-lg">Traduza sua carreira para o padrão americano com IA.</p>
        </div>

        <div className="bg-white p-2 pr-6 rounded-full border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold">
                {credits}
            </div>
            <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-900">Créditos Disponíveis</span>
                <button className="text-[10px] font-bold text-brand-600 hover:underline text-left">Recarregar agora</button>
            </div>
        </div>
      </div>

      {result ? renderResults() : renderForm()}

    </div>
  );
};

export default TitleTranslator;
