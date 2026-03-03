import React, { useState } from 'react';
import { 
  Briefcase, 
  DollarSign, 
  TrendingUp, 
  Zap, 
  Search, 
  Filter, 
  History, 
  Bookmark, 
  Heart, 
  CheckCircle, 
  ArrowRight, 
  Globe,
  Clock,
  X,
  MapPin,
  Building,
  Share2,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import PrimeJobDetails from './PrimeJobDetails';

export interface Job {
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

export default function PrimeJobs() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [showToast, setShowToast] = useState<{message: string, type: 'success' | 'info'} | null>(null);

  const toggleSave = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (savedJobs.includes(id)) {
      setSavedJobs(prev => prev.filter(jobId => jobId !== id));
      showNotification('Vaga removida dos salvos', 'info');
    } else {
      setSavedJobs(prev => [...prev, id]);
      showNotification('Vaga salva com sucesso!', 'success');
    }
  };

  const showNotification = (message: string, type: 'success' | 'info') => {
    setShowToast({ message, type });
    setTimeout(() => setShowToast(null), 3000);
  };

  const jobs: Job[] = [
    {
      id: '1',
      title: 'Remote Customer Sales Representative – Plumbing Industry',
      company: 'HireLATAM (Recruiting for Client)',
      initial: 'H',
      initialColor: 'bg-blue-100 text-blue-600',
      tags: [
        { label: '100% REMOTO', type: 'remote' },
        { label: 'CONTRATO', type: 'contract' },
        { label: 'ENTRY LEVEL', type: 'level' }
      ],
      salary: '$1,000 - $1,500',
      postedAt: '12H ATRÁS',
      isNew: true,
      isVisited: true,
      description: "Estamos procurando um Representante de Vendas focado no cliente para se juntar à nossa equipe em crescimento. Você será responsável por gerenciar leads, fechar vendas e manter o relacionamento com clientes no setor de encanamento.",
      requirements: ["Inglês fluente (C1/C2)", "Experiência prévia em vendas", "Disponibilidade para horário comercial EST"]
    },
    {
      id: '2',
      title: 'Remote Tax Associate – Venture Capital & SPV Specialist',
      company: 'HireLATAM (Recruiting for Client)',
      initial: 'H',
      initialColor: 'bg-blue-100 text-blue-600',
      tags: [
        { label: '100% REMOTO', type: 'remote' },
        { label: 'CONTRATO', type: 'contract' },
        { label: 'MID LEVEL', type: 'level' }
      ],
      salary: '$2,000 - $2,000',
      postedAt: '12H ATRÁS',
      isNew: true,
      isVisited: true,
      description: "Busca-se um Associado Fiscal com experiência em Venture Capital. Você trabalhará diretamente com fundos de investimento nos EUA, preparando declarações fiscais e relatórios K-1.",
      requirements: ["Experiência com taxação nos EUA", "Conhecimento em VC/Private Equity", "CPA é um diferencial"]
    },
    {
      id: '3',
      title: 'Team Leader – Sales Operations',
      company: '5C Company LLC',
      initial: '5C',
      initialColor: 'bg-indigo-100 text-indigo-600',
      tags: [
        { label: '100% REMOTO', type: 'remote' },
        { label: 'FULL-TIME', type: 'fulltime' },
        { label: 'LEAD/STAFF', type: 'level' }
      ],
      salary: '$800 - $800',
      postedAt: '12H ATRÁS',
      isNew: true,
      isVisited: true
    },
    {
      id: '4',
      title: 'LATAM Executive Assistant',
      company: 'US Company (via Recruiter)',
      initial: 'UC',
      initialColor: 'bg-purple-100 text-purple-600',
      tags: [
        { label: '100% REMOTO', type: 'remote' },
        { label: 'FULL-TIME', type: 'fulltime' },
        { label: 'SENIOR', type: 'level' }
      ],
      salary: '$3,000 - $3,000',
      postedAt: '12H ATRÁS',
      isNew: true,
      isVisited: false
    },
    {
      id: '5',
      title: 'Remote Bilingual Sales Executive',
      company: 'Valatam',
      initial: 'V',
      initialColor: 'bg-cyan-100 text-cyan-600',
      tags: [
        { label: '100% REMOTO', type: 'remote' },
        { label: 'FULL-TIME', type: 'fulltime' },
        { label: 'MID LEVEL', type: 'level' }
      ],
      salary: '$1,044 - $1,044',
      postedAt: '12H ATRÁS',
      isNew: true,
      isVisited: true
    },
    {
      id: '6',
      title: 'SDR (Sales Development Representative)',
      company: 'StemWave',
      initial: 'S',
      initialColor: 'bg-orange-100 text-orange-600',
      tags: [
        { label: '100% REMOTO', type: 'remote' },
        { label: 'FULL-TIME', type: 'fulltime' },
        { label: 'MID LEVEL', type: 'level' }
      ],
      salary: '$3,000 - $3,000',
      postedAt: '12H ATRÁS',
      isNew: true,
      isVisited: false
    },
    {
      id: '7',
      title: 'Remote Construction Project Engineer – Commercial Glazing',
      company: 'HireLATAM (Recruiting for Client)',
      initial: 'H',
      initialColor: 'bg-blue-100 text-blue-600',
      tags: [
        { label: '100% REMOTO', type: 'remote' },
        { label: 'CONTRATO', type: 'contract' },
        { label: 'MID LEVEL', type: 'level' }
      ],
      salary: '$1,500 - $2,000',
      postedAt: '12H ATRÁS',
      isNew: true,
      isVisited: false
    },
    {
      id: '8',
      title: 'Remote Finance Operations Specialist – Fractional CFO Practice',
      company: 'HireLATAM (Recruiting for Client)',
      initial: 'H',
      initialColor: 'bg-blue-100 text-blue-600',
      tags: [
        { label: '100% REMOTO', type: 'remote' },
        { label: 'CONTRATO', type: 'contract' },
        { label: 'MID LEVEL', type: 'level' }
      ],
      salary: '$2,000 - $2,500',
      postedAt: '12H ATRÁS',
      isNew: true,
      isVisited: false
    },
    {
      id: '9',
      title: 'Remote Head of Finance – B2B SaaS',
      company: 'HireLATAM (Recruiting for Client)',
      initial: 'H',
      initialColor: 'bg-blue-100 text-blue-600',
      tags: [
        { label: '100% REMOTO', type: 'remote' },
        { label: 'CONTRATO', type: 'contract' },
        { label: 'EXECUTIVE', type: 'level' }
      ],
      salary: '$2,500 - $4,000',
      postedAt: '12H ATRÁS',
      isNew: true,
      isVisited: false
    },
    {
      id: '10',
      title: 'Remote Financial Controller – Investment & Real Estate',
      company: 'HireLATAM (Recruiting for Client)',
      initial: 'H',
      initialColor: 'bg-blue-100 text-blue-600',
      tags: [
        { label: '100% REMOTO', type: 'remote' },
        { label: 'CONTRATO', type: 'contract' },
        { label: 'SENIOR', type: 'level' }
      ],
      salary: '$4,200 - $4,200',
      postedAt: '12H ATRÁS',
      isNew: true,
      isVisited: false
    }
  ];

  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (selectedJob) {
    return <PrimeJobDetails job={selectedJob} onBack={() => setSelectedJob(null)} />;
  }

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-6 relative min-h-screen">
      
      {/* Toast Notification */}
      {showToast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-xl transform transition-all duration-300 animate-in slide-in-from-top-2 flex items-center gap-2 font-medium ${
          showToast.type === 'success' ? 'bg-green-600 text-white' : 'bg-gray-800 text-white'
        }`}>
          {showToast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
          {showToast.message}
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-800">Prime Jobs</h1>
            <span className="bg-blue-100 text-blue-600 text-xs font-bold px-2 py-0.5 rounded border border-blue-200">PLANO PRO</span>
          </div>
          <p className="text-gray-500 text-sm">
            Vagas remotas curadas para brasileiros trabalharem em empresas americanas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600">
            Acessos: <span className="text-gray-900 font-bold">0/20</span>
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            <History className="w-4 h-4" />
            Histórico
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            Minhas Vagas Salvas
            {savedJobs.length > 0 && (
              <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 rounded-full">{savedJobs.length}</span>
            )}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={<Briefcase className="w-5 h-5 text-blue-500" />}
          label="VAGAS ATIVAS"
          value="10"
          bgIcon="bg-blue-50"
        />
        <StatCard 
          icon={<DollarSign className="w-5 h-5 text-green-500" />}
          label="MÉDIA SALARIAL"
          value="$2k"
          bgIcon="bg-green-50"
        />
        <StatCard 
          icon={<TrendingUp className="w-5 h-5 text-indigo-500" />}
          label="NOVAS ESTA SEMANA"
          value="+10"
          bgIcon="bg-indigo-50"
        />
        <StatCard 
          icon={<Zap className="w-5 h-5 text-orange-500" />}
          label="SETOR EM ALTA"
          value="Finance"
          bgIcon="bg-orange-50"
        />
      </div>

      {/* Search Bar & Filters */}
      <div className="space-y-4">
        <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text"
              placeholder="Título da vaga, tecnologia ou empresa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
            />
          </div>
          <button className="bg-[#2563eb] text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-200">
            <Search className="w-4 h-4" />
            BUSCAR
          </button>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 border ${
              showFilters ? 'bg-gray-100 border-gray-300 text-gray-900' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtros
            <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Expandable Filters */}
        {showFilters && (
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Modalidade</label>
                <div className="space-y-2">
                  {['100% Remoto', 'Híbrido', 'Presencial'].map(opt => (
                    <label key={opt} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tipo de Contrato</label>
                <div className="space-y-2">
                  {['Full-time', 'Contract (PJ)', 'Part-time'].map(opt => (
                    <label key={opt} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nível</label>
                <div className="space-y-2">
                  {['Junior', 'Mid-Level', 'Senior', 'Lead', 'Executive'].map(opt => (
                    <label key={opt} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Faixa Salarial</label>
                <input type="range" className="w-full accent-blue-600" />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>$1k</span>
                  <span>$10k+</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-500 font-medium flex justify-between items-center">
        <span>{filteredJobs.length} vagas encontradas</span>
        <span className="text-xs text-gray-400">Atualizado há 5 min</span>
      </div>

      {/* Job Grid */}
      {filteredJobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredJobs.map((job) => (
            <JobCard 
              key={job.id} 
              job={job} 
              isSaved={savedJobs.includes(job.id)}
              onToggleSave={(e) => toggleSave(e, job.id)}
              onClick={() => setSelectedJob(job)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Search className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">Nenhuma vaga encontrada</h3>
          <p className="text-gray-500 max-w-sm">
            Tente ajustar seus filtros ou buscar por outros termos. Novas vagas são adicionadas diariamente.
          </p>
          <button 
            onClick={() => {setSearchQuery(''); setShowFilters(false);}}
            className="mt-6 text-blue-600 font-bold hover:underline"
          >
            Limpar filtros
          </button>
        </div>
      )}

      {/* Load More */}
      {filteredJobs.length > 0 && (
        <div className="flex justify-center pt-8 pb-4">
          <button className="px-6 py-3 bg-white border border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-50 transition-colors shadow-sm">
            Carregar mais vagas
          </button>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, bgIcon }: { icon: React.ReactNode, label: string, value: string, bgIcon: string }) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-32 hover:shadow-md transition-shadow">
      <div className={`w-10 h-10 ${bgIcon} rounded-xl flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <div>
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</div>
        <div className="text-2xl font-bold text-gray-800">{value}</div>
      </div>
    </div>
  );
}

interface JobCardProps {
  job: Job;
  isSaved: boolean;
  onToggleSave: (e: React.MouseEvent) => void;
  onClick: () => void;
}

const JobCard: React.FC<JobCardProps> = ({ job, isSaved, onToggleSave, onClick }) => {
  const getTagStyle = (type: string) => {
    switch (type) {
      case 'remote': return 'bg-gray-100 text-gray-600 border-gray-200';
      case 'contract': return 'bg-green-50 text-green-600 border-green-100';
      case 'fulltime': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'level': return 'bg-purple-50 text-purple-600 border-purple-100';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div 
      onClick={onClick}
      className={`
        bg-white rounded-2xl border p-6 relative transition-all duration-300 group flex flex-col h-full cursor-pointer
        ${job.isVisited ? 'border-gray-200 opacity-80 hover:opacity-100' : 'border-gray-200 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-50'}
      `}
    >
      {job.isNew && (
        <div className="absolute top-0 right-0 bg-yellow-400 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl shadow-sm z-10">
          NOVO
        </div>
      )}
      
      <div className="flex justify-end items-start mb-4">
        <button 
          onClick={onToggleSave}
          className={`p-2 rounded-full transition-all ${isSaved ? 'text-red-500 bg-red-50' : 'text-gray-300 hover:bg-gray-50 hover:text-red-400'}`}
        >
          <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
        </button>
      </div>

      <h3 className="font-bold text-gray-800 text-lg leading-tight mb-2 line-clamp-2 min-h-[3.5rem] group-hover:text-blue-600 transition-colors">
        {job.title}
      </h3>
      
      <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-4">
        <Briefcase className="w-3.5 h-3.5" />
        <span className="truncate">{job.company}</span>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {job.tags.map((tag, idx) => (
          <span 
            key={idx} 
            className={`text-[10px] font-bold px-2 py-1 rounded border flex items-center gap-1 ${getTagStyle(tag.type)}`}
          >
            {tag.type === 'remote' && <Globe className="w-3 h-3" />}
            {tag.label}
          </span>
        ))}
      </div>

      <div className="mt-auto pt-4 border-t border-gray-50">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-gray-400 font-medium">Salário Estimado</div>
          <div className="font-bold text-gray-800">{job.salary}</div>
        </div>
        
        <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-4">
          <Clock className="w-3 h-3" />
          {job.postedAt}
        </div>

        {job.isVisited ? (
          <button className="w-full py-3 rounded-xl border border-green-200 bg-green-50 text-green-700 font-bold text-sm flex items-center justify-center gap-2 hover:bg-green-100 transition-colors">
            <CheckCircle className="w-4 h-4" />
            VISITADO
          </button>
        ) : (
          <button className="w-full py-3 rounded-xl bg-[#1e1e2d] text-white font-bold text-sm flex items-center justify-center gap-2 group-hover:bg-[#2b2b40] transition-colors shadow-lg shadow-gray-200">
            Ver Detalhes
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        )}
      </div>
    </div>
  );
}
