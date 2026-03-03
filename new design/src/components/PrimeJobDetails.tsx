import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  MapPin, 
  Building, 
  Clock, 
  Globe, 
  DollarSign, 
  Zap, 
  CheckCircle, 
  Sparkles, 
  Briefcase, 
  Share2, 
  Heart, 
  ExternalLink,
  Lightbulb,
  FileText,
  Users,
  ChevronRight,
  AlertCircle,
  Target,
  Award
} from 'lucide-react';

interface Job {
  id: string;
  title: string;
  company: string;
  initial: string;
  initialColor: string;
  tags: { label: string; type: 'remote' | 'contract' | 'fulltime' | 'level' }[];
  salary: string;
  postedAt: string;
  isNew: boolean;
  isVisited: boolean;
  description?: string;
  requirements?: string[];
}

interface PrimeJobDetailsProps {
  job: Job;
  onBack: () => void;
}

export default function PrimeJobDetails({ job, onBack }: PrimeJobDetailsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'analysis'>('overview');

  // Mock extended data for the demo
  const enpAnalysis = {
    matchScore: 92,
    timezone: { score: '3/10', label: 'Overlap', detail: 'CT 12:00 PM – 10:00 PM', subDetail: 'BRT 2:00 PM – 00:00 AM' },
    english: { level: 'B1', label: 'Intermediário', description: 'Comunicação clara para vendas.' },
    salaryBrl: { value: 'R$ 8.700', context: 'Acima da média BR' },
    skills: ['Customer Service', 'Sales', 'CRM', 'Lead Gen'],
    tip: 'Horário tardio (até 00h BRT). Ideal para quem prefere rotinas noturnas.',
    applicationTips: [
      'Destaque experiência em vendas.',
      'Enfatize autonomia.',
      'Cite ferramentas de CRM.',
      'Prepare-se para roleplay de vendas.'
    ],
    keywords: ['Customer Service', 'Sales', 'Lead Generation', 'CRM', 'Communication'],
    career: 'Evolução para Liderança de Vendas em 2-3 anos.'
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen bg-gray-50/50"
    >
      {/* Navigation Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <button 
          onClick={onBack}
          className="hover:text-blue-600 transition-colors flex items-center gap-1 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>
        <ChevronRight className="w-4 h-4 text-gray-300" />
        <span className="text-gray-900 font-medium truncate max-w-[300px]">{job.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Main Content Column */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Hero Header Section */}
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-50 to-purple-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-60" />
            
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row gap-6 items-start mb-6">
                <div className="flex-1">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight mb-3">
                    {job.title}
                  </h1>
                  
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <div className="flex items-center gap-1.5 text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                      <Building className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{job.company}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">Remote (LATAM)</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-green-700 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100">
                      <DollarSign className="w-4 h-4" />
                      <span className="font-bold">{job.salary}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 shrink-0">
                  <button className="p-2.5 rounded-xl border border-gray-200 text-gray-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-all">
                    <Heart className="w-5 h-5" />
                  </button>
                  <button className="p-2.5 rounded-xl border border-gray-200 text-gray-400 hover:text-blue-500 hover:bg-blue-50 hover:border-blue-100 transition-all">
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {job.tags.map((tag, idx) => (
                  <span key={idx} className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-lg text-xs font-bold uppercase tracking-wide shadow-sm">
                    {tag.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="flex items-center gap-1 bg-gray-100/50 p-1 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'overview' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Visão Geral
            </button>
            <button
              onClick={() => setActiveTab('analysis')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'analysis' 
                  ? 'bg-white text-purple-700 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Análise ENP
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'overview' ? (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Job Description */}
                <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                  <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-blue-600" />
                    Sobre a Vaga
                  </h2>
                  <div className="prose prose-blue max-w-none text-gray-600 leading-relaxed">
                    <p className="mb-4">
                      {job.description || "A remote sales role for a client in the plumbing industry. The position involves customer interaction and sales coordination on a Central Time schedule. You will be responsible for managing leads, closing sales, and maintaining relationships with clients."}
                    </p>
                    <h3 className="text-gray-900 font-bold text-sm uppercase tracking-wide mb-3 mt-6">Responsabilidades</h3>
                    <ul className="space-y-2 list-disc pl-5">
                      <li>Gerenciar pipeline de vendas e leads qualificados.</li>
                      <li>Manter comunicação constante com clientes via CRM.</li>
                      <li>Atingir metas mensais de conversão.</li>
                      <li>Colaborar com a equipe de operações nos EUA.</li>
                    </ul>
                  </div>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                        <DollarSign className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-400 uppercase">Compensação</div>
                        <div className="font-bold text-gray-900">Em Dólar (USD)</div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">
                      Pagamento mensal em USD. Valor competitivo para o mercado LATAM com possibilidade de bônus por performance.
                    </p>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-400 uppercase">Horário</div>
                        <div className="font-bold text-gray-900">Central Time (CT)</div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">
                      Necessário disponibilidade para trabalhar no fuso horário do cliente (aprox. 2h a menos que Brasília).
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="analysis"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* ENP Scorecard */}
                <div className="bg-white rounded-3xl border border-purple-100 shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-purple-200" />
                          Análise de Compatibilidade
                        </h2>
                        <p className="text-purple-100 text-sm mt-1">Baseado no seu perfil brasileiro</p>
                      </div>
                      <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                        <div className="text-3xl font-bold">{enpAnalysis.matchScore}%</div>
                        <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">Match</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                    {/* Timezone */}
                    <div className="space-y-3 pt-4 md:pt-0">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        <Clock className="w-4 h-4" /> Fuso Horário
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-gray-900">{enpAnalysis.timezone.score}</span>
                        <span className="text-xs font-medium px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">
                          {enpAnalysis.timezone.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        {enpAnalysis.timezone.detail}
                        <br />
                        <span className="text-gray-400">{enpAnalysis.timezone.subDetail}</span>
                      </p>
                    </div>

                    {/* English */}
                    <div className="space-y-3 pt-4 md:pt-0 md:pl-8">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        <Globe className="w-4 h-4" /> Inglês
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-blue-600">{enpAnalysis.english.level}</span>
                        <span className="text-xs font-medium text-gray-500">{enpAnalysis.english.label}</span>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        {enpAnalysis.english.description}
                      </p>
                    </div>

                    {/* Salary */}
                    <div className="space-y-3 pt-4 md:pt-0 md:pl-8">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        <DollarSign className="w-4 h-4" /> Estimativa BRL
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-green-600">{enpAnalysis.salaryBrl.value}</span>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        {enpAnalysis.salaryBrl.context}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Insights Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Skills */}
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-4">
                      <Target className="w-5 h-5 text-blue-500" />
                      Skills Necessárias
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {enpAnalysis.skills.map((skill, i) => (
                        <span key={i} className="px-3 py-1.5 bg-gray-50 text-gray-700 rounded-lg text-xs font-medium border border-gray-100">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Attention Point */}
                  <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100">
                    <div className="flex items-center gap-2 text-sm font-bold text-orange-800 mb-4">
                      <AlertCircle className="w-5 h-5 text-orange-600" />
                      Ponto de Atenção
                    </div>
                    <p className="text-sm text-orange-800/80 leading-relaxed">
                      {enpAnalysis.tip}
                    </p>
                  </div>
                </div>

                {/* Application Tips */}
                <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                  <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-500" />
                    Dicas para Aplicação
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {enpAnalysis.applicationTips.map((tip, idx) => (
                      <div key={idx} className="flex gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                        <div className="w-6 h-6 bg-white text-gray-900 rounded-full flex items-center justify-center text-xs font-bold shadow-sm shrink-0 border border-gray-100">
                          {idx + 1}
                        </div>
                        <p className="text-sm text-gray-600 font-medium">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* Sidebar Column - Sticky */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-8">
          
          {/* Action Card - Primary CTA */}
          <div className="bg-[#1e1e2d] rounded-3xl p-1 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-blue-500/30" />
            
            <div className="bg-[#1e1e2d] rounded-[22px] p-6 relative z-10 h-full flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-bold text-green-400 uppercase tracking-wider">Vaga Ativa</span>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">Pronto para aplicar?</h3>
              <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                Você tem o perfil para esta vaga. Acesse o link oficial e siga nossas dicas.
              </p>

              <button className="w-full py-4 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 mb-4 shadow-lg shadow-green-900/20 hover:shadow-green-900/40 hover:-translate-y-0.5">
                <CheckCircle className="w-5 h-5" />
                Acessar Vaga
              </button>

              <div className="flex items-center justify-center gap-2 text-xs text-gray-500 border-t border-gray-800 pt-4">
                <Users className="w-3 h-3" />
                <span>24 pessoas visualizaram hoje</span>
              </div>
            </div>
          </div>

          {/* Resume Optimization Widget */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
              <FileText className="w-4 h-4" /> Otimize seu CV
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Use estas palavras-chave para passar no filtro ATS:
            </p>
            <div className="flex flex-wrap gap-2 mb-6">
              {enpAnalysis.keywords.slice(0, 3).map((kw, i) => (
                <span key={i} className="px-2 py-1 bg-gray-50 text-gray-600 rounded border border-gray-200 text-xs font-medium">
                  {kw}
                </span>
              ))}
              <span className="px-2 py-1 bg-gray-50 text-gray-400 rounded border border-gray-200 text-xs font-medium">
                +2
              </span>
            </div>
            <button className="w-full py-3 bg-blue-50 text-blue-600 rounded-xl font-bold text-sm hover:bg-blue-100 transition-colors flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" />
              Gerar CV Otimizado
            </button>
          </div>

          {/* Mentorship Promo */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden group cursor-pointer transition-transform hover:scale-[1.02]">
            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-200 uppercase tracking-wider mb-3">
                <Award className="w-4 h-4" /> Carreira
              </div>
              <h3 className="text-lg font-bold mb-2">Quer ajuda para passar?</h3>
              <p className="text-indigo-100 text-sm mb-4 leading-relaxed">
                Mentoria em Grupo ROTA EUA™ com vagas abertas para a próxima turma.
              </p>
              <div className="flex items-center gap-2 text-sm font-bold text-white group-hover:gap-3 transition-all">
                Saiba mais <ExternalLink className="w-4 h-4" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
}
