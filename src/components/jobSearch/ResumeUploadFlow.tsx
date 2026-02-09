
import React, { useState, useEffect } from 'react';
import { 
  CloudUpload, 
  FileText, 
  X, 
  CheckCircle2, 
  Loader2, 
  Zap, 
  Plus, 
  Trash2,
  Linkedin,
  Sparkles,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface ResumeUploadFlowProps {
  onComplete: () => void;
  onCancel: () => void;
}

type Step = 'upload' | 'processing' | 'review';

const ResumeUploadFlow: React.FC<ResumeUploadFlowProps> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState<Step>('upload');
  const [uploadProgress, setUploadProgress] = useState(0);

  const startProcessing = () => {
    setStep('processing');
    let p = 0;
    const interval = setInterval(() => {
      p += 10;
      setUploadProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        setTimeout(() => setStep('review'), 500);
      }
    }, 300);
  };

  const renderUpload = () => (
    <div className="max-w-2xl mx-auto py-20 px-4 animate-fade-in text-center">
       <div className="mb-10">
          <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Showcase your <span className="text-brand-600">potential</span>.</h1>
          <p className="text-gray-500 text-lg">Our AI will parse your resume to build a high-performance profile.</p>
       </div>

       <div 
        onClick={startProcessing}
        className="group relative bg-white border-2 border-dashed border-gray-200 rounded-[48px] p-16 flex flex-col items-center justify-center cursor-pointer hover:border-brand-400 hover:bg-brand-50/30 transition-all shadow-sm"
       >
          <div className="w-24 h-24 rounded-[32px] bg-brand-50 text-brand-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
             <CloudUpload size={48} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Drag and drop your resume</h3>
          <p className="text-gray-400 text-sm mb-8">PDF, DOCX, or TXT up to 5MB</p>
          <button className="px-8 py-3 bg-gray-900 text-white font-bold rounded-2xl shadow-xl hover:bg-black transition-all">Browse Files</button>
       </div>

       <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
           {[
             { title: 'AI Matching', desc: 'Get matched with roles that fit your skill set.', icon: Sparkles },
             { title: 'Auto-fill', desc: 'Apply to jobs with a single click.', icon: Zap }
           ].map((item, i) => (
             <div key={i} className="flex gap-4 p-4 bg-white rounded-3xl border border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                    <item.icon size={20} />
                </div>
                <div>
                    <h4 className="font-bold text-gray-900 text-sm">{item.title}</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
             </div>
           ))}
       </div>
    </div>
  );

  const renderProcessing = () => (
    <div className="max-w-md mx-auto py-32 px-4 text-center animate-fade-in">
        <div className="relative mb-10 mx-auto w-32 h-32 flex items-center justify-center">
            <div className="absolute inset-0 border-8 border-gray-100 rounded-full" />
            <div 
              className="absolute inset-0 border-8 border-brand-600 rounded-full transition-all duration-300"
              style={{ clipPath: `inset(0 ${100 - uploadProgress}% 0 0)` }}
            />
            <Loader2 className="text-brand-600 animate-spin" size={48} />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Analyzing your skills...</h2>
        <p className="text-gray-500 mb-12">This usually takes 10-15 seconds.</p>

        <div className="space-y-4 max-w-xs mx-auto">
            {[
              { label: 'Extracting text', done: uploadProgress > 20 },
              { label: 'Identifying skills', done: uploadProgress > 50 },
              { label: 'Building work profile', done: uploadProgress > 80 },
            ].map((step, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm font-bold">
                 <span className={step.done ? 'text-gray-900' : 'text-gray-300'}>{step.label}</span>
                 {step.done ? <CheckCircle2 className="text-green-500" size={18} /> : <div className="w-4 h-4 rounded-full bg-gray-100" />}
              </div>
            ))}
        </div>
    </div>
  );

  const renderReview = () => (
    <div className="max-w-4xl mx-auto py-12 px-4 animate-fade-in-up">
        <div className="flex justify-between items-end mb-12">
            <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Review your parsed profile</h1>
                <p className="text-gray-500 mt-1">We've extracted this information. Please verify it's correct.</p>
            </div>
            <div className="flex gap-3">
                <button onClick={onCancel} className="px-6 py-3 text-gray-400 font-bold hover:text-gray-900 transition-colors uppercase text-xs tracking-widest">Cancel</button>
                <button onClick={onComplete} className="px-8 py-3 bg-brand-600 hover:bg-brand-700 text-white font-black rounded-xl shadow-lg transition-all">Save & Continue</button>
            </div>
        </div>

        <div className="space-y-8">
            {/* Personal Info */}
            <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                   <ShieldCheck size={16} /> Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Full Name</label>
                        <input type="text" defaultValue="Alex Rivera" className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none focus:bg-white" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Email</label>
                        <input type="email" defaultValue="alex.rivera@example.com" className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none focus:bg-white" />
                    </div>
                </div>
            </div>

            {/* AI Summary */}
            <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                   <Sparkles size={16} className="text-brand-600" /> AI Generated Summary
                </h3>
                <textarea 
                    className="w-full p-6 bg-gray-50 border border-gray-100 rounded-[24px] text-gray-700 leading-relaxed min-h-[120px] focus:bg-white transition-all outline-none font-medium"
                    defaultValue="Senior Frontend Engineer with 8+ years of experience building scalable web applications. Expert in React and TypeScript with a passion for UX design and AI integration."
                />
            </div>

            {/* Skills Tag Input */}
            <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm">
                 <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                   <Zap size={16} className="text-brand-600" /> Key Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                    {['React', 'TypeScript', 'Tailwind CSS', 'Node.js', 'AWS', 'Next.js', 'Figma'].map(skill => (
                        <div key={skill} className="px-4 py-2 bg-brand-50 text-brand-700 font-bold rounded-xl flex items-center gap-2 border border-brand-100 group">
                            {skill}
                            <button className="text-brand-300 hover:text-brand-600"><X size={14} /></button>
                        </div>
                    ))}
                    <button className="px-4 py-2 border-2 border-dashed border-gray-200 text-gray-400 rounded-xl hover:border-brand-200 hover:text-brand-600 transition-all font-bold flex items-center gap-2">
                        <Plus size={16} /> Add Skill
                    </button>
                </div>
            </div>

            {/* Work Experience */}
            <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm">
                 <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-8 flex items-center justify-between">
                   <span className="flex items-center gap-2"><FileText size={16} /> Work Experience</span>
                   <button className="text-brand-600 hover:underline">Add Position</button>
                </h3>
                <div className="space-y-10">
                    {[
                        { role: 'Senior Developer', company: 'Innovation Hub', period: '2020 - Present' },
                        { role: 'Frontend Engineer', company: 'StartupX', period: '2018 - 2020' },
                    ].map((exp, i) => (
                        <div key={i} className="relative pl-8 border-l-2 border-gray-50 pb-2">
                            <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-brand-600" />
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-black text-gray-900">{exp.role}</h4>
                                    <p className="text-sm font-bold text-gray-500">{exp.company}</p>
                                    <p className="text-xs font-medium text-gray-400 mt-1">{exp.period}</p>
                                </div>
                                <button className="p-2 text-gray-300 hover:text-red-500"><Trash2 size={18} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="pt-8 text-center">
                 <p className="text-sm text-gray-400 font-medium mb-6">Profile strength is improved by 25% after parsing!</p>
                 <button 
                   onClick={onComplete}
                   className="px-12 py-5 bg-brand-600 hover:bg-brand-700 text-white font-black rounded-2xl shadow-2xl shadow-brand-600/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-3 mx-auto"
                 >
                    Finalize Profile <ArrowRight size={20} />
                 </button>
            </div>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      {step === 'upload' && renderUpload()}
      {step === 'processing' && renderProcessing()}
      {step === 'review' && renderReview()}
    </div>
  );
};

export default ResumeUploadFlow;
