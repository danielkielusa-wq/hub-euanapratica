import { useState, useEffect, useCallback } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Lightbulb, Sparkles, FileText, Loader2, Check, CheckSquare, Square,
  ArrowRight, Play, AlertTriangle, RefreshCw, Wand2, Video, Clock, Zap,
  Share2, Linkedin,
} from 'lucide-react';
import {
  useGenerateInsights,
  useGenerateIdeas,
  useGenerateScript,
  useGenerateSocialPosts,
  type ContentInsight,
  type ContentIdea,
  type ContentScript,
  type ContentSocialPost,
} from '@/hooks/useAdminContentStudio';

// ── Constants ────────────────────────────────────────────────────────────

const INSIGHT_TYPE_CONFIG: Record<string, { color: string; label: string }> = {
  barrier_radar: { color: 'bg-red-50 text-red-700 border-red-200', label: 'Barreiras' },
  area_trend: { color: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Tendência' },
  question_hot: { color: 'bg-orange-50 text-orange-700 border-orange-200', label: 'Pergunta' },
  job_highlight: { color: 'bg-green-50 text-green-700 border-green-200', label: 'Vaga' },
  churn_pattern: { color: 'bg-purple-50 text-purple-700 border-purple-200', label: 'Churn' },
  engagement_gap: { color: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Gap' },
};

const CATEGORY_COLORS: Record<string, string> = {
  instructional: 'bg-blue-50 text-blue-700',
  polemic: 'bg-red-50 text-red-700',
  data_story: 'bg-emerald-50 text-emerald-700',
  myth_busting: 'bg-purple-50 text-purple-700',
  roast: 'bg-orange-50 text-orange-700',
  vaga_da_semana: 'bg-teal-50 text-teal-700',
};

const CONTENT_TYPE_LABELS: Record<string, string> = {
  vertical_short: 'Vertical',
  long_youtube: 'YouTube',
  stories: 'Stories',
  carousel: 'Carrossel',
};

// ── Helpers ──────────────────────────────────────────────────────────────

function formatCreatedAt(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}

function viralityBadgeClass(score: number) {
  if (score >= 80) return 'bg-red-50 text-red-700 border-red-200';
  if (score >= 60) return 'bg-orange-50 text-orange-700 border-orange-200';
  return 'bg-gray-50 text-gray-600';
}

// ── Types ────────────────────────────────────────────────────────────────

type WizardStep = 1 | 2 | 3 | 4;
type Step2Phase = 'selecting' | 'generating' | 'reviewing';

interface ContentPipelineWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ── Stepper ──────────────────────────────────────────────────────────────

const STEPS = [
  { step: 1 as const, label: 'Insights', icon: Lightbulb },
  { step: 2 as const, label: 'Ideias', icon: Sparkles },
  { step: 3 as const, label: 'Roteiros', icon: FileText },
  { step: 4 as const, label: 'Posts', icon: Share2 },
];

function WizardStepper({ currentStep }: { currentStep: WizardStep }) {
  return (
    <div className="flex items-center justify-center gap-0 py-4">
      {STEPS.map((s, idx) => {
        const isCompleted = currentStep > s.step;
        const isCurrent = currentStep === s.step;
        const Icon = s.icon;
        return (
          <div key={s.step} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                  isCompleted
                    ? 'bg-purple-600 text-white'
                    : isCurrent
                    ? 'bg-purple-100 text-purple-700 ring-4 ring-purple-200'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              <span
                className={`text-[10px] font-medium ${
                  isCurrent ? 'text-purple-700' : isCompleted ? 'text-purple-600' : 'text-gray-400'
                }`}
              >
                {s.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={`w-16 h-0.5 mx-2 mb-4 ${
                  currentStep > s.step ? 'bg-purple-400' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Score Bar (mini) ─────────────────────────────────────────────────────

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.round(value * 10);
  return (
    <div className="flex items-center gap-2 text-[10px]">
      <span className="text-muted-foreground w-16 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-muted-foreground w-4 text-right">{value}</span>
    </div>
  );
}

// ── Main Wizard ──────────────────────────────────────────────────────────

export function ContentPipelineWizard({ open, onOpenChange }: ContentPipelineWizardProps) {
  const generateInsights = useGenerateInsights();
  const generateIdeas = useGenerateIdeas();
  const generateScript = useGenerateScript();
  const generateSocialPosts = useGenerateSocialPosts();

  // Wizard state
  const [step, setStep] = useState<WizardStep>(1);
  const [hasStarted, setHasStarted] = useState(false);

  // Step 1 state
  const [insights, setInsights] = useState<ContentInsight[]>([]);
  const [step1Loading, setStep1Loading] = useState(false);
  const [step1Error, setStep1Error] = useState<string | null>(null);

  // Step 2 state
  const [selectedInsightIds, setSelectedInsightIds] = useState<Set<string>>(new Set());
  const [step2Phase, setStep2Phase] = useState<Step2Phase>('selecting');
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [selectedIdeaIds, setSelectedIdeaIds] = useState<Set<string>>(new Set());
  const [step2Error, setStep2Error] = useState<string | null>(null);

  // Step 3 state
  const [scripts, setScripts] = useState<ContentScript[]>([]);
  const [scriptProgress, setScriptProgress] = useState({ current: 0, total: 0 });
  const [step3Loading, setStep3Loading] = useState(false);
  const [step3Error, setStep3Error] = useState<string | null>(null);
  const [step3Done, setStep3Done] = useState(false);

  // Step 4 state
  const [socialPosts, setSocialPosts] = useState<ContentSocialPost[]>([]);
  const [socialProgress, setSocialProgress] = useState({ current: 0, total: 0 });
  const [step4Loading, setStep4Loading] = useState(false);
  const [step4Error, setStep4Error] = useState<string | null>(null);
  const [step4Done, setStep4Done] = useState(false);

  // Reset everything when wizard closes
  useEffect(() => {
    if (!open) {
      setStep(1);
      setHasStarted(false);
      setInsights([]);
      setStep1Loading(false);
      setStep1Error(null);
      setSelectedInsightIds(new Set());
      setStep2Phase('selecting');
      setIdeas([]);
      setSelectedIdeaIds(new Set());
      setStep2Error(null);
      setScripts([]);
      setScriptProgress({ current: 0, total: 0 });
      setStep3Loading(false);
      setStep3Error(null);
      setStep3Done(false);
      setSocialPosts([]);
      setSocialProgress({ current: 0, total: 0 });
      setStep4Loading(false);
      setStep4Error(null);
      setStep4Done(false);
    }
  }, [open]);

  // ── Step 1: Generate Insights ──────────────────────────────────────────

  const runStep1 = useCallback(async (periodDays: number = 7) => {
    setStep1Loading(true);
    setStep1Error(null);
    try {
      const result = await generateInsights.mutateAsync(periodDays);
      const insightsList = result?.insights || [];
      setInsights(insightsList);
      // Pre-select all
      setSelectedInsightIds(new Set(insightsList.map((i: ContentInsight) => i.id)));
      if (insightsList.length === 0) {
        setStep1Error(periodDays === 7
          ? 'Nenhum insight gerado para os últimos 7 dias.'
          : 'Nenhum insight gerado para o período solicitado.');
      }
    } catch (err: any) {
      setStep1Error(err?.message || 'Erro ao gerar insights');
    } finally {
      setStep1Loading(false);
    }
  }, [generateInsights]);

  // Auto-start on open
  useEffect(() => {
    if (open && !hasStarted) {
      setHasStarted(true);
      runStep1(7);
    }
  }, [open, hasStarted, runStep1]);

  // ── Step 2: Generate Ideas ─────────────────────────────────────────────

  const runGenerateIdeas = useCallback(async () => {
    setStep2Phase('generating');
    setStep2Error(null);
    try {
      const result = await generateIdeas.mutateAsync({
        insight_ids: Array.from(selectedInsightIds),
      });
      const ideasList = result?.ideas || [];
      setIdeas(ideasList);
      setSelectedIdeaIds(new Set(ideasList.map((i: ContentIdea) => i.id)));
      setStep2Phase('reviewing');
      if (ideasList.length === 0) {
        setStep2Error('Nenhuma ideia gerada. Tente selecionar outros insights.');
        setStep2Phase('selecting');
      }
    } catch (err: any) {
      setStep2Error(err?.message || 'Erro ao gerar ideias');
      setStep2Phase('selecting');
    }
  }, [generateIdeas, selectedInsightIds]);

  // ── Step 3: Generate Scripts ───────────────────────────────────────────

  const runGenerateScripts = useCallback(async () => {
    const ideaIds = Array.from(selectedIdeaIds);
    setStep3Loading(true);
    setStep3Error(null);
    setStep3Done(false);
    setScripts([]);
    setScriptProgress({ current: 0, total: ideaIds.length });

    let failCount = 0;
    for (let i = 0; i < ideaIds.length; i++) {
      setScriptProgress({ current: i + 1, total: ideaIds.length });
      try {
        const result = await generateScript.mutateAsync({ idea_id: ideaIds[i] });
        if (result?.script) {
          setScripts(prev => [...prev, result.script]);
        }
      } catch {
        failCount++;
      }
    }

    setStep3Loading(false);
    setStep3Done(true);
    if (failCount === ideaIds.length) {
      setStep3Error('Nenhum roteiro gerado. Verifique a configuração da API.');
    }
  }, [generateScript, selectedIdeaIds]);

  // Auto-run scripts when arriving at step 3
  useEffect(() => {
    if (step === 3 && !step3Loading && !step3Done && scripts.length === 0) {
      runGenerateScripts();
    }
  }, [step, step3Loading, step3Done, scripts.length, runGenerateScripts]);

  // ── Step 4: Generate Social Posts ────────────────────────────────────────

  const runGenerateSocialPosts = useCallback(async () => {
    setStep4Loading(true);
    setStep4Error(null);
    setStep4Done(false);
    setSocialPosts([]);
    setSocialProgress({ current: 0, total: scripts.length });

    let failCount = 0;
    for (let i = 0; i < scripts.length; i++) {
      setSocialProgress({ current: i + 1, total: scripts.length });
      try {
        const result = await generateSocialPosts.mutateAsync({ script_id: scripts[i].id });
        if (result?.posts) {
          setSocialPosts(prev => [...prev, ...result.posts]);
        }
      } catch {
        failCount++;
      }
    }

    setStep4Loading(false);
    setStep4Done(true);
    if (failCount === scripts.length) {
      setStep4Error('Nenhum post social gerado. Verifique a configuração da API.');
    }
  }, [generateSocialPosts, scripts]);

  // Auto-run social posts when arriving at step 4
  useEffect(() => {
    if (step === 4 && !step4Loading && !step4Done && socialPosts.length === 0) {
      runGenerateSocialPosts();
    }
  }, [step, step4Loading, step4Done, socialPosts.length, runGenerateSocialPosts]);

  // ── Toggle helpers ─────────────────────────────────────────────────────

  const toggleInsight = (id: string) => {
    setSelectedInsightIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAllInsights = () => {
    if (selectedInsightIds.size === insights.length) {
      setSelectedInsightIds(new Set());
    } else {
      setSelectedInsightIds(new Set(insights.map(i => i.id)));
    }
  };

  const toggleIdea = (id: string) => {
    setSelectedIdeaIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAllIdeas = () => {
    if (selectedIdeaIds.size === ideas.length) {
      setSelectedIdeaIds(new Set());
    } else {
      setSelectedIdeaIds(new Set(ideas.map(i => i.id)));
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl overflow-hidden flex flex-col p-0">
        {/* Header */}
        <div className="px-6 pt-6 pb-0">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-purple-600" />
              Pipeline Interativo
            </SheetTitle>
          </SheetHeader>
          <WizardStepper currentStep={step} />
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 pb-4">
          {/* ── Step 1: Insights ──────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold">Etapa 1: Gerar Insights</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Analisando dados da plataforma para identificar oportunidades de conteúdo.
                </p>
              </div>

              {step1Loading && (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                  <p className="text-sm text-muted-foreground">Gerando insights a partir dos últimos 7 dias...</p>
                </div>
              )}

              {step1Error && !step1Loading && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <p className="text-sm text-amber-800">{step1Error}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => runStep1(7)}>
                      <RefreshCw className="w-3.5 h-3.5 mr-1" /> Tentar novamente
                    </Button>
                    {step1Error.includes('7 dias') && (
                      <Button size="sm" variant="outline" onClick={() => runStep1(14)}>
                        Tentar com 14 dias
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {!step1Loading && insights.length > 0 && (
                <div className="space-y-3">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {insights.length} insights gerados
                  </Badge>

                  <div className="grid gap-2 md:grid-cols-2">
                    {insights.map((insight) => {
                      const typeCfg = INSIGHT_TYPE_CONFIG[insight.insight_type] || {
                        color: 'bg-gray-50 text-gray-700 border-gray-200',
                        label: insight.insight_type,
                      };
                      return (
                        <Card key={insight.id} className="p-3 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <Badge variant="outline" className={`text-[10px] ${typeCfg.color}`}>
                              {typeCfg.label}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">{formatCreatedAt(insight.created_at)}</span>
                          </div>
                          <p className="text-xs font-medium line-clamp-2">{insight.title}</p>
                          <div className="space-y-1">
                            <ScoreBar label="Relevância" value={insight.relevance_score} color="bg-blue-400" />
                            <ScoreBar label="Polêmica" value={insight.controversy_score} color="bg-orange-400" />
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Step 2: Ideas ─────────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Phase A: Selecting Insights */}
              {step2Phase === 'selecting' && (
                <>
                  <div>
                    <h3 className="text-sm font-semibold">Etapa 2: Selecionar Insights & Gerar Ideias</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Escolha quais insights explorar para gerar ideias de conteúdo.
                    </p>
                  </div>

                  {step2Error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                      <p className="text-xs text-red-700">{step2Error}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <button
                      onClick={toggleAllInsights}
                      className="flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-800 font-medium"
                    >
                      {selectedInsightIds.size === insights.length ? (
                        <><CheckSquare className="w-3.5 h-3.5" /> Desmarcar todos</>
                      ) : (
                        <><Square className="w-3.5 h-3.5" /> Selecionar todos</>
                      )}
                    </button>
                    <span className="text-[10px] text-muted-foreground">
                      {selectedInsightIds.size} de {insights.length} selecionados
                    </span>
                  </div>

                  <div className="space-y-2">
                    {insights.map((insight) => {
                      const isSelected = selectedInsightIds.has(insight.id);
                      const typeCfg = INSIGHT_TYPE_CONFIG[insight.insight_type] || {
                        color: 'bg-gray-50 text-gray-700 border-gray-200',
                        label: insight.insight_type,
                      };
                      return (
                        <button
                          key={insight.id}
                          onClick={() => toggleInsight(insight.id)}
                          className={`w-full text-left rounded-lg border p-3 transition-all ${
                            isSelected
                              ? 'border-purple-200 bg-purple-50/40 shadow-sm'
                              : 'border-gray-200 opacity-60 hover:opacity-80'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className={`text-[10px] ${typeCfg.color}`}>
                                  {typeCfg.label}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground">
                                  Relevância {insight.relevance_score} · Polêmica {insight.controversy_score}
                                </span>
                                <span className="text-[10px] text-muted-foreground ml-auto">{formatCreatedAt(insight.created_at)}</span>
                              </div>
                              <p className="text-xs font-medium line-clamp-1">{insight.title}</p>
                              <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                                {insight.summary}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Phase: Generating */}
              {step2Phase === 'generating' && (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                  <p className="text-sm text-muted-foreground">
                    Gerando ideias a partir de {selectedInsightIds.size} insight{selectedInsightIds.size > 1 ? 's' : ''}...
                  </p>
                </div>
              )}

              {/* Phase B: Reviewing Ideas */}
              {step2Phase === 'reviewing' && (
                <>
                  <div>
                    <h3 className="text-sm font-semibold">Revisar Ideias Geradas</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Selecione as ideias que deseja transformar em roteiros.
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      onClick={toggleAllIdeas}
                      className="flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-800 font-medium"
                    >
                      {selectedIdeaIds.size === ideas.length ? (
                        <><CheckSquare className="w-3.5 h-3.5" /> Desmarcar todas</>
                      ) : (
                        <><Square className="w-3.5 h-3.5" /> Selecionar todas</>
                      )}
                    </button>
                    <span className="text-[10px] text-muted-foreground">
                      {selectedIdeaIds.size} de {ideas.length} selecionadas
                    </span>
                  </div>

                  <div className="space-y-2">
                    {ideas.map((idea) => {
                      const isSelected = selectedIdeaIds.has(idea.id);
                      const firstHook = idea.hooks?.[0];
                      return (
                        <button
                          key={idea.id}
                          onClick={() => toggleIdea(idea.id)}
                          className={`w-full text-left rounded-lg border p-3 transition-all ${
                            isSelected
                              ? 'border-purple-200 bg-purple-50/40 shadow-sm'
                              : 'border-gray-200 opacity-60 hover:opacity-80'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <div
                                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                    idea.estimated_virality_score >= 80 ? 'bg-gradient-to-br from-red-100 to-orange-100 text-red-700' :
                                    idea.estimated_virality_score >= 60 ? 'bg-gradient-to-br from-orange-100 to-amber-100 text-orange-700' :
                                    'bg-gradient-to-br from-purple-100 to-pink-100 text-purple-700'
                                  }`}
                                >
                                  {idea.estimated_virality_score}
                                </div>
                                <p className="text-xs font-medium line-clamp-1 flex-1">{idea.title}</p>
                                <span className="text-[10px] text-muted-foreground shrink-0">{formatCreatedAt(idea.created_at)}</span>
                              </div>
                              <div className="flex items-center gap-1.5 mb-1">
                                <Badge variant="outline" className="text-[10px]">
                                  {CONTENT_TYPE_LABELS[idea.content_type] || idea.content_type}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] ${CATEGORY_COLORS[idea.category] || ''}`}
                                >
                                  {idea.category?.replace(/_/g, ' ')}
                                </Badge>
                                <Badge variant="outline" className={`text-[10px] ${viralityBadgeClass(idea.estimated_virality_score)}`}>
                                  <Zap className="w-2.5 h-2.5 mr-0.5" />
                                  Viral: {idea.estimated_virality_score}
                                </Badge>
                              </div>
                              {firstHook && (
                                <p className="text-[10px] text-muted-foreground italic line-clamp-1">
                                  "{firstHook.text}"
                                </p>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Step 3: Scripts ────────────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold">Etapa 3: Gerar Roteiros</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Gerando roteiros completos para as ideias aprovadas.
                </p>
              </div>

              {step3Loading && (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                  <p className="text-sm text-muted-foreground">
                    Gerando roteiro {scriptProgress.current} de {scriptProgress.total}...
                  </p>
                  <div className="w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full transition-all"
                      style={{ width: `${(scriptProgress.current / scriptProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {step3Error && !step3Loading && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-2">
                  <p className="text-xs text-red-700">{step3Error}</p>
                  <Button size="sm" variant="outline" onClick={runGenerateScripts}>
                    <RefreshCw className="w-3.5 h-3.5 mr-1" /> Tentar novamente
                  </Button>
                </div>
              )}

              {/* Scripts rendered as they complete */}
              {scripts.length > 0 && (
                <div className="space-y-3">
                  {scripts.map((script) => (
                    <Card key={script.id} className="p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold line-clamp-1">{script.title}</p>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Badge variant="outline" className="text-[10px]">
                            <Video className="w-2.5 h-2.5 mr-0.5" />
                            {script.platform}
                          </Badge>
                          {script.duration_estimate_seconds && (
                            <Badge variant="outline" className="text-[10px]">
                              <Clock className="w-2.5 h-2.5 mr-0.5" />
                              {Math.round(script.duration_estimate_seconds / 60)}min
                            </Badge>
                          )}
                          {script.virality_score != null && (
                            <Badge variant="outline" className={`text-[10px] ${viralityBadgeClass(script.virality_score)}`}>
                              <Zap className="w-2.5 h-2.5 mr-0.5" />
                              {script.virality_score}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="rounded bg-purple-50 border border-purple-200 p-2">
                        <p className="text-[10px] font-semibold text-purple-700 mb-0.5">Hook</p>
                        <p className="text-xs italic text-purple-900">{script.hook}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] text-muted-foreground">
                          {script.body_sections?.length || 0} seções · Tom: {script.tone}
                          {script.cta && ` · CTA: "${script.cta.slice(0, 60)}..."`}
                        </p>
                        <span className="text-[10px] text-muted-foreground">{formatCreatedAt(script.created_at)}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* Done summary */}
              {step3Done && !step3Loading && scripts.length > 0 && (
                <div className="rounded-lg bg-purple-50 border border-purple-200 p-4 text-center space-y-2">
                  <Check className="w-6 h-6 text-purple-600 mx-auto" />
                  <p className="text-sm font-semibold text-purple-800">
                    {scripts.length} roteiro(s) gerado(s)!
                  </p>
                  <p className="text-xs text-purple-700">
                    Avance para gerar posts sociais (LinkedIn e X) ou conclua.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Step 4: Social Posts ──────────────────────────────────────── */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold">Etapa 4: Gerar Posts Sociais</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Gerando posts para LinkedIn e X a partir dos roteiros.
                </p>
              </div>

              {step4Loading && (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  <p className="text-sm text-muted-foreground">
                    Gerando posts para roteiro {socialProgress.current} de {socialProgress.total}...
                  </p>
                  <div className="w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${(socialProgress.current / socialProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {step4Error && !step4Loading && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-2">
                  <p className="text-xs text-red-700">{step4Error}</p>
                  <Button size="sm" variant="outline" onClick={runGenerateSocialPosts}>
                    <RefreshCw className="w-3.5 h-3.5 mr-1" /> Tentar novamente
                  </Button>
                </div>
              )}

              {/* Social posts rendered as they complete */}
              {socialPosts.length > 0 && (
                <div className="space-y-3">
                  {socialPosts.map((post) => (
                    <Card key={post.id} className="p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                            post.platform === 'linkedin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-800 text-white'
                          }`}>
                            {post.platform === 'linkedin' ? 'LinkedIn' : 'X'}
                          </span>
                          <Badge variant="outline" className="text-[10px]">{post.tone}</Badge>
                        </div>
                        <Badge variant="outline" className={`text-[10px] ${
                          post.platform === 'x' && post.content.length > 280 ? 'bg-red-50 text-red-700' : ''
                        }`}>
                          {post.content.length} chars
                        </Badge>
                      </div>
                      <div className={`rounded p-2 border ${
                        post.platform === 'linkedin' ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                      }`}>
                        <p className="text-xs whitespace-pre-line line-clamp-4">{post.content}</p>
                      </div>
                      {post.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {post.hashtags.slice(0, 5).map((tag, i) => (
                            <span key={i} className="text-[9px] text-muted-foreground">{tag}</span>
                          ))}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}

              {/* Done summary */}
              {step4Done && !step4Loading && (
                <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-center space-y-2">
                  <Check className="w-6 h-6 text-green-600 mx-auto" />
                  <p className="text-sm font-semibold text-green-800">Pipeline concluído!</p>
                  <p className="text-xs text-green-700">
                    {insights.length} insights · {ideas.length} ideias · {scripts.length} roteiros · {socialPosts.length} posts sociais
                  </p>
                  <p className="text-[10px] text-green-600">
                    Os conteúdos estão disponíveis nas abas Insights, Ideias, Roteiros e Posts.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer with navigation */}
        <div className="border-t px-6 py-4 flex items-center justify-between bg-white">
          {/* Left: Back */}
          <div>
            {step > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep((step - 1) as WizardStep)}
                disabled={step3Loading}
              >
                Voltar
              </Button>
            )}
          </div>

          {/* Right: Primary action */}
          <div className="flex items-center gap-2">
            {/* Step 1: Advance */}
            {step === 1 && !step1Loading && insights.length > 0 && (
              <Button size="sm" onClick={() => setStep(2)} className="bg-purple-600 hover:bg-purple-700">
                Próximo: Selecionar Insights
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            )}

            {/* Step 2 selecting: Generate ideas */}
            {step === 2 && step2Phase === 'selecting' && (
              <Button
                size="sm"
                onClick={runGenerateIdeas}
                disabled={selectedInsightIds.size === 0}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                Gerar Ideias ({selectedInsightIds.size} selecionados)
              </Button>
            )}

            {/* Step 2 reviewing: Approve or regenerate */}
            {step === 2 && step2Phase === 'reviewing' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setStep2Phase('selecting');
                    setIdeas([]);
                    setSelectedIdeaIds(new Set());
                    setStep2Error(null);
                  }}
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1" />
                  Gerar Novas Ideias
                </Button>
                <Button
                  size="sm"
                  onClick={() => setStep(3)}
                  disabled={selectedIdeaIds.size === 0}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Play className="w-3.5 h-3.5 mr-1" />
                  Gerar Roteiros ({selectedIdeaIds.size})
                </Button>
              </>
            )}

            {/* Step 3: Advance to social posts or close */}
            {step === 3 && step3Done && !step3Loading && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Pular Posts
                </Button>
                <Button
                  size="sm"
                  onClick={() => setStep(4)}
                  className="bg-purple-600 hover:bg-purple-700"
                  disabled={scripts.length === 0}
                >
                  <Share2 className="w-3.5 h-3.5 mr-1" />
                  Gerar Posts ({scripts.length})
                </Button>
              </>
            )}

            {/* Step 4: Close */}
            {step === 4 && step4Done && !step4Loading && (
              <Button
                size="sm"
                onClick={() => onOpenChange(false)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Check className="w-3.5 h-3.5 mr-1" />
                Concluir
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
