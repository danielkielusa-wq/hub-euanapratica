import { ReportHeader } from './ReportHeader';
import { GreetingCard } from './GreetingCard';
import { DiagnosticGrid } from './DiagnosticGrid';
import { RotaMethodSection } from './RotaMethodSection';
import { ActionPlanList } from './ActionPlanList';
import { ResourcesPills } from './ResourcesPills';
import { ReportFooter } from './ReportFooter';
import { RecommendationsCTA } from './RecommendationsCTA';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { V2ReportContainer } from './v2';
import type { CareerEvaluation, FormattedReportData, V2FormattedReportData } from '@/types/leads';
import { isV2Report } from '@/types/leads';

interface FormattedReportProps {
  evaluation: CareerEvaluation;
  formattedContent?: string;
  isLoading?: boolean;
  processingStatus?: string | null;
}

export function FormattedReport({ evaluation, formattedContent, isLoading, processingStatus }: FormattedReportProps) {
  // Try to parse formatted content and detect version
  let reportData: FormattedReportData | null = null;
  let v2ReportData: V2FormattedReportData | null = null;

  if (formattedContent) {
    try {
      const parsed = JSON.parse(formattedContent);
      if (isV2Report(parsed)) {
        v2ReportData = parsed;
      } else if (parsed.greeting && parsed.diagnostic) {
        reportData = parsed as FormattedReportData;
      }
    } catch {
      // Not valid JSON, will show fallback
    }
  }

  // V2 report: render with V2 components
  if (v2ReportData) {
    return <V2ReportContainer data={v2ReportData} evaluation={evaluation} />;
  }

  // Processing state: report is being generated in background (with auto-polling)
  if (processingStatus === 'processing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
        <ReportHeader />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <Card className="rounded-[40px]">
            <CardContent className="p-12 flex flex-col items-center justify-center gap-6">
              <div className="relative">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold text-foreground">
                  Preparando seu relatório...
                </h2>
                <p className="text-muted-foreground max-w-md">
                  Nossa inteligência artificial está analisando seu perfil e criando um diagnóstico personalizado. Isso leva apenas alguns segundos.
                </p>
              </div>
              <div className="flex gap-1.5 mt-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Loading state: on-demand generation in progress
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
        <ReportHeader />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <Card className="rounded-[40px]">
            <CardContent className="p-12 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Gerando seu relatório personalizado...</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Fallback: show raw content if no structured data
  if (!reportData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
        <ReportHeader />
        <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
          {/* Simple greeting */}
          <Card className="rounded-[40px] overflow-hidden">
            <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 md:p-10">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Olá, {evaluation.name.split(' ')[0]}! 👋
              </h2>
              <p className="mt-2 text-muted-foreground">
                Seu diagnóstico de prontidão para carreira internacional está pronto.
              </p>
            </div>
          </Card>

          {/* Raw content */}
          <Card className="rounded-[40px]">
            <CardContent className="p-8">
              <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                {formattedContent || evaluation.report_content}
              </div>
            </CardContent>
          </Card>

          <ReportFooter generatedAt={evaluation.formatted_at || evaluation.created_at} />
        </main>
      </div>
    );
  }

  // Premium structured report
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background print:bg-white">
      <ReportHeader />
      
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8 print:space-y-6">
        {/* Greeting */}
        <GreetingCard greeting={reportData.greeting} />
        
        {/* Diagnostic Grid */}
        <DiagnosticGrid diagnostic={reportData.diagnostic} />
        
        {/* ROTA Method */}
        <RotaMethodSection rotaMethod={reportData.rota_method} />
        
        {/* Action Plan */}
        <ActionPlanList actionPlan={reportData.action_plan} />
        
        {/* Service Recommendations CTAs */}
        {reportData.recommendations && reportData.recommendations.length > 0 && (
          <RecommendationsCTA recommendations={reportData.recommendations} />
        )}
        
        {/* Resources */}
        <ResourcesPills 
          resources={reportData.resources} 
          whatsappKeyword={reportData.whatsapp_keyword} 
        />
        
        {/* Footer */}
        <ReportFooter 
          generatedAt={evaluation.formatted_at || evaluation.created_at}
        />
      </main>
    </div>
  );
}
