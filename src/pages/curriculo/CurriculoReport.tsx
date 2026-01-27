import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, Wrench, GraduationCap, FileText, Loader2, Lock } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/useSubscription';
import {
  ReportHeader,
  MetricsRow,
  CulturalBridgeCard,
  MarketValueCard,
  ImprovementsSection,
  LinkedInQuickFix,
  InterviewCheatSheet,
  CriticalAlert,
} from '@/components/curriculo/report';
import { LockedFeature } from '@/components/curriculo/LockedFeature';
import { UpgradeModal } from '@/components/curriculo/UpgradeModal';
import type { FullAnalysisResult } from '@/types/curriculo';
import { CURRICULO_RESULT_STORAGE_KEY } from '@/types/curriculo';

export default function CurriculoReport() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { quota, isLoading: quotaLoading } = useSubscription();
  const [result, setResult] = useState<FullAnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  // Get features from subscription
  const features = quota?.features || {
    allow_pdf: false,
    show_improvements: false,
    show_cheat_sheet: false,
    impact_cards: false,
    priority_support: false,
  };

  useEffect(() => {
    // Load result from localStorage
    const stored = localStorage.getItem(CURRICULO_RESULT_STORAGE_KEY);
    if (stored) {
      try {
        setResult(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse stored result:', e);
        navigate('/curriculo');
      }
    } else {
      // No result found, redirect back
      navigate('/curriculo');
    }
  }, [navigate]);

  const handleNewAnalysis = () => {
    localStorage.removeItem(CURRICULO_RESULT_STORAGE_KEY);
    navigate('/curriculo');
  };

  const handleDownloadPDF = async () => {
    // Check if PDF is allowed in user's plan
    if (!features.allow_pdf) {
      setShowUpgradeModal(true);
      toast({
        title: 'Recurso Premium',
        description: 'Exportar PDF está disponível nos planos Pro e VIP.',
        variant: 'destructive',
      });
      return;
    }

    if (!reportRef.current) return;
    
    setIsGeneratingPDF(true);
    
    try {
      // Dynamic import to avoid SSR issues
      const html2pdf = (await import('html2pdf.js')).default;
      
      const element = reportRef.current;
      
      await html2pdf()
        .set({
          margin: [10, 10, 10, 10],
          filename: 'curriculo-usa-report.pdf',
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { 
            scale: 2, 
            useCORS: true,
            logging: false,
          },
          jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'portrait' 
          },
          pagebreak: { 
            mode: ['avoid-all', 'css', 'legacy'],
            avoid: ['.improvement-card', '.metric-card', '.cultural-bridge-card']
          }
        })
        .from(element)
        .save();
        
      toast({
        title: 'PDF gerado!',
        description: 'O relatório foi baixado com sucesso.',
      });
    } catch (err) {
      console.error('PDF generation error:', err);
      toast({
        title: 'Erro ao gerar PDF',
        description: 'Não foi possível criar o arquivo.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Check if ATS format is critical
  const isAtsCritical = result?.metrics?.ats_format?.score !== undefined && result.metrics.ats_format.score < 50;

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
      <div className="min-h-screen bg-[#F8F9FB] p-6 md:p-8 animate-in fade-in duration-500">
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

          {/* Report Content - wrapped in ref for PDF generation */}
          <div ref={reportRef} className="space-y-8">
            {/* Score Section */}
            <ReportHeader result={result} />

            {/* Tab Navigation */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full justify-start bg-background border border-border rounded-2xl p-1.5 h-auto">
                <TabsTrigger 
                  value="overview" 
                  className="flex items-center gap-2 rounded-xl px-4 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Eye className="w-4 h-4" />
                  <span className="font-medium">Visão Geral</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="optimization" 
                  className="flex items-center gap-2 rounded-xl px-4 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Wrench className="w-4 h-4" />
                  <span className="font-medium">Otimização</span>
                  {!features.show_improvements && (
                    <Lock className="w-3 h-3 ml-1 opacity-60" />
                  )}
                </TabsTrigger>
                <TabsTrigger 
                  value="preparation" 
                  className="flex items-center gap-2 rounded-xl px-4 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span className="font-medium">Preparação</span>
                  {!features.show_cheat_sheet && (
                    <Lock className="w-3 h-3 ml-1 opacity-60" />
                  )}
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: Visão Geral */}
              <TabsContent value="overview" className="mt-6 space-y-6 animate-in fade-in duration-300">
                {/* Critical Alert */}
                {isAtsCritical && (
                  <CriticalAlert message={result.parsing_error_message} />
                )}

                {/* Metrics Row */}
                <MetricsRow metrics={result.metrics} />

                {/* Market Intelligence Section */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1">
                    Inteligência de Mercado
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <CulturalBridgeCard data={result.cultural_bridge} />
                    <MarketValueCard data={result.market_value} />
                  </div>
                </div>
              </TabsContent>

              {/* Tab 2: Otimização */}
              <TabsContent value="optimization" className="mt-6 animate-in fade-in duration-300">
                <LockedFeature 
                  isLocked={!features.show_improvements}
                  featureName="Melhorias Sugeridas"
                  onUpgrade={() => setShowUpgradeModal(true)}
                >
                  <ImprovementsSection
                    improvements={result.improvements}
                    powerVerbs={result.power_verbs_suggestions}
                  />
                </LockedFeature>
              </TabsContent>

              {/* Tab 3: Preparação */}
              <TabsContent value="preparation" className="mt-6 space-y-6 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <LinkedInQuickFix data={result.linkedin_fix} />
                  
                  <LockedFeature
                    isLocked={!features.show_cheat_sheet}
                    featureName="Cheat Sheet de Entrevista"
                    onUpgrade={() => setShowUpgradeModal(true)}
                  >
                    <InterviewCheatSheet questions={result.interview_cheat_sheet} />
                  </LockedFeature>
                </div>
              </TabsContent>
            </Tabs>
          </div>
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
