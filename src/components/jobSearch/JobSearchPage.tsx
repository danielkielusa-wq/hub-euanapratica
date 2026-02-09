
import React, { useState } from 'react';
// Added Briefcase and CreditCard to imports
import { 
  Search, 
  Filter, 
  MapPin, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Zap, 
  ShieldCheck, 
  Lock, 
  Sparkles, 
  ChevronDown, 
  Globe, 
  Clock, 
  Building2,
  Trophy,
  ArrowRight,
  BarChart3,
  Briefcase,
  CreditCard
} from 'lucide-react';
import JobCard from './JobCard';
import ApplyModal from './ApplyModal';
import CreditStore from './CreditStore';

interface JobSearchPageProps {
  userPlan: 'free' | 'pro' | 'vip';
  credits: number;
}

const MOCK_JOBS = [
  {
    id: '1',
    title: 'Senior Full Stack Engineer',
    company: 'TechGrowth USA',
    logo: 'TG',
    location: 'Remote (Worldwide)',
    salary: '$120k - $160k',
    type: 'Full-time / PJ',
    seniority: 'Sênior',
    postedAt: '2h atrás',
    stack: ['React', 'Node.js', 'AWS'],
    description: 'We are looking for a Senior Full Stack Engineer to join our core product team. You will be responsible for building scalable web applications using React and Node.js. Experience with AWS is a must. You will work in a distributed team environment and contribute to architectural decisions.',
    benefits: ['Health Care', 'Stock Options', 'Flexible Hours'],
    applicants: 42,
    isApplied: false,
    isSaved: true
  },
  {
    id: '2',
    title: 'Product Designer (UX/UI)',
    company: 'Fintech Solutions',
    logo: 'FS',
    location: 'Remote (US Timezone)',
    salary: '$90k - $120k',
    type: 'CLT Internacional',
    seniority: 'Pleno/Sênior',
    postedAt: '5h atrás',
    stack: ['Figma', 'Design Systems', 'Prototyping'],
    description: 'Join our design team to create intuitive and beautiful user experiences for our fintech mobile app. You will work closely with product managers and engineers to translate requirements into pixel-perfect designs.',
    benefits: ['Home Office Stipend', 'Learning Budget'],
    applicants: 15,
    isApplied: false,
    isSaved: false
  },
  {
    id: '3',
    title: 'DevOps & Cloud Specialist',
    company: 'ScaleUp Corp',
    logo: 'SC',
    location: 'Remote (Anywhere)',
    salary: '$140k - $180k',
    type: 'Freelance Long-term',
    seniority: 'Lead',
    postedAt: 'Ontem',
    stack: ['Kubernetes', 'Terraform', 'Go'],
    description: 'We need a DevOps specialist to manage our multi-cloud infrastructure. You should have extensive experience with Kubernetes, Terraform, and Go. Your main goal will be to ensure 99.99% uptime and automate deployment pipelines.',
    benefits: ['Equity', 'Unlimited PTO'],
    applicants: 8,
    isApplied: true,
    isSaved: false
  }
];

const JobSearchPage: React.FC<JobSearchPageProps> = ({ userPlan, credits }) => {
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  
  // New state for filters
  const [selectedCategory, setSelectedCategory] = useState('Todas');

  const stats = [
    { label: 'Vagas Ativas', val: '1,284', icon: Briefcase, color: 'text-brand-600', bg: 'bg-brand-50' },
    { label: 'Média Salarial', val: '$112k', icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Novas Vagas/Semana', val: '+245', icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Setor em Alta', val: 'AI/ML', icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' }
  ];

  const handleApply = (job: any) => {
    setSelectedJob(job);
    setIsApplyModalOpen(true);
  };

  return (
    <div className="animate-fade-in space-y-10">
      {/* Header & Plan Indicator */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">Oportunidades Remotas</h1>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
                  userPlan === 'vip' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                  userPlan === 'pro' ? 'bg-brand-50 text-brand-600 border-brand-200' :
                  'bg-gray-50 text-gray-500 border-gray-200'
              }`}>
                  Plano {userPlan}
              </span>
           </div>
           <p className="text-gray-500 font-medium">Encontre sua próxima carreira global entre as melhores empresas dos EUA.</p>
        </div>

        <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsStoreOpen(true)}
              className="px-5 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm"
            >
                <CreditCard size={18} className="text-brand-600" />
                Store de Créditos
            </button>
            <button className="px-6 py-3 bg-gray-900 hover:bg-black text-white rounded-2xl text-sm font-black transition-all shadow-xl shadow-gray-900/20">
                Minhas Aplicações
            </button>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((s, i) => (
              <div key={i} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm group hover:shadow-md transition-shadow">
                  <div className={`w-12 h-12 rounded-2xl ${s.bg} ${s.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <s.icon size={22} />
                  </div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{s.label}</p>
                  <p className="text-2xl font-black text-gray-900">{s.val}</p>
              </div>
          ))}
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm space-y-8">
          <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input 
                    type="text" 
                    placeholder="Título da vaga, tecnologia ou empresa..."
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:bg-white focus:ring-2 focus:ring-brand-100 outline-none transition-all"
                  />
              </div>
              <button className="px-8 py-4 bg-brand-600 hover:bg-brand-700 text-white font-black rounded-2xl shadow-lg shadow-brand-600/20 transition-all active:scale-95 flex items-center justify-center gap-2">
                  <Search size={20} /> BUSCAR AGORA
              </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 border-t border-gray-50">
              {/* Seniority */}
              <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Senioridade</label>
                  <select className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm outline-none focus:bg-white">
                      <option>Todos os níveis</option>
                      <option>Júnior (0-2 anos)</option>
                      <option>Pleno (3-5 anos)</option>
                      <option>Sênior (6+ anos)</option>
                      <option>Lead / Principal</option>
                  </select>
              </div>
              {/* Contract */}
              <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Contrato</label>
                  <select className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm outline-none focus:bg-white">
                      <option>Todos os tipos</option>
                      <option>PJ Internacional</option>
                      <option>CLT Internacional</option>
                      <option>Freelance</option>
                  </select>
              </div>
              {/* Timezone */}
              <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Timezone</label>
                  <select className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm outline-none focus:bg-white">
                      <option>Qualquer Timezone</option>
                      <option>GMT-3 (Brasil)</option>
                      <option>EST (US East)</option>
                      <option>PST (US West)</option>
                  </select>
              </div>
              {/* Category (Replaces Salary) */}
              <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Categoria</label>
                  <select 
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm outline-none focus:bg-white"
                  >
                      <option>Todas</option>
                      <option>Engineering</option>
                      <option>Design</option>
                      <option>Product</option>
                      <option>Sales</option>
                      <option>Support</option>
                      <option>Marketing</option>
                  </select>
              </div>
          </div>
      </div>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
          {MOCK_JOBS.map(job => (
              <JobCard 
                key={job.id} 
                job={job} 
                userPlan={userPlan} 
                onApply={() => handleApply(job)}
              />
          ))}
      </div>

      {/* Modals */}
      {isApplyModalOpen && (
          <ApplyModal 
            job={selectedJob} 
            credits={credits}
            onClose={() => setIsApplyModalOpen(false)} 
          />
      )}
      
      {isStoreOpen && (
          <CreditStore 
            onClose={() => setIsStoreOpen(false)} 
          />
      )}
    </div>
  );
};

export default JobSearchPage;
