import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Globe, Languages, Briefcase, Target, Zap, TrendingUp,
  Sparkles, ArrowRight, Crown, X, Printer, Download, FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CareerEvaluation, FormattedReportData, ServiceRecommendation } from '@/types/leads';

interface LeadReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  evaluation: CareerEvaluation | null;
}

interface HubService {
  id: string;
  name: string;
  description: string | null;
  icon_name: string;
  price: number | null;
  price_display: string | null;
  cta_text: string | null;
  ticto_checkout_url: string | null;
  route: string | null;
}

const ROTA_STEPS = [
  { letter: 'R', title: 'Realidade & Direção', desc: 'Clareza de cenário, objetivo, rota e prazos.' },
  { letter: 'O', title: 'Organização da Marca', desc: 'Ajuste de currículo, LinkedIn e narrativa.' },
  { letter: 'T', title: 'Tração no Mercado', desc: 'Networking estratégico, visibilidade e entrevistas.' },
  { letter: 'A', title: 'Aceleração & Adaptação', desc: 'Negociação, mudança e adaptação de vida.' },
];

const diagnosticConfig = [
  { key: 'english' as const, icon: Languages, label: 'Inglês', bgColor: 'bg-blue-50 dark:bg-blue-950/30', iconColor: 'text-blue-600' },
  { key: 'experience' as const, icon: Briefcase, label: 'Experiência', bgColor: 'bg-indigo-50 dark:bg-indigo-950/30', iconColor: 'text-indigo-600' },
  { key: 'objective' as const, icon: Target, label: 'Objetivo', bgColor: 'bg-primary/5', iconColor: 'text-primary' },
  { key: 'financial' as const, icon: Zap, label: 'Financeiro', bgColor: 'bg-amber-50 dark:bg-amber-950/30', iconColor: 'text-amber-600' },
];

export function LeadReportModal({ isOpen, onClose, evaluation }: LeadReportModalProps) {
  const [reportData, setReportData] = useState<FormattedReportData | null>(null);
  const [services, setServices] = useState<HubService[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && evaluation) {
      fetchReportData();
      fetchServices();
    }
  }, [isOpen, evaluation?.id]);

  const fetchReportData = async () => {
    if (!evaluation) return;
    
    const formattedAt = evaluation.formatted_at ? new Date(evaluation.formatted_at).getTime() : 0;
    const updatedAt = evaluation.updated_at ? new Date(evaluation.updated_at).getTime() : 0;
    const isStale = formattedAt > 0 && updatedAt > formattedAt;

    // Try to parse existing formatted report (only if not stale)
    if (evaluation.formatted_report && !isStale) {
      try {
        const parsed = JSON.parse(evaluation.formatted_report);
        if (parsed.greeting && parsed.diagnostic) {
          setReportData(parsed as FormattedReportData);
          return;
        }
      } catch {
        // Will regenerate below
      }
    }

    // Generate if not available
    setIsLoading(true);
    const { data, error } = await supabase.functions.invoke('format-lead-report', {
      body: { evaluationId: evaluation.id, forceRefresh: isStale }
    });
    
    if (!error && data?.content) {
      setReportData(data.content);
    }
    setIsLoading(false);
  };

  const fetchServices = async () => {
    const { data } = await supabase
      .from('hub_services')
      .select('id, name, description, icon_name, price, price_display, cta_text, ticto_checkout_url, route')
      .eq('status', 'available')
      .eq('is_visible_in_hub', true);
    
    if (data) {
      setServices(data);
    }
  };

  const getServiceById = (serviceId: string): HubService | undefined => {
    return services.find(s => s.id === serviceId);
  };

  const getDiagnosticValue = (key: keyof FormattedReportData['diagnostic']): { primary: string; secondary: string } => {
    if (!reportData) return { primary: '', secondary: '' };
    const item = reportData.diagnostic[key];
    
    switch (key) {
      case 'english':
        return { primary: (item as { level: string; description: string }).level, secondary: (item as { level: string; description: string }).description };
      case 'experience':
        return { primary: (item as { summary: string; details: string }).summary, secondary: (item as { summary: string; details: string }).details };
      case 'objective':
        return { primary: (item as { goal: string; timeline: string }).goal, secondary: (item as { goal: string; timeline: string }).timeline };
      case 'financial':
        return { primary: (item as { income: string; investment: string }).income, secondary: (item as { income: string; investment: string }).investment };
      default:
        return { primary: '', secondary: '' };
    }
  };

  if (!evaluation) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] p-0 overflow-hidden bg-muted/30 rounded-[40px]">
        {/* Header */}
        <div className="p-8 border-b bg-background flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg">
              <Globe size={28} />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black tracking-tight">Relatório Individual</DialogTitle>
              <p className="text-sm text-muted-foreground font-bold uppercase tracking-wider">EUA Na Prática Core</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="rounded-xl" title="Imprimir">
              <Printer size={20} />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full bg-muted" onClick={onClose}>
              <X size={20} />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 md:p-10 space-y-12">
          {isLoading ? (
            <div className="space-y-6">
              <Skeleton className="h-40 w-full rounded-[32px]" />
              <div className="grid grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-[28px]" />)}
              </div>
              <Skeleton className="h-64 w-full rounded-[40px]" />
            </div>
          ) : reportData ? (
            <>
              {/* Greeting & Intro */}
              <section className="space-y-6">
                <div className="bg-background p-8 rounded-[32px] border shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                  <p className="text-lg text-foreground leading-relaxed font-medium mb-6">
                    {reportData.greeting.title}
                  </p>
                  <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10">
                    <p className="font-bold leading-relaxed">
                      <span className="text-primary">{reportData.greeting.phase_highlight}</span>
                      {' '}{reportData.greeting.phase_description}
                    </p>
                  </div>
                </div>
              </section>

              {/* Diagnostic Grid */}
              <section>
                <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-6 ml-2">
                  Diagnóstico de Prontidão
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-min">
                  {diagnosticConfig.map((item) => {
                    const Icon = item.icon;
                    const values = getDiagnosticValue(item.key);
                    return (
                      <div 
                        key={item.key} 
                        className="bg-background p-6 rounded-[28px] border shadow-sm hover:shadow-md transition-all flex gap-4 items-start min-h-fit"
                      >
                        <div className={cn("w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center", item.bgColor, item.iconColor)}>
                          <Icon size={24} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black text-muted-foreground uppercase tracking-wider mb-1">{item.label}</p>
                          <p className="text-sm text-foreground font-bold leading-relaxed">{values.primary}</p>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{values.secondary}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* ROTA EUA Section */}
              <section className="bg-foreground dark:bg-slate-800 rounded-[40px] p-10 text-primary-foreground relative overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary opacity-20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <h3 className="text-xl font-bold mb-8 flex items-center gap-2 text-background">
                  <TrendingUp className="text-primary" /> Método ROTA EUA™️
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
                  {ROTA_STEPS.map((step) => {
                    const isActive = step.letter === reportData.rota_method.current_phase;
                    return (
                      <div 
                        key={step.letter} 
                        className={cn(
                          "relative p-5 rounded-3xl border transition-all",
                          isActive 
                            ? "bg-primary border-primary/50 shadow-lg shadow-primary/20" 
                            : "bg-background/5 border-background/10 opacity-70"
                        )}
                      >
                        <div className="text-3xl font-black mb-2 text-background">{step.letter}</div>
                        <div className="text-xs font-bold mb-1 text-background">{step.title}</div>
                        <div className="text-[10px] opacity-60 leading-tight text-background/80">{step.desc}</div>
                        {isActive && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-foreground dark:border-slate-800" />
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="bg-background/10 backdrop-blur-xl border border-background/10 p-6 rounded-2xl">
                  <p className="text-primary/80 leading-relaxed font-medium italic text-sm">
                    "{reportData.rota_method.phase_analysis}"
                  </p>
                </div>
              </section>

              {/* Action Plan */}
              <section>
                <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-6 ml-2">
                  Plano de Ação (3 Passos)
                </h3>
                <div className="space-y-4">
                  {reportData.action_plan.map((step) => (
                    <div key={step.step} className="bg-background p-6 rounded-[28px] border shadow-sm flex gap-4 items-center">
                      <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 flex items-center justify-center text-sm font-black flex-shrink-0">
                        {step.step}
                      </div>
                      <div>
                        <p className="text-sm text-foreground font-bold">{step.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Recommendations CTAs */}
              {reportData.recommendations && reportData.recommendations.length > 0 && (
                <section className="bg-muted/50 rounded-[40px] p-8 md:p-10 border">
                  <div className="flex items-center gap-2 mb-8">
                    <div className="p-2 bg-primary text-primary-foreground rounded-lg">
                      <Zap size={20} className="fill-current" />
                    </div>
                    <h3 className="text-xl font-black tracking-tight">Próximos Passos Estratégicos</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* PRIMARY Recommendations */}
                    {reportData.recommendations.filter(r => r.type === 'PRIMARY').map((rec) => {
                      const service = getServiceById(rec.service_id);
                      if (!service) return null;
                      
                      return (
                        <div 
                          key={rec.service_id} 
                          className="lg:col-span-2 bg-foreground dark:bg-slate-800 text-background rounded-[32px] p-8 shadow-xl relative overflow-hidden flex flex-col justify-between"
                        >
                          <div className="absolute top-0 right-0 w-64 h-64 bg-primary rounded-full blur-[80px] opacity-30 -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                          
                          <div className="relative z-10">
                            <div className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">
                              <Sparkles size={12} className="fill-current" /> Recomendação Oficial
                            </div>
                            
                            <div className="flex items-start gap-4 mb-4">
                              <div className="p-3 bg-background/10 rounded-2xl border border-background/10">
                                <FileText size={24} className="text-primary/80" />
                              </div>
                              <div>
                                <h4 className="text-xl font-black mb-1 leading-tight">{service.name}</h4>
                                <p className="text-primary/60 text-sm leading-relaxed">{rec.reason}</p>
                              </div>
                            </div>

                            {service.price_display && (
                              <Badge variant="secondary" className="mb-4">{service.price_display}</Badge>
                            )}
                          </div>

                          <Button 
                            className="w-full bg-background text-foreground hover:bg-primary/10 font-black py-4 rounded-2xl mt-4 group"
                            onClick={() => service.ticto_checkout_url && window.open(service.ticto_checkout_url, '_blank')}
                          >
                            {service.cta_text || 'Agendar Sessão'} 
                            <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </div>
                      );
                    })}

                    {/* SECONDARY & UPGRADE */}
                    <div className="flex flex-col gap-6">
                      {reportData.recommendations.filter(r => r.type !== 'PRIMARY').map((rec) => {
                        const service = getServiceById(rec.service_id);
                        if (!service) return null;
                        
                        return (
                          <div 
                            key={rec.service_id} 
                            className={cn(
                              "flex-1 rounded-[32px] p-6 border transition-all flex flex-col justify-between",
                              rec.type === 'UPGRADE' 
                                ? "bg-gradient-to-br from-primary/5 to-indigo-500/5 border-primary/20" 
                                : "bg-background"
                            )}
                          >
                            <div>
                              <div className="flex justify-between items-start mb-3">
                                <Badge variant={rec.type === 'UPGRADE' ? 'default' : 'secondary'} className="text-[9px] uppercase">
                                  {rec.type === 'UPGRADE' ? 'Acompanhamento' : 'Estratégia'}
                                </Badge>
                                {rec.type === 'UPGRADE' && <Crown size={16} className="text-primary" />}
                              </div>
                              <h4 className="font-bold text-sm mb-2">{service.name}</h4>
                              <p className="text-xs text-muted-foreground leading-relaxed mb-4">{rec.reason}</p>
                            </div>
                            
                            <Button 
                              variant={rec.type === 'UPGRADE' ? 'default' : 'outline'}
                              className="w-full rounded-xl text-xs font-bold"
                              onClick={() => service.ticto_checkout_url && window.open(service.ticto_checkout_url, '_blank')}
                            >
                              {service.cta_text || 'Saiba mais'}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <p className="text-center text-xs text-muted-foreground mt-8 font-medium">
                    Todos os serviços contam com garantia de satisfação de 7 dias.
                  </p>
                </section>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Relatório não disponível
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 border-t bg-background flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              Análise Finalizada • Daniel Kiel EUA Na Prática
            </p>
          </div>
          <Button variant="secondary" className="rounded-2xl">
            <Download size={16} className="mr-2" /> Baixar PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
