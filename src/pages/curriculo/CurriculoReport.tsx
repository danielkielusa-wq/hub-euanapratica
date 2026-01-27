import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import {
  ReportHeader,
  MetricsRow,
  CulturalBridgeCard,
  MarketValueCard,
  ImprovementsSection,
  LinkedInQuickFix,
  InterviewCheatSheet,
} from '@/components/curriculo/report';
import type { FullAnalysisResult } from '@/types/curriculo';
import { CURRICULO_RESULT_STORAGE_KEY } from '@/types/curriculo';

export default function CurriculoReport() {
  const navigate = useNavigate();
  const [result, setResult] = useState<FullAnalysisResult | null>(null);

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

  if (!result) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
          <div className="animate-pulse text-gray-500">Carregando...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#F5F5F7] p-6 md:p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={handleNewAnalysis}
            className="gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Nova Análise
          </Button>

          {/* Score Section */}
          <ReportHeader result={result} />

          {/* Metrics Row */}
          <MetricsRow metrics={result.metrics} />

          {/* Cultural Bridge + Market Value Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CulturalBridgeCard data={result.cultural_bridge} />
            <MarketValueCard data={result.market_value} />
          </div>

          {/* Improvements Section */}
          <ImprovementsSection
            improvements={result.improvements}
            powerVerbs={result.power_verbs_suggestions}
          />

          {/* LinkedIn + Interview Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <LinkedInQuickFix data={result.linkedin_fix} />
            <InterviewCheatSheet questions={result.interview_cheat_sheet} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
