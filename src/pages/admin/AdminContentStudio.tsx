import { useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Lightbulb, Sparkles, FileText, Calendar, Settings2,
  RefreshCw, Loader2, ChevronDown, ChevronRight,
  Copy, Check, Trash2, TrendingUp, MessageCircle,
  Briefcase, LogOut, AlertTriangle, Shield,
  Video, Zap, Target, Eye, Clock, BookOpen,
  Database, Brain, Wand2, ArrowRight, Play, Timer, ArrowUpDown,
  Hash, Image, Type, Youtube, Share2, Linkedin, HelpCircle,
} from 'lucide-react';
import {
  useContentInsights,
  useContentIdeas,
  useContentScripts,
  useContentPrompts,
  useGenerateInsights,
  useGenerateIdeas,
  useGenerateScript,
  useUpdateIdea,
  useUpdateScript,
  useUpdateInsight,
  useDeleteIdea,
  useSavePrompt,
  useAvailableApis,
  useUpdateCronSchedule,
  useContentSocialPosts,
  useGenerateSocialPosts,
  useUpdateSocialPost,
  useDeleteSocialPost,
  type ContentInsight,
  type ContentIdea,
  type ContentScript,
  type ContentSocialPost,
} from '@/hooks/useAdminContentStudio';
import { ContentPipelineWizard } from '@/components/admin/content-studio/ContentPipelineWizard';
import { ContentCalendar } from '@/components/admin/content-studio/ContentCalendar';

// ── Constants ────────────────────────────────────────────────────────────

const SCHEDULE_PRESETS = [
  { cron: '0 8 * * 1', label: 'Semanal (segunda 5h BRT)' },
  { cron: '0 8 * * 1,4', label: '2x/semana (seg+qui 5h BRT)' },
  { cron: '0 8 * * 1,3,5', label: '3x/semana (seg+qua+sex 5h BRT)' },
  { cron: '0 8 * * *', label: 'Diário (5h BRT)' },
  { cron: '0 8 1,15 * *', label: 'Quinzenal (1o+15o 5h BRT)' },
];

const TABS = [
  { id: 'insights' as const, label: 'Insights', icon: Lightbulb },
  { id: 'ideas' as const, label: 'Ideias', icon: Sparkles },
  { id: 'scripts' as const, label: 'Roteiros', icon: FileText },
  { id: 'social' as const, label: 'Posts', icon: Share2 },
  { id: 'calendar' as const, label: 'Calendário', icon: Calendar },
  { id: 'prompts' as const, label: 'Prompts', icon: Settings2 },
];

type TabId = typeof TABS[number]['id'];

const INSIGHT_TYPE_CONFIG: Record<string, { icon: typeof Shield; color: string; label: string }> = {
  barrier_radar: { icon: Shield, color: 'bg-red-50 text-red-700 border-red-200', label: 'Barreiras' },
  area_trend: { icon: TrendingUp, color: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Tendência' },
  question_hot: { icon: MessageCircle, color: 'bg-orange-50 text-orange-700 border-orange-200', label: 'Pergunta' },
  job_highlight: { icon: Briefcase, color: 'bg-green-50 text-green-700 border-green-200', label: 'Vaga' },
  churn_pattern: { icon: LogOut, color: 'bg-purple-50 text-purple-700 border-purple-200', label: 'Churn' },
  engagement_gap: { icon: AlertTriangle, color: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Gap' },
};

const CATEGORY_COLORS: Record<string, string> = {
  instructional: 'bg-blue-50 text-blue-700 border-blue-200',
  polemic: 'bg-red-50 text-red-700 border-red-200',
  data_story: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  myth_busting: 'bg-purple-50 text-purple-700 border-purple-200',
  roast: 'bg-orange-50 text-orange-700 border-orange-200',
  vaga_da_semana: 'bg-teal-50 text-teal-700 border-teal-200',
};

const CONTENT_TYPE_COLORS: Record<string, string> = {
  vertical_short: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  long_youtube: 'bg-red-50 text-red-700 border-red-200',
  stories: 'bg-pink-50 text-pink-700 border-pink-200',
  carousel: 'bg-amber-50 text-amber-700 border-amber-200',
};

const CONTENT_TYPE_LABELS: Record<string, string> = {
  vertical_short: 'Vertical',
  long_youtube: 'YouTube',
  stories: 'Stories',
  carousel: 'Carrossel',
};

const STATUS_COLORS: Record<string, string> = {
  idea: 'bg-gray-50 text-gray-700 border-gray-200',
  approved: 'bg-blue-50 text-blue-700 border-blue-200',
  in_production: 'bg-amber-50 text-amber-700 border-amber-200',
  published: 'bg-green-50 text-green-700 border-green-200',
  discarded: 'bg-red-50 text-red-700 border-red-200',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-gray-50 text-gray-600',
  medium: 'bg-blue-50 text-blue-600',
  high: 'bg-orange-50 text-orange-600',
  urgent: 'bg-red-50 text-red-600',
};

function formatCreatedAt(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}

function viralityBadgeClass(score: number) {
  if (score >= 80) return 'bg-red-50 text-red-700 border-red-200';
  if (score >= 60) return 'bg-orange-50 text-orange-700 border-orange-200';
  return 'bg-gray-50 text-gray-600';
}

const PROMPT_KEYS = [
  { key: 'content_studio_insights_prompt', apiKey: 'content_studio_insights_api_key', label: 'Prompt de Insights', description: 'Usado pelo generate-content-insights para analisar dados agregados e gerar insights.', apiHint: 'Ex: Perplexity para pesquisa online com dados atuais' },
  { key: 'content_studio_ideas_prompt', apiKey: 'content_studio_ideas_api_key', label: 'Prompt de Ideias', description: 'Usado pelo generate-content-ideas para gerar ideias de conteúdo com hooks.', apiHint: 'Ex: OpenAI GPT-4o para criatividade e hooks' },
  { key: 'content_studio_script_prompt', apiKey: 'content_studio_script_api_key', label: 'Prompt de Roteiros', description: 'Usado pelo generate-content-script para gerar roteiros completos.', apiHint: 'Ex: Claude para roteiros longos e detalhados' },
  { key: 'content_studio_social_prompt', apiKey: 'content_studio_social_api_key', label: 'Prompt de Posts Sociais', description: 'Usado pelo generate-content-social-posts para adaptar roteiros em posts de LinkedIn e X.', apiHint: 'Ex: GPT-4o para texto curto e impactante' },
];

// ── Tab Help Content ─────────────────────────────────────────────────────

type HelpStep = { icon: typeof Lightbulb; text: string };
type HelpSection = { title: string; steps: HelpStep[]; tip?: string };

const TAB_HELP: Record<TabId, { headline: string; description: string; sections: HelpSection[] }> = {
  insights: {
    headline: 'O que são Insights?',
    description: 'Insights são padrões detectados nos dados reais da plataforma — barreiras dos leads, engajamento da comunidade, vagas do job board, cancelamentos e aulas travadas. A LLM os analisa e sugere ângulos virais de conteúdo.',
    sections: [
      {
        title: 'Como gerar',
        steps: [
          { icon: Database, text: 'Escolha o período (7, 14 ou 30 dias) para definir a janela de análise.' },
          { icon: Zap, text: 'Clique em "Gerar Novos Insights" — a Edge Function minera os dados e chama a LLM.' },
          { icon: Lightbulb, text: 'Os insights gerados aparecem com score de Relevância + Controvérsia. Insights cruzando 2+ fontes são os mais valiosos.' },
        ],
        tip: 'Score de Controvérsia ≥ 70 = alta chance de debate nos comentários. Priorize esses.',
      },
      {
        title: 'Tipos de insight',
        steps: [
          { icon: Shield, text: 'Barreiras — O que realmente bloqueia as pessoas (inglês? visto? clareza?).' },
          { icon: TrendingUp, text: 'Tendência — Quais áreas profissionais estão migrando mais ou buscando mais.' },
          { icon: MessageCircle, text: 'Pergunta Quente — Tópicos da comunidade com alto engajamento orgânico.' },
          { icon: Briefcase, text: 'Vaga — Dados surpreendentes do job board (salário, remote, Brazil-friendly).' },
          { icon: LogOut, text: 'Churn — O que os cancelamentos revelam sobre o sentimento do mercado.' },
          { icon: AlertTriangle, text: 'Gap de Engajamento — Cruzamento de demanda não atendida por conteúdo.' },
        ],
      },
      {
        title: 'Próximo passo',
        steps: [
          { icon: Sparkles, text: 'Selecione insights com score alto e clique "Gerar Ideias" para avançar no pipeline.' },
        ],
      },
    ],
  },
  ideas: {
    headline: 'O que são Ideias?',
    description: 'Ideias são conceitos de vídeo com hooks testados e score de viralidade. Cada ideia nasce de um ou mais insights e vem com 3-5 variações de abertura (question, claim, data, provocation) prontas para uso.',
    sections: [
      {
        title: 'Como gerar',
        steps: [
          { icon: Lightbulb, text: 'Na aba Insights, selecione insights e clique "Gerar Ideias" — ou clique "Gerar de Tópico Livre" aqui.' },
          { icon: Sparkles, text: 'A LLM cria ideias com título, descrição, público-alvo, categoria e score de viralidade (0-100).' },
          { icon: Target, text: 'Score ≥ 80 = viral (debate intenso). 60-79 = bom engajamento. < 60 = conteúdo sólido.' },
        ],
        tip: 'Tópico livre permite criar ideias sem dados de insights — útil para datas sazonais ou eventos externos.',
      },
      {
        title: 'Gerenciar ideias',
        steps: [
          { icon: Eye, text: 'Clique em uma ideia para ver hooks, scoring detalhado e técnicas de viralidade usadas.' },
          { icon: FileText, text: 'Clique "Roteiro" em qualquer ideia para gerar o roteiro completo na próxima etapa.' },
          { icon: ArrowUpDown, text: 'Use os filtros de Status e Categoria para organizar seu backlog de ideias.' },
        ],
      },
    ],
  },
  scripts: {
    headline: 'O que são Roteiros?',
    description: 'Roteiros são scripts completos prontos para gravar — com hook, seções de corpo, CTA, notas de câmera, sugestões de thumbnail e metadados de publicação (título YouTube, descrição, hashtags).',
    sections: [
      {
        title: 'Como gerar',
        steps: [
          { icon: Sparkles, text: 'Na aba Ideias, clique "Roteiro" em qualquer ideia aprovada.' },
          { icon: FileText, text: 'O roteiro chega com seções numeradas, data callouts para grafismo e camera notes para produção.' },
          { icon: Zap, text: 'Virality score ≥ 70 indica roteiro forte. Abaixo disso considere ajustar o hook.' },
        ],
        tip: 'Clique em "Copiar Tudo" para copiar o roteiro inteiro em Markdown formatado, pronto para colar no editor de script.',
      },
      {
        title: 'Gerar Posts Sociais',
        steps: [
          { icon: Share2, text: 'Clique "Gerar Posts" em qualquer roteiro para criar automaticamente um post para LinkedIn e um para X.' },
          { icon: Linkedin, text: 'Os posts são adaptados para cada plataforma — não são um resize. LinkedIn: 1200-2000 chars com storytelling. X: ≤ 280 chars, hot take.' },
          { icon: Calendar, text: 'Após gerar, os posts aparecem na aba Posts e no Calendário para agendamento.' },
        ],
      },
    ],
  },
  social: {
    headline: 'O que são Posts Sociais?',
    description: 'Posts sociais são adaptações dos roteiros para LinkedIn e X (Twitter). Cada roteiro gera dois posts distintos — não um copy-paste reduzido. A LLM extrai a essência viral e reescreve para o formato e tom de cada plataforma.',
    sections: [
      {
        title: 'Como gerar',
        steps: [
          { icon: FileText, text: 'Vá na aba Roteiros → clique "Gerar Posts" em qualquer roteiro.' },
          { icon: Share2, text: 'A Edge Function gera 1 post LinkedIn (800-2500 chars, storytelling) + 1 tweet X (≤ 280 chars, hot take).' },
          { icon: Lightbulb, text: 'Cada post vem com hooks alternativos, dica de engajamento e melhor horário de postagem.' },
        ],
        tip: 'O tweet X deve ter ≤ 280 caracteres incluindo hashtags. O contador vermelho aparece automaticamente se passar do limite.',
      },
      {
        title: 'Gerenciar posts',
        steps: [
          { icon: Copy, text: 'Clique "Copiar" para copiar o conteúdo + hashtags do post para a área de transferência.' },
          { icon: Calendar, text: 'Arraste o post para uma data no Calendário para agendar.' },
          { icon: Eye, text: 'Use o dropdown de Status (Draft → Review → Aprovado → Publicado) para controlar o fluxo editorial.' },
        ],
      },
    ],
  },
  calendar: {
    headline: 'Calendário de Conteúdo',
    description: 'Visualização mensal de roteiros e posts sociais agendados. Arraste qualquer item para uma data para agendar, ou para a zona "Sem data" para desagendar. Clique em qualquer item para ver os detalhes.',
    sections: [
      {
        title: 'Como usar',
        steps: [
          { icon: Calendar, text: 'Navegue entre meses com as setas. O mês atual é destacado automaticamente.' },
          { icon: ArrowRight, text: 'Arraste roteiros (borda roxa) ou posts sociais (borda azul=LinkedIn, borda preta=X) para qualquer célula de data.' },
          { icon: Eye, text: 'Clique em qualquer item para abrir o painel de detalhes com opção de copiar e gerenciar status.' },
        ],
        tip: 'Itens sem data aparecem na zona inferior "Sem data programada" — arraste-os para o calendário quando estiverem prontos.',
      },
      {
        title: 'Legenda visual',
        steps: [
          { icon: FileText, text: 'Borda roxa = Roteiro de vídeo.' },
          { icon: Linkedin, text: 'Badge "LI" azul = Post LinkedIn.' },
          { icon: Share2, text: 'Badge "X" preto = Post para X (Twitter).' },
        ],
      },
    ],
  },
  prompts: {
    headline: 'Configuração de Prompts e APIs',
    description: 'Cada etapa do pipeline usa um prompt e uma API/LLM configuráveis. Mudanças são aplicadas imediatamente — sem redeploy. Se o campo de prompt estiver vazio, o sistema usa o prompt padrão embutido na Edge Function.',
    sections: [
      {
        title: 'Como configurar',
        steps: [
          { icon: Settings2, text: 'Escolha a API/LLM para cada etapa no dropdown. Exemplo: Insights com Perplexity (dados online), Roteiros com Claude (textos longos).' },
          { icon: Brain, text: 'Edite o prompt no textarea. Salve com "Salvar Prompt". Para voltar ao padrão, apague o texto e salve vazio.' },
          { icon: Wand2, text: 'Use "Pipeline Completo" para gerar todas as etapas em sequência, ou "Apenas Insights" para parar após a mineração de dados.' },
        ],
        tip: 'O botão "Documentação" exibe a referência completa do pipeline com exemplos de prompt e estrutura de dados de cada etapa.',
      },
      {
        title: 'Pipeline automático',
        steps: [
          { icon: Timer, text: 'Configure a frequência de execução automática (diário, semanal, etc.).' },
          { icon: Database, text: 'Defina quantos insights viram ideias (Top N) e quantas ideias viram roteiros.' },
          { icon: Share2, text: 'Para gerar posts sociais automaticamente no pipeline, ative "content_studio_auto_social_enabled" no banco.' },
        ],
      },
    ],
  },
};

function TabHelp({ tab }: { tab: TabId }) {
  const [open, setOpen] = useState(false);
  const help = TAB_HELP[tab];

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
        onClick={() => setOpen(true)}
        title="Ajuda desta aba"
      >
        <HelpCircle className="w-4 h-4" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-[420px] sm:w-[480px] overflow-y-auto">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2 text-base">
              <HelpCircle className="w-4 h-4 text-purple-500" />
              {help.headline}
            </SheetTitle>
            <p className="text-sm text-muted-foreground leading-relaxed">{help.description}</p>
          </SheetHeader>

          <div className="space-y-6">
            {help.sections.map((section, si) => (
              <div key={si}>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  {section.title}
                </h3>
                <div className="space-y-3">
                  {section.steps.map((step, i) => {
                    const Icon = step.icon;
                    return (
                      <div key={i} className="flex items-start gap-3">
                        <div className="mt-0.5 p-1.5 rounded-md bg-purple-50 shrink-0">
                          <Icon className="w-3.5 h-3.5 text-purple-600" />
                        </div>
                        <p className="text-sm leading-relaxed">{step.text}</p>
                      </div>
                    );
                  })}
                </div>
                {section.tip && (
                  <div className="mt-3 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <Zap className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-800 leading-relaxed">{section.tip}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

// ── Main Component ───────────────────────────────────────────────────────

export default function AdminContentStudio() {
  const [activeTab, setActiveTab] = useState<TabId>('insights');

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-100 rounded-xl">
            <Video className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Content Studio</h1>
            <p className="text-sm text-muted-foreground">
              Mine dados reais da plataforma para gerar conteúdo viral com AI.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-muted rounded-lg p-1 gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'insights' && <InsightsTab />}
        {activeTab === 'ideas' && <IdeasTab />}
        {activeTab === 'scripts' && <ScriptsTab />}
        {activeTab === 'social' && <SocialPostsTab />}
        {activeTab === 'calendar' && <CalendarTab />}
        {activeTab === 'prompts' && <PromptsTab />}
      </div>
    </DashboardLayout>
  );
}

// ── Insights Tab ─────────────────────────────────────────────────────────

function InsightsTab() {
  const [periodDays, setPeriodDays] = useState(7);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const { data: rawInsights = [], isLoading, refetch } = useContentInsights(
    typeFilter !== 'all' ? { type: typeFilter } : undefined
  );
  const generateInsights = useGenerateInsights();
  const generateIdeas = useGenerateIdeas();

  const insights = sortOrder === 'oldest'
    ? [...rawInsights].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    : rawInsights;

  return (
    <div className="space-y-4">
      {/* Actions bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Select value={String(periodDays)} onValueChange={(v) => setPeriodDays(Number(v))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 dias</SelectItem>
              <SelectItem value="14">14 dias</SelectItem>
              <SelectItem value="30">30 dias</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {Object.entries(INSIGHT_TYPE_CONFIG).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as 'newest' | 'oldest')}>
            <SelectTrigger className="w-40">
              <ArrowUpDown className="w-3 h-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Mais recentes</SelectItem>
              <SelectItem value="oldest">Mais antigos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <TabHelp tab="insights" />
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-1" /> Atualizar
          </Button>
          <Button
            size="sm"
            onClick={() => generateInsights.mutate(periodDays)}
            disabled={generateInsights.isPending}
          >
            {generateInsights.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1" />
            ) : (
              <Zap className="w-4 h-4 mr-1" />
            )}
            Gerar Novos Insights
          </Button>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && insights.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Lightbulb className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Nenhum insight gerado ainda.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Clique "Gerar Novos Insights" para minerar seus dados.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Insights grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {insights.map((insight) => (
          <InsightCard
            key={insight.id}
            insight={insight}
            onGenerateIdeas={() => generateIdeas.mutate({ insight_ids: [insight.id] })}
            isGenerating={generateIdeas.isPending}
          />
        ))}
      </div>
    </div>
  );
}

function InsightCard({ insight, onGenerateIdeas, isGenerating }: {
  insight: ContentInsight;
  onGenerateIdeas: () => void;
  isGenerating: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const config = INSIGHT_TYPE_CONFIG[insight.insight_type] || INSIGHT_TYPE_CONFIG.engagement_gap;
  const Icon = config.icon;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <Badge variant="outline" className={config.color}>
            <Icon className="w-3 h-3 mr-1" />
            {config.label}
          </Badge>
          {insight.status === 'used' && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">Usado</Badge>
          )}
        </div>
        <CardTitle className="text-sm font-semibold leading-snug mt-2">
          {insight.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-3">{insight.summary}</p>

        {/* Score bars */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs">
            <span className="w-20 text-muted-foreground">Relevância</span>
            <div className="flex-1 bg-gray-100 rounded-full h-1.5">
              <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${insight.relevance_score}%` }} />
            </div>
            <span className="w-8 text-right font-mono">{insight.relevance_score}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-20 text-muted-foreground">Polêmica</span>
            <div className="flex-1 bg-gray-100 rounded-full h-1.5">
              <div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${insight.controversy_score}%` }} />
            </div>
            <span className="w-8 text-right font-mono">{insight.controversy_score}</span>
          </div>
        </div>

        {/* Data points (collapsible) */}
        {insight.data_points && Object.keys(insight.data_points).length > 0 && (
          <Collapsible open={expanded} onOpenChange={setExpanded}>
            <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              Ver dados
            </CollapsibleTrigger>
            <CollapsibleContent>
              <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-40">
                {JSON.stringify(insight.data_points, null, 2)}
              </pre>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="text-xs text-muted-foreground">
            <div>{insight.period_start} → {insight.period_end}</div>
            <div className="text-[10px]">Criado: {formatCreatedAt(insight.created_at)}</div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={onGenerateIdeas}
            disabled={isGenerating || insight.status === 'used'}
          >
            {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Sparkles className="w-3.5 h-3.5 mr-1" />}
            Gerar Ideias
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Ideas Tab ────────────────────────────────────────────────────────────

function IdeasTab() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [selectedIdea, setSelectedIdea] = useState<ContentIdea | null>(null);
  const [freeTextDialog, setFreeTextDialog] = useState(false);
  const [freeText, setFreeText] = useState('');

  const filters: any = {};
  if (statusFilter !== 'all') filters.status = statusFilter;
  if (categoryFilter !== 'all') filters.category = categoryFilter;

  const { data: rawIdeas = [], isLoading, refetch } = useContentIdeas(
    Object.keys(filters).length > 0 ? filters : undefined
  );
  const generateScript = useGenerateScript();
  const generateIdeas = useGenerateIdeas();
  const updateIdea = useUpdateIdea();
  const deleteIdea = useDeleteIdea();

  const ideas = sortOrder === 'oldest'
    ? [...rawIdeas].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    : rawIdeas;

  return (
    <div className="space-y-4">
      {/* Actions bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="idea">Ideia</SelectItem>
              <SelectItem value="approved">Aprovada</SelectItem>
              <SelectItem value="in_production">Produção</SelectItem>
              <SelectItem value="published">Publicada</SelectItem>
              <SelectItem value="discarded">Descartada</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="instructional">Instrucional</SelectItem>
              <SelectItem value="polemic">Polêmica</SelectItem>
              <SelectItem value="data_story">Data Story</SelectItem>
              <SelectItem value="myth_busting">Mito</SelectItem>
              <SelectItem value="roast">Roast</SelectItem>
              <SelectItem value="vaga_da_semana">Vaga</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as 'newest' | 'oldest')}>
            <SelectTrigger className="w-40">
              <ArrowUpDown className="w-3 h-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Mais recentes</SelectItem>
              <SelectItem value="oldest">Mais antigos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <TabHelp tab="ideas" />
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-1" /> Atualizar
          </Button>
          <Button size="sm" onClick={() => setFreeTextDialog(true)}>
            <Sparkles className="w-4 h-4 mr-1" /> Gerar de Tópico Livre
          </Button>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && ideas.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Sparkles className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Nenhuma ideia ainda.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Gere insights primeiro, ou crie ideias a partir de um tópico livre.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Virality legend */}
      {!isLoading && ideas.length > 0 && (
        <ViralityLegend
          items={ideas.map(i => ({ virality_score: i.estimated_virality_score, metadata: i.metadata }))}
          type="ideas"
        />
      )}

      {/* Ideas list */}
      <div className="space-y-3">
        {ideas.map((idea) => (
          <IdeaCard
            key={idea.id}
            idea={idea}
            onSelect={() => setSelectedIdea(idea)}
            onStatusChange={(status) => updateIdea.mutate({ id: idea.id, status })}
            onGenerateScript={() => generateScript.mutate({ idea_id: idea.id })}
            onDelete={() => deleteIdea.mutate(idea.id)}
            isGeneratingScript={generateScript.isPending && generateScript.variables?.idea_id === idea.id}
          />
        ))}
      </div>

      {/* Idea detail sheet */}
      <Sheet open={!!selectedIdea} onOpenChange={(open) => !open && setSelectedIdea(null)}>
        <SheetContent className="sm:max-w-2xl overflow-auto">
          <SheetHeader>
            <SheetTitle>{selectedIdea?.title}</SheetTitle>
          </SheetHeader>
          {selectedIdea && <IdeaDetail idea={selectedIdea} />}
        </SheetContent>
      </Sheet>

      {/* Free text dialog */}
      <Dialog open={freeTextDialog} onOpenChange={setFreeTextDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Gerar Ideias de Tópico Livre</DialogTitle>
          </DialogHeader>
          <Textarea
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            placeholder="Ex: imigração via EB-2 NIW, diferenças culturais no trabalho, erros de currículo..."
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setFreeTextDialog(false)}>Cancelar</Button>
            <Button
              onClick={() => {
                generateIdeas.mutate({ free_text: freeText });
                setFreeTextDialog(false);
                setFreeText('');
              }}
              disabled={!freeText.trim() || generateIdeas.isPending}
            >
              {generateIdeas.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Sparkles className="w-4 h-4 mr-1" />}
              Gerar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function IdeaCard({ idea, onSelect, onStatusChange, onGenerateScript, onDelete, isGeneratingScript }: {
  idea: ContentIdea;
  onSelect: () => void;
  onStatusChange: (status: string) => void;
  onGenerateScript: () => void;
  onDelete: () => void;
  isGeneratingScript: boolean;
}) {
  const [hooksOpen, setHooksOpen] = useState(false);

  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Virality score indicator */}
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
            idea.estimated_virality_score >= 80 ? 'bg-gradient-to-br from-red-100 to-orange-100' :
            idea.estimated_virality_score >= 60 ? 'bg-gradient-to-br from-orange-100 to-amber-100' :
            'bg-gradient-to-br from-purple-100 to-pink-100'
          }`}>
            <span className={`text-xs font-bold ${
              idea.estimated_virality_score >= 80 ? 'text-red-700' :
              idea.estimated_virality_score >= 60 ? 'text-orange-700' :
              'text-purple-700'
            }`}>{idea.estimated_virality_score}</span>
          </div>

          <div className="flex-1 min-w-0">
            {/* Title + badges row */}
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <button onClick={onSelect} className="text-sm font-semibold text-left hover:text-purple-600 truncate max-w-xs">
                {idea.title}
              </button>
              <Badge variant="outline" className={`text-[10px] ${CONTENT_TYPE_COLORS[idea.content_type] || ''}`}>
                {CONTENT_TYPE_LABELS[idea.content_type] || idea.content_type}
              </Badge>
              <Badge variant="outline" className={`text-[10px] ${CATEGORY_COLORS[idea.category] || ''}`}>
                {idea.category}
              </Badge>
              <Badge variant="outline" className={`text-[10px] ${PRIORITY_COLORS[idea.priority] || ''}`}>
                {idea.priority}
              </Badge>
              <Badge variant="outline" className={`text-[10px] ${viralityBadgeClass(idea.estimated_virality_score)}`}>
                <Zap className="w-2.5 h-2.5 mr-0.5" />
                Viral: {idea.estimated_virality_score}
              </Badge>
            </div>

            {idea.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{idea.description}</p>
            )}

            {/* Hooks preview */}
            {idea.hooks?.length > 0 && (
              <Collapsible open={hooksOpen} onOpenChange={setHooksOpen}>
                <CollapsibleTrigger className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 mb-1">
                  {hooksOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  {idea.hooks.length} hooks
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="space-y-1.5 mt-1">
                    {idea.hooks.map((hook, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs bg-muted/50 rounded p-2">
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          {hook.style}
                        </Badge>
                        <span className="text-muted-foreground flex-1">{hook.text}</span>
                        <span className="text-[10px] font-mono text-muted-foreground shrink-0">{hook.score}</span>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Actions row */}
            <div className="flex items-center gap-2 mt-2">
              <Select value={idea.status} onValueChange={onStatusChange}>
                <SelectTrigger className="h-7 w-32 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="idea">Ideia</SelectItem>
                  <SelectItem value="approved">Aprovada</SelectItem>
                  <SelectItem value="in_production">Produção</SelectItem>
                  <SelectItem value="published">Publicada</SelectItem>
                  <SelectItem value="discarded">Descartada</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onGenerateScript} disabled={isGeneratingScript}>
                {isGeneratingScript ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <FileText className="w-3 h-3 mr-1" />}
                Roteiro
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs text-red-500 hover:text-red-700" onClick={onDelete}>
                <Trash2 className="w-3 h-3" />
              </Button>
              <span className="text-[10px] text-muted-foreground ml-auto">
                {idea.scheduled_date && (
                  <><Clock className="w-3 h-3 inline mr-0.5" />{idea.scheduled_date} · </>
                )}
                {formatCreatedAt(idea.created_at)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function IdeaDetail({ idea }: { idea: ContentIdea }) {
  return (
    <div className="space-y-4 mt-4">
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-1">Descrição</h3>
        <p className="text-sm">{idea.description || 'Sem descrição'}</p>
      </div>

      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-1">Público-alvo</h3>
        <p className="text-sm">{idea.target_audience || 'Não especificado'}</p>
      </div>

      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Hooks ({idea.hooks?.length || 0})</h3>
        <div className="space-y-2">
          {(idea.hooks || []).map((hook, i) => (
            <div key={i} className="flex items-start gap-2 p-3 bg-muted rounded-lg">
              <Badge variant="outline" className="shrink-0">{hook.style}</Badge>
              <p className="text-sm flex-1">"{hook.text}"</p>
              <span className="text-sm font-mono text-muted-foreground">{hook.score}</span>
            </div>
          ))}
        </div>
      </div>

      {idea.data_points_used && Object.keys(idea.data_points_used).length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Dados utilizados</h3>
          <pre className="p-2 bg-muted rounded text-xs overflow-auto">
            {JSON.stringify(idea.data_points_used, null, 2)}
          </pre>
        </div>
      )}

      {/* Virality breakdown */}
      {(idea.metadata as any)?.virality_breakdown && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            <Zap className="w-3.5 h-3.5 inline mr-1" />
            Análise de Viralidade ({idea.estimated_virality_score}/100)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-3">
            {Object.entries((idea.metadata as any).virality_breakdown as Record<string, number>).map(([key, val]) => (
              <div key={key} className="text-center p-2 bg-muted rounded-lg">
                <div className={`text-lg font-bold ${val >= 80 ? 'text-red-600' : val >= 60 ? 'text-orange-600' : 'text-gray-600'}`}>{val}</div>
                <div className="text-[10px] text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</div>
              </div>
            ))}
          </div>
          {(idea.metadata as any)?.virality_techniques?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {((idea.metadata as any).virality_techniques as string[]).map((t: string) => (
                <Badge key={t} variant="outline" className="text-xs">
                  {t.replace(/_/g, ' ')}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      {idea.notes && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Notas</h3>
          <p className="text-sm">{idea.notes}</p>
        </div>
      )}

      <div className="text-[10px] text-muted-foreground pt-2 border-t">
        Criado: {formatCreatedAt(idea.created_at)} · Atualizado: {formatCreatedAt(idea.updated_at)}
      </div>
    </div>
  );
}

// ── Scripts Tab ──────────────────────────────────────────────────────────

function ViralityLegend({ items, type }: { items: Array<{ virality_score: number | null; metadata: Record<string, unknown> | null }>; type: 'scripts' | 'ideas' }) {
  const withScore = items.filter(i => i.virality_score != null && i.virality_score !== 50);
  if (withScore.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/50 p-3">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-4 h-4 text-gray-400" />
          <span className="text-xs font-semibold text-gray-500">Score de Viralidade</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {type === 'scripts' ? 'Roteiros' : 'Ideias'} existentes foram gerados antes do scoring de viralidade.
          Novos itens terão scores reais (0-100) com breakdown por dimensão.
        </p>
        <div className="flex flex-wrap gap-3 mt-2 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400" /> 80+ Altamente viral</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400" /> 60-79 Bom engajamento</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-400" /> &lt;60 Sólido</span>
        </div>
        <div className="flex flex-wrap gap-3 mt-1.5 text-[10px] text-muted-foreground">
          <span><strong>5 dimensões:</strong></span>
          <span>Hook Power</span>
          <span>Controvérsia</span>
          <span>Compartilhabilidade</span>
          <span>Identificação</span>
          <span>Força dos Dados</span>
        </div>
      </div>
    );
  }

  const scores = withScore.map(i => i.virality_score!);
  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const max = Math.max(...scores);
  const min = Math.min(...scores);
  const viral80 = scores.filter(s => s >= 80).length;
  const good60 = scores.filter(s => s >= 60 && s < 80).length;

  // Aggregate breakdown if available
  const breakdownKeys = ['hook_power', 'hook_strength', 'controversy', 'controversy_level', 'shareability', 'relatability', 'data_strength'];
  const breakdownLabels: Record<string, string> = {
    hook_power: 'Hook Power', hook_strength: 'Hook Power',
    controversy: 'Controvérsia', controversy_level: 'Controvérsia',
    shareability: 'Compartilhabilidade', relatability: 'Identificação', data_strength: 'Dados',
  };
  const breakdownAgg: Record<string, { sum: number; count: number }> = {};
  for (const item of withScore) {
    const bd = (item.metadata as any)?.virality_breakdown;
    if (bd && typeof bd === 'object') {
      for (const key of Object.keys(bd)) {
        const label = breakdownLabels[key] || key;
        if (!breakdownAgg[label]) breakdownAgg[label] = { sum: 0, count: 0 };
        breakdownAgg[label].sum += Number(bd[key]) || 0;
        breakdownAgg[label].count++;
      }
    }
  }

  return (
    <div className="rounded-lg border border-purple-200 bg-gradient-to-r from-purple-50/50 to-white p-3">
      <div className="flex items-center gap-2 mb-2">
        <Zap className="w-4 h-4 text-purple-600" />
        <span className="text-xs font-semibold text-purple-700">Score de Viralidade</span>
        <span className="text-[10px] text-muted-foreground">({withScore.length} de {items.length} com score)</span>
      </div>
      <div className="flex flex-wrap gap-4 mb-2">
        <div className="text-center">
          <div className={`text-xl font-bold ${avg >= 80 ? 'text-red-600' : avg >= 60 ? 'text-orange-600' : 'text-gray-600'}`}>{avg}</div>
          <div className="text-[10px] text-muted-foreground">Média</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-green-600">{max}</div>
          <div className="text-[10px] text-muted-foreground">Máximo</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-gray-500">{min}</div>
          <div className="text-[10px] text-muted-foreground">Mínimo</div>
        </div>
        {viral80 > 0 && (
          <div className="text-center">
            <div className="text-xl font-bold text-red-600">{viral80}</div>
            <div className="text-[10px] text-muted-foreground">80+ Viral</div>
          </div>
        )}
        {good60 > 0 && (
          <div className="text-center">
            <div className="text-xl font-bold text-orange-600">{good60}</div>
            <div className="text-[10px] text-muted-foreground">60-79 Bom</div>
          </div>
        )}
      </div>
      {Object.keys(breakdownAgg).length > 0 && (
        <div className="flex flex-wrap gap-3 pt-2 border-t border-purple-100">
          {Object.entries(breakdownAgg).map(([label, { sum, count }]) => {
            const dimAvg = Math.round(sum / count);
            return (
              <div key={label} className="flex items-center gap-1.5">
                <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${dimAvg >= 80 ? 'bg-red-400' : dimAvg >= 60 ? 'bg-orange-400' : 'bg-gray-400'}`} style={{ width: `${dimAvg}%` }} />
                </div>
                <span className="text-[10px] text-muted-foreground">{label} <strong>{dimAvg}</strong></span>
              </div>
            );
          })}
        </div>
      )}
      <div className="flex flex-wrap gap-3 mt-2 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400" /> 80+ Altamente viral</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400" /> 60-79 Bom engajamento</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-400" /> &lt;60 Sólido</span>
      </div>
    </div>
  );
}

function ScriptsTab() {
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const { data: rawScripts = [], isLoading, refetch } = useContentScripts();
  const updateScript = useUpdateScript();
  const generateSocialPosts = useGenerateSocialPosts();

  const scripts = sortOrder === 'oldest'
    ? [...rawScripts].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    : rawScripts;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">{scripts.length} roteiro(s)</p>
          <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as 'newest' | 'oldest')}>
            <SelectTrigger className="w-40">
              <ArrowUpDown className="w-3 h-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Mais recentes</SelectItem>
              <SelectItem value="oldest">Mais antigos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <TabHelp tab="scripts" />
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-1" /> Atualizar
          </Button>
        </div>
      </div>

      {/* Virality legend */}
      {!isLoading && scripts.length > 0 && (
        <ViralityLegend items={scripts} type="scripts" />
      )}

      {isLoading && (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
        </div>
      )}

      {!isLoading && scripts.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Nenhum roteiro ainda.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Gere roteiros a partir das ideias na aba "Ideias".
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {scripts.map((script) => (
          <ScriptCard
            key={script.id}
            script={script}
            onStatusChange={(status) => updateScript.mutate({ id: script.id, status })}
            onGeneratePosts={(scriptId) => generateSocialPosts.mutate({ script_id: scriptId })}
            isGeneratingPosts={generateSocialPosts.isPending}
            generatingScriptId={(generateSocialPosts.variables as any)?.script_id}
          />
        ))}
      </div>
    </div>
  );
}

function ScriptCard({ script, onStatusChange, onGeneratePosts, isGeneratingPosts, generatingScriptId }: {
  script: ContentScript;
  onStatusChange: (status: string) => void;
  onGeneratePosts?: (scriptId: string) => void;
  isGeneratingPosts?: boolean;
  generatingScriptId?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyText = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const pub = (script.metadata as any)?.publishing as {
    youtube_title?: string; description?: string; hashtags?: string[]; thumbnail_ideas?: { text_overlay: string; visual_description: string; style: string }[];
  } | null;

  const copyFullScript = () => {
    const parts = [
      `# ${script.title}`,
      `\n## HOOK\n${script.hook}`,
      ...script.body_sections.map((s) =>
        `\n## ${s.heading}\n${s.content}${s.data_callout ? `\n[DADO: ${s.data_callout}]` : ''}${s.camera_note ? `\n[CÂMERA: ${s.camera_note}]` : ''}`
      ),
      script.cta ? `\n## CTA\n${script.cta}` : '',
      pub?.youtube_title ? `\n---\n## PUBLICAÇÃO\n**Título YouTube:** ${pub.youtube_title}` : '',
      pub?.description ? `**Descrição:**\n${pub.description}` : '',
      pub?.hashtags?.length ? `**Hashtags:** ${pub.hashtags.join(' ')}` : '',
      pub?.thumbnail_ideas?.length ? `**Thumbnails:**\n${pub.thumbnail_ideas.map((t, i) => `${i + 1}. [${t.style}] "${t.text_overlay}" — ${t.visual_description}`).join('\n')}` : '',
    ].filter(Boolean).join('\n');
    copyText(parts, 'full');
  };

  const durationLabel = script.duration_estimate_seconds
    ? script.duration_estimate_seconds >= 60
      ? `${Math.floor(script.duration_estimate_seconds / 60)}min${script.duration_estimate_seconds % 60 > 0 ? ` ${script.duration_estimate_seconds % 60}s` : ''}`
      : `${script.duration_estimate_seconds}s`
    : null;

  return (
    <Card>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <h3 className="text-sm font-semibold">{script.title}</h3>
              <Badge variant="outline" className={CONTENT_TYPE_COLORS[script.platform] || ''}>
                {script.platform}
              </Badge>
              <Badge variant="outline">{script.tone}</Badge>
              {durationLabel && (
                <Badge variant="outline" className="bg-gray-50">
                  <Clock className="w-3 h-3 mr-0.5" />
                  {durationLabel}
                </Badge>
              )}
              {script.virality_score != null && (
                <Badge variant="outline" className={viralityBadgeClass(script.virality_score)}>
                  <Zap className="w-3 h-3 mr-0.5" />
                  Viral: {script.virality_score}
                </Badge>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground">{formatCreatedAt(script.created_at)}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Select value={script.status} onValueChange={onStatusChange}>
              <SelectTrigger className="h-7 w-28 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="approved">Aprovado</SelectItem>
                <SelectItem value="recorded">Gravado</SelectItem>
              </SelectContent>
            </Select>
            {onGeneratePosts && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1"
                onClick={() => onGeneratePosts(script.id)}
                disabled={isGeneratingPosts && generatingScriptId === script.id}
              >
                {isGeneratingPosts && generatingScriptId === script.id
                  ? <Loader2 className="w-3 h-3 animate-spin" />
                  : <Share2 className="w-3 h-3" />}
                Gerar Posts
              </Button>
            )}
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={copyFullScript}>
              {copiedField === 'full' ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
              Copiar Tudo
            </Button>
          </div>
        </div>

        {/* Hook (always visible) */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-3 mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-purple-700">HOOK</span>
            <button
              className="text-xs text-purple-500 hover:text-purple-700"
              onClick={() => copyText(script.hook, 'hook')}
            >
              {copiedField === 'hook' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
          <p className="text-sm font-medium">{script.hook}</p>
        </div>

        {/* Body sections (collapsible) */}
        <Collapsible open={expanded} onOpenChange={setExpanded}>
          <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-2">
            {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            {script.body_sections.length} seções
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="space-y-3">
              {script.body_sections.map((section, i) => (
                <div key={i} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase">{section.heading}</h4>
                    <button
                      className="text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => copyText(section.content, `section-${i}`)}
                    >
                      {copiedField === `section-${i}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <p className="text-sm whitespace-pre-line">{section.content}</p>
                  {section.data_callout && (
                    <div className="mt-2 px-2 py-1 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                      <Target className="w-3 h-3 inline mr-1" />
                      {section.data_callout}
                    </div>
                  )}
                  {section.camera_note && (
                    <div className="mt-1 px-2 py-1 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
                      <Eye className="w-3 h-3 inline mr-1" />
                      {section.camera_note}
                    </div>
                  )}
                </div>
              ))}

              {/* CTA */}
              {script.cta && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <span className="text-xs font-medium text-green-700 block mb-1">CTA</span>
                  <p className="text-sm">{script.cta}</p>
                </div>
              )}

              {/* Virality breakdown */}
              {(script.metadata as any)?.virality_breakdown && (
                <div className="bg-red-50/50 border border-red-200 rounded-lg p-3">
                  <span className="text-xs font-medium text-red-700 block mb-2">
                    <Zap className="w-3 h-3 inline mr-1" />
                    ANÁLISE DE VIRALIDADE
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-2">
                    {Object.entries((script.metadata as any).virality_breakdown as Record<string, number>).map(([key, val]) => (
                      <div key={key} className="text-center">
                        <div className="text-lg font-bold text-red-700">{val}</div>
                        <div className="text-[10px] text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</div>
                      </div>
                    ))}
                  </div>
                  {(script.metadata as any)?.virality_techniques_used?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {((script.metadata as any).virality_techniques_used as string[]).map((t: string) => (
                        <Badge key={t} variant="outline" className="text-[10px] bg-red-50 border-red-200">
                          {t.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {(script.metadata as any)?.predicted_top_comments?.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-medium text-muted-foreground">Comentários previstos:</span>
                      {((script.metadata as any).predicted_top_comments as string[]).map((c: string, i: number) => (
                        <p key={i} className="text-xs text-muted-foreground italic">"{c}"</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Publishing metadata */}
              {pub && (
                <div className="bg-blue-50/50 border border-blue-200 rounded-lg p-3 space-y-3">
                  <span className="text-xs font-medium text-blue-700 block">
                    <Youtube className="w-3 h-3 inline mr-1" />
                    PUBLICAÇÃO
                  </span>

                  {pub.youtube_title && (
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[10px] font-medium text-muted-foreground">Título YouTube/Instagram</span>
                        <button
                          className="text-xs text-blue-500 hover:text-blue-700"
                          onClick={() => copyText(pub.youtube_title!, 'yt-title')}
                        >
                          {copiedField === 'yt-title' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                      <p className="text-sm font-medium">{pub.youtube_title}</p>
                    </div>
                  )}

                  {pub.description && (
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[10px] font-medium text-muted-foreground">Descrição</span>
                        <button
                          className="text-xs text-blue-500 hover:text-blue-700"
                          onClick={() => copyText(pub.description!, 'desc')}
                        >
                          {copiedField === 'desc' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                      <p className="text-xs whitespace-pre-line text-muted-foreground">{pub.description}</p>
                    </div>
                  )}

                  {pub.hashtags && pub.hashtags.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-medium text-muted-foreground">
                          <Hash className="w-3 h-3 inline mr-0.5" />
                          Hashtags
                        </span>
                        <button
                          className="text-xs text-blue-500 hover:text-blue-700"
                          onClick={() => copyText(pub.hashtags!.join(' '), 'hashtags')}
                        >
                          {copiedField === 'hashtags' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {pub.hashtags.map((h) => (
                          <Badge key={h} variant="outline" className="text-[10px] bg-blue-50 border-blue-200">
                            {h}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {pub.thumbnail_ideas && pub.thumbnail_ideas.length > 0 && (
                    <div>
                      <span className="text-[10px] font-medium text-muted-foreground block mb-1">
                        <Image className="w-3 h-3 inline mr-0.5" />
                        Ideias de Thumbnail
                      </span>
                      <div className="space-y-2">
                        {pub.thumbnail_ideas.map((thumb, i) => (
                          <div key={i} className="bg-white border rounded p-2">
                            <div className="flex items-center gap-1.5 mb-1">
                              <Badge variant="outline" className="text-[10px]">
                                {thumb.style}
                              </Badge>
                              <span className="text-xs font-bold uppercase">{thumb.text_overlay}</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground">{thumb.visual_description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}

// ── Social Posts Tab ─────────────────────────────────────────────────────

const SOCIAL_PLATFORM_COLORS: Record<string, string> = {
  linkedin: 'bg-blue-100 text-blue-700 border-blue-200',
  x: 'bg-gray-900 text-white border-gray-700',
};

const SOCIAL_PLATFORM_LABELS: Record<string, string> = {
  linkedin: 'LinkedIn',
  x: 'X (Twitter)',
};

const SOCIAL_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  review: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  published: 'bg-emerald-100 text-emerald-700',
};

function SocialPostsTab() {
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const { data: rawPosts = [], isLoading, refetch } = useContentSocialPosts();
  const { data: scripts = [] } = useContentScripts();
  const updatePost = useUpdateSocialPost();
  const deletePost = useDeleteSocialPost();

  const posts = platformFilter === 'all'
    ? rawPosts
    : rawPosts.filter((p) => p.platform === platformFilter);

  const getScriptTitle = (scriptId: string) =>
    scripts.find((s) => s.id === scriptId)?.title || 'Roteiro';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">{posts.length} post(s)</p>
          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
              <SelectItem value="x">X (Twitter)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <TabHelp tab="social" />
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-1" /> Atualizar
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
        </div>
      )}

      {!isLoading && posts.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Share2 className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Nenhum post social ainda.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Gere posts a partir de um roteiro na aba "Roteiros" clicando em "Posts".
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {posts.map((post) => (
          <SocialPostCard
            key={post.id}
            post={post}
            scriptTitle={getScriptTitle(post.script_id)}
            onStatusChange={(status) => updatePost.mutate({ id: post.id, status })}
            onDelete={() => deletePost.mutate(post.id)}
          />
        ))}
      </div>
    </div>
  );
}

function SocialPostCard({ post, scriptTitle, onStatusChange, onDelete }: {
  post: ContentSocialPost;
  scriptTitle: string;
  onStatusChange: (status: string) => void;
  onDelete: () => void;
}) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyText = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const copyFull = () => {
    const parts = [
      post.content,
      post.hashtags.length > 0 ? `\n${post.hashtags.join(' ')}` : '',
    ].filter(Boolean).join('');
    copyText(parts, 'full');
  };

  const charCount = post.content.length;
  const isOverLimit = post.platform === 'x' && charCount > 280;
  const meta = post.metadata as Record<string, any> | null;
  const alternativeHooks = meta?.alternative_hooks as string[] | undefined;

  return (
    <Card>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <Badge variant="outline" className={SOCIAL_PLATFORM_COLORS[post.platform] || ''}>
                {post.platform === 'linkedin' ? <Linkedin className="w-3 h-3 mr-0.5" /> : null}
                {SOCIAL_PLATFORM_LABELS[post.platform] || post.platform}
              </Badge>
              <Badge variant="outline">{post.tone}</Badge>
              <Badge variant="outline" className={isOverLimit ? 'bg-red-50 text-red-700 border-red-200' : 'bg-gray-50'}>
                {charCount} chars{isOverLimit ? ' (excede 280!)' : ''}
              </Badge>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Roteiro: {scriptTitle} · {formatCreatedAt(post.created_at)}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Select value={post.status} onValueChange={onStatusChange}>
              <SelectTrigger className="h-7 w-28 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="approved">Aprovado</SelectItem>
                <SelectItem value="published">Publicado</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={copyFull}>
              {copiedField === 'full' ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
              Copiar
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs text-red-500 hover:text-red-700" onClick={onDelete}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className={`rounded-lg p-3 mb-3 ${
          post.platform === 'linkedin'
            ? 'bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-200'
            : 'bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200'
        }`}>
          <p className="text-sm whitespace-pre-line">{post.content}</p>
        </div>

        {/* Hashtags */}
        {post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {post.hashtags.map((tag, i) => (
              <Badge key={i} variant="outline" className="text-[10px] bg-gray-50">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* CTA */}
        {post.cta && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-2 mb-3">
            <span className="text-[10px] font-medium text-green-700 block mb-0.5">CTA</span>
            <p className="text-xs">{post.cta}</p>
          </div>
        )}

        {/* Alternative hooks (collapsible) */}
        {alternativeHooks && alternativeHooks.length > 0 && (
          <Collapsible>
            <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-2">
              <ChevronRight className="w-3 h-3" />
              {alternativeHooks.length} hook(s) alternativo(s)
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-1.5">
                {alternativeHooks.map((hook, i) => (
                  <div key={i} className="flex items-start gap-2 bg-muted rounded p-2">
                    <span className="text-[10px] text-muted-foreground shrink-0">#{i + 1}</span>
                    <p className="text-xs flex-1">{hook}</p>
                    <button
                      className="text-xs text-muted-foreground hover:text-foreground shrink-0"
                      onClick={() => copyText(hook, `hook-${i}`)}
                    >
                      {copiedField === `hook-${i}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Engagement tips */}
        {meta?.engagement_tips && (
          <p className="text-[10px] text-muted-foreground mt-2">
            <Target className="w-3 h-3 inline mr-0.5" />
            {meta.engagement_tips}
            {meta.best_posting_time ? ` · Melhor horário: ${meta.best_posting_time}` : ''}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ── Calendar Tab ─────────────────────────────────────────────────────────

function CalendarTab() {
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <TabHelp tab="calendar" />
      </div>
      <ContentCalendar />
    </div>
  );
}

// ── Prompts Tab ──────────────────────────────────────────────────────────

function PromptsTab() {
  const { data: prompts = {}, isLoading } = useContentPrompts();
  const { data: availableApis = [] } = useAvailableApis();
  const savePrompt = useSavePrompt();
  const updateCronSchedule = useUpdateCronSchedule();
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showDocs, setShowDocs] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);

  const handleEdit = (key: string) => {
    setEditingKey(key);
    setEditValue(prompts[key] || '');
  };

  const handleSave = () => {
    if (editingKey) {
      savePrompt.mutate({ key: editingKey, value: editValue });
      setEditingKey(null);
    }
  };

  const handleApiChange = (configKey: string, apiKey: string) => {
    savePrompt.mutate({ key: configKey, value: apiKey });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Configure qual API/LLM usar para cada etapa e edite os prompts. Mudanças aplicadas imediatamente.
        </p>
        <div className="flex items-center gap-2">
          <TabHelp tab="prompts" />
          <Button size="sm" variant="outline" onClick={() => setShowDocs(true)}>
            <BookOpen className="w-3.5 h-3.5 mr-1" />
            Documentação
          </Button>
          <a
            href="/admin/configuracoes-apis"
            className="text-xs text-purple-600 hover:underline whitespace-nowrap"
          >
            Gerenciar APIs
          </a>
        </div>
      </div>

      {/* Pipeline Config Card */}
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50/50 to-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Timer className="w-4 h-4 text-purple-600" />
            Configurações do Pipeline Automático
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Defina a frequência de execução automática e o comportamento do pipeline.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Schedule */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium flex items-center gap-1">
                <Clock className="w-3 h-3" /> Frequência
              </label>
              <Select
                value={prompts['content_studio_cron_schedule'] || '0 8 * * 1'}
                onValueChange={(v) => {
                  updateCronSchedule.mutate(v);
                }}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCHEDULE_PRESETS.map((p) => (
                    <SelectItem key={p.cron} value={p.cron}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Pipeline Mode */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium flex items-center gap-1">
                <Zap className="w-3 h-3" /> Modo
              </label>
              <Select
                value={prompts['content_studio_pipeline_mode'] || 'full_pipeline'}
                onValueChange={(v) => {
                  savePrompt.mutate({ key: 'content_studio_pipeline_mode', value: v });
                }}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="insights_only">Apenas Insights</SelectItem>
                  <SelectItem value="full_pipeline">Pipeline Completo (Insights → Ideias → Roteiros)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Auto counts — only visible in full_pipeline mode */}
          {(prompts['content_studio_pipeline_mode'] || 'full_pipeline') === 'full_pipeline' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Top Insights → Ideias</label>
                <p className="text-[10px] text-muted-foreground">
                  Quantos dos melhores insights alimentam a geração de ideias (1-10)
                </p>
                <Select
                  value={prompts['content_studio_auto_ideas_count'] || '5'}
                  onValueChange={(v) => {
                    savePrompt.mutate({ key: 'content_studio_auto_ideas_count', value: v });
                  }}
                >
                  <SelectTrigger className="h-8 text-xs w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                      <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">Top Ideias → Roteiros</label>
                <p className="text-[10px] text-muted-foreground">
                  Quantas das melhores ideias geram roteiros automaticamente (1-5)
                </p>
                <Select
                  value={prompts['content_studio_auto_scripts_count'] || '3'}
                  onValueChange={(v) => {
                    savePrompt.mutate({ key: 'content_studio_auto_scripts_count', value: v });
                  }}
                >
                  <SelectTrigger className="h-8 text-xs w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 5 }, (_, i) => i + 1).map((n) => (
                      <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Manual trigger */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div>
              <p className="text-xs font-medium">Execução manual</p>
              <p className="text-[10px] text-muted-foreground">
                Abre o wizard interativo com aprovação em cada etapa
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setWizardOpen(true)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Play className="w-3.5 h-3.5 mr-1" />
              Executar Pipeline
            </Button>
          </div>
        </CardContent>
      </Card>

      {PROMPT_KEYS.map(({ key, apiKey: apiConfigKey, label, description, apiHint }) => {
        const currentApiKey = prompts[apiConfigKey] || 'openai_api';
        const currentApi = availableApis.find((a) => a.api_key === currentApiKey);
        return (
          <Card key={key}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm">{label}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleEdit(key)}>
                  Editar Prompt
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* API selector inline */}
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                <span className="text-xs font-medium text-muted-foreground shrink-0">LLM:</span>
                <Select value={currentApiKey} onValueChange={(v) => handleApiChange(apiConfigKey, v)}>
                  <SelectTrigger className="h-8 text-xs w-56">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableApis.map((api) => (
                      <SelectItem key={api.api_key} value={api.api_key}>
                        <span className="flex items-center gap-2">
                          {api.name}
                          {!api.is_active && (
                            <span className="text-xs text-red-500">(inativa)</span>
                          )}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {currentApi && !currentApi.is_active && (
                  <span className="text-xs text-red-600 font-medium">Inativa!</span>
                )}
                <span className="text-xs text-muted-foreground italic hidden lg:inline">{apiHint}</span>
              </div>
              <pre className="text-xs bg-muted rounded p-3 overflow-auto max-h-32 whitespace-pre-wrap">
                {prompts[key]
                  ? prompts[key].slice(0, 500) + (prompts[key].length > 500 ? '...' : '')
                  : '(vazio — usando prompt padrão)'}
              </pre>
            </CardContent>
          </Card>
        );
      })}

      {/* Edit dialog */}
      <Dialog open={!!editingKey} onOpenChange={(open) => !open && setEditingKey(null)}>
        <DialogContent className="sm:max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              Editar {PROMPT_KEYS.find((p) => p.key === editingKey)?.label}
            </DialogTitle>
          </DialogHeader>
          <Textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            rows={20}
            className="font-mono text-xs"
          />
          <div className="text-xs text-muted-foreground">
            {editValue.length} caracteres
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingKey(null)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={savePrompt.isPending}>
              {savePrompt.isPending && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Documentation Sheet */}
      <Sheet open={showDocs} onOpenChange={setShowDocs}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Documentação dos Prompts
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-8">
            {/* Overview */}
            <div className="rounded-lg bg-purple-50 border border-purple-200 p-4 space-y-2">
              <h3 className="text-sm font-semibold text-purple-900">Como funciona o pipeline</h3>
              <div className="flex items-center gap-2 text-xs text-purple-700">
                <div className="flex items-center gap-1 bg-white rounded px-2 py-1 border border-purple-200">
                  <Database className="w-3 h-3" />
                  <span>6 tabelas</span>
                </div>
                <ArrowRight className="w-3 h-3" />
                <div className="flex items-center gap-1 bg-white rounded px-2 py-1 border border-purple-200">
                  <Lightbulb className="w-3 h-3" />
                  <span>Insights</span>
                </div>
                <ArrowRight className="w-3 h-3" />
                <div className="flex items-center gap-1 bg-white rounded px-2 py-1 border border-purple-200">
                  <Sparkles className="w-3 h-3" />
                  <span>Ideias + Hooks</span>
                </div>
                <ArrowRight className="w-3 h-3" />
                <div className="flex items-center gap-1 bg-white rounded px-2 py-1 border border-purple-200">
                  <FileText className="w-3 h-3" />
                  <span>Roteiro</span>
                </div>
              </div>
              <p className="text-xs text-purple-700">
                Cada etapa usa seu próprio prompt (editável aqui) e sua própria API/LLM.
                O prompt é enviado como <code className="bg-purple-100 px-1 rounded">system message</code>;
                os dados são injetados automaticamente como <code className="bg-purple-100 px-1 rounded">user message</code> em JSON.
              </p>
              <p className="text-xs text-purple-700">
                Se o prompt estiver vazio, a Edge Function usa um prompt padrão embutido no código.
              </p>
            </div>

            {/* Prompt 1: Insights */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center">
                  <Lightbulb className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Prompt de Insights</h3>
                  <p className="text-xs text-muted-foreground">generate-content-insights</p>
                </div>
              </div>

              <div className="space-y-2 pl-9">
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Propósito</h4>
                  <p className="text-sm">
                    Analisa dados agregados da plataforma para identificar padrões que renderiam conteúdo viral
                    para YouTube/Instagram. Gera 5-10 insights com scores de relevância e controvérsia.
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dados analisados (6 blocos)</h4>
                  <div className="space-y-1.5 mt-1">
                    {[
                      { name: 'lead_profiles_and_barriers', table: 'career_evaluations', desc: 'Percentuais por barreira (inglês, visto, financeiro, família, tempo, clareza, experiência), temperatura do lead, áreas profissionais, objetivos' },
                      { name: 'hot_community_topics', table: 'community_posts', desc: 'Top 20 posts por engajamento (likes + comentários), título, prévia do conteúdo' },
                      { name: 'job_market', table: 'jobs', desc: 'Total de vagas, % Brazil-friendly, % remote, salário médio USD, categorias, tech stacks, exemplos' },
                      { name: 'subscription_churn', table: 'subscription_cancellation_surveys', desc: 'Distribuição de motivos de cancelamento + até 10 feedbacks literais' },
                      { name: 'course_dropoffs', table: 'course_progress + course_lessons', desc: 'Aulas com menor taxa de conclusão (min. 3 alunos), % watch médio' },
                      { name: 'title_translations', table: 'title_translations', desc: 'Títulos BR→US mais buscados, top 10 por frequência, exemplos de tradução' },
                    ].map((block) => (
                      <div key={block.name} className="rounded border bg-muted/50 p-2">
                        <div className="flex items-center gap-1.5">
                          <code className="text-xs font-semibold text-purple-700">{block.name}</code>
                          <span className="text-[10px] text-muted-foreground">({block.table})</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{block.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tipos de insight gerados</h4>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {Object.entries(INSIGHT_TYPE_CONFIG).map(([type, cfg]) => (
                      <Badge key={type} variant="outline" className={cfg.color}>
                        {cfg.label}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pré-requisitos</h4>
                  <ul className="text-xs text-muted-foreground space-y-0.5 mt-1 list-disc pl-4">
                    <li>Dados nas tabelas consultadas (período configurável, padrão 7 dias)</li>
                    <li>API/LLM ativa configurada nesta aba</li>
                    <li>Blocos sem dados no período são enviados como <code className="bg-muted px-1 rounded">null</code></li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Execução automática</h4>
                  <p className="text-xs text-muted-foreground">
                    Executado automaticamente como primeira etapa do pipeline (frequência configurável acima).
                    Também pode ser executado manualmente pela aba Insights ou pelo botão "Executar Pipeline".
                  </p>
                </div>
              </div>
            </div>

            <hr className="border-border" />

            {/* Prompt 2: Ideas */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-violet-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Prompt de Ideias</h3>
                  <p className="text-xs text-muted-foreground">generate-content-ideas</p>
                </div>
              </div>

              <div className="space-y-2 pl-9">
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Propósito</h4>
                  <p className="text-sm">
                    Transforma insights selecionados (ou um tópico livre) em ideias de conteúdo concretas,
                    cada uma com 3-5 variações de hook em estilos diferentes (pergunta, afirmação, dado, provocação).
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dados recebidos pelo LLM</h4>
                  <div className="space-y-1.5 mt-1">
                    <div className="rounded border bg-muted/50 p-2">
                      <p className="text-xs"><strong>Via insights:</strong> tipo, título, resumo, data_points, scores de relevância/controvérsia de cada insight selecionado</p>
                    </div>
                    <div className="rounded border bg-muted/50 p-2">
                      <p className="text-xs"><strong>Via texto livre:</strong> o tópico digitado pelo admin + contagem de ideias desejada</p>
                    </div>
                    <div className="rounded border bg-muted/50 p-2">
                      <p className="text-xs"><strong>Opcionais:</strong> tipo de conteúdo preferido (vertical/YouTube/stories/carrossel), quantidade (máx 10)</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Categorias de conteúdo</h4>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
                      <Badge key={cat} variant="outline" className={color}>
                        {cat.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estilos de hook</h4>
                  <div className="grid grid-cols-2 gap-1.5 mt-1">
                    {[
                      { style: 'question', desc: 'Pergunta provocativa', ex: '"Você sabia que 72% dos brasileiros nos EUA..."' },
                      { style: 'claim', desc: 'Afirmação ousada', ex: '"Fluência em inglês NÃO é o que vai te levar pros EUA"' },
                      { style: 'data', desc: 'Número surpreendente', ex: '"Analisei 500 perfis e descobri que..."' },
                      { style: 'provocation', desc: 'Intencionalmente controverso', ex: '"Para de estudar inglês se você quer ir pros EUA"' },
                    ].map((h) => (
                      <div key={h.style} className="rounded border bg-muted/50 p-2">
                        <code className="text-[10px] font-semibold text-violet-700">{h.style}</code>
                        <p className="text-[10px] text-muted-foreground">{h.desc}</p>
                        <p className="text-[10px] italic mt-0.5">{h.ex}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pré-requisitos</h4>
                  <ul className="text-xs text-muted-foreground space-y-0.5 mt-1 list-disc pl-4">
                    <li>Insights gerados (para o fluxo via insights) OU texto livre</li>
                    <li>API/LLM ativa configurada nesta aba</li>
                    <li>Insights usados são marcados com status "used" automaticamente</li>
                  </ul>
                </div>
              </div>
            </div>

            <hr className="border-border" />

            {/* Prompt 3: Scripts */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Prompt de Roteiros</h3>
                  <p className="text-xs text-muted-foreground">generate-content-script</p>
                </div>
              </div>

              <div className="space-y-2 pl-9">
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Propósito</h4>
                  <p className="text-sm">
                    Gera roteiros completos de vídeo a partir de uma ideia aprovada, com hook, seções do corpo,
                    notas de câmera/produção e CTA. Adapta estrutura e duração à plataforma-alvo.
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dados recebidos pelo LLM</h4>
                  <div className="space-y-1.5 mt-1">
                    <div className="rounded border bg-muted/50 p-2">
                      <p className="text-xs"><strong>Ideia:</strong> título, descrição, tipo de conteúdo, categoria, hooks gerados, público-alvo, data points</p>
                    </div>
                    <div className="rounded border bg-muted/50 p-2">
                      <p className="text-xs"><strong>Insight vinculado (se houver):</strong> tipo, título, resumo, data_points, fontes</p>
                    </div>
                    <div className="rounded border bg-muted/50 p-2">
                      <p className="text-xs"><strong>Plataforma:</strong> formato detectado automaticamente ou overridden manualmente + duração-alvo</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estrutura por plataforma</h4>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div className="rounded border bg-muted/50 p-2">
                      <div className="flex items-center gap-1 mb-1">
                        <Video className="w-3 h-3 text-indigo-500" />
                        <span className="text-xs font-semibold">Vertical (30-60s)</span>
                      </div>
                      <ol className="text-[10px] text-muted-foreground space-y-0.5 list-decimal pl-3">
                        <li>Hook (3s)</li>
                        <li>Problema (10s)</li>
                        <li>Dado/Insight (15s)</li>
                        <li>Takeaway (10s)</li>
                        <li>CTA (5s)</li>
                      </ol>
                    </div>
                    <div className="rounded border bg-muted/50 p-2">
                      <div className="flex items-center gap-1 mb-1">
                        <Video className="w-3 h-3 text-red-500" />
                        <span className="text-xs font-semibold">YouTube (8-15min)</span>
                      </div>
                      <ol className="text-[10px] text-muted-foreground space-y-0.5 list-decimal pl-3">
                        <li>Hook (15s)</li>
                        <li>Contexto (2min)</li>
                        <li>Deep-dive com dados (3-4min)</li>
                        <li>Framework/Solução (3min)</li>
                        <li>Exemplo/Case (2min)</li>
                        <li>CTA (30s)</li>
                      </ol>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Saída gerada</h4>
                  <ul className="text-xs text-muted-foreground space-y-0.5 mt-1 list-disc pl-4">
                    <li><strong>hook:</strong> texto exato dos primeiros 3-15 segundos</li>
                    <li><strong>body_sections:</strong> seções com texto, destaque de dado e nota de câmera</li>
                    <li><strong>cta:</strong> chamada para ação final</li>
                    <li><strong>tone:</strong> instructional, polemic, storytelling ou data_journalism</li>
                    <li><strong>duration_estimate_seconds:</strong> duração estimada do roteiro</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pré-requisitos</h4>
                  <ul className="text-xs text-muted-foreground space-y-0.5 mt-1 list-disc pl-4">
                    <li>Uma ideia existente (gerada na etapa anterior)</li>
                    <li>API/LLM ativa configurada nesta aba</li>
                    <li>Vídeos longos (YouTube) usam até 6000 tokens; verticais usam até 3000</li>
                  </ul>
                </div>
              </div>
            </div>

            <hr className="border-border" />

            {/* Pipeline Automation */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center">
                  <Timer className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Pipeline Automático</h3>
                  <p className="text-xs text-muted-foreground">run-content-pipeline</p>
                </div>
              </div>

              <div className="space-y-2 pl-9">
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Propósito</h4>
                  <p className="text-sm">
                    Orquestra as 3 etapas sequencialmente de forma automática: gera insights, seleciona os melhores,
                    gera ideias, seleciona as melhores, e gera roteiros — tudo em uma única execução.
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fluxo de execução</h4>
                  <div className="space-y-1.5 mt-1">
                    <div className="rounded border bg-muted/50 p-2">
                      <p className="text-xs"><strong>1. Insights:</strong> Gera insights dos últimos N dias (padrão 7)</p>
                    </div>
                    <div className="rounded border bg-muted/50 p-2">
                      <p className="text-xs"><strong>2. Ideias:</strong> Seleciona os top N insights (por score combinado: 40% relevância + 60% controvérsia) e gera ideias</p>
                    </div>
                    <div className="rounded border bg-muted/50 p-2">
                      <p className="text-xs"><strong>3. Roteiros:</strong> Seleciona as top N ideias (por virality_score) e gera roteiro para cada uma</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Configurações</h4>
                  <ul className="text-xs text-muted-foreground space-y-0.5 mt-1 list-disc pl-4">
                    <li><strong>Frequência:</strong> 5 presets de cron (semanal, 2x/sem, 3x/sem, diário, quinzenal)</li>
                    <li><strong>Modo:</strong> "Apenas Insights" (só etapa 1) ou "Pipeline Completo" (3 etapas)</li>
                    <li><strong>Top Insights → Ideias:</strong> quantos insights alimentam a geração de ideias (1-10)</li>
                    <li><strong>Top Ideias → Roteiros:</strong> quantas ideias geram roteiros (1-5)</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Resiliência</h4>
                  <ul className="text-xs text-muted-foreground space-y-0.5 mt-1 list-disc pl-4">
                    <li>Cada etapa pode falhar independentemente — o pipeline continua</li>
                    <li>Resultado e duração logados em <code className="bg-muted px-1 rounded">content_generation_logs</code> com tipo "pipeline"</li>
                    <li>Execução via cron ou manual (botão "Executar Pipeline")</li>
                  </ul>
                </div>
              </div>
            </div>

            <hr className="border-border" />

            {/* Tips */}
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 space-y-2">
              <h3 className="text-sm font-semibold text-amber-900 flex items-center gap-1.5">
                <Wand2 className="w-4 h-4" />
                Dicas para editar prompts
              </h3>
              <ul className="text-xs text-amber-800 space-y-1 list-disc pl-4">
                <li>Você <strong>não precisa</strong> descrever as tabelas do banco — os dados já chegam como JSON na mensagem do usuário</li>
                <li>Foque nas <strong>instruções</strong>: tom, formato de saída, tipos de insight, regras de negócio</li>
                <li>Se o campo estiver vazio, a Edge Function usa um prompt padrão embutido no código</li>
                <li>Mudanças são aplicadas <strong>imediatamente</strong> — não precisa de deploy</li>
                <li>Cada etapa pode usar um LLM diferente (ex: Perplexity para insights, GPT-4o para ideias, Claude para roteiros)</li>
                <li>Custos por chamada são rastreados em <a href="/admin/custos-api" className="underline font-medium">Custos API</a></li>
              </ul>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Pipeline Wizard */}
      <ContentPipelineWizard open={wizardOpen} onOpenChange={setWizardOpen} />
    </div>
  );
}
