import { useState } from 'react';
import { Eye, Wrench, GraduationCap, Lock } from 'lucide-react';
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
import { LockedFeature } from '@/components/curriculo/LockedFeature';
import type { FullAnalysisResult } from '@/types/curriculo';

export interface PlanFeatures {
  allow_pdf: boolean;
  show_improvements: boolean;
  show_power_verbs: boolean;
  show_cheat_sheet: boolean;
  impact_cards: boolean;
  priority_support: boolean;
}

interface ReportContentProps {
  result: FullAnalysisResult;
  features: PlanFeatures;
  onUpgrade: () => void;
}

export function ReportContent({ result, features, onUpgrade }: ReportContentProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const isAtsCritical = result.metrics?.ats_format?.score !== undefined && result.metrics.ats_format.score < 50;

  return (
    <div className="space-y-8">
      <ReportHeader result={result} />

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
          {isAtsCritical && (
            <CriticalAlert message={result.parsing_error_message} />
          )}

          <MetricsRow metrics={result.metrics} />

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
            onUpgrade={onUpgrade}
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
              onUpgrade={onUpgrade}
            >
              <InterviewCheatSheet questions={result.interview_cheat_sheet} />
            </LockedFeature>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
