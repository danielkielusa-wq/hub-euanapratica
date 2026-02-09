
import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  MapPin, 
  Globe, 
  DollarSign, 
  Clock, 
  ChevronDown, 
  Heart, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  LayoutGrid
} from 'lucide-react';
import JobCard from './JobCard';

interface DashboardProps {
  hasResume: boolean;
  onJobClick: (id: string) => void;
  onUploadClick: () => void;
  onUpgradeClick: () => void;
}

const MOCK_JOBS = [
  {
    id: "job-001",
    title: "Senior Full-Stack Engineer",
    company: { name: "TechFlow Inc.", logo: "TF", industry: "SaaS" },
    location: "Remote (Worldwide)",
    salary: "$120k - $180k",
    type: "Full-time",
    posted: "2 days ago",
    applicants: 23,
    matchScore: 92,
    skills: ["React", "Node.js", "TypeScript", "AWS"],
  },
  {
    id: "job-002",
    title: "Product Designer",
    company: { name: "CreativeCloud", logo: "CC", industry: "Design" },
    location: "Remote (US Only)",
    salary: "$140k - $160k",
    type: "Full-time",
    posted: "1 day ago",
    applicants: 45,
    matchScore: 78,
    skills: ["Figma", "Design Systems", "Prototyping"],
  },
  {
    id: "job-003",
    title: "DevOps Specialist",
    company: { name: "SecureNet", logo: "SN", industry: "Cybersecurity" },
    location: "Hybrid - London",
    salary: "£80k - £100k",
    type: "Contract",
    posted: "5 hours ago",
    applicants: 12,
    matchScore: 65,
    skills: ["Docker", "Kubernetes", "Terraform", "Go"],
  }
];

const Dashboard: React.FC<DashboardProps> = ({ hasResume, onJobClick, onUploadClick, onUpgradeClick }) => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      
      {/* 1. HERO SECTION */}
      {!hasResume ? (
        <div className="relative bg-[#0F172A] rounded-[40px] p-8 md:p-16 overflow-hidden mb-12 shadow-2xl">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-600 rounded-full blur-[120px] opacity-20 -translate-y-1/2 translate-x-1/3" />
          <div className="relative z-10 flex flex-col items-center text-center">
             <div className="bg-brand-500/10 text-brand-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border border-brand-500/20 flex items-center gap-2">
                <Sparkles size={14} /> AI Powered Matching
             </div>
             <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-6">
                Unlock your <span className="text-brand-400">perfect</span> remote role.
             </h1>
             <p className="text-gray-400 text-lg max-w-2xl mb-10 leading-relaxed">
                Upload your resume and let our AI analyze your skills to match you with opportunities where you have the highest chance of success.
             </p>
             <button 
                onClick={onUploadClick}
                className="group px-10 py-5 bg-brand-600 hover:bg-brand-700 text-white font-black rounded-2xl shadow-xl shadow-brand-600/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
             >
                Upload Resume to Start <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
             </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm mb-12 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-3xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 relative">
                   <Zap size={32} fill="currentColor" />
                   <div className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">LIVE</div>
                </div>
                <div>
                    <h2 className="text-2xl font-black text-gray-900">Welcome back, Alex!</h2>
                    <div className="flex items-center gap-2 mt-2">
                        <div className="w-48 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-600 w-[85%] rounded-full" />
                        </div>
                        <span className="text-xs font-bold text-gray-400">85% Complete</span>
                    </div>
                </div>
            </div>
            <div className="flex gap-4">
                <div className="text-center px-6">
                    <p className="text-2xl font-black text-gray-900">42</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Matches</p>
                </div>
                <div className="h-10 w-px bg-gray-100" />
                <div className="text-center px-6">
                    <p className="text-2xl font-black text-gray-900">12</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">New Jobs</p>
                </div>
                <div className="h-10 w-px bg-gray-100" />
                <button 
                  onClick={onUpgradeClick}
                  className="px-6 py-3 bg-gray-900 hover:bg-black text-white font-bold rounded-xl text-sm transition-all"
                >
                    Upgrade to VIP
                </button>
            </div>
        </div>
      )}

      {/* 2. MAIN CONTENT GRID */}
      <div className="grid grid-cols-12 gap-8">
        
        {/* SIDEBAR FILTERS */}
        <aside className="hidden lg:block lg:col-span-3 space-y-8">
            <div className="sticky top-28 bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="font-black text-gray-900 flex items-center gap-2 uppercase tracking-widest text-xs">
                        <Filter size={16} /> Filters
                    </h3>
                    <button className="text-[10px] font-bold text-brand-600 hover:underline">Clear All</button>
                </div>

                <div className="space-y-8">
                    {/* Job Type */}
                    <div className="space-y-3">
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Job Type</p>
                        {['Full-time', 'Part-time', 'Contract', 'Freelance'].map(type => (
                            <label key={type} className="flex items-center gap-3 cursor-pointer group">
                                <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
                                <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900">{type}</span>
                            </label>
                        ))}
                    </div>

                    {/* Location */}
                    <div className="space-y-3">
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Arrangement</p>
                        {['Remote (100%)', 'Hybrid', 'Office-based'].map(arr => (
                            <label key={arr} className="flex items-center gap-3 cursor-pointer group">
                                <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
                                <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900">{arr}</span>
                            </label>
                        ))}
                    </div>

                    {/* Salary Slider Mock */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Salary Range</p>
                            <span className="text-[10px] font-bold text-brand-600">$0 - $250k+</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full relative">
                            <div className="absolute left-0 right-0 h-full bg-brand-200 rounded-full" />
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-brand-600 rounded-full shadow-sm" />
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-brand-600 rounded-full shadow-sm" />
                        </div>
                    </div>

                    {/* Benefits (Locked) */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Premium Benefits</p>
                            <ShieldCheck size={14} className="text-brand-600" />
                        </div>
                        <div className="opacity-40 pointer-events-none space-y-3">
                            {['Unlimited PTO', 'Equity', 'Health Insurance'].map(b => (
                                <div key={b} className="flex items-center gap-3">
                                    <div className="w-5 h-5 rounded border border-gray-300" />
                                    <span className="text-sm font-medium">{b}</span>
                                </div>
                            ))}
                        </div>
                        <button onClick={onUpgradeClick} className="w-full py-2 bg-brand-50 text-brand-600 text-[10px] font-black rounded-lg hover:bg-brand-600 hover:text-white transition-all uppercase tracking-widest mt-2">Unlock VIP Filters</button>
                    </div>
                </div>
            </div>
        </aside>

        {/* LISTING FEED */}
        <section className="col-span-12 lg:col-span-9 space-y-6">
            
            {/* Search & Sort Bar */}
            <div className="bg-white rounded-[28px] p-4 border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input 
                        type="text" 
                        placeholder="Search jobs by title, skills, or company..."
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white transition-all outline-none"
                    />
                </div>
                <div className="flex items-center gap-3 px-2">
                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Sort by</span>
                    <button className="flex items-center gap-2 text-sm font-bold text-gray-700 hover:text-brand-600 transition-colors">
                        Best Match <ChevronDown size={16} />
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="space-y-4">
                {!hasResume && (
                    <div className="bg-amber-50 border border-amber-100 p-6 rounded-[32px] flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                             <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
                                <ShieldCheck size={24} />
                             </div>
                             <div>
                                <h4 className="font-bold text-amber-900">Personalize your results</h4>
                                <p className="text-sm text-amber-700">Upload your resume to see match scores and apply instantly.</p>
                             </div>
                        </div>
                        <button onClick={onUploadClick} className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-sm shadow-lg shadow-amber-600/20 whitespace-nowrap">
                            Get Scored Now
                        </button>
                    </div>
                )}

                {MOCK_JOBS.map(job => (
                    <JobCard 
                      key={job.id} 
                      job={job} 
                      hasResume={hasResume} 
                      onClick={() => onJobClick(job.id)} 
                    />
                ))}

                <button className="w-full py-4 bg-white border border-gray-200 text-gray-500 font-bold rounded-3xl hover:bg-gray-50 transition-all text-sm shadow-sm flex items-center justify-center gap-2">
                    Load more opportunities <ChevronDown size={16} />
                </button>
            </div>
        </section>

      </div>
    </div>
  );
};

export default Dashboard;
