import React, { useState } from 'react';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  History, 
  ChevronRight, 
  Zap, 
  HelpCircle, 
  ChevronDown,
  AlertCircle,
  FileType,
  X
} from 'lucide-react';

export default function ResumePass() {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [showAtsInfo, setShowAtsInfo] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-6">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <FileText className="w-5 h-5 text-[#7367F0]" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">ResumePass AI</h1>
          </div>
          <p className="text-gray-500 max-w-2xl">
            Compare seu CV com a vaga desejada e vença o ATS (Applicant Tracking System). 
            Nossa IA simula os robôs de recrutamento dos EUA para te dar um score real.
          </p>
        </div>

        {/* Credits Counter */}
        <div className="bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Créditos Disponíveis</span>
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="text-lg font-bold text-gray-800">16<span className="text-gray-400 text-sm font-medium">/20</span></span>
            </div>
          </div>
          <div className="w-12 h-12 relative">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="24" cy="24" r="20" stroke="#f3f4f6" strokeWidth="4" fill="none" />
              <circle cx="24" cy="24" r="20" stroke="#7367F0" strokeWidth="4" fill="none" strokeDasharray="125.6" strokeDashoffset="25.12" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </div>

      {/* ATS Info Accordion */}
      <div className="bg-indigo-50/50 rounded-xl border border-indigo-100 overflow-hidden">
        <button 
          onClick={() => setShowAtsInfo(!showAtsInfo)}
          className="w-full px-6 py-3 flex items-center justify-between text-indigo-900 font-medium hover:bg-indigo-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-indigo-600" />
            <span>Como o ATS funciona?</span>
          </div>
          <ChevronDown className={`w-4 h-4 transition-transform ${showAtsInfo ? 'rotate-180' : ''}`} />
        </button>
        {showAtsInfo && (
          <div className="px-6 pb-4 text-sm text-indigo-800/80 leading-relaxed">
            O ATS (Applicant Tracking System) é um software usado por 98% das empresas da Fortune 500 para filtrar currículos antes que um humano os leia. Ele busca palavras-chave, formatação específica e relevância. O ResumePass analisa seu currículo exatamente como esses robôs, garantindo que você não seja descartado por questões técnicas.
          </div>
        )}
      </div>

      {/* Main Interaction Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[400px]">
        
        {/* Left: File Upload */}
        <div 
          className={`
            relative rounded-2xl border-2 border-dashed transition-all duration-200 flex flex-col
            ${isDragging 
              ? 'border-[#7367F0] bg-indigo-50/30 ring-4 ring-indigo-100' 
              : 'border-gray-300 bg-white hover:border-[#7367F0] hover:bg-gray-50/50'
            }
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {file ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4 animate-in zoom-in duration-300">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-1">{file.name}</h3>
              <p className="text-sm text-gray-500 mb-6">{(file.size / 1024 / 1024).toFixed(2)} MB • Pronto para análise</p>
              <button 
                onClick={() => setFile(null)}
                className="text-red-500 hover:text-red-700 text-sm font-bold flex items-center gap-1 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
              >
                <X className="w-4 h-4" /> Remover arquivo
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center cursor-pointer" onClick={() => document.getElementById('file-upload')?.click()}>
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Upload className="w-10 h-10 text-[#7367F0]" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Seu Currículo</h3>
              <p className="text-gray-500 max-w-xs mb-8 leading-relaxed">
                Arraste e solte seu arquivo (PDF ou DOCX) aqui ou clique para buscar no computador.
              </p>
              <div className="flex items-center gap-2 text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full uppercase tracking-wide">
                <FileType className="w-3 h-3" /> PDF Preferencial
              </div>
              <input 
                id="file-upload" 
                type="file" 
                className="hidden" 
                accept=".pdf,.doc,.docx"
                onChange={handleFileSelect}
              />
            </div>
          )}
        </div>

        {/* Right: Job Description */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <h3 className="font-bold text-gray-700 flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-500" />
              Descrição da Vaga
            </h3>
            <span className="text-xs font-medium text-gray-400">Cole o texto abaixo</span>
          </div>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            className="flex-1 w-full p-6 text-sm text-gray-600 focus:outline-none resize-none placeholder:text-gray-300 leading-relaxed"
            placeholder="Ex: Senior Software Engineer @ Google...
            
Cole aqui o texto completo da vaga (LinkedIn, Indeed, site da empresa). Quanto mais detalhes, melhor será a análise."
          ></textarea>
        </div>
      </div>

      {/* CTA Button */}
      <div className="flex justify-center py-4">
        <button 
          disabled={!file || !jobDescription}
          className={`
            relative group px-8 py-4 rounded-xl font-bold text-lg shadow-xl flex items-center gap-3 transition-all duration-300
            ${(!file || !jobDescription) 
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' 
              : 'bg-[#7367F0] text-white hover:bg-[#685dd8] hover:scale-105 shadow-indigo-200'
            }
          `}
        >
          <Zap className={`w-5 h-5 ${(!file || !jobDescription) ? '' : 'fill-white animate-pulse'}`} />
          Analisar Compatibilidade Agora
          {(!file || !jobDescription) && (
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-red-500 font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              Preencha ambos os campos para continuar
            </div>
          )}
        </button>
      </div>

      {/* History Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <History className="w-5 h-5 text-gray-500" />
            Histórico de Relatórios
          </h3>
          <button className="text-sm text-[#7367F0] font-bold hover:underline">Ver todos</button>
        </div>
        
        <div className="divide-y divide-gray-100">
          <HistoryItem 
            date="27 de fev. de 2026" 
            title="Resume Report - Senior Frontend Engineer" 
            score={32} 
            status="critical"
          />
          <HistoryItem 
            date="25 de fev. de 2026" 
            title="Resume Report - Product Manager" 
            score={28} 
            status="critical"
          />
          <HistoryItem 
            date="20 de fev. de 2026" 
            title="Resume Report - Tech Lead" 
            score={78} 
            status="good"
          />
        </div>
      </div>
    </div>
  );
}

function HistoryItem({ date, title, score, status }: { date: string, title: string, score: number, status: 'good' | 'warning' | 'critical' }) {
  const getStatusColor = () => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-50 border-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-100';
      case 'critical': return 'text-red-600 bg-red-50 border-red-100';
    }
  };

  return (
    <div className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between group cursor-pointer">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-[#7367F0]">
          <FileText className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-bold text-gray-800 text-sm mb-0.5 group-hover:text-[#7367F0] transition-colors">{title}</h4>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>{date}</span>
            <span>•</span>
            <span className={`${status === 'critical' ? 'text-red-500' : 'text-green-500'}`}>
              {status === 'critical' ? 'Abaixo do recomendado' : 'Boa compatibilidade'}
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className={`px-3 py-1 rounded-full border text-xs font-bold ${getStatusColor()}`}>
          {score}% Match
        </div>
        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#7367F0] transition-colors" />
      </div>
    </div>
  );
}
