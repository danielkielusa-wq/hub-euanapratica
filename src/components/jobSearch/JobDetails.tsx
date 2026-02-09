
import React from 'react';
import { 
  ArrowLeft, 
  MapPin, 
  Globe, 
  Clock, 
  Briefcase, 
  DollarSign, 
  Sparkles, 
  CheckCircle2,
  Share2,
  Heart,
  ArrowRight
} from 'lucide-react';

interface JobDetailsProps {
  jobId: string;
  hasResume: boolean;
  onBack: () => void;
  onApply: () => void;
}

const JobDetails: React.FC<JobDetailsProps> = ({ jobId, hasResume, onBack, onApply }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in-up">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-bold text-sm mb-10 transition-colors group">
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Back to Search
      </button>

      <div className="grid grid-cols-12 gap-12">
        
        {/* Main Info */}
        <div className="col-span-12 lg:col-span-8 space-y-10">
            
            {/* Header Card */}
            <div className="bg-white rounded-[48px] p-10 md:p-12 border border-gray-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-50 opacity-40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                
                <div className="flex flex-col md:flex-row justify-between gap-8 relative z-10">
                    <div className="flex gap-6 items-start">
                        <div className="w-20 h-20 rounded-3xl bg-brand-600 text-white flex items-center justify-center font-black text-2xl shadow-xl shadow-brand-600/20">TF</div>
                        <div>
                            <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight leading-none mb-4">Senior Full-Stack Engineer</h1>
                            <div className="flex flex-wrap items-center gap-4 text-sm font-bold text-gray-500">
                                <span className="flex items-center gap-1.5"><Briefcase size={16}/> TechFlow Inc.</span>
                                <span className="flex items-center gap-1.5"><MapPin size={16}/> Remote (Worldwide)</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3">
                         <button className="p-4 bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all shadow-sm"><Heart size={20} /></button>
                         <button className="p-4 bg-gray-50 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-2xl transition-all shadow-sm"><Share2 size={20} /></button>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3 mt-10">
                    {['Full-time', '100% Remote', 'Senior Level', '$120k-$180k'].map(badge => (
                        <span key={badge} className="px-4 py-2 bg-brand-50 text-brand-700 font-bold text-xs rounded-xl border border-brand-100">
                            {badge}
                        </span>
                    ))}
                </div>
            </div>

            {/* Match Score Breakdown */}
            {hasResume && (
                <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm">
                    <div className="flex flex-col md:flex-row items-center gap-10">
                        <div className="flex flex-col items-center">
                            <div className="relative w-32 h-32 flex items-center justify-center mb-4">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="64" cy="64" r="56" stroke="#f3f4f6" strokeWidth="12" fill="transparent" />
                                    <circle cx="64" cy="64" r="56" stroke="#10B981" strokeWidth="12" fill="transparent" strokeDasharray="351" strokeDashoffset="28" strokeLinecap="round" />
                                </svg>
                                <span className="absolute inset-0 flex items-center justify-center text-3xl font-black text-gray-900">92%</span>
                            </div>
                            <span className="text-[10px] font-black text-green-600 uppercase tracking-widest bg-green-50 px-3 py-1 rounded-full">Excellent Match</span>
                        </div>
                        <div className="flex-1 grid grid-cols-2 gap-x-12 gap-y-6">
                            {[
                                { label: 'Skills Match', val: '95%', color: 'bg-green-500' },
                                { label: 'Experience', val: '85%', color: 'bg-green-500' },
                                { label: 'Salary Fit', val: '100%', color: 'bg-green-500' },
                                { label: 'Location', val: '100%', color: 'bg-green-500' },
                            ].map(stat => (
                                <div key={stat.label}>
                                    <div className="flex justify-between items-center text-xs font-bold mb-2">
                                        <span className="text-gray-400 uppercase tracking-wide">{stat.label}</span>
                                        <span className="text-gray-900">{stat.val}</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div className={`h-full ${stat.color} w-[${stat.val}] rounded-full`} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Job Description */}
            <div className="bg-white rounded-[40px] p-10 md:p-12 border border-gray-100 shadow-sm space-y-8">
                 <div className="prose prose-blue max-w-none">
                    <h2 className="text-2xl font-black text-gray-900 mb-6">About the Role</h2>
                    <p className="text-gray-600 leading-relaxed text-lg font-medium">
                        We are looking for a Senior Full-Stack Engineer who is passionate about creating elegant user experiences and building robust back-end systems. You'll be joining a distributed team of engineers working on our core SaaS platform.
                    </p>
                    
                    <h3 className="text-xl font-bold text-gray-900 mt-10 mb-6">Responsibilities</h3>
                    <ul className="space-y-4">
                        {[
                            'Lead the development of new features from architecture to deployment.',
                            'Collaborate with product designers to implement pixel-perfect UIs.',
                            'Optimize application performance and scalability.',
                            'Mentor junior and mid-level engineers through code reviews.'
                        ].map(item => (
                            <li key={item} className="flex gap-4 text-gray-600 font-medium">
                                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-600 shrink-0" />
                                {item}
                            </li>
                        ))}
                    </ul>

                    <h3 className="text-xl font-bold text-gray-900 mt-10 mb-6">Requirements</h3>
                    <ul className="space-y-4">
                        {[
                            '5+ years of experience with React and Node.js.',
                            'Expert knowledge of TypeScript and modern JavaScript.',
                            'Strong experience with AWS or similar cloud platforms.',
                            'Proven track record of delivering high-quality production code.'
                        ].map(item => (
                            <li key={item} className="flex gap-4 text-gray-600 font-medium">
                                <CheckCircle2 className="text-green-500 mt-0.5 shrink-0" size={18} />
                                {item}
                            </li>
                        ))}
                    </ul>
                 </div>
            </div>
        </div>

        {/* Sidebar */}
        <aside className="col-span-12 lg:col-span-4 space-y-8">
            {/* CTA Box */}
            <div className="bg-gray-900 rounded-[40px] p-10 text-white shadow-2xl sticky top-28">
                <h3 className="text-xl font-black mb-6">Ready to apply?</h3>
                <p className="text-gray-400 text-sm mb-10 leading-relaxed">
                    Use our AI assistant to tailor your application and increase your chances of being interviewed.
                </p>
                <div className="space-y-4">
                    <button 
                      onClick={onApply}
                      className="w-full py-5 bg-brand-600 hover:bg-brand-700 text-white font-black rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                    >
                        Apply with AI <ArrowRight size={20} />
                    </button>
                    <p className="text-center text-[10px] font-black text-gray-500 uppercase tracking-widest">Takes less than 2 minutes</p>
                </div>

                <div className="mt-12 pt-8 border-t border-white/10 space-y-6">
                    <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-gray-400 uppercase tracking-widest">Application Limit</span>
                        <span className="font-black">3/3 Remaining</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-500 w-full rounded-full" />
                    </div>
                </div>
            </div>

            {/* Company Info */}
            <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">About TechFlow Inc.</h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-8">
                    TechFlow is a leading SaaS provider helping enterprise teams automate their workflows through intelligent data processing.
                </p>
                <div className="space-y-4">
                    {[
                        { label: 'Industry', val: 'SaaS / Enterprise' },
                        { label: 'Company Size', val: '51-200 Employees' },
                        { label: 'Founded', val: '2016' },
                        { label: 'Headquarters', val: 'Remote / San Francisco' },
                    ].map(item => (
                        <div key={item.label} className="flex justify-between py-2 border-b border-gray-50">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{item.label}</span>
                            <span className="text-xs font-black text-gray-900">{item.val}</span>
                        </div>
                    ))}
                </div>
            </div>
        </aside>

      </div>
    </div>
  );
};

export default JobDetails;
