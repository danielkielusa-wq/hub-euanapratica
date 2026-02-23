import { useState } from 'react';
import { FileText, RefreshCw, ExternalLink, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LeadReportModal } from './LeadReportModal';
import { isV2Report } from '@/types/leads';
import type { CareerEvaluation, V2FormattedReportData, FormattedReportData } from '@/types/leads';

interface LeadReportTabProps {
  lead: CareerEvaluation;
}

export function LeadReportTab({ lead }: LeadReportTabProps) {
  const { toast } = useToast();
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showModal, setShowModal] = useState(false);

  let reportData: V2FormattedReportData | FormattedReportData | null = null;
  let isV2 = false;

  if (lead.formatted_report) {
    try {
      const parsed = JSON.parse(lead.formatted_report);
      isV2 = isV2Report(parsed);
      reportData = parsed;
    } catch {
      // invalid JSON
    }
  }

  const handleRegenerate = async () => {
    try {
      setIsRegenerating(true);
      const { error } = await supabase.functions.invoke('format-lead-report', {
        body: { evaluationId: lead.id, forceRefresh: true },
      });
      if (error) throw error;
      toast({ title: 'Relatório regenerado!', description: 'Recarregue a página para ver.' });
    } catch (err: any) {
      toast({ title: 'Erro ao regenerar', description: err.message, variant: 'destructive' });
    } finally {
      setIsRegenerating(false);
    }
  };

  const v2 = isV2 ? (reportData as V2FormattedReportData) : null;
  const v1 = !isV2 ? (reportData as FormattedReportData) : null;

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs rounded-xl gap-1.5"
          onClick={handleRegenerate}
          disabled={isRegenerating}
        >
          {isRegenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Regenerar Relatório
        </Button>
        {reportData && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs rounded-xl gap-1.5"
            onClick={() => setShowModal(true)}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Abrir Relatório Completo
          </Button>
        )}
        {lead.access_token && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs rounded-xl gap-1.5"
            onClick={() => window.open(`/report/${lead.access_token}`, '_blank')}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Página Pública
          </Button>
        )}
        <div className="flex-1" />
        <div className="flex items-center gap-2 text-[10px] text-gray-400">
          {lead.processing_status && (
            <Badge variant="outline" className={
              lead.processing_status === 'completed' ? 'text-green-600 bg-green-50 border-green-200' :
              lead.processing_status === 'error' ? 'text-red-600 bg-red-50 border-red-200' :
              'text-amber-600 bg-amber-50 border-amber-200'
            }>
              {lead.processing_status}
            </Badge>
          )}
          {lead.formatted_at && (
            <span>Formatado: {new Date(lead.formatted_at).toLocaleString('pt-BR')}</span>
          )}
        </div>
      </div>

      {/* Report summary */}
      {!reportData ? (
        <Card variant="glass">
          <CardContent className="py-16 text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">Relatório não disponível.</p>
            <p className="text-xs text-gray-400 mt-1">
              {lead.processing_status === 'error' ? (
                <>Erro no processamento: {lead.processing_error}</>
              ) : lead.processing_status === 'pending' || lead.processing_status === 'processing' ? (
                'O relatório está sendo processado...'
              ) : (
                'Clique em "Regenerar Relatório" para gerar.'
              )}
            </p>
          </CardContent>
        </Card>
      ) : v2 ? (
        /* V2 Report Summary */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Hero */}
          <Card variant="glass">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-indigo-50 rounded-xl p-4">
                <p className="text-lg font-bold text-indigo-800">{v2.web_report_data?.hero_section?.headline || 'Sem headline'}</p>
                <p className="text-xs text-indigo-600 mt-1">{v2.web_report_data?.hero_section?.subheadline}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <p className="text-2xl font-bold text-indigo-600">{v2.scoring?.readiness_score}</p>
                  <p className="text-[10px] text-gray-400">Score</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-800">{v2.phase_classification?.phase_emoji} {v2.phase_classification?.rota_letter}</p>
                  <p className="text-[10px] text-gray-400">Fase</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-800">{v2.phase_classification?.urgency_level}</p>
                  <p className="text-[10px] text-gray-400">Urgência</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Metrics */}
          <Card variant="glass">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Métricas Chave</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {v2.web_report_data?.key_metrics?.strengths?.length ? (
                <div>
                  <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">Pontos Fortes</p>
                  <div className="space-y-1">
                    {v2.web_report_data.key_metrics.strengths.map((s, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-green-700">
                        <CheckCircle className="w-3 h-3 flex-shrink-0" /> {s}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              {v2.web_report_data?.key_metrics?.critical_gaps?.length ? (
                <div>
                  <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">Gaps Críticos</p>
                  <div className="space-y-1">
                    {v2.web_report_data.key_metrics.critical_gaps.map((g, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-red-700">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" /> {g}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Phase Diagnosis */}
          {v2.phase_classification?.full_diagnosis && (
            <Card variant="glass" className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Diagnóstico da Fase</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {v2.phase_classification.full_diagnosis}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Action Plan Summary */}
          {v2.action_plan?.next_30_days?.length ? (
            <Card variant="glass" className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Plano de Ação — Próximos 30 dias</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {v2.action_plan.next_30_days.map((step, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-indigo-600">
                        {step.step_number || i + 1}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-800">{step.title}</p>
                        <p className="text-[10px] text-gray-500">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : v1 ? (
        /* V1 Report Summary */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card variant="glass">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-700">{v1.greeting?.title}</p>
              <div className="bg-indigo-50 rounded-xl p-3">
                <p className="text-xs text-indigo-700 font-medium">
                  {v1.greeting?.phase_highlight} {v1.greeting?.phase_description}
                </p>
              </div>
              <p className="text-xs text-gray-500">Fase ROTA: {v1.rota_method?.current_phase}</p>
            </CardContent>
          </Card>

          {v1.action_plan?.length ? (
            <Card variant="glass">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Plano de Ação</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {v1.action_plan.map((step, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-indigo-600">
                        {step.step}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-800">{step.title}</p>
                        <p className="text-[10px] text-gray-500">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}

      {/* Full modal */}
      <LeadReportModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        evaluation={lead}
      />
    </div>
  );
}
