import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  LayoutDashboard,
  GripVertical,
  Save,
  ArrowUp,
  ArrowDown,
  MessageCircle,
  Type,
  TrendingUp,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { useAppConfigs } from '@/hooks/useAppConfigs';
import { DEFAULT_CONFIG } from '@/hooks/useHubDashboardConfig';
import type {
  HubDashboardConfig,
  HubDashboardSectionId,
  SmartNextStepType,
  ReportDimensionKey,
} from '@/types/hub';
import { REPORT_DIMENSION_OPTIONS } from '@/types/hub';

const SECTION_LABELS: Record<HubDashboardSectionId, string> = {
  career_hero: 'Hero com Score de Carreira',
  smart_next_step: 'Próximo Passo Inteligente',
  active_items: 'Itens Ativos (Minha Jornada)',
  career_dimensions: 'Dimensões de Carreira',
  community_pulse: 'Pulso da Comunidade',
  smart_upsell: 'Upsell Inteligente',
  quick_tools: 'Ferramentas Rápidas',
  getting_started: 'Checklist Primeiros Passos',
  secondary_services: 'Serviços Secundários',
};

const STEP_LABELS: Record<SmartNextStepType, string> = {
  unscheduled_consultation: 'Consultoria não agendada',
  upcoming_event_24h: 'Evento nas próximas 24h',
  report_first_action: 'Ação recomendada do relatório',
  checklist_incomplete: 'Item pendente do checklist',
  resume_suggestion: 'Sugestão de análise de currículo',
  community_prompt: 'Incentivo à comunidade',
};

const QUICK_TOOL_OPTIONS = [
  { key: 'resume_pass', label: 'ResumePass AI' },
  { key: 'title_translator', label: 'Title Translator' },
  { key: 'prime_jobs', label: 'Prime Jobs' },
];

export default function AdminHubConfig() {
  const { getConfigValue, updateConfig, isSaving } = useAppConfigs();
  const [config, setConfig] = useState<HubDashboardConfig>(DEFAULT_CONFIG);

  // Load config from DB
  useEffect(() => {
    const raw = getConfigValue('hub_dashboard_config');
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Partial<HubDashboardConfig>;
        setConfig({
          sections_order: parsed.sections_order ?? DEFAULT_CONFIG.sections_order,
          sections_visibility: { ...DEFAULT_CONFIG.sections_visibility, ...parsed.sections_visibility },
          greetings: { ...DEFAULT_CONFIG.greetings, ...parsed.greetings },
          smart_next_step_priority: parsed.smart_next_step_priority ?? DEFAULT_CONFIG.smart_next_step_priority,
          community_pulse: { ...DEFAULT_CONFIG.community_pulse, ...parsed.community_pulse },
          social_proof: {
            dimension_cta: { ...DEFAULT_CONFIG.social_proof.dimension_cta, ...parsed.social_proof?.dimension_cta },
            general_upsell: parsed.social_proof?.general_upsell ?? DEFAULT_CONFIG.social_proof.general_upsell,
          },
          quick_tools: parsed.quick_tools ?? DEFAULT_CONFIG.quick_tools,
        });
      } catch { /* use defaults */ }
    }
  }, [getConfigValue]);

  const handleSave = async () => {
    try {
      await updateConfig('hub_dashboard_config', JSON.stringify(config));
      toast.success('Configurações do Hub salvas!');
    } catch {
      toast.error('Erro ao salvar configurações');
    }
  };

  // Section reorder helpers
  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...config.sections_order];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= newOrder.length) return;
    [newOrder[index], newOrder[target]] = [newOrder[target], newOrder[index]];
    setConfig({ ...config, sections_order: newOrder });
  };

  const toggleSection = (sectionId: HubDashboardSectionId) => {
    setConfig({
      ...config,
      sections_visibility: {
        ...config.sections_visibility,
        [sectionId]: !config.sections_visibility[sectionId],
      },
    });
  };

  // Smart next step priority reorder
  const moveStep = (index: number, direction: 'up' | 'down') => {
    const newPriority = [...config.smart_next_step_priority];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= newPriority.length) return;
    [newPriority[index], newPriority[target]] = [newPriority[target], newPriority[index]];
    setConfig({ ...config, smart_next_step_priority: newPriority });
  };

  const toggleQuickTool = (key: string) => {
    const tools = config.quick_tools.includes(key)
      ? config.quick_tools.filter((t) => t !== key)
      : [...config.quick_tools, key];
    setConfig({ ...config, quick_tools: tools });
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-10 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="h-6 w-6 text-indigo-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Hub Dashboard</h1>
              <p className="text-sm text-gray-500">Configure layout, seções e textos do hub do aluno</p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            <Save size={16} />
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>

        <Tabs defaultValue="layout">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="layout" className="gap-1 text-xs"><LayoutDashboard size={14} /> Layout</TabsTrigger>
            <TabsTrigger value="greetings" className="gap-1 text-xs"><Type size={14} /> Saudações</TabsTrigger>
            <TabsTrigger value="social" className="gap-1 text-xs"><TrendingUp size={14} /> Social Proof</TabsTrigger>
            <TabsTrigger value="steps" className="gap-1 text-xs"><Sparkles size={14} /> Próximo Passo</TabsTrigger>
            <TabsTrigger value="tools" className="gap-1 text-xs"><Wrench size={14} /> Ferramentas</TabsTrigger>
          </TabsList>

          {/* Tab 1: Layout & Sections */}
          <TabsContent value="layout">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ordem e Visibilidade das Seções</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {config.sections_order.map((sectionId, index) => (
                  <div key={sectionId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <GripVertical size={16} className="text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 flex-1">
                      {SECTION_LABELS[sectionId] || sectionId}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost" size="sm"
                        onClick={() => moveSection(index, 'up')}
                        disabled={index === 0}
                        className="h-7 w-7 p-0"
                      >
                        <ArrowUp size={14} />
                      </Button>
                      <Button
                        variant="ghost" size="sm"
                        onClick={() => moveSection(index, 'down')}
                        disabled={index === config.sections_order.length - 1}
                        className="h-7 w-7 p-0"
                      >
                        <ArrowDown size={14} />
                      </Button>
                    </div>
                    <Switch
                      checked={config.sections_visibility[sectionId] ?? true}
                      onCheckedChange={() => toggleSection(sectionId)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Greetings */}
          <TabsContent value="greetings">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Templates de Saudação</CardTitle>
                <p className="text-sm text-gray-500">Use {'{name}'} para inserir o nome do aluno.</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {(['morning', 'afternoon', 'evening', 'no_report'] as const).map((key) => (
                  <div key={key} className="space-y-1">
                    <Label className="text-sm font-medium capitalize">
                      {key === 'morning' ? 'Manhã (antes 12h)' :
                       key === 'afternoon' ? 'Tarde (12h-18h)' :
                       key === 'evening' ? 'Noite (após 18h)' :
                       'Sem relatório (fallback)'}
                    </Label>
                    <Input
                      value={config.greetings[key]}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          greetings: { ...config.greetings, [key]: e.target.value },
                        })
                      }
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: Social Proof */}
          <TabsContent value="social">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Textos de Prova Social por Dimensão</CardTitle>
                <p className="text-sm text-gray-500">
                  Exibidos junto à dimensão mais fraca do aluno para incentivar o upsell.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {REPORT_DIMENSION_OPTIONS.map((dim) => (
                  <div key={dim.value} className="space-y-1">
                    <Label className="text-sm font-medium">{dim.label}</Label>
                    <Textarea
                      rows={2}
                      value={config.social_proof.dimension_cta[dim.value] ?? ''}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          social_proof: {
                            ...config.social_proof,
                            dimension_cta: { ...config.social_proof.dimension_cta, [dim.value]: e.target.value },
                          },
                        })
                      }
                    />
                  </div>
                ))}

                <div className="pt-4 border-t space-y-1">
                  <Label className="text-sm font-medium">Texto geral de upsell (fallback)</Label>
                  <Textarea
                    rows={2}
                    value={config.social_proof.general_upsell}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        social_proof: { ...config.social_proof, general_upsell: e.target.value },
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 4: Smart Next Step */}
          <TabsContent value="steps">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Prioridade do Próximo Passo</CardTitle>
                <p className="text-sm text-gray-500">
                  O primeiro item com dados disponíveis será exibido ao aluno.
                </p>
              </CardHeader>
              <CardContent className="space-y-2">
                {config.smart_next_step_priority.map((stepType, index) => (
                  <div key={stepType} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <span className="text-xs font-bold text-gray-400 w-5">{index + 1}.</span>
                    <span className="text-sm font-medium text-gray-700 flex-1">
                      {STEP_LABELS[stepType] || stepType}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost" size="sm"
                        onClick={() => moveStep(index, 'up')}
                        disabled={index === 0}
                        className="h-7 w-7 p-0"
                      >
                        <ArrowUp size={14} />
                      </Button>
                      <Button
                        variant="ghost" size="sm"
                        onClick={() => moveStep(index, 'down')}
                        disabled={index === config.smart_next_step_priority.length - 1}
                        className="h-7 w-7 p-0"
                      >
                        <ArrowDown size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg">Pulso da Comunidade</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1 space-y-1">
                    <Label className="text-sm">Período de trending (dias)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={30}
                      value={config.community_pulse.trending_period_days}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          community_pulse: {
                            ...config.community_pulse,
                            trending_period_days: parseInt(e.target.value) || 7,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-5">
                    <Switch
                      checked={config.community_pulse.show_top_post}
                      onCheckedChange={(checked) =>
                        setConfig({
                          ...config,
                          community_pulse: { ...config.community_pulse, show_top_post: checked },
                        })
                      }
                    />
                    <Label className="text-sm">Mostrar post destaque</Label>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">CTA quando sem atividade</Label>
                  <Input
                    value={config.community_pulse.no_activity_cta}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        community_pulse: { ...config.community_pulse, no_activity_cta: e.target.value },
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 5: Quick Tools */}
          <TabsContent value="tools">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ferramentas Rápidas</CardTitle>
                <p className="text-sm text-gray-500">Selecione quais ferramentas aparecem no strip de atalhos.</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {QUICK_TOOL_OPTIONS.map((tool) => (
                  <div key={tool.key} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <Switch
                      checked={config.quick_tools.includes(tool.key)}
                      onCheckedChange={() => toggleQuickTool(tool.key)}
                    />
                    <span className="text-sm font-medium text-gray-700">{tool.label}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
