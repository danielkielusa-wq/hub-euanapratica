import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Lock, HelpCircle, ChevronDown } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import {
  CurriculoHeader,
  ResumeUploadCard,
  JobDescriptionCard,
  AnalyzingLoader,
} from '@/components/curriculo';
import { ReportHistory } from '@/components/curriculo/ReportHistory';
import { UpgradeModal } from '@/components/curriculo/UpgradeModal';
import { useCurriculoAnalysis } from '@/hooks/useCurriculoAnalysis';
import { useSubscription } from '@/hooks/useSubscription';
import { useAnalytics } from '@/hooks/useAnalytics';

export default function CurriculoUSA() {
  const navigate = useNavigate();
  const { logEvent } = useAnalytics();
  const {
    status,
    uploadedFile,
    jobDescription,
    setFile,
    setJobDescription,
    analyze,
    canAnalyze,
  } = useCurriculoAnalysis();

  const { quota, isLoading: quotaLoading } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showAtsInfo, setShowAtsInfo] = useState(false);

  // Load ATS info state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('ats-educational-pill-expanded');
    if (savedState === 'true') {
      setShowAtsInfo(true);
    }
  }, []);

  // Persist ATS info state
  const toggleAtsInfo = () => {
    const newState = !showAtsInfo;
    setShowAtsInfo(newState);
    localStorage.setItem('ats-educational-pill-expanded', String(newState));
  };

  const isAnalyzing = status === 'uploading' || status === 'analyzing';
  const resumeCost = 3; // credits per analysis (from unified pool)
  const hasCredits = quota ? quota.remaining >= resumeCost : false; // fail-closed when quota unknown
  const hasRequiredFields = !!uploadedFile && !!jobDescription.trim();

  const handleAnalyze = async () => {
    logEvent({
      event_type: 'curriculo_analyze_click',
      metadata: {
        has_credits: hasCredits,
        has_required_fields: hasRequiredFields,
        status
      }
    });
    await analyze();
  };

  const handleFileChange = (file: File | null) => {
    setFile(file);
    if (file) {
      logEvent({
        event_type: 'curriculo_upload',
        metadata: {
          filename: file.name,
          size: file.size,
          type: file.type
        }
      });
    }
  };

  const handleUpgradeClick = () => {
    logEvent({
      event_type: 'curriculo_upgrade_click',
      metadata: {
        plan_id: quota?.planId || null,
        monthly_limit: quota?.monthlyLimit || null
      }
    });
    navigate('/pricing');
  };

  return (
    <DashboardLayout>
      <div className="p-3 sm:p-4 md:p-6 max-w-[1600px] mx-auto space-y-4 sm:space-y-6">

        {/* Header Section */}
        <CurriculoHeader />

        {/* Analyzing State */}
        {isAnalyzing && <AnalyzingLoader status={status as 'uploading' | 'analyzing'} />}

        {/* Input State (idle or error) */}
        {(status === 'idle' || status === 'error') && (
          <>
            {/* ATS Info Accordion */}
            <div className="bg-indigo-50/50 rounded-xl border border-indigo-100 overflow-hidden">
              <button
                onClick={toggleAtsInfo}
                className="w-full px-4 sm:px-6 py-3 flex items-center justify-between text-indigo-900 font-medium hover:bg-indigo-50 transition-colors"
              >
                <div className="flex items-center gap-2 text-sm sm:text-base">
                  <HelpCircle className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Como o ATS funciona?</span>
                </div>
                <ChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-200 ${showAtsInfo ? 'rotate-180' : ''}`} />
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  showAtsInfo ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-4 sm:px-6 pb-4 text-sm text-indigo-800/80 leading-relaxed">
                  O ATS (Applicant Tracking System) é um software usado por 98% das empresas da Fortune 500 para filtrar
                  currículos antes que um humano os leia. Ele busca palavras-chave, formatação específica e relevância.
                  O ResumePass analisa seu currículo exatamente como esses robôs, garantindo que você não seja descartado
                  por questões técnicas.
                </div>
              </div>
            </div>

            {/* Main Interaction Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Left: File Upload */}
              <ResumeUploadCard
                file={uploadedFile}
                onFileChange={handleFileChange}
                disabled={!hasCredits}
                onBlockedAction={handleUpgradeClick}
              />

              {/* Right: Job Description */}
              <JobDescriptionCard value={jobDescription} onChange={setJobDescription} />
            </div>

            {/* CTA Button */}
            <div className="flex justify-center py-2 sm:py-4">
              {!hasCredits && !quotaLoading ? (
                <button
                  onClick={handleUpgradeClick}
                  className="w-full sm:w-auto relative group px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl font-bold text-sm sm:text-lg shadow-sm flex items-center justify-center gap-2 sm:gap-3 transition-all duration-300 bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300"
                >
                  <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="sm:hidden">Ver Planos</span>
                  <span className="hidden sm:inline">Sem Créditos — Ver Planos</span>
                </button>
              ) : (
                <button
                  disabled={!hasRequiredFields}
                  onClick={handleAnalyze}
                  className={`
                    w-full sm:w-auto relative group px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl font-bold text-sm sm:text-lg shadow-xl flex items-center justify-center gap-2 sm:gap-3 transition-all duration-300
                    ${!hasRequiredFields
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                      : 'bg-[#7367F0] text-white hover:bg-[#685dd8] hover:scale-[1.02] sm:hover:scale-105 shadow-indigo-200'
                    }
                  `}
                >
                  <Zap className={`w-4 h-4 sm:w-5 sm:h-5 ${hasRequiredFields ? 'fill-white animate-pulse' : ''}`} />
                  {status === 'error' ? 'Tentar Novamente' : 'Analisar Compatibilidade'}
                  {!hasRequiredFields && (
                    <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-[11px] text-red-500 font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
                      Preencha ambos os campos para continuar
                    </div>
                  )}
                </button>
              )}
            </div>
          </>
        )}

        {/* Report History */}
        {(status === 'idle' || status === 'error') && <ReportHistory />}
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        currentPlanId={quota?.planId}
        reason="limit_reached"
      />
    </DashboardLayout>
  );
}
