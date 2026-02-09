
import React, { useState } from 'react';
import { 
  MessageSquare, 
  Send, 
  Copy, 
  Check, 
  Sparkles, 
  Zap, 
  Briefcase, 
  User, 
  Link as LinkIcon, 
  Loader2, 
  Info,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Clock,
  X,
  Calendar
} from 'lucide-react';

interface ScriptResult {
  type: 'warm' | 'cold' | 'followup' | 'reconnect';
  title: string;
  subject?: string;
  body: string;
  explanation: string;
  timing: string;
}

interface GenerationResult {
  scripts: ScriptResult[];
  dos: string[];
  donts: string[];
  schedule: string;
}

const NetworkingScriptTool: React.FC = () => {
  // Form State
  const [formData, setFormData] = useState({
    targetName: '',
    targetCompany: '',
    targetRole: 'recruiter', // recruiter, peer, hiring_manager
    connectionDegree: '2', // 1, 2, 3
    mutualConnection: '',
    jobContext: '',
    myBackground: ''
  });

  // UI State
  const [step, setStep] = useState<'form' | 'loading' | 'results'>('form');
  const [results, setResults] = useState<GenerationResult | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [expandedCard, setExpandedCard] = useState<number | null>(0); // Default first open

  // Mock AI Generation
  const handleGenerate = () => {
    if (!formData.targetName || !formData.targetCompany) return;

    setStep('loading');

    // Simulate AI Latency
    setTimeout(() => {
      const mockResults: GenerationResult = {
        scripts: [
          {
            type: 'cold',
            title: 'Abordagem Direta (Alta Relevância)',
            subject: `Question about ${formData.targetRole === 'recruiter' ? 'open roles' : 'engineering team'} at ${formData.targetCompany}`,
            body: `Hi ${formData.targetName},\n\nI've been following ${formData.targetCompany}'s work on [Specific Project] and recently saw the [Job Title] opening.\n\nBased on my background in ${formData.myBackground || 'tech'}, I believe I could bring value to the team immediately.\n\nWould you be open to a brief 10-min chat to discuss how my experience aligns with your current goals?\n\nBest,\n[Your Name]`,
            explanation: 'Esta mensagem funciona porque vai direto ao ponto, mostra que você fez o "dever de casa" sobre a empresa e pede pouco tempo (low friction).',
            timing: 'Enviar terça ou quarta-feira, entre 09:00 e 11:00.'
          },
          {
            type: 'warm',
            title: 'Usando Conexão Mútua',
            subject: `Intro from ${formData.mutualConnection || 'our mutual connection'}`,
            body: `Hi ${formData.targetName},\n\nOur mutual friend ${formData.mutualConnection || '[Name]'} suggested I reach out to you given your experience at ${formData.targetCompany}.\n\nI'm very interested in the [Role Name] position and would love to ask 2 quick questions about the team culture before I apply officially.\n\nDo you have a moment later this week?\n\nThanks,\n[Your Name]`,
            explanation: 'Mencionar um nome conhecido aumenta a taxa de resposta em até 40%. É uma prova social instantânea.',
            timing: 'Qualquer dia útil, preferencialmente à tarde.'
          }
        ],
        dos: [
          'Pesquise algo recente sobre a empresa antes de enviar.',
          'Mantenha a mensagem com menos de 100 palavras.',
          'Termine sempre com uma pergunta (Call to Action).'
        ],
        donts: [
          'Não peça um emprego diretamente na primeira mensagem.',
          'Não envie "Oi, tudo bem?" e espere a resposta.',
          'Não use formatação genérica que pareça spam.'
        ],
        schedule: 'Dia 1: Enviar conexão/mensagem.\nDia 4: Se aceito, enviar a pergunta.\nDia 8: Follow-up leve (valor agregado).'
      };

      setResults(mockResults);
      setStep('results');
    }, 2000);
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'warm': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'cold': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'followup': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 animate-fade-in">
      
      {/* Header */}
      <div className="mb-10 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-50 text-brand-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-brand-100 mb-4">
           <Sparkles size={14} /> AI Powered Tool
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight mb-4">
          Networking Script Generator
        </h1>
        <p className="text-gray-500 text-lg">
          Não sabe o que dizer no LinkedIn? Nossa IA cria mensagens personalizadas, educadas e estratégicas para aumentar sua taxa de resposta.
        </p>
      </div>

      {step === 'form' && (
        <div className="bg-white rounded-[40px] p-8 md:p-10 shadow-sm border border-gray-100">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* Target Info */}
              <div className="space-y-5">
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                      <User size={16} className="text-brand-600" /> Quem é o Alvo?
                  </h3>
                  
                  <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500">Nome da Pessoa</label>
                      <input 
                        type="text" 
                        placeholder="Ex: Sarah Johnson" 
                        value={formData.targetName}
                        onChange={(e) => setFormData({...formData, targetName: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-brand-100 outline-none transition-all"
                      />
                  </div>

                  <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500">Empresa Alvo</label>
                      <input 
                        type="text" 
                        placeholder="Ex: Google, Nubank..." 
                        value={formData.targetCompany}
                        onChange={(e) => setFormData({...formData, targetCompany: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-brand-100 outline-none transition-all"
                      />
                  </div>

                  <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500">Cargo da Pessoa</label>
                      <select 
                        value={formData.targetRole}
                        onChange={(e) => setFormData({...formData, targetRole: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white outline-none"
                      >
                          <option value="recruiter">Recrutador / TA</option>
                          <option value="hiring_manager">Hiring Manager (Chefe)</option>
                          <option value="peer">Colega (Mesma função)</option>
                          <option value="exec">Executivo / C-Level</option>
                      </select>
                  </div>
              </div>

              {/* Context Info */}
              <div className="space-y-5">
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                      <LinkIcon size={16} className="text-brand-600" /> Contexto da Conexão
                  </h3>

                  <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500">Grau de Conexão</label>
                      <div className="grid grid-cols-3 gap-2">
                          {['1', '2', '3'].map((deg) => (
                              <button
                                key={deg}
                                onClick={() => setFormData({...formData, connectionDegree: deg})}
                                className={`py-3 rounded-xl text-sm font-bold border transition-all ${
                                    formData.connectionDegree === deg 
                                    ? 'bg-brand-600 text-white border-brand-600 shadow-md' 
                                    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                                }`}
                              >
                                  {deg}º Grau
                              </button>
                          ))}
                      </div>
                  </div>

                  {formData.connectionDegree === '2' && (
                      <div className="space-y-1.5 animate-fade-in">
                          <label className="text-xs font-bold text-gray-500">Nome da Conexão em Comum</label>
                          <input 
                            type="text" 
                            placeholder="Ex: João Silva (Quem nos conecta)" 
                            value={formData.mutualConnection}
                            onChange={(e) => setFormData({...formData, mutualConnection: e.target.value})}
                            className="w-full px-4 py-3 bg-white border-2 border-brand-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-100 outline-none"
                          />
                      </div>
                  )}

                  <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500">Sobre Você (Breve Resumo)</label>
                      <textarea 
                        rows={3}
                        placeholder="Ex: 5 anos de exp em Backend, focado em Java..." 
                        value={formData.myBackground}
                        onChange={(e) => setFormData({...formData, myBackground: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-brand-100 outline-none resize-none"
                      />
                  </div>
              </div>
           </div>

           <div className="pt-6 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
               <div className="flex items-center gap-2 text-xs text-gray-500">
                   <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                   1 Crédito será utilizado (Saldo: 5)
               </div>
               <button 
                 onClick={handleGenerate}
                 disabled={!formData.targetName || !formData.targetCompany}
                 className="w-full md:w-auto px-8 py-4 bg-gray-900 hover:bg-black text-white font-black rounded-2xl shadow-xl shadow-gray-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5"
               >
                   <Zap size={20} className={!formData.targetName ? 'text-gray-500' : 'text-yellow-400'} fill="currentColor" />
                   GERAR SCRIPTS
               </button>
           </div>
        </div>
      )}

      {step === 'loading' && (
          <div className="py-20 text-center animate-fade-in">
              <div className="relative w-24 h-24 mx-auto mb-8">
                  <div className="absolute inset-0 bg-brand-100 rounded-full animate-ping opacity-20"></div>
                  <div className="relative bg-white p-6 rounded-full border-2 border-brand-100 shadow-xl">
                      <Loader2 size={40} className="text-brand-600 animate-spin" />
                  </div>
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-2">Analisando Perfil...</h2>
              <p className="text-gray-500">Nossa IA está construindo a melhor abordagem para {formData.targetCompany}.</p>
          </div>
      )}

      {step === 'results' && results && (
          <div className="space-y-8 animate-fade-in-up">
              <div className="flex justify-between items-center">
                  <button onClick={() => setStep('form')} className="text-sm font-bold text-gray-500 hover:text-gray-900 flex items-center gap-2">
                      <ChevronDown className="rotate-90" size={16} /> Voltar e Editar
                  </button>
                  <p className="text-xs font-bold text-brand-600 bg-brand-50 px-3 py-1 rounded-full">Sucesso! -1 Crédito</p>
              </div>

              {/* Scripts List */}
              <div className="space-y-6">
                  {results.scripts.map((script, idx) => (
                      <div 
                        key={idx} 
                        className={`bg-white rounded-[32px] border transition-all duration-300 overflow-hidden ${expandedCard === idx ? 'border-brand-200 shadow-xl ring-1 ring-brand-100' : 'border-gray-200 shadow-sm hover:border-brand-200'}`}
                      >
                          <div 
                            className="p-6 md:p-8 cursor-pointer"
                            onClick={() => setExpandedCard(expandedCard === idx ? null : idx)}
                          >
                              <div className="flex justify-between items-start mb-4">
                                  <div className="flex items-center gap-3">
                                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getTypeColor(script.type)}`}>
                                          {script.type === 'cold' ? '❄️ Cold Outreach' : '🔥 Warm Intro'}
                                      </span>
                                      <h3 className="font-bold text-gray-900 text-lg">{script.title}</h3>
                                  </div>
                                  <div className="text-gray-400">
                                      {expandedCard === idx ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                  </div>
                              </div>

                              {/* Preview if collapsed */}
                              {expandedCard !== idx && (
                                  <p className="text-sm text-gray-500 truncate">{script.body.replace(/\n/g, ' ')}</p>
                              )}

                              {/* Expanded Content */}
                              {expandedCard === idx && (
                                  <div className="mt-6 animate-fade-in">
                                      {script.subject && (
                                          <div className="mb-4 pb-4 border-b border-gray-50">
                                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Assunto (Para E-mail)</p>
                                              <p className="font-medium text-gray-900">{script.subject}</p>
                                          </div>
                                      )}
                                      
                                      <div className="relative bg-gray-50 rounded-2xl p-6 border border-gray-100 group">
                                          <pre className="font-sans text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{script.body}</pre>
                                          <button 
                                            onClick={(e) => { e.stopPropagation(); copyToClipboard(script.subject ? `Subject: ${script.subject}\n\n${script.body}` : script.body, idx); }}
                                            className="absolute top-4 right-4 p-2 bg-white rounded-xl shadow-sm border border-gray-200 text-gray-500 hover:text-brand-600 hover:border-brand-200 transition-all"
                                          >
                                              {copiedIndex === idx ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                                          </button>
                                      </div>

                                      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                                              <p className="text-xs font-bold text-blue-800 uppercase tracking-widest mb-2 flex items-center gap-1">
                                                  <Info size={14} /> Por que funciona?
                                              </p>
                                              <p className="text-xs text-blue-700 leading-relaxed">{script.explanation}</p>
                                          </div>
                                          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                                              <p className="text-xs font-bold text-amber-800 uppercase tracking-widest mb-2 flex items-center gap-1">
                                                  <Clock size={14} /> Quando enviar?
                                              </p>
                                              <p className="text-xs text-amber-700 leading-relaxed">{script.timing}</p>
                                          </div>
                                      </div>
                                  </div>
                              )}
                          </div>
                      </div>
                  ))}
              </div>

              {/* Tips Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-green-50 rounded-[32px] p-8 border border-green-100">
                      <h3 className="font-black text-green-800 flex items-center gap-2 mb-4">
                          <ThumbsUp size={20} /> DO's (Boas Práticas)
                      </h3>
                      <ul className="space-y-3">
                          {results.dos.map((tip, i) => (
                              <li key={i} className="flex items-start gap-3 text-sm text-green-700">
                                  <Check size={16} className="mt-0.5 shrink-0" />
                                  {tip}
                              </li>
                          ))}
                      </ul>
                  </div>
                  <div className="bg-red-50 rounded-[32px] p-8 border border-red-100">
                      <h3 className="font-black text-red-800 flex items-center gap-2 mb-4">
                          <ThumbsDown size={20} /> DON'Ts (Evite)
                      </h3>
                      <ul className="space-y-3">
                          {results.donts.map((tip, i) => (
                              <li key={i} className="flex items-start gap-3 text-sm text-red-700">
                                  <X size={16} className="mt-0.5 shrink-0" />
                                  {tip}
                              </li>
                          ))}
                      </ul>
                  </div>
              </div>

              {/* Schedule */}
              <div className="bg-gray-900 rounded-[32px] p-8 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-brand-600 opacity-20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                  <h3 className="font-black text-lg mb-4 flex items-center gap-2 relative z-10">
                      <Calendar size={20} className="text-brand-400" /> Sugestão de Cadência
                  </h3>
                  <div className="relative z-10 font-mono text-sm text-gray-300 bg-black/30 p-6 rounded-2xl border border-white/10 whitespace-pre-wrap">
                      {results.schedule}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default NetworkingScriptTool;
