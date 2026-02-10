import { useState } from 'react';
import { Sparkles, Lock } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
  
  const { quota } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const isAnalyzing = status === 'uploading' || status === 'analyzing';
  const hasCredits = quota ? quota.remaining > 0 : true;
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
    setShowUpgradeModal(true);
  };

  // Dynamic button configuration based on credit state
  const getButtonConfig = () => {
    if (!hasCredits) {
      return {
        text: 'Limite Mensal Atingido - Faça Upgrade',
        icon: Lock,
        variant: 'secondary' as const,
        disabled: false, // Allow click to open modal
        onClick: handleUpgradeClick,
        tooltip: `Você já usou seu limite de ${quota?.monthlyLimit} análise(s) este mês no plano ${quota?.planName}.`,
      };
    }
    return {
      text: status === 'error' ? 'Tentar Novamente' : 'Analisar Compatibilidade Agora',
      icon: Sparkles,
      variant: 'default' as const,
      disabled: !hasRequiredFields,
      onClick: handleAnalyze,
      tooltip: null,
    };
  };

  const buttonConfig = getButtonConfig();
  const ButtonIcon = buttonConfig.icon;

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#F5F5F7] p-6 md:p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <CurriculoHeader />

          {/* Analyzing State */}
          {isAnalyzing && <AnalyzingLoader />}

          {/* Input State (idle or error) */}
          {(status === 'idle' || status === 'error') && (
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
                <ResumeUploadCard 
                  file={uploadedFile} 
                  onFileChange={handleFileChange}
                  disabled={!hasCredits}
                  onBlockedAction={handleUpgradeClick}
                />
                <JobDescriptionCard value={jobDescription} onChange={setJobDescription} />
              </div>

              {/* CTA Button */}
              <div className="flex justify-center pt-4">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Button
                          onClick={buttonConfig.onClick}
                          disabled={buttonConfig.disabled}
                          variant={buttonConfig.variant}
                          className={`rounded-[20px] py-6 px-12 text-base font-semibold gap-2 transition-all duration-200 ${
                            hasCredits 
                              ? 'shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40' 
                              : 'opacity-90 hover:opacity-100'
                          }`}
                        >
                          <ButtonIcon className="w-5 h-5" />
                          {buttonConfig.text}
                        </Button>
                      </div>
                    </TooltipTrigger>
                    {buttonConfig.tooltip && (
                      <TooltipContent side="bottom" className="max-w-xs text-center">
                        <p>{buttonConfig.tooltip}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </div>
            </>
          )}

          {/* Report History */}
          {(status === 'idle' || status === 'error') && <ReportHistory />}
        </div>
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
