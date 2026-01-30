import { useState } from 'react';
import { ReportHeader } from './ReportHeader';
import { GreetingCard } from './GreetingCard';
import { DiagnosticGrid } from './DiagnosticGrid';
import { RotaMethodSection } from './RotaMethodSection';
import { ActionPlanList } from './ActionPlanList';
import { ResourcesPills } from './ResourcesPills';
import { ReportFooter } from './ReportFooter';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import type { CareerEvaluation, FormattedReportData } from '@/types/leads';

interface FormattedReportProps {
  evaluation: CareerEvaluation;
  formattedContent?: string;
  isLoading?: boolean;
}

export function FormattedReport({ evaluation, formattedContent, isLoading }: FormattedReportProps) {
  // Try to parse formatted content as JSON
  let reportData: FormattedReportData | null = null;
  
  if (formattedContent) {
    try {
      const parsed = JSON.parse(formattedContent);
      if (parsed.greeting && parsed.diagnostic) {
        reportData = parsed as FormattedReportData;
      }
    } catch {
      // Not valid JSON, will show fallback
    }
  }

  // Loading state
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
