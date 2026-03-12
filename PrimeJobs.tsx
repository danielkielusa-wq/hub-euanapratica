import React, { useState } from 'react';
import { 
  Search, 
  SlidersHorizontal, 
  Bookmark, 
  Clock,
  MapPin,
  ChevronLeft
} from 'lucide-react';
import PrimeJobDetails from './PrimeJobDetails';

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  initial: string;
  initialColor: string;
  tags: { label: string; type: 'remote' | 'contract' | 'fulltime' | 'level' | 'other' }[];
  salary: string;
  postedAt: string;
  applications: number;
  isUrgent: boolean;
  isVisited: boolean;
  description?: string;
  requirements?: string[];
}

const CATEGORIES = ['All', 'Marketing', 'Design', 'Administration', 'Product', 'Engineering'];

export default function PrimeJobs() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);

  const toggleSave = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (savedJobs.includes(id)) {
      setSavedJobs(prev => prev.filter(jobId => jobId !== id));
    } else {
      setSavedJobs(prev => [...prev, id]);
    }
  };

  const jobs: Job[] = [
    {
      id: '1',
      title: 'Remote Customer Sales Rep',
      company: 'HireLATAM',
      location: 'Remote (LATAM)',
      initial: 'H',
      initialColor: 'bg-blue-100 text-blue-600',
      tags: [
        { label: 'Remote LATAM', type: 'remote' },
        { label: 'Contract', type: 'contract' },
        { label: '+3', type: 'other' }
      ],
      salary: '$1,500/month',
      postedAt: '30 min ago',
      applications: 58,
      isUrgent: true,
      isVisited: true,
      description: "Estamos procurando um Representante de Vendas focado no cliente para se juntar à nossa equipe em crescimento. Você será responsável por gerenciar leads, fechar vendas e manter o relacionamento com clientes no setor de encanamento.",
      requirements: ["Inglês fluente (C1/C2)", "Experiência prévia em vendas", "Disponibilidade para horário comercial EST"]
    },
    {
      id: '2',
      title: 'Remote Tax Associate',
      company: 'HireLATAM',
      location: 'Remote (LATAM)',
      initial: 'H',
      initialColor: 'bg-blue-100 text-blue-600',
      tags: [
        { label: 'Remote LATAM', type: 'remote' },
        { label: 'Contract', type: 'contract' },
        { label: '+2', type: 'other' }
      ],
      salary: '$2,000/month',
      postedAt: '2 hours ago',
      applications: 124,
      isUrgent: false,
      isVisited: true,
      description: "Busca-se um Associado Fiscal com experiência em Venture Capital. Você trabalhará diretamente com fundos de investimento nos EUA, preparando declarações fiscais e relatórios K-1.",
      requirements: ["Experiência com taxação nos EUA", "Conhecimento em VC/Private Equity", "CPA é um diferencial"]
    },
    {
      id: '3',
      title: 'Team Leader – Sales Ops',
      company: '5C Company LLC',
      location: 'Remote (LATAM)',
      initial: '5C',
      initialColor: 'bg-emerald-100 text-emerald-600',
      tags: [
        { label: 'Remote LATAM', type: 'remote' },
        { label: 'Full-time', type: 'fulltime' },
        { label: '+4', type: 'other' }
      ],
      salary: '$800/month',
      postedAt: '5 hours ago',
      applications: 42,
      isUrgent: true,
      isVisited: true
    },
    {
      id: '4',
      title: 'LATAM Executive Assistant',
      company: 'US Company',
      location: 'Remote (LATAM)',
      initial: 'UC',
      initialColor: 'bg-purple-100 text-purple-600',
      tags: [
        { label: 'Remote LATAM', type: 'remote' },
        { label: 'Full-time', type: 'fulltime' },
        { label: '+1', type: 'other' }
      ],
      salary: '$3,000/month',
      postedAt: '1 day ago',
      applications: 210,
      isUrgent: false,
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
    <div className="min-h-screen bg-[#f8f9fc] font-sans pb-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 leading-tight mb-6">
            Let's get <span className="font-bold">you</span> hired for the job you <span className="font-bold">deserve!</span>
          </h1>
          
          {/* Search Bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-white rounded-full text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm border border-gray-100"
              />
            </div>
            <button className="p-3.5 bg-white rounded-full shadow-sm border border-gray-100 text-gray-600 hover:bg-gray-50 transition-colors shrink-0">
              <SlidersHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Categories */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Category</h2>
          <div className="flex overflow-x-auto no-scrollbar gap-3 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${
                  selectedCategory === cat 
                    ? 'bg-gray-900 text-white border-gray-900' 
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Job List */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Job match with you</h2>
            <button className="text-blue-600 font-medium text-sm hover:underline">See All</button>
          </div>

          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <div 
                key={job.id}
                onClick={() => setSelectedJob(job)}
                className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${job.initialColor}`}>
                      {job.initial}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-base">{job.title}</h3>
                      <p className="text-sm text-gray-500">{job.company} • {job.location}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900 text-base">{job.salary.split('/')[0]}<span className="text-sm font-normal text-gray-500">/month</span></div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-5">
                  {job.tags.map((tag, idx) => (
                    <span 
                      key={idx} 
                      className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-lg text-xs font-medium flex items-center gap-1.5"
                    >
                      {tag.type === 'remote' && <MapPin className="w-3 h-3 text-blue-600" />}
                      {tag.label}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-50 text-xs text-gray-500">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> {job.postedAt}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Bookmark className="w-3.5 h-3.5" /> {job.applications} application
                    </span>
                  </div>
                  {job.isUrgent && (
                    <span className="px-2 py-1 bg-red-50 text-red-600 font-semibold rounded text-[10px] uppercase tracking-wider">
                      Urgent
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
