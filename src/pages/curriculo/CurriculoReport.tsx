import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, Wrench, GraduationCap } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import type { FullAnalysisResult } from '@/types/curriculo';
import { CURRICULO_RESULT_STORAGE_KEY } from '@/types/curriculo';

export default function CurriculoReport() {
  const navigate = useNavigate();
  const [result, setResult] = useState<FullAnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

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
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={handleNewAnalysis}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Nova Análise
          </Button>

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
              </TabsTrigger>
              <TabsTrigger 
                value="preparation" 
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <GraduationCap className="w-4 h-4" />
                <span className="font-medium">Preparação</span>
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
              <ImprovementsSection
                improvements={result.improvements}
                powerVerbs={result.power_verbs_suggestions}
              />
            </TabsContent>

            {/* Tab 3: Preparação */}
            <TabsContent value="preparation" className="mt-6 space-y-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <LinkedInQuickFix data={result.linkedin_fix} />
                <InterviewCheatSheet questions={result.interview_cheat_sheet} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
}
