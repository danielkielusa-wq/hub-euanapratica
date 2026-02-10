import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, Loader2, Lock, AlertCircle } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/useSubscription';
import { ReportContent } from '@/components/curriculo/report';
import { UpgradeModal } from '@/components/curriculo/UpgradeModal';
import { CurriculoReportPDF } from '@/components/curriculo/pdf';
import { useResumePassReport } from '@/hooks/useResumePassReports';

export default function SavedReportPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { quota } = useSubscription();
  const { data: report, isLoading, error } = useResumePassReport(id);
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

  const result = report?.report_data ?? null;

  const handleDownloadPDF = async () => {
    if (!features.allow_pdf) {
      setShowUpgradeModal(true);
      toast({
        title: 'Recurso Premium',
        description: 'Exportar PDF está disponível nos planos Pro e VIP.',
        variant: 'destructive',
      });
      return;
    }

    if (!result) return;

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

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !result) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
          <div className="text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">Relatório não encontrado.</p>
            <Button variant="outline" onClick={() => navigate('/curriculo')}>
              Voltar ao Currículo USA
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#F8F9FB] p-6 md:p-8 animate-in fade-in duration-500">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header with Back Button and PDF Download */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate('/curriculo')}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
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
