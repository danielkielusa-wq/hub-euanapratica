
import React, { useState } from 'react';
import { 
  X, 
  Briefcase, 
  CreditCard, 
  ShieldCheck, 
  FileText, 
  Sparkles, 
  Zap, 
  Loader2, 
  CheckCircle2, 
  ArrowRight, 
  Upload,
  Trophy,
  ExternalLink
} from 'lucide-react';

interface ApplyModalProps {
  job: any;
  credits: number;
  onClose: () => void;
}

const ApplyModal: React.FC<ApplyModalProps> = ({ job, credits, onClose }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleResumePass = () => {
    // Simulating redirect to Resume Pass tool with job context
    const resumePassUrl = `https://resume-pass.app/analyze?job=${encodeURIComponent(job.title)}&desc=${encodeURIComponent(job.description.substring(0, 100))}`;
    window.open(resumePassUrl, '_blank');
  };

  const handleStartApplication = () => {
    setIsProcessing(true);
    // Simulate redirection delay
    setTimeout(() => {
        setIsProcessing(false);
        // In a real app, this would be the external job URL
        window.open(`https://linkedin.com/jobs/search/?keywords=${encodeURIComponent(job.title)}`, '_blank');
        onClose();
    }, 1000);
  };

  if (!job) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-fade-in-up flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 flex-shrink-0">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-600 text-white rounded-2xl flex items-center justify-center font-black text-lg">
                    {job.logo}
                </div>
                <div>
                    <h3 className="font-bold text-gray-900 leading-tight">{job.title}</h3>
                    <p className="text-xs text-gray-500 font-medium">{job.company} • Remoto</p>
                </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-400 transition-all">
                <X size={24} />
            </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-8 space-y-8 overflow-y-auto no-scrollbar flex-1">
            
            {/* Job Description */}
            <div className="prose prose-sm max-w-none text-gray-600">
                <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-3">Job Description</h4>
                <p className="leading-relaxed whitespace-pre-wrap">{job.description}</p>
                
                <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mt-6 mb-3">Tech Stack</h4>
                <div className="flex flex-wrap gap-2">
                    {job.stack.map((tech: string) => (
                        <span key={tech} className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg border border-gray-200">
                            {tech}
                        </span>
                    ))}
                </div>
            </div>

            {/* ResumePass Button Action */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-[24px] p-6">
                <div className="flex items-start gap-4 mb-4">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-600/20">
                        <Zap size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900 text-sm">ResumePass™ AI</h4>
                        <p className="text-xs text-indigo-700 leading-relaxed mt-1">
                            Gere um relatório completo de compatibilidade (ATS Score) e receba sugestões para otimizar seu currículo para esta vaga específica.
                        </p>
                    </div>
                </div>
                <button 
                    onClick={handleResumePass}
                    className="w-full py-3 bg-white border border-indigo-200 text-indigo-600 font-black rounded-xl text-xs hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 shadow-sm uppercase tracking-widest"
                >
                    <Sparkles size={14} /> Rodar ResumePass™ AI
                </button>
            </div>

            {/* Credits Info */}
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2 text-gray-400 text-xs font-medium">
                    <CreditCard size={14} />
                    <span>Custo do redirecionamento: <strong>0 Créditos</strong></span>
                </div>
                <p className="text-xs font-bold text-brand-600">Free Access</p>
            </div>
        </div>

        {/* Footer Actions */}
        <div className="p-8 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row gap-4 flex-shrink-0">
            <button onClick={onClose} className="flex-1 py-4 bg-white border border-gray-200 text-gray-600 font-black rounded-2xl text-xs hover:bg-gray-50 transition-all uppercase tracking-widest">
                Cancelar
            </button>
            <button 
                onClick={handleStartApplication}
                disabled={isProcessing}
                className="flex-[2] py-4 bg-gray-900 hover:bg-black text-white font-black rounded-2xl text-xs shadow-xl shadow-gray-900/20 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2 uppercase tracking-widest"
            >
                {isProcessing ? <Loader2 className="animate-spin" /> : (
                    <>INICIAR APLICAÇÃO <ExternalLink size={14} /></>
                )}
            </button>
        </div>
      </div>
    </div>
  );
};

export default ApplyModal;
