import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Loader2, Lock } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/useSubscription';
import { useAnalytics } from '@/hooks/useAnalytics';
import { ReportContent } from '@/components/curriculo/report';
import { UpgradeModal } from '@/components/curriculo/UpgradeModal';
import { CurriculoReportPDF } from '@/components/curriculo/pdf';
import type { FullAnalysisResult } from '@/types/curriculo';
import { CURRICULO_RESULT_STORAGE_KEY } from '@/types/curriculo';

export default function CurriculoReport() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logEvent } = useAnalytics();
  const { quota } = useSubscription();
  const [result, setResult] = useState<FullAnalysisResult | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const features = quota?.features || {
    allow_pdf: false,
    show_improvements: false,
    show_power_verbs: false,
    show_cheat_sheet: false,
    impact_cards: false,
    priority_support: false,
  };

  useEffect(() => {
    const stored = localStorage.getItem(CURRICULO_RESULT_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setResult(parsed);
        logEvent({
          event_type: 'curriculo_report_view',
          metadata: {
            score: parsed?.score || null,
            ats_score: parsed?.metrics?.ats_format?.score || null
          }
        });
      } catch (e) {
        navigate('/curriculo');
      }
    } else {
      navigate('/curriculo');
    }
  }, [navigate, logEvent]);

  const handleNewAnalysis = () => {
    localStorage.removeItem(CURRICULO_RESULT_STORAGE_KEY);
    navigate('/curriculo');
  };

  const handleDownloadPDF = async () => {
    if (!features.allow_pdf) {
      logEvent({
        event_type: 'curriculo_pdf_blocked',
        metadata: { plan_id: quota?.planId || null }
      });
      setShowUpgradeModal(true);
      toast({
        title: 'Recurso Premium',
        description: 'Exportar PDF está disponível nos planos Pro e VIP.',
        variant: 'destructive',
      });
      return;
    }

    if (!result) return;

    logEvent({
      event_type: 'curriculo_pdf_download_start',
      metadata: { plan_id: quota?.planId || null }
    });

    setIsGeneratingPDF(true);

    try {
      const blob = await pdf(<CurriculoReportPDF result={result} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'curriculo-usa-report.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      logEvent({
        event_type: 'curriculo_pdf_downloaded',
        metadata: { filename: 'curriculo-usa-report.pdf' }
      });
      toast({
        title: 'PDF gerado!',
        description: 'O relatório foi baixado com sucesso.',
      });
    } catch (err) {
      toast({
        title: 'Erro ao gerar PDF',
        description: 'Não foi possível criar o arquivo.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (!result) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Carregando...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#F8F9FB] p-4 md:p-8 animate-in fade-in duration-500">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header with Back Button and PDF Download */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handleNewAnalysis}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              Nova Análise
            </Button>

            <Button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="gap-2 rounded-xl"
              variant={features.allow_pdf ? "default" : "outline"}
            >
              {isGeneratingPDF ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Gerando arquivo...
                </>
              ) : !features.allow_pdf ? (
                <>
                  <Lock className="w-4 h-4" />
                  Baixar PDF
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  Baixar Relatório PDF
                </>
              )}
            </Button>
          </div>

          {/* Report Content */}
          <ReportContent
            result={result}
            features={features}
            onUpgrade={() => setShowUpgradeModal(true)}
          />
        </div>
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        currentPlanId={quota?.planId}
      />
    </DashboardLayout>
  );
}
