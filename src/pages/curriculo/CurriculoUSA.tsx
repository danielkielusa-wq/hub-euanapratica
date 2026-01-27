import { Sparkles } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import {
  CurriculoHeader,
  ResumeUploadCard,
  JobDescriptionCard,
  AnalyzingLoader,
  AnalysisResult,
} from '@/components/curriculo';
import { useCurriculoAnalysis } from '@/hooks/useCurriculoAnalysis';

export default function CurriculoUSA() {
  const {
    status,
    uploadedFile,
    jobDescription,
    result,
    setFile,
    setJobDescription,
    analyze,
    reset,
    canAnalyze,
  } = useCurriculoAnalysis();

  const isAnalyzing = status === 'uploading' || status === 'analyzing';
  const hasResult = status === 'complete' && result;

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#F5F5F7] p-6 md:p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <CurriculoHeader />

          {/* Analyzing State */}
          {isAnalyzing && <AnalyzingLoader />}

          {/* Result State */}
          {hasResult && (
            <AnalysisResult result={result} onReset={reset} />
          )}

          {/* Input State */}
          {status === 'idle' && (
            <>
              {/* Hero Section */}
              <div className="text-center space-y-4 py-6">
                <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">
                  Seu currículo está pronto para o<br />
                  <span className="bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
                    mercado Americano?
                  </span>
                </h2>
                <p className="text-gray-500 max-w-2xl mx-auto">
                  Compare seu CV com a vaga desejada e vença o ATS (Applicant Tracking System). 
                  Nossa IA simula os robôs de recrutamento dos EUA para te dar um score real.
                </p>
              </div>

              {/* Input Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ResumeUploadCard file={uploadedFile} onFileChange={setFile} />
                <JobDescriptionCard value={jobDescription} onChange={setJobDescription} />
              </div>

              {/* CTA Button */}
              <div className="flex justify-center pt-4">
                <Button
                  onClick={analyze}
                  disabled={!canAnalyze}
                  className="rounded-[20px] py-6 px-12 text-base font-semibold shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 transition-all duration-200 gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  Analisar Compatibilidade Agora
                </Button>
              </div>
            </>
          )}

          {/* Error State - show inputs again */}
          {status === 'error' && (
            <>
              <div className="text-center space-y-4 py-6">
                <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">
                  Seu currículo está pronto para o<br />
                  <span className="bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
                    mercado Americano?
                  </span>
                </h2>
                <p className="text-gray-500 max-w-2xl mx-auto">
                  Compare seu CV com a vaga desejada e vença o ATS (Applicant Tracking System). 
                  Nossa IA simula os robôs de recrutamento dos EUA para te dar um score real.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ResumeUploadCard file={uploadedFile} onFileChange={setFile} />
                <JobDescriptionCard value={jobDescription} onChange={setJobDescription} />
              </div>

              <div className="flex justify-center pt-4">
                <Button
                  onClick={analyze}
                  disabled={!canAnalyze}
                  className="rounded-[20px] py-6 px-12 text-base font-semibold shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 transition-all duration-200 gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  Tentar Novamente
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
