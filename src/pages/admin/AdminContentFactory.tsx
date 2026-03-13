import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  Flame, Sparkles, Database, Loader2, Copy, Check,
  Trash2, ChevronDown, ChevronRight, Video, FileText,
  Image, MessageSquare, TrendingUp, TrendingDown, Zap, RefreshCw,
  Linkedin, Twitter, Youtube, Eye, Settings2, Save, Pencil, X, HelpCircle,
  Send, Link2, RotateCcw, Clock, Calendar, ChevronLeft,
  Search, Filter, ArrowUpDown, ExternalLink, CheckCircle2, MoreVertical, PlaySquare,
  Wand2, Target, Users2, ShoppingBag, LayoutTemplate, History,
} from 'lucide-react';
import {
  useTrendingTopics,
  useContentPieces,
  useFetchTrending,
  useClearTrendingCache,
  useGenerateContent,
  useUpdatePiece,
  useUpdatePieceStatus,
  useDeletePiece,
  useAvailableApis,
  useContentFactoryConfig,
  useSaveContentFactoryConfig,
  useEnabledProductShowcases,
  useProductShowcases,
  useSaveProductShowcase,
  useDeleteProductShowcase,
  type ContentPiece,
  type ProductShowcase,
  type TrendingTopic,
  type ContentFormat,
  type ContentTone,
  type GrowthFunction,
  type AudienceStage,
} from '@/hooks/useAdminContentFactory';
import { useContentAssets } from '@/hooks/useContentAssets';
import { AssetGeneratorSheet } from '@/components/content/AssetGeneratorSheet';
import { PublicationsTab } from '@/components/content/PublicationsTab';
import { SocialAccountsSettings } from '@/components/content/SocialAccountsSettings';
import { useToast } from '@/hooks/use-toast';
import { PieceEditModal } from '@/components/content/PieceEditModal';
import {
  useGenerateSocialPost,
  useSocialAccounts,
  useCreatePublication,
  useContentPublications,
  useCancelPublication,
  type GeneratedSocialPost,
} from '@/hooks/useContentPublishing';

// ── Constants ────────────────────────────────────────────────────────────

const FORMAT_OPTIONS: { value: ContentFormat; label: string; icon: typeof Video }[] = [
  { value: 'short', label: 'Short (Reels/TikTok)', icon: Video },
  { value: 'medium_video', label: 'YouTube Medio (8-15min)', icon: Youtube },
  { value: 'long_video', label: 'YouTube Longo (20-40min)', icon: Youtube },
  { value: 'carousel', label: 'Carrossel', icon: Image },
  { value: 'stories', label: 'Stories', icon: MessageSquare },
];

const TONE_OPTIONS: { value: ContentTone; label: string }[] = [
  { value: 'polemic', label: 'Polemico' },
  { value: 'educational', label: 'Educativo' },
  { value: 'storytelling', label: 'Storytelling' },
  { value: 'roast', label: 'Roast' },
  { value: 'data_story', label: 'Data Story' },
  { value: 'myth_busting', label: 'Myth Busting' },
];

const GROWTH_FUNCTION_OPTIONS: { value: string; label: string; description: string }[] = [
  { value: '', label: 'Auto', description: 'Deixar o modelo decidir' },
  { value: 'discovery', label: 'Discovery', description: 'Trazer gente nova (Shorts, dados chocantes)' },
  { value: 'conversion', label: 'Conversion', description: 'Transformar viewer em inscrito (frameworks)' },
  { value: 'retention', label: 'Retention', description: 'Fidelizar inscritos (deep dives)' },
];

const AUDIENCE_STAGE_OPTIONS: { value: string; label: string; description: string }[] = [
  { value: '', label: 'Auto', description: 'Deixar o modelo decidir' },
  { value: 'cold', label: 'Cold', description: 'Nunca viu o Daniel' },
  { value: 'warm', label: 'Warm', description: 'Ja viu 1-2 videos' },
  { value: 'hot', label: 'Hot', description: 'Inscrito engajado' },
];

const DEFAULT_SOCIAL_PROMPT = `Você é o estrategista de redes sociais do Daniel Kielusa (@eua_na_pratica).

Sua função: receber um roteiro de conteúdo já pronto e transformar em um post que PARA O SCROLL na plataforma indicada.

═══ PERSONA DO DANIEL ═══

Daniel é direto, sem filtro, storyteller com dados. Estilo Alex Hormozi da imigração qualificada.
Voz: Direta, sem filtro. Frases curtas, parágrafos de 1-2 linhas. Sempre "você" (informal).
Bordão: "A porta tá aberta — mas não pra quem fica parado." (Use só quando encaixar naturalmente.)

Crenças:
• "É mentira quem disse que precisa trabalhar de subemprego nos EUA."
• "Não é difícil como imaginam — desde que venha com estratégia."
• "As portas da imigração fechando pra alguns? Abrem pra quem é qualificado."

Vilões narrativos: Vendedores de sonho, mentalidade CLT, coaches que nunca moraram fora.

═══ COMO EXTRAIR DO ROTEIRO ═══

1. LEIA O ROTEIRO INTEIRO. Não pare no hook.
2. IDENTIFIQUE O PONTO NUCLEAR — qual é o argumento central que geraria debate?
3. ENCONTRE O DADO MAIS FORTE — o número/estatística que obriga a parar o scroll.
4. DETECTE A TENSÃO — qual é o "contra quem" ou "contra o quê"?
5. EXTRAIA CASES — nomes, números, resultados concretos.

NÃO RESUMA O ROTEIRO. Destile a essência viral. O post é um SOCO concentrado.

═══ LINKEDIN — REGRAS ═══

ESTRUTURA:
1. HOOK (1a linha — a mais importante): Deve funcionar SOZINHA como tweet. NUNCA comece com "Eu".
2. DESENVOLVIMENTO (4-8 parágrafos curtos): Cada parágrafo = 1-2 frases. Alterne dado → opinião → case → provocação.
3. TAKEAWAY (penúltimo parágrafo): Uma frase síntese.
4. CTA (último parágrafo): UMA ação clara. Pergunta provocativa > "Curta e compartilhe".
5. HASHTAGS: 3-5, mix pt-BR + inglês.

FORMATAÇÃO: 1200-2000 chars (sweet spot). Cada frase em linha separada. Emojis: máx 3-4 no post inteiro.

═══ X (TWITTER) — REGRAS ═══

INEGOCIÁVEL: MÁXIMO 280 CARACTERES incluindo hashtags. CONTE ANTES de finalizar.

ESTILOS: Hot Take, Dado Solto, Pergunta Retórica, Provocação Pura, Case Relâmpago.

FORMATAÇÃO: Sem emojis excessivos (máx 1-2). Hashtags: 0-2 só se couberem. Tweet é UMA UNIDADE de impacto.

═══ TÉCNICAS DE VIRALIDADE (aplique pelo menos 2) ═══

1. PATTERN INTERRUPT 2. ENEMY FRAMING 3. DATA BOMB 4. IDENTITY CHALLENGE
5. CONTROVERSY SANDWICH 6. STAKE RAISING 7. SOCIAL PROOF STACK 8. MYTH DESTRUCTION

═══ FORMATO DE SAÍDA (JSON) ═══

{
  "content": "Texto completo do post com line breaks (\\n entre parágrafos)",
  "hashtags": ["#Hashtag1", "#Hashtag2"],
  "engagement_tips": "Estratégia específica para maximizar alcance (1-2 frases)",
  "best_posting_time": "Dia e horário ideal em BRT",
  "alternative_hooks": ["Hook alternativo 1", "Hook alternativo 2"]
}

REGRAS FINAIS:
- Posts devem funcionar INDEPENDENTEMENTE do vídeo.
- Se for X, o content + hashtags DEVE ter ≤ 280 chars. CONTE.
- Se roteiro é tutorial, transforme em opinião no post.
- Retorne APENAS o JSON. Sem markdown.`;

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: 'Rascunho', color: 'bg-gray-100 text-gray-700' },
  approved: { label: 'Aprovado', color: 'bg-blue-100 text-blue-700' },
  in_production: { label: 'Producao', color: 'bg-amber-100 text-amber-700' },
  recorded: { label: 'Gravado', color: 'bg-purple-100 text-purple-700' },
  published: { label: 'Publicado', color: 'bg-green-100 text-green-700' },
  discarded: { label: 'Descartado', color: 'bg-red-100 text-red-700' },
};

const FORMAT_LABELS: Record<string, string> = {
  short: 'Short', medium_video: 'YT Medio', long_video: 'YouTube', carousel: 'Carrossel', stories: 'Stories',
};

const TONE_LABELS: Record<string, string> = {
  polemic: 'Polemico', educational: 'Educativo', storytelling: 'Story',
  roast: 'Roast', data_story: 'Data', myth_busting: 'Mitos',
};

// ── Main Component ───────────────────────────────────────────────────────

export default function AdminContentFactory() {
  const [activeMode, setActiveMode] = useState<'trending' | 'create' | 'history' | 'calendar'>('create');
  const [showConfig, setShowConfig] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const [showAccounts, setShowAccounts] = useState(false);
  const [showProducts, setShowProducts] = useState(false);
  const [createPrompt, setCreatePrompt] = useState('');

  const handleCreateFromTrending = (title: string, context: string) => {
    setCreatePrompt(`Crie um roteiro sobre: ${title}\n\nContexto: ${context}`);
    setActiveMode('create');
  };

  return (
    <DashboardLayout>
      <div className="-m-4 lg:-m-6 min-h-screen bg-muted/40">
        {/* Header — white bar with border */}
        <header className="bg-white dark:bg-card border-b border-border px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-orange-100 text-orange-500 rounded-xl flex items-center justify-center">
              <Flame className="w-6 h-6" fill="currentColor" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Content Factory</h1>
              <p className="text-sm text-muted-foreground">Trending topics, ideias e roteiros completos com IA.</p>
            </div>
          </div>
          <nav className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
            <button onClick={() => setShowProducts(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:text-foreground hover:bg-muted transition-colors">
              <FileText className="w-4 h-4" /> Produtos
            </button>
            <button onClick={() => setShowAccounts(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:text-foreground hover:bg-muted transition-colors">
              <Link2 className="w-4 h-4" /> Contas
            </button>
            <button onClick={() => setShowDocs(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:text-foreground hover:bg-muted transition-colors">
              <HelpCircle className="w-4 h-4" />
            </button>
            <button onClick={() => setShowConfig(v => !v)} className={`flex items-center gap-2 px-3 py-2 rounded-lg hover:text-foreground transition-colors ${showConfig ? 'bg-muted text-foreground' : 'hover:bg-muted'}`}>
              <Settings2 className="w-4 h-4" /> LLMs
            </button>
          </nav>
        </header>

        {/* Docs Sheet */}
        {showDocs && <DocsSheet onClose={() => setShowDocs(false)} />}

        {/* Product Showcases Management */}
        {showProducts && <ProductShowcasesSheet onClose={() => setShowProducts(false)} />}

        {/* Social Accounts Settings */}
        {showAccounts && <SocialAccountsSettings open={showAccounts} onClose={() => setShowAccounts(false)} />}

        {/* LLM Config Panel */}
        {showConfig && <LLMConfigPanel />}

        <div className="px-8 py-8">
          {/* Mode Tabs — pill style */}
          <div className="flex items-center gap-2 bg-white dark:bg-card p-1.5 rounded-xl border border-border mb-8 inline-flex shadow-sm">
            {[
              { id: 'trending' as const, label: 'Trending', icon: Flame },
              { id: 'create' as const, label: 'Criar', icon: Sparkles },
              { id: 'history' as const, label: 'Historico', icon: Clock },
              { id: 'calendar' as const, label: 'Calendario', icon: Calendar },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeMode === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveMode(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? 'bg-slate-100 dark:bg-muted text-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-slate-50 dark:hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${tab.id === 'trending' && isActive ? 'text-orange-500' : tab.id === 'create' && isActive ? 'text-blue-500' : ''}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {activeMode === 'trending' && <TrendingTab onCreateFromTrending={handleCreateFromTrending} />}
          {activeMode === 'create' && <CreateTab promptText={createPrompt} setPromptText={setCreatePrompt} />}
          {activeMode === 'history' && <HistoryTab />}
          {activeMode === 'calendar' && <CalendarTab />}
        </div>
      </div>
    </DashboardLayout>
  );
}

// ── LLM Config Panel ──────────────────────────────────────────────────────

function LLMConfigPanel() {
  const { data: apis = [], isLoading: apisLoading } = useAvailableApis();
  const { data: config, isLoading: configLoading } = useContentFactoryConfig();
  const saveConfig = useSaveContentFactoryConfig();

  const [trendingApi, setTrendingApi] = useState('');
  const [generateApi, setGenerateApi] = useState('');
  const [socialApi, setSocialApi] = useState('');
  const [trendingPrompt, setTrendingPrompt] = useState('');
  const [generatePrompt, setGeneratePrompt] = useState('');
  const [socialPrompt, setSocialPrompt] = useState('');
  const [calendarRecipients, setCalendarRecipients] = useState('');
  const [showPrompt, setShowPrompt] = useState<'trending' | 'generate' | 'social' | null>(null);

  useEffect(() => {
    if (config) {
      setTrendingApi(config.trending_api_key);
      setGenerateApi(config.generate_api_key);
      setSocialApi(config.social_api_key);
      setTrendingPrompt(config.trending_prompt);
      setGeneratePrompt(config.generate_prompt);
      setSocialPrompt(config.social_prompt);
      // Parse JSON array to comma-separated for display
      try {
        const arr = JSON.parse(config.calendar_recipients || '[]');
        setCalendarRecipients(Array.isArray(arr) ? arr.join(', ') : '');
      } catch { setCalendarRecipients(config.calendar_recipients || ''); }
    }
  }, [config]);

  const isLoading = apisLoading || configLoading;
  const effectiveTrending = trendingApi || config?.trending_api_key || '';
  const effectiveGenerate = generateApi || config?.generate_api_key || '';
  const effectiveSocial = socialApi || config?.social_api_key || '';

  const handleSave = () => {
    // Convert comma-separated emails to JSON array
    const recipientsJson = JSON.stringify(
      calendarRecipients.split(',').map(e => e.trim()).filter(Boolean)
    );
    saveConfig.mutate({
      trending_api_key: effectiveTrending,
      generate_api_key: effectiveGenerate,
      social_api_key: effectiveSocial,
      trending_prompt: trendingPrompt,
      generate_prompt: generatePrompt,
      social_prompt: socialPrompt,
      calendar_recipients: recipientsJson,
    });
  };

  return (
    <Card className="border-orange-200 bg-orange-50/30">
      <CardContent className="p-4 space-y-4">
        {/* API selectors row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 flex-1 flex-wrap">
            {/* Trending API */}
            <div className="flex items-center gap-2">
              <Flame className="w-3.5 h-3.5 text-orange-500 shrink-0" />
              <span className="text-xs font-medium whitespace-nowrap">Trending</span>
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              ) : (
                <Select value={effectiveTrending} onValueChange={setTrendingApi}>
                  <SelectTrigger className="w-48 h-8 text-xs">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {apis.map((api) => (
                      <SelectItem key={api.api_key} value={api.api_key}>{api.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <button
                onClick={() => setShowPrompt(showPrompt === 'trending' ? null : 'trending')}
                className={`text-[10px] underline underline-offset-2 whitespace-nowrap transition-colors ${
                  showPrompt === 'trending' ? 'text-orange-600' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {showPrompt === 'trending' ? 'fechar prompt' : 'ver prompt'}
              </button>
            </div>

            {/* Generate API */}
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-500 shrink-0" />
              <span className="text-xs font-medium whitespace-nowrap">Geracao</span>
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              ) : (
                <Select value={effectiveGenerate} onValueChange={setGenerateApi}>
                  <SelectTrigger className="w-48 h-8 text-xs">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {apis.map((api) => (
                      <SelectItem key={api.api_key} value={api.api_key}>{api.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <button
                onClick={() => setShowPrompt(showPrompt === 'generate' ? null : 'generate')}
                className={`text-[10px] underline underline-offset-2 whitespace-nowrap transition-colors ${
                  showPrompt === 'generate' ? 'text-purple-600' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {showPrompt === 'generate' ? 'fechar prompt' : 'ver prompt'}
              </button>
            </div>

            {/* Social Posts API */}
            <div className="flex items-center gap-2">
              <Send className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span className="text-xs font-medium whitespace-nowrap">Social Posts</span>
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              ) : (
                <Select value={effectiveSocial} onValueChange={setSocialApi}>
                  <SelectTrigger className="w-48 h-8 text-xs">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {apis.map((api) => (
                      <SelectItem key={api.api_key} value={api.api_key}>{api.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <button
                onClick={() => setShowPrompt(showPrompt === 'social' ? null : 'social')}
                className={`text-[10px] underline underline-offset-2 whitespace-nowrap transition-colors ${
                  showPrompt === 'social' ? 'text-blue-600' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {showPrompt === 'social' ? 'fechar prompt' : 'ver prompt'}
              </button>
            </div>
          </div>

          <Button
            size="sm"
            className="gap-1.5 shrink-0"
            onClick={handleSave}
            disabled={saveConfig.isPending || isLoading}
          >
            {saveConfig.isPending
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Save className="w-3.5 h-3.5" />}
            Salvar
          </Button>
        </div>

        {/* Calendar recipients */}
        <div className="flex items-center gap-2 border-t pt-3">
          <Calendar className="w-3.5 h-3.5 text-green-500 shrink-0" />
          <span className="text-xs font-medium whitespace-nowrap">Convites Calendario</span>
          <Input
            value={calendarRecipients}
            onChange={(e) => setCalendarRecipients(e.target.value)}
            placeholder="email1@exemplo.com, email2@exemplo.com"
            className="flex-1 h-8 text-xs"
          />
          <span className="text-[10px] text-muted-foreground whitespace-nowrap">Separar com virgula</span>
        </div>

        {/* Prompt editors */}
        {showPrompt === 'trending' && (
          <div className="space-y-1.5 border-t pt-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium flex items-center gap-1.5">
                <Flame className="w-3 h-3 text-orange-500" />
                Prompt de Trending
              </label>
              <span className="text-[10px] text-muted-foreground">Vazio = usa o prompt padrao embutido</span>
            </div>
            <Textarea
              value={trendingPrompt}
              onChange={(e) => setTrendingPrompt(e.target.value)}
              placeholder="Deixe vazio para usar o prompt padrão. Cole aqui para customizar completamente o comportamento de pesquisa de trending topics..."
              rows={8}
              className="text-xs font-mono resize-y"
            />
          </div>
        )}

        {showPrompt === 'generate' && (
          <div className="space-y-1.5 border-t pt-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-purple-500" />
                Prompt de Geracao
              </label>
              <span className="text-[10px] text-muted-foreground">Vazio = usa o prompt padrao embutido</span>
            </div>
            <Textarea
              value={generatePrompt}
              onChange={(e) => setGeneratePrompt(e.target.value)}
              placeholder="Deixe vazio para usar o prompt padrão. Cole aqui para customizar a persona, estilo, estrutura do roteiro, etc..."
              rows={12}
              className="text-xs font-mono resize-y"
            />
          </div>
        )}

        {showPrompt === 'social' && (
          <div className="space-y-1.5 border-t pt-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium flex items-center gap-1.5">
                <Send className="w-3 h-3 text-blue-500" />
                Prompt de Social Posts
              </label>
              <span className="text-[10px] text-muted-foreground">Edite abaixo para customizar. O prompt é usado para LinkedIn e X.</span>
            </div>
            <Textarea
              value={socialPrompt || DEFAULT_SOCIAL_PROMPT}
              onChange={(e) => setSocialPrompt(e.target.value)}
              rows={16}
              className="text-xs font-mono resize-y"
            />
          </div>
        )}

        <p className="text-[10px] text-muted-foreground">
          Recomendado: Perplexity para Trending, Claude/GPT-4o para Geracao e Social Posts.
        </p>
      </CardContent>
    </Card>
  );
}

// ── Trending Tab ──────────────────────────────────────────────────────────

function TrendingTab({ onCreateFromTrending }: { onCreateFromTrending?: (title: string, context: string) => void }) {
  const { data: topics = [], isLoading } = useTrendingTopics();
  const fetchTrending = useFetchTrending();
  const clearCache = useClearTrendingCache();
  const generateContent = useGenerateContent();
  const [selectedTopic, setSelectedTopic] = useState<TrendingTopic | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [timeFilter, setTimeFilter] = useState<'all' | '24h' | '7d'>('all');

  const timeFiltered = timeFilter === 'all'
    ? topics
    : topics.filter(t => {
        const created = new Date(t.created_at).getTime();
        const now = Date.now();
        return timeFilter === '24h' ? now - created < 86400000 : now - created < 604800000;
      });

  const searchFiltered = searchQuery
    ? timeFiltered.filter(t =>
        t.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.keywords?.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : timeFiltered;

  const filteredTopics = [...searchFiltered].sort((a, b) =>
    sortDirection === 'desc'
      ? b.virality_potential - a.virality_potential
      : a.virality_potential - b.virality_potential
  );

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredTopics.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTopics.map(t => t.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  // Check which topics already have a generated piece
  const { data: pieces = [] } = useContentPieces();
  const generatedTopicIds = new Set(pieces.filter(p => p.trending_topic_id).map(p => p.trending_topic_id));

  const handleBulkGenerate = () => {
    for (const id of selectedIds) {
      const topic = topics.find(t => t.id === id);
      if (!topic) continue;
      generateContent.mutate({
        input_text: `${topic.topic}\n\nContexto: ${topic.summary}\n\nAngulo sugerido: ${topic.angle}`,
        input_type: 'trending',
        trending_topic_id: topic.id,
        format: (topic.format_suggestion as ContentFormat) || 'short',
        tone: 'polemic' as ContentTone,
        growth_function: (topic.growth_function || undefined) as GrowthFunction | undefined,
        audience_stage: (topic.audience_stage || undefined) as AudienceStage | undefined,
        trending_angle: topic.angle || undefined,
        trending_short_cuts: topic.short_cuts?.length ? topic.short_cuts : undefined,
      });
    }
    setSelectedIds(new Set());
  };

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              type="text"
              placeholder="Buscar topicos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white dark:bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64 shadow-sm transition-shadow hover:shadow"
            />
          </div>
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5 border border-border">
            {([['all', 'Todos'], ['24h', 'Últimas 24h'], ['7d', '7 dias']] as const).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setTimeFilter(val)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  timeFilter === val
                    ? 'bg-card text-foreground shadow-sm border border-border'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {selectedIds.size > 0 && (
            <span className="text-sm font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-md">
              {selectedIds.size} selecionados
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {selectedIds.size > 0 ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  for (const id of selectedIds) clearCache.mutate();
                  setSelectedIds(new Set());
                }}
                disabled={clearCache.isPending}
                className="gap-2 shadow-sm"
              >
                <Trash2 className="w-4 h-4 text-muted-foreground" /> Excluir Selecao
              </Button>
              <Button
                size="sm"
                onClick={handleBulkGenerate}
                disabled={generateContent.isPending}
                className="gap-2 shadow-sm"
              >
                <Sparkles className="w-4 h-4" /> Gerar Roteiros ({selectedIds.size})
              </Button>
            </>
          ) : (
            <>
              {topics.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => clearCache.mutate()}
                  disabled={clearCache.isPending || fetchTrending.isPending}
                  className="gap-2 shadow-sm"
                >
                  <Trash2 className="w-4 h-4 text-muted-foreground" /> Limpar Cache
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => fetchTrending.mutate({ force_refresh: true })}
                disabled={fetchTrending.isPending}
                className="gap-2 shadow-sm"
              >
                {fetchTrending.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                {fetchTrending.isPending ? 'Pesquisando...' : 'Buscar Trending'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Table */}
      {!isLoading && (
        <div className="bg-white dark:bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 w-10">
                    <Checkbox
                      checked={filteredTopics.length > 0 && selectedIds.size === filteredTopics.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-2/5">Topico</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tags</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fonte</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <button
                      onClick={() => setSortDirection(d => d === 'desc' ? 'asc' : 'desc')}
                      className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      Potencial <ArrowUpDown className="w-3.5 h-3.5" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredTopics.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-muted-foreground">
                      {topics.length === 0
                        ? 'Nenhum trending topic. Clique "Buscar Trending" para pesquisar.'
                        : 'Nenhum resultado para a busca.'}
                    </td>
                  </tr>
                )}
                {filteredTopics.map((topic) => {
                  const isSelected = selectedIds.has(topic.id);
                  const hasScript = generatedTopicIds.has(topic.id);
                  return (
                    <tr
                      key={topic.id}
                      className={`transition-colors group ${isSelected ? 'bg-blue-50/50 dark:bg-primary/5' : 'bg-white dark:bg-card hover:bg-slate-50 dark:hover:bg-muted/30'}`}
                    >
                      <td className="px-4 py-3 align-top">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelect(topic.id)}
                        />
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex items-start gap-3">
                          <Flame className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="font-medium text-sm text-foreground leading-tight">{topic.topic}</p>
                              {hasScript && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 shrink-0">
                                  <CheckCircle2 className="w-3 h-3" /> Roteiro
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-1 leading-relaxed pr-4" title={topic.summary}>{topic.summary}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-wrap gap-1.5">
                          {topic.keywords?.slice(0, 3).map((kw) => (
                            <span key={kw} className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-muted text-muted-foreground border border-border">
                              {kw}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        {topic.source_url ? (
                          <a
                            href={topic.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-start gap-2 text-xs text-muted-foreground max-w-[240px] hover:text-foreground transition-colors group/link"
                          >
                            <PlaySquare className="w-4 h-4 shrink-0 mt-0.5" />
                            <span className="line-clamp-2 leading-snug">{topic.source}</span>
                            <ExternalLink className="w-3 h-3 shrink-0 mt-0.5 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                          </a>
                        ) : (
                          <div className="flex items-start gap-2 text-xs text-muted-foreground max-w-[240px]">
                            <PlaySquare className="w-4 h-4 shrink-0 mt-0.5" />
                            <span className="line-clamp-2 leading-snug">{topic.source}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${
                            topic.virality_potential >= 95 ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800' :
                            topic.virality_potential >= 80 ? 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800' :
                            'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                          }`}>
                            {topic.virality_potential}% viral
                          </span>
                          {topic.virality_potential >= 80 ? (
                            <TrendingUp className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-400" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top text-right">
                        <button
                          onClick={() => {
                            if (onCreateFromTrending) {
                              onCreateFromTrending(topic.topic, topic.summary);
                            } else {
                              setSelectedTopic(topic);
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md text-xs font-medium border border-blue-100"
                        >
                          <Sparkles className="w-3.5 h-3.5" /> Criar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          {filteredTopics.length > 0 && (
            <div className="px-6 py-4 border-t border-border bg-slate-50 dark:bg-muted/30 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Mostrando <span className="font-medium text-foreground">{filteredTopics.length}</span> de <span className="font-medium text-foreground">{topics.length}</span> topicos{timeFilter !== 'all' && ` (filtro: ${timeFilter === '24h' ? 'últimas 24h' : '7 dias'})`}
              </span>
              {topics.length > 0 && (
                <span className="text-[10px] text-muted-foreground">
                  Cache expira em {new Date(topics[0]?.expires_at).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Topic detail → generate */}
      {selectedTopic && (
        <TrendingToCreateSheet
          topic={selectedTopic}
          onClose={() => setSelectedTopic(null)}
        />
      )}
    </div>
  );
}

function TrendingToCreateSheet({ topic, onClose }: { topic: TrendingTopic; onClose: () => void }) {
  const [format, setFormat] = useState<ContentFormat>((topic.format_suggestion as ContentFormat) || 'short');
  const [tone, setTone] = useState<ContentTone>('polemic');
  const [growthFunction, setGrowthFunction] = useState<string>(topic.growth_function || '');
  const [audienceStage, setAudienceStage] = useState<string>(topic.audience_stage || '');
  const [productShowcaseKey, setProductShowcaseKey] = useState<string>('');
  const [usePlatformData, setUsePlatformData] = useState(false);
  const [customInstructions, setCustomInstructions] = useState('');
  const generateContent = useGenerateContent();
  const { data: products } = useEnabledProductShowcases();

  const handleGenerate = () => {
    generateContent.mutate({
      input_text: `${topic.topic}\n\nContexto: ${topic.summary}\n\nAngulo sugerido: ${topic.angle}`,
      input_type: 'trending',
      trending_topic_id: topic.id,
      format,
      tone,
      growth_function: (growthFunction || undefined) as GrowthFunction | undefined,
      audience_stage: (audienceStage || undefined) as AudienceStage | undefined,
      product_showcase_key: productShowcaseKey || undefined,
      use_platform_data: usePlatformData,
      custom_instructions: customInstructions || undefined,
      trending_angle: topic.angle || undefined,
      trending_short_cuts: topic.short_cuts?.length ? topic.short_cuts : undefined,
    }, { onSuccess: () => onClose() });
  };

  return (
    <Sheet open onOpenChange={() => onClose()}>
      <SheetContent className="w-full sm:w-[480px] md:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-base">
            <Flame className="w-4 h-4 text-orange-500" />
            Gerar a partir do trending
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
            <p className="font-medium text-sm">{topic.topic}</p>
            <p className="text-xs text-muted-foreground mt-1">{topic.summary}</p>
            <p className="text-xs text-orange-700 mt-2">Angulo: {topic.angle}</p>
            {topic.pillar && (
              <Badge variant="outline" className="mt-2 text-[10px]">{topic.pillar}</Badge>
            )}
            {topic.growth_function && (
              <Badge variant="secondary" className="mt-2 ml-1 text-[10px]">{topic.growth_function}</Badge>
            )}
            {topic.title_options?.length > 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-[10px] font-medium text-orange-600">Titulos sugeridos:</p>
                {topic.title_options.map((t, i) => (
                  <p key={i} className="text-[10px] text-muted-foreground">{i + 1}. {t}</p>
                ))}
              </div>
            )}
            {topic.short_cuts?.length > 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-[10px] font-medium text-orange-600">Short cuts sugeridos:</p>
                {topic.short_cuts.map((sc, i) => (
                  <p key={i} className="text-[10px] text-muted-foreground">
                    {sc.hook} ({sc.estimated_duration})
                  </p>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Formato</label>
              <Select value={format} onValueChange={(v) => setFormat(v as ContentFormat)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FORMAT_OPTIONS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Tom</label>
              <Select value={tone} onValueChange={(v) => setTone(v as ContentTone)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TONE_OPTIONS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Funcao de crescimento</label>
              <Select value={growthFunction} onValueChange={setGrowthFunction}>
                <SelectTrigger><SelectValue placeholder="Auto" /></SelectTrigger>
                <SelectContent>
                  {GROWTH_FUNCTION_OPTIONS.map((g) => (
                    <SelectItem key={g.value || '_auto'} value={g.value || '_auto'}>
                      <span>{g.label}</span>
                      <span className="text-[10px] text-muted-foreground ml-1">- {g.description}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Audiencia</label>
              <Select value={audienceStage} onValueChange={setAudienceStage}>
                <SelectTrigger><SelectValue placeholder="Auto" /></SelectTrigger>
                <SelectContent>
                  {AUDIENCE_STAGE_OPTIONS.map((a) => (
                    <SelectItem key={a.value || '_auto'} value={a.value || '_auto'}>
                      <span>{a.label}</span>
                      <span className="text-[10px] text-muted-foreground ml-1">- {a.description}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium">Showcase de produto (opcional)</label>
            <Select value={productShowcaseKey || '_none'} onValueChange={(v) => setProductShowcaseKey(v === '_none' ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="Nenhum produto" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">Nenhum produto</SelectItem>
                {products?.map((p) => (
                  <SelectItem key={p.product_key} value={p.product_key}>{p.display_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="platform-data"
              checked={usePlatformData}
              onCheckedChange={(v) => setUsePlatformData(!!v)}
            />
            <label htmlFor="platform-data" className="text-sm flex items-center gap-1.5 cursor-pointer">
              <Database className="w-3.5 h-3.5 text-blue-500" />
              Enriquecer com dados da plataforma
            </label>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium">Instrucoes adicionais (opcional)</label>
            <Textarea
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="Ex: Focar no publico de TI, mencionar vistos H-1B..."
              rows={3}
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={generateContent.isPending}
            className="w-full gap-2"
          >
            {generateContent.isPending
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Gerando...</>
              : <><Sparkles className="w-4 h-4" /> Gerar Roteiro Completo</>}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Create Tab ────────────────────────────────────────────────────────────

const QUICK_SUGGESTIONS = [
  "Analisar mercado de TI nos EUA",
  "Explicar o visto EB-2 NIW",
  "5 erros na entrevista em ingles",
];

function CreateTab({ promptText, setPromptText }: { promptText: string; setPromptText: (v: string) => void }) {
  const [inputText, setInputText] = useState(promptText || '');
  const [format, setFormat] = useState<ContentFormat>('short');
  const [tone, setTone] = useState<ContentTone>('polemic');
  const [growthFunction, setGrowthFunction] = useState<string>('');
  const [audienceStage, setAudienceStage] = useState<string>('');
  const [productShowcaseKey, setProductShowcaseKey] = useState<string>('');
  const [usePlatformData, setUsePlatformData] = useState(false);
  const [customInstructions, setCustomInstructions] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const generateContent = useGenerateContent();
  const { data: recentPieces = [] } = useContentPieces();
  const { data: products } = useEnabledProductShowcases();

  // Sync when promptText changes from parent (Trending → Criar flow)
  useEffect(() => {
    if (promptText) {
      setInputText(promptText);
      setPromptText('');
    }
  }, [promptText, setPromptText]);

  const handleGenerate = () => {
    if (!inputText.trim()) return;
    generateContent.mutate({
      input_text: inputText,
      input_type: 'manual',
      format,
      tone,
      growth_function: (growthFunction || undefined) as GrowthFunction | undefined,
      audience_stage: (audienceStage || undefined) as AudienceStage | undefined,
      product_showcase_key: productShowcaseKey || undefined,
      use_platform_data: usePlatformData,
      custom_instructions: customInstructions || undefined,
    });
  };

  // Keyboard shortcut: Cmd/Ctrl+Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleGenerate();
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
      {/* Left Column: Form (2/3) */}
      <div className="lg:col-span-2">
        <div className="bg-white dark:bg-card border border-border rounded-2xl shadow-sm p-6 lg:p-8 relative overflow-hidden h-full">
          {/* Decorative blur accent */}
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-blue-100/60 dark:bg-blue-900/20 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-800">
              <Wand2 className="w-[18px] h-[18px]" />
            </div>
            <h2 className="text-xl font-semibold text-foreground tracking-tight">Novo Roteiro</h2>
          </div>

          <div className="space-y-6 relative z-10" onKeyDown={handleKeyDown}>
            {/* Prompt Input */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Sobre o que voce quer criar?
              </label>
              <div className="relative group">
                <textarea
                  rows={4}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all resize-none placeholder:text-muted-foreground shadow-inner"
                  placeholder='Ex: "Novas medidas de Trump na imigracao", "5 erros fatais ao imigrar para os EUA", ou cole um link de artigo...'
                />
                <div className="absolute bottom-3 right-3 flex gap-2 opacity-50 group-focus-within:opacity-100 transition-opacity">
                  <button className="p-1.5 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-md transition-colors" title="Anexar Link">
                    <Link2 className="w-4 h-4" />
                  </button>
                  <button className="p-1.5 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-md transition-colors" title="Usar Template">
                    <FileText className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Quick Suggestion Chips */}
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="text-xs text-muted-foreground flex items-center gap-1 py-1">
                  <Zap className="w-3 h-3" /> Sugestoes:
                </span>
                {QUICK_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setInputText(s)}
                    className="text-xs bg-card border border-border hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-muted-foreground hover:text-blue-700 dark:hover:text-blue-400 px-2.5 py-1 rounded-full transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* 2x2 Grid for Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <LayoutTemplate className="w-4 h-4 text-muted-foreground" /> Formato
                </label>
                <Select value={format} onValueChange={(v) => setFormat(v as ContentFormat)}>
                  <SelectTrigger className="bg-muted/30 border-border hover:border-muted-foreground/30"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FORMAT_OPTIONS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-muted-foreground" /> Tom da Comunicacao
                </label>
                <Select value={tone} onValueChange={(v) => setTone(v as ContentTone)}>
                  <SelectTrigger className="bg-muted/30 border-border hover:border-muted-foreground/30"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TONE_OPTIONS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Target className="w-4 h-4 text-muted-foreground" /> Objetivo (Crescimento)
                </label>
                <Select value={growthFunction || '_auto'} onValueChange={(v) => setGrowthFunction(v === '_auto' ? '' : v)}>
                  <SelectTrigger className="bg-muted/30 border-border hover:border-muted-foreground/30"><SelectValue placeholder="Automatico (IA decide)" /></SelectTrigger>
                  <SelectContent>
                    {GROWTH_FUNCTION_OPTIONS.map((g) => (
                      <SelectItem key={g.value || '_auto'} value={g.value || '_auto'}>{g.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Users2 className="w-4 h-4 text-muted-foreground" /> Audiencia Alvo
                </label>
                <Select value={audienceStage || '_auto'} onValueChange={(v) => setAudienceStage(v === '_auto' ? '' : v)}>
                  <SelectTrigger className="bg-muted/30 border-border hover:border-muted-foreground/30"><SelectValue placeholder="Automatico (IA decide)" /></SelectTrigger>
                  <SelectContent>
                    {AUDIENCE_STAGE_OPTIONS.map((a) => (
                      <SelectItem key={a.value || '_auto'} value={a.value || '_auto'}>{a.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Product Showcase */}
            <div className="space-y-2 pt-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-muted-foreground" /> Showcase de Produto <span className="text-muted-foreground font-normal">(Opcional)</span>
              </label>
              <Select value={productShowcaseKey || '_none'} onValueChange={(v) => setProductShowcaseKey(v === '_none' ? '' : v)}>
                <SelectTrigger className="bg-muted/30 border-border hover:border-muted-foreground/30"><SelectValue placeholder="Nenhum produto (Conteudo puro)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Nenhum produto (Conteudo puro)</SelectItem>
                  {products?.map((p) => (
                    <SelectItem key={p.product_key} value={p.product_key}>{p.display_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="h-px bg-border my-2" />

            {/* Toggle + Advanced */}
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <Switch
                  checked={usePlatformData}
                  onCheckedChange={setUsePlatformData}
                />
                <div>
                  <p className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Database className={`w-4 h-4 ${usePlatformData ? 'text-blue-500' : 'text-muted-foreground'}`} />
                    Enriquecer com dados da plataforma
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">A IA buscara dados recentes na web para embasar o roteiro.</p>
                </div>
              </label>

              <div className="pt-2">
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronRight className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} />
                  Instrucoes adicionais (Prompt avancado)
                </button>

                {showAdvanced && (
                  <div className="mt-3 pl-6 pb-2">
                    <textarea
                      rows={3}
                      value={customInstructions}
                      onChange={(e) => setCustomInstructions(e.target.value)}
                      className="w-full bg-muted/30 border border-border rounded-lg px-4 py-3 text-sm text-foreground focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all resize-none placeholder:text-muted-foreground shadow-inner"
                      placeholder="Ex: Nao use a palavra 'garantido'. Foque em profissionais de TI. Adicione um CTA forte no final."
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                onClick={handleGenerate}
                disabled={generateContent.isPending || !inputText.trim()}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-blue-400 disabled:to-indigo-400 disabled:cursor-not-allowed text-white font-medium py-3.5 px-4 rounded-xl transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 relative overflow-hidden group"
              >
                {/* Shine effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />

                {generateContent.isPending ? (
                  <>
                    <Loader2 className="w-[18px] h-[18px] animate-spin relative z-10" />
                    <span className="relative z-10">Gerando roteiro completo...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-[18px] h-[18px] relative z-10" />
                    <span className="relative z-10">Gerar Roteiro com IA</span>
                  </>
                )}

                {/* Keyboard Shortcut Hint */}
                {!generateContent.isPending && (
                  <div className="absolute right-4 flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                    <kbd className="font-sans text-[10px] px-1.5 py-0.5 rounded bg-black/20 text-white border border-white/10">Ctrl</kbd>
                    <kbd className="font-sans text-[10px] px-1.5 py-0.5 rounded bg-black/20 text-white border border-white/10">Enter</kbd>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Recent Creations (1/3) */}
      <div className="lg:col-span-1 flex flex-col">
        <div className="bg-white dark:bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-slate-50/50 dark:bg-muted/30 shrink-0">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <History className="w-4 h-4 text-muted-foreground" />
              Ultimas criacoes
            </h3>
            <span className="text-xs font-medium text-muted-foreground">{recentPieces.length} itens</span>
          </div>

          <div className="divide-y divide-border/50 overflow-y-auto flex-1">
            {recentPieces.slice(0, 8).map((piece) => {
              const statusCfg = STATUS_CONFIG[piece.status] || STATUS_CONFIG.draft;
              const formatLabel = FORMAT_LABELS[piece.format] || piece.format;
              const toneLabel = TONE_LABELS[piece.tone] || piece.tone;
              return (
                <div key={piece.id} className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-muted/30 transition-colors cursor-pointer group">
                  <h4 className="text-sm font-medium text-foreground mb-1.5 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
                    {piece.title}
                  </h4>
                  <div className="flex items-center flex-wrap gap-1.5 mb-1.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border border-purple-200/50 dark:border-purple-800/50">
                      {formatLabel}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground border border-border/50">
                      {toneLabel}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border border-transparent ${statusCfg.color}`}>
                      {statusCfg.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {timeAgo(piece.created_at)}</span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-blue-500" />
                  </div>
                </div>
              );
            })}
            {recentPieces.length === 0 && (
              <div className="px-6 py-12 text-center text-sm text-muted-foreground">
                Nenhum conteudo gerado ainda.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── History Tab ───────────────────────────────────────────────────────────

const HISTORY_PAGE_SIZE = 10;

function HistoryTab() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [formatFilter, setFormatFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
  const updateStatus = useUpdatePieceStatus();
  const { data: pieces = [], isLoading } = useContentPieces({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    format: formatFilter !== 'all' ? formatFilter : undefined,
  });
  const deletePiece = useDeletePiece();

  // Filter by search
  const filtered = searchQuery
    ? pieces.filter(p =>
        (p.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.input_text || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : pieces;

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / HISTORY_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * HISTORY_PAGE_SIZE, safePage * HISTORY_PAGE_SIZE);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [statusFilter, formatFilter, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              type="text"
              placeholder="Buscar roteiros..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white dark:bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64 shadow-sm transition-shadow hover:shadow"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 bg-white dark:bg-card shadow-sm"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={formatFilter} onValueChange={setFormatFilter}>
            <SelectTrigger className="w-36 bg-white dark:bg-card shadow-sm"><SelectValue placeholder="Formato" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Formatos</SelectItem>
              {FORMAT_OPTIONS.map((f) => (
                <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <span className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{filtered.length}</span> roteiros
        </span>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Table */}
      {!isLoading && (
        <div className="bg-white dark:bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-slate-50/80 dark:bg-muted/50">
                  <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-2/5">Titulo</th>
                  <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Formato</th>
                  <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tom</th>
                  <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Score</th>
                  <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Criado</th>
                  <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {paged.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-sm text-muted-foreground">
                      {pieces.length === 0
                        ? 'Nenhum conteudo gerado ainda. Use a aba "Criar" ou "Trending" para comecar.'
                        : 'Nenhum resultado para os filtros aplicados.'}
                    </td>
                  </tr>
                )}
                {paged.map((piece) => {
                  const statusCfg = STATUS_CONFIG[piece.status] || STATUS_CONFIG.draft;
                  const formatLabel = FORMAT_LABELS[piece.format] || piece.format;
                  const toneLabel = TONE_LABELS[piece.tone] || piece.tone;
                  return (
                    <tr
                      key={piece.id}
                      className="bg-white dark:bg-card hover:bg-slate-50 dark:hover:bg-muted/30 transition-colors group cursor-pointer"
                      onClick={() => setSelectedPieceId(piece.id)}
                    >
                      <td className="px-6 py-4 align-top">
                        <div className="flex items-start gap-3">
                          <FileText className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-foreground leading-tight line-clamp-1">{piece.title || 'Sem titulo'}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5" title={piece.input_text || ''}>
                              {piece.input_text || '—'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border border-purple-200/50 dark:border-purple-800/50">
                          {formatLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-muted text-muted-foreground border border-border">
                          {toneLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border border-transparent ${statusCfg.color}`}>
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 align-top">
                        {piece.virality_score > 0 ? (
                          <div className="flex items-center gap-1.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${
                              piece.virality_score >= 80 ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800' :
                              piece.virality_score >= 60 ? 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800' :
                              'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                            }`}>
                              {piece.virality_score}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 align-top">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {getTimeAgo(new Date(piece.created_at))}
                        </span>
                      </td>
                      <td className="px-6 py-4 align-top text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950/30 dark:text-blue-400 dark:hover:bg-blue-950/50 rounded-md text-xs font-medium border border-blue-100 dark:border-blue-800"
                            onClick={() => setSelectedPieceId(piece.id)}
                          >
                            <Eye className="w-3.5 h-3.5" /> Ver
                          </button>
                          <button
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md"
                            onClick={() => deletePiece.mutate(piece.id)}
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {filtered.length > 0 && (
            <div className="px-6 py-4 border-t border-border bg-slate-50 dark:bg-muted/30 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Mostrando <span className="font-medium text-foreground">{(safePage - 1) * HISTORY_PAGE_SIZE + 1}</span> a <span className="font-medium text-foreground">{Math.min(safePage * HISTORY_PAGE_SIZE, filtered.length)}</span> de <span className="font-medium text-foreground">{filtered.length}</span> roteiros
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  className="px-3 py-1.5 text-sm font-medium text-muted-foreground bg-white dark:bg-card border border-border rounded-md hover:bg-slate-50 dark:hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  Anterior
                </button>
                {totalPages <= 7 ? (
                  Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md border transition-colors shadow-sm ${
                        p === safePage
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'text-muted-foreground bg-white dark:bg-card border-border hover:bg-slate-50 dark:hover:bg-muted'
                      }`}
                    >
                      {p}
                    </button>
                  ))
                ) : (
                  <>
                    {[1, 2].map(p => (
                      <button key={p} onClick={() => setPage(p)} className={`px-3 py-1.5 text-sm font-medium rounded-md border transition-colors shadow-sm ${p === safePage ? 'bg-blue-600 text-white border-blue-600' : 'text-muted-foreground bg-white dark:bg-card border-border hover:bg-slate-50'}`}>{p}</button>
                    ))}
                    {safePage > 3 && <span className="px-1 text-muted-foreground">...</span>}
                    {safePage > 2 && safePage < totalPages - 1 && (
                      <button onClick={() => {}} className="px-3 py-1.5 text-sm font-medium rounded-md border bg-blue-600 text-white border-blue-600 shadow-sm">{safePage}</button>
                    )}
                    {safePage < totalPages - 2 && <span className="px-1 text-muted-foreground">...</span>}
                    {[totalPages - 1, totalPages].filter(p => p > 2).map(p => (
                      <button key={p} onClick={() => setPage(p)} className={`px-3 py-1.5 text-sm font-medium rounded-md border transition-colors shadow-sm ${p === safePage ? 'bg-blue-600 text-white border-blue-600' : 'text-muted-foreground bg-white dark:bg-card border-border hover:bg-slate-50'}`}>{p}</button>
                    ))}
                  </>
                )}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  className="px-3 py-1.5 text-sm font-medium text-muted-foreground bg-white dark:bg-card border border-border rounded-md hover:bg-slate-50 dark:hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  Proxima
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Modal — same as Content Pipeline */}
      <Dialog open={!!selectedPieceId} onOpenChange={(open) => { if (!open) setSelectedPieceId(null); }}>
        <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden">
          {(() => {
            const piece = pieces.find(p => p.id === selectedPieceId);
            if (!piece) return null;
            return (
              <PieceEditModal
                piece={piece}
                onClose={() => setSelectedPieceId(null)}
                onStatusChange={(status) => updateStatus.mutate({ id: piece.id, status })}
                onDelete={(id) => deletePiece.mutate(id)}
              />
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Calendar Tab ─────────────────────────────────────────────────────────

function CalendarTab() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const { data: pieces = [], isLoading } = useContentPieces();
  const updatePiece = useUpdatePiece();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDayOfWeek = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  interface CalEntry { piece: ContentPiece; type: 'production' | 'publication'; }
  const entriesByDate: Record<string, CalEntry[]> = {};
  const addEntry = (dateStr: string, entry: CalEntry) => {
    if (!entriesByDate[dateStr]) entriesByDate[dateStr] = [];
    entriesByDate[dateStr].push(entry);
  };
  for (const p of pieces) {
    if (p.production_date) addEntry(p.production_date.slice(0, 10), { piece: p, type: 'production' });
    if (p.scheduled_for) addEntry(p.scheduled_for.slice(0, 10), { piece: p, type: 'publication' });
  }

  const today = new Date().toISOString().slice(0, 10);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  const productionCount = pieces.filter(p => p.production_date).length;
  const publicationCount = pieces.filter(p => p.scheduled_for).length;

  const endBlanks = (7 - ((daysInMonth + startDayOfWeek) % 7)) % 7;

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, pieceId: string, entryType: 'production' | 'publication') => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ pieceId, entryType }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dropTarget !== dateStr) setDropTarget(dateStr);
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  const handleDrop = (e: React.DragEvent, targetDate: string) => {
    e.preventDefault();
    setDropTarget(null);
    try {
      const { pieceId, entryType } = JSON.parse(e.dataTransfer.getData('text/plain'));
      const field = entryType === 'production' ? 'production_date' : 'scheduled_for';
      updatePiece.mutate({ id: pieceId, [field]: targetDate });
    } catch { /* ignore bad data */ }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={prevMonth}
              className="p-1.5 bg-white dark:bg-card border border-border rounded-md hover:bg-slate-50 dark:hover:bg-muted text-muted-foreground transition-colors shadow-sm"
            >
              <ChevronLeft className="w-[18px] h-[18px]" />
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 bg-white dark:bg-card border border-border rounded-md hover:bg-slate-50 dark:hover:bg-muted text-muted-foreground transition-colors shadow-sm"
            >
              <ChevronRight className="w-[18px] h-[18px]" />
            </button>
          </div>
          <h2 className="text-lg font-bold text-foreground capitalize">{monthName}</h2>
        </div>
        <div className="flex items-center gap-6 text-sm font-medium">
          <button onClick={goToday} className="text-muted-foreground hover:text-foreground transition-colors">
            Hoje
          </button>
          <div className="hidden sm:flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-muted-foreground text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              Gravacao ({productionCount})
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
              Publicacao ({publicationCount})
            </span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="bg-white dark:bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          {/* Days of week header */}
          <div className="grid grid-cols-7 border-b border-border bg-slate-50/80 dark:bg-muted/50">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map((d) => (
              <div key={d} className="py-3 text-center text-xs font-medium text-muted-foreground">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 auto-rows-[120px]">
            {/* Leading blanks */}
            {Array.from({ length: startDayOfWeek }).map((_, i) => (
              <div key={`blank-${i}`} className="border-b border-r border-border/50 bg-slate-50/30 dark:bg-muted/10 p-2" />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayEntries = entriesByDate[dateStr] || [];
              const isToday = dateStr === today;
              const isDragOver = dropTarget === dateStr;

              return (
                <div
                  key={dateStr}
                  onDragOver={(e) => handleDragOver(e, dateStr)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, dateStr)}
                  className={`border-b border-r border-border/50 p-2 text-left transition-colors hover:bg-slate-50 dark:hover:bg-muted/30 ${
                    isDragOver ? 'bg-blue-50 dark:bg-blue-950/30 ring-2 ring-blue-400 ring-inset' : ''
                  }`}
                >
                  <span className={`text-sm font-medium ${
                    isToday ? 'text-blue-600 font-bold' : 'text-muted-foreground'
                  }`}>
                    {day}
                  </span>

                  <div className="mt-1 flex flex-col gap-1">
                    {dayEntries.slice(0, 3).map((entry, ei) => {
                      const isProd = entry.type === 'production';
                      return (
                        <div
                          key={`${entry.piece.id}-${entry.type}-${ei}`}
                          draggable
                          onDragStart={(e) => handleDragStart(e, entry.piece.id, entry.type)}
                          className={`text-[11px] font-medium px-2 py-1 rounded truncate flex items-center gap-1.5 cursor-grab active:cursor-grabbing transition-colors select-none ${
                            isProd
                              ? 'bg-amber-100/60 text-amber-800 hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:hover:bg-amber-950/50'
                              : 'bg-sky-100/60 text-sky-800 hover:bg-sky-100 dark:bg-sky-950/30 dark:text-sky-400 dark:hover:bg-sky-950/50'
                          }`}
                          title={`${isProd ? 'Gravacao' : 'Publicacao'}: ${entry.piece.title || 'Sem titulo'} — arraste para mover`}
                        >
                          <span className={`flex-shrink-0 w-1.5 h-1.5 rounded-full ${isProd ? 'bg-amber-400' : 'bg-sky-500'}`} />
                          <span className="truncate">
                            {FORMAT_LABELS[entry.piece.format] || entry.piece.format}: {entry.piece.title || 'Sem titulo'}
                          </span>
                        </div>
                      );
                    })}
                    {dayEntries.length > 3 && (
                      <span className="text-[10px] text-muted-foreground pl-1 font-medium">+{dayEntries.length - 3} mais</span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Trailing blanks */}
            {Array.from({ length: endBlanks }).map((_, i) => (
              <div key={`end-blank-${i}`} className="border-b border-r border-border/50 bg-slate-50/30 dark:bg-muted/10 p-2" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Publish Popover ──────────────────────────────────────────────────────

function PublishPopover({ piece, platform, mediaAssets, sharedTexts, onTextGenerated }: {
  piece: ContentPiece;
  platform: 'linkedin' | 'x' | 'threads';
  mediaAssets: { id: string; public_url: string | null; position: number }[];
  sharedTexts?: Record<string, string>;
  onTextGenerated?: (platform: string, text: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [postText, setPostText] = useState('');
  const [generated, setGenerated] = useState(false);
  const [scheduleMode, setScheduleMode] = useState<'now' | 'schedule'>('now');
  const [scheduledAt, setScheduledAt] = useState('');
  const [suggestedTime, setSuggestedTime] = useState('');
  const [selectedVisualIds, setSelectedVisualIds] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();
  const generatePost = useGenerateSocialPost();
  const createPub = useCreatePublication();
  const cancelPub = useCancelPublication();
  const { data: accounts = [] } = useSocialAccounts();
  const { data: publications = [], refetch: refetchPubs } = useContentPublications(piece.id);
  const isPublished = publications.some(p => p.platform === platform && p.status === 'published');
  const scheduledPub = publications.find(p => p.platform === platform && p.status === 'scheduled');
  const isScheduled = !!scheduledPub;

  // Fetch own assets (always when dialog open)
  const { data: ownAssets = [] } = useContentAssets(open ? piece.id : undefined);
  const ownSlides = ownAssets.filter(a => a.type === 'slide');
  const visuals = mediaAssets.length > 0 ? mediaAssets : ownSlides.map(a => ({ id: a.id, public_url: a.public_url, position: a.position }));

  // Initialize selection when visuals load
  useEffect(() => {
    if (open && visuals.length > 0 && selectedVisualIds.size === 0) {
      setSelectedVisualIds(new Set(visuals.map(v => v.id)));
    }
  }, [open, visuals.length]);

  // Pre-fill scheduledAt when switching to schedule mode with a suggested time
  useEffect(() => {
    if (scheduleMode === 'schedule' && suggestedTime && !scheduledAt) {
      setScheduledAt(suggestedTime);
    }
  }, [scheduleMode, suggestedTime]);

  const toggleVisual = (id: string) => {
    setSelectedVisualIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedVisuals = visuals.filter(v => selectedVisualIds.has(v.id));
  const selectedIds = selectedVisuals.map(v => v.id);

  // Compute next optimal posting time for this platform
  const formatDatetimeLocal = (d: Date): string => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const getNextOptimalSlot = (_llmSuggestion?: string | null): string => {
    const peakHours: Record<string, number[]> = {
      linkedin: [8, 9, 10],
      x: [12, 13],
      threads: [12, 13, 19, 20],
    };
    const hours = peakHours[platform] || [9, 10];
    const now = new Date();
    for (let dayOffset = 0; dayOffset <= 1; dayOffset++) {
      for (const hour of hours) {
        const target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset, hour, 0, 0);
        if (target.getTime() > now.getTime()) {
          return formatDatetimeLocal(target);
        }
      }
    }
    const fallback = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, hours[0], 0, 0);
    return formatDatetimeLocal(fallback);
  };

  const applySuggestedTime = (post: { best_posting_time?: string | null }) => {
    const slot = getNextOptimalSlot(post.best_posting_time);
    setSuggestedTime(slot);
    if (!scheduledAt) setScheduledAt(slot);
  };

  const account = accounts.find(a => a.platform === platform);
  const isLinkedin = platform === 'linkedin';
  const isThreads = platform === 'threads';
  const PlatformIcon = isLinkedin ? Linkedin : isThreads ? MessageSquare : Twitter;
  const platformLabel = isLinkedin ? 'LinkedIn' : isThreads ? 'Threads' : 'X';
  const maxChars = isLinkedin ? 3000 : isThreads ? 500 : 280;
  const handleOpen = () => {
    setOpen(true);
    if (!generated) {
      // If there's an existing scheduled/draft publication, load its text
      const existingPub = publications.find(p => p.platform === platform && (p.status === 'scheduled' || p.status === 'draft'));
      if (existingPub) {
        setPostText(existingPub.post_text || '');
        setGenerated(true);
        if (existingPub.scheduled_at) {
          setScheduleMode('schedule');
          // Format to datetime-local
          const d = new Date(existingPub.scheduled_at);
          const pad = (n: number) => String(n).padStart(2, '0');
          setScheduledAt(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
        }
        return;
      }
      // Threads can reuse X text as starting point
      const crossPostSource = platform === 'threads' ? sharedTexts?.['x'] : undefined;
      if (crossPostSource) {
        setPostText(crossPostSource);
        setGenerated(true);
        const slot = getNextOptimalSlot();
        setSuggestedTime(slot);
        setScheduleMode('schedule');
        setScheduledAt(slot);
        return;
      }
      generatePost.mutate(
        { pieceId: piece.id, platform },
        {
          onSuccess: (post) => {
            const fullText = post.hashtags?.length
              ? `${post.content}\n\n${post.hashtags.join(' ')}`
              : post.content;
            setPostText(fullText);
            setGenerated(true);
            onTextGenerated?.(platform, fullText);
            applySuggestedTime(post);
          },
        },
      );
    }
  };

  const handleRegenerate = () => {
    setGenerated(false);
    generatePost.mutate(
      { pieceId: piece.id, platform },
      {
        onSuccess: (post) => {
          const fullText = post.hashtags?.length
            ? `${post.content}\n\n${post.hashtags.join(' ')}`
            : post.content;
          setPostText(fullText);
          setGenerated(true);
          onTextGenerated?.(platform, fullText);
          applySuggestedTime(post);
        },
      },
    );
  };

  const handlePublish = () => {
    if (!postText.trim()) return;
    createPub.mutate(
      {
        piece_id: piece.id,
        platform,
        post_text: postText,
        media_asset_ids: (isLinkedin || isThreads) ? selectedIds : selectedIds.slice(0, 1),
        publish_now: scheduleMode === 'now',
        scheduled_at: scheduleMode === 'schedule' ? scheduledAt || null : null,
      },
      {
        onSuccess: (data: any) => {
          // Auto-schedule Threads when scheduling X (same text, Threads optimal time)
          if (platform === 'x' && scheduleMode === 'schedule') {
            const threadsHours = [12, 13, 19, 20];
            const now = new Date();
            let threadsSlot: Date | null = null;
            for (let dayOff = 0; dayOff <= 1 && !threadsSlot; dayOff++) {
              for (const h of threadsHours) {
                const t = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOff, h, 0, 0);
                if (t.getTime() > now.getTime()) { threadsSlot = t; break; }
              }
            }
            if (!threadsSlot) threadsSlot = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 12, 0, 0);
            createPub.mutate({
              piece_id: piece.id,
              platform: 'threads',
              post_text: postText,
              media_asset_ids: selectedIds,
              scheduled_at: threadsSlot.toISOString(),
            });
          }

          setOpen(false);
          setGenerated(false);
          setPostText('');
          setScheduleMode('now');
          setScheduledAt('');
          setSuggestedTime('');
          setSelectedVisualIds(new Set());
          const postUrl = data?.postUrl;
          if (postUrl) {
            navigator.clipboard.writeText(postUrl).catch(() => {});
          }
        },
      },
    );
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className={`h-8 gap-1 text-xs ${
          isPublished
            ? 'border-green-300 text-green-700 bg-green-50/50'
            : isScheduled
            ? 'border-orange-300 text-orange-700 bg-orange-50/50'
            : isLinkedin ? 'hover:border-blue-300 hover:text-blue-700'
            : isThreads ? 'hover:border-purple-300 hover:text-purple-700'
            : 'hover:border-gray-400'
        }`}
        onClick={handleOpen}
      >
        {isPublished ? (
          <Check className="w-3 h-3 text-green-600" />
        ) : isScheduled ? (
          <Clock className="w-3 h-3 text-orange-500" />
        ) : (
          <PlatformIcon className={`w-3 h-3 ${isLinkedin ? 'text-blue-600' : isThreads ? 'text-purple-600' : ''}`} />
        )}
        {platformLabel}
        {isScheduled && scheduledPub?.scheduled_at && (
          <>
            <span className="text-[10px] text-orange-600 font-normal">
              {new Date(scheduledPub.scheduled_at).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
            </span>
            <span
              role="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                cancelPub.mutate(scheduledPub.id, {
                  onSuccess: () => {
                    queryClient.invalidateQueries({ queryKey: ['content-publications', piece.id] });
                    refetchPubs();
                  },
                });
              }}
              className="ml-0.5 rounded-full hover:bg-red-100 p-0.5 transition-colors"
            >
              <X className="w-3 h-3 text-red-500" />
            </span>
          </>
        )}
      </Button>

      {open && (
        <Dialog open onOpenChange={(v) => { if (!v) setOpen(false); }}>
          <DialogContent className="max-w-3xl w-[95vw] sm:w-full p-0 gap-0 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b">
              <div className="flex items-center gap-2">
                <PlatformIcon className={`w-5 h-5 ${isLinkedin ? 'text-blue-600' : isThreads ? 'text-purple-600' : ''}`} />
                <span className="text-base font-semibold">Publicar no {platformLabel}</span>
                {!account && (
                  <Badge variant="outline" className="text-[10px] text-amber-600">Nao conectado</Badge>
                )}
              </div>
              {generated && (
                <button
                  onClick={handleRegenerate}
                  disabled={generatePost.isPending}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {generatePost.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                  {platform === 'threads' && sharedTexts?.['x'] && !generatePost.data ? 'Gerar versao Threads' : 'Regenerar texto'}
                </button>
              )}
            </div>

            {/* Loading */}
            {generatePost.isPending && !generated && (
              <div className="flex items-center justify-center py-16 gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
                <span className="text-sm text-muted-foreground">Gerando post otimizado para {platformLabel}...</span>
              </div>
            )}

            {/* Error */}
            {generatePost.isError && !generated && !generatePost.isPending && (
              <div className="text-center py-12 space-y-3">
                <p className="text-sm text-red-600">Erro ao gerar post</p>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={handleRegenerate}>
                  <RotateCcw className="w-3.5 h-3.5" /> Tentar novamente
                </Button>
              </div>
            )}

            {/* Content: text + visuals side by side */}
            {(generated || postText) && (
              <div className="flex flex-col sm:flex-row">
                {/* Left: text editor */}
                <div className="flex-1 p-3 sm:p-5 space-y-3 min-w-0">
                  <Textarea
                    value={postText}
                    onChange={(e) => setPostText(e.target.value)}
                    rows={isLinkedin ? 12 : isThreads ? 8 : 5}
                    className="text-sm resize-y"
                    placeholder={`Texto do post para ${platformLabel}...`}
                  />
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${postText.length > maxChars ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                      {postText.length}/{maxChars} chars
                    </span>
                  </div>

                  {/* Schedule */}
                  <div className="flex items-center gap-2 pt-2 border-t flex-wrap">
                    <button
                      onClick={() => setScheduleMode('now')}
                      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-colors ${
                        scheduleMode === 'now' ? 'bg-orange-100 text-orange-700 font-medium' : 'text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      <Send className="w-3.5 h-3.5" /> Agora
                    </button>
                    <button
                      onClick={() => setScheduleMode('schedule')}
                      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-colors ${
                        scheduleMode === 'schedule' ? 'bg-blue-100 text-blue-700 font-medium' : 'text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" /> Agendar
                    </button>
                    {scheduleMode === 'schedule' && (
                      <input
                        type="datetime-local"
                        value={scheduledAt}
                        onChange={(e) => setScheduledAt(e.target.value)}
                        className="text-xs border rounded px-2 py-1.5 h-8 w-full sm:w-auto sm:flex-1"
                      />
                    )}
                  </div>
                  {suggestedTime && scheduleMode === 'now' && (
                    <button
                      onClick={() => { setScheduleMode('schedule'); setScheduledAt(suggestedTime); }}
                      className="flex items-center gap-1.5 text-[11px] text-orange-600 hover:text-orange-700 transition-colors"
                    >
                      <Clock className="w-3 h-3" />
                      Agendar no horario ideal: {new Date(suggestedTime).toLocaleString('pt-BR', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}
                    </button>
                  )}

                  {/* Publish button */}
                  <Button
                    className="w-full gap-2"
                    onClick={handlePublish}
                    disabled={createPub.isPending || !postText.trim() || !account || (scheduleMode === 'schedule' && !scheduledAt)}
                  >
                    {createPub.isPending
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : scheduleMode === 'now' ? <Send className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    {scheduleMode === 'now' ? 'Publicar agora' : 'Agendar publicacao'}
                  </Button>
                </div>

                {/* Right: visual selection */}
                {visuals.length > 0 && (
                  <div className="w-full sm:w-64 border-t sm:border-t-0 sm:border-l p-3 sm:p-4 bg-muted/20 space-y-3 shrink-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Image className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">
                          {selectedVisualIds.size}/{visuals.length} visuais
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          if (selectedVisualIds.size === visuals.length) setSelectedVisualIds(new Set());
                          else setSelectedVisualIds(new Set(visuals.map(v => v.id)));
                        }}
                        className="text-[10px] text-muted-foreground hover:text-foreground"
                      >
                        {selectedVisualIds.size === visuals.length ? 'Nenhum' : 'Todos'}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {visuals.map((asset) => {
                        const isSelected = selectedVisualIds.has(asset.id);
                        return (
                          <button
                            key={asset.id}
                            type="button"
                            onClick={() => toggleVisual(asset.id)}
                            className="relative group"
                          >
                            <img
                              src={asset.public_url || ''}
                              alt={`Slide ${asset.position}`}
                              className={`w-full aspect-square rounded-lg border-2 object-cover transition-all ${
                                isSelected ? 'border-orange-400 opacity-100' : 'border-transparent opacity-40 grayscale'
                              }`}
                            />
                            <div className={`absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] font-bold ${
                              isSelected ? 'bg-orange-500' : 'bg-gray-400'
                            }`}>
                              {isSelected ? asset.position : ''}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    {platform === 'x' && (
                      <p className="text-[10px] text-muted-foreground">
                        Apenas 1 imagem sera enviada no X (capa)
                      </p>
                    )}
                    {isThreads && (
                      <p className="text-[10px] text-muted-foreground">
                        Threads suporta carousel (2-20 imagens)
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

// ── Piece Card ────────────────────────────────────────────────────────────

function PieceCard({ piece, compact }: { piece: ContentPiece; compact?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showAssetSheet, setShowAssetSheet] = useState(false);
  const [sharedTexts, setSharedTexts] = useState<Record<string, string>>({});
  const handleTextGenerated = (platform: string, text: string) => {
    setSharedTexts(prev => ({ ...prev, [platform]: text }));
  };
  // showPublishSheet removed — replaced by inline PublishPopover
  const { data: pieceAssets = [] } = useContentAssets(expanded ? piece.id : undefined);
  const updateStatus = useUpdatePieceStatus();
  const updatePiece = useUpdatePiece();
  const deletePiece = useDeletePiece();
  const slideAssets = pieceAssets.filter((a) => a.type === 'slide');
  const hasVisuals = slideAssets.length > 0;

  // Editable state
  const [editTitle, setEditTitle] = useState(piece.title || '');
  const [editHooks, setEditHooks] = useState(piece.hook_variations || []);
  const [editSections, setEditSections] = useState(piece.script_sections || []);
  const [editCta, setEditCta] = useState(piece.cta || '');
  const [editSocialPosts, setEditSocialPosts] = useState(piece.social_posts || []);

  const startEditing = () => {
    setEditTitle(piece.title || '');
    setEditHooks([...(piece.hook_variations || [])]);
    setEditSections([...(piece.script_sections || []).map(s => ({ ...s }))]);
    setEditCta(piece.cta || '');
    setEditSocialPosts([...(piece.social_posts || []).map(p => ({ ...p, hashtags: [...(p.hashtags || [])] }))]);
    setEditing(true);
  };

  const cancelEditing = () => setEditing(false);

  const saveEdits = () => {
    updatePiece.mutate({
      id: piece.id,
      title: editTitle,
      hook_variations: editHooks,
      script_sections: editSections,
      cta: editCta,
      social_posts: editSocialPosts.map(p => ({ ...p, char_count: p.content.length })),
    }, { onSuccess: () => setEditing(false) });
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const copyFullScript = () => {
    const src = editing ? editSections : (piece.script_sections || []);
    const hks = editing ? editHooks : (piece.hook_variations || []);
    const ttl = editing ? editTitle : piece.title;
    const cta = editing ? editCta : piece.cta;

    const sections = src
      .map((s) => {
        let text = `## ${s.heading}\n\n${s.content}`;
        if (s.camera_note) text += `\n\n_Camera: ${s.camera_note}_`;
        if (s.data_callout) text += `\n\n> ${s.data_callout}`;
        return text;
      })
      .join('\n\n---\n\n');

    const hooks = hks.map((h, i) => `${i + 1}. [${h.style}] ${h.text}`).join('\n');
    const full = `# ${ttl}\n\n## Hooks\n${hooks}\n\n---\n\n${sections}\n\n---\n\n**CTA:** ${cta || 'N/A'}`;
    copyToClipboard(full, 'full');
  };

  const statusCfg = STATUS_CONFIG[piece.status] || STATUS_CONFIG.draft;
  const createdAt = new Date(piece.created_at);
  const timeAgo = getTimeAgo(createdAt);

  return (
    <Card className={`transition-colors ${expanded ? 'border-orange-300' : ''} ${editing ? 'border-blue-300 bg-blue-50/20' : ''}`}>
      <CardContent className="p-4">
        {/* Header */}
        <div
          className="flex items-start justify-between gap-3 cursor-pointer"
          onClick={() => !editing && setExpanded(!expanded)}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {editing ? (
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="font-semibold text-sm w-full bg-white border rounded px-2 py-1"
                />
              ) : (
                <h3 className="font-semibold text-sm truncate">{piece.title || 'Sem titulo'}</h3>
              )}
              {piece.virality_score > 0 && !editing && (
                <Badge variant="outline" className={
                  piece.virality_score >= 80 ? 'border-red-300 text-red-700 bg-red-50' :
                  piece.virality_score >= 60 ? 'border-orange-300 text-orange-700 bg-orange-50' :
                  'border-gray-300 text-gray-600'
                }>
                  {piece.virality_score}%
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-[10px]">{FORMAT_LABELS[piece.format] || piece.format}</Badge>
              <Badge variant="secondary" className="text-[10px]">{TONE_LABELS[piece.tone] || piece.tone}</Badge>
              <Badge className={`text-[10px] ${statusCfg.color}`}>{statusCfg.label}</Badge>
              {piece.use_platform_data && (
                <Badge variant="outline" className="text-[10px] gap-1"><Database className="w-2.5 h-2.5" /> Dados</Badge>
              )}
              {hasVisuals && (
                <Badge variant="outline" className="text-[10px] gap-1 border-purple-300 text-purple-700 bg-purple-50"><Image className="w-2.5 h-2.5" /> {slideAssets.length} slides</Badge>
              )}
              <span className="text-[10px] text-muted-foreground">{timeAgo}</span>
            </div>
          </div>
          {!editing && (expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />)}
        </div>

        {/* Expanded content */}
        {expanded && !compact && (
          <div className="mt-4 space-y-4 border-t pt-4">
            {/* Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              {editing ? (
                <>
                  <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={saveEdits} disabled={updatePiece.isPending}>
                    {updatePiece.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                    Salvar
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={cancelEditing}>
                    <X className="w-3 h-3" /> Cancelar
                  </Button>
                </>
              ) : (
                <>
                  <Select
                    value={piece.status}
                    onValueChange={(v) => updateStatus.mutate({ id: piece.id, status: v })}
                  >
                    <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" onClick={startEditing}>
                    <Pencil className="w-3 h-3" /> Editar
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" onClick={copyFullScript}>
                    {copiedField === 'full' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    Copiar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1 text-xs"
                    onClick={() => setShowAssetSheet(true)}
                  >
                    <Image className="w-3 h-3" />
                    {hasVisuals ? `Visuais (${slideAssets.length})` : 'Visuais'}
                  </Button>
                  <PublishPopover piece={piece} platform="linkedin" mediaAssets={slideAssets.map(a => ({ id: a.id, public_url: a.public_url, position: a.position }))} sharedTexts={sharedTexts} onTextGenerated={handleTextGenerated} />
                  <PublishPopover piece={piece} platform="x" mediaAssets={slideAssets.map(a => ({ id: a.id, public_url: a.public_url, position: a.position }))} sharedTexts={sharedTexts} onTextGenerated={handleTextGenerated} />
                  <PublishPopover piece={piece} platform="threads" mediaAssets={slideAssets.map(a => ({ id: a.id, public_url: a.public_url, position: a.position }))} sharedTexts={sharedTexts} onTextGenerated={handleTextGenerated} />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 ml-auto"
                    onClick={() => deletePiece.mutate(piece.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </>
              )}
            </div>

            {/* Hooks */}
            {(editing ? editHooks : piece.hook_variations)?.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Hooks</h4>
                <div className="space-y-2">
                  {(editing ? editHooks : piece.hook_variations).map((hook, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 bg-muted/50 rounded-md">
                      <Badge variant="outline" className="text-[10px] shrink-0 mt-0.5">{hook.style}</Badge>
                      {editing ? (
                        <Textarea
                          value={hook.text}
                          onChange={(e) => {
                            const updated = [...editHooks];
                            updated[i] = { ...updated[i], text: e.target.value };
                            setEditHooks(updated);
                          }}
                          rows={2}
                          className="text-sm flex-1 resize-none bg-white"
                        />
                      ) : (
                        <p className="text-sm flex-1">{hook.text}</p>
                      )}
                      {!editing && (
                        <button
                          onClick={() => copyToClipboard(hook.text, `hook-${i}`)}
                          className="shrink-0 p-1 hover:bg-muted rounded"
                        >
                          {copiedField === `hook-${i}` ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Script sections */}
            {(editing ? editSections : piece.script_sections)?.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase">Roteiro</h4>
                  {!editing && (
                    <button
                      onClick={copyFullScript}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                    >
                      {copiedField === 'full' ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                      {copiedField === 'full' ? 'Copiado!' : 'Copiar tudo'}
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  {(editing ? editSections : piece.script_sections).map((section, i) => (
                    <div key={i} className="p-3 bg-muted/30 rounded-lg border">
                      <div className="flex items-center justify-between mb-1">
                        {editing ? (
                          <input
                            type="text"
                            value={section.heading}
                            onChange={(e) => {
                              const updated = [...editSections];
                              updated[i] = { ...updated[i], heading: e.target.value };
                              setEditSections(updated);
                            }}
                            className="text-xs font-semibold bg-white border rounded px-2 py-0.5 flex-1 mr-2"
                          />
                        ) : (
                          <span className="text-xs font-semibold">{section.heading}</span>
                        )}
                        {!editing && (
                          <button
                            onClick={() => copyToClipboard(section.content, `section-${i}`)}
                            className="p-1 hover:bg-muted rounded"
                          >
                            {copiedField === `section-${i}` ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                          </button>
                        )}
                      </div>
                      {editing ? (
                        <Textarea
                          value={section.content}
                          onChange={(e) => {
                            const updated = [...editSections];
                            updated[i] = { ...updated[i], content: e.target.value };
                            setEditSections(updated);
                          }}
                          rows={5}
                          className="text-sm resize-y bg-white mt-1"
                        />
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">{section.content}</p>
                      )}
                      {section.camera_note && !editing && (
                        <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                          <Video className="w-3 h-3" /> {section.camera_note}
                        </p>
                      )}
                      {editing && (
                        <input
                          type="text"
                          value={section.camera_note || ''}
                          onChange={(e) => {
                            const updated = [...editSections];
                            updated[i] = { ...updated[i], camera_note: e.target.value || null };
                            setEditSections(updated);
                          }}
                          placeholder="Nota de camera (opcional)"
                          className="text-xs text-blue-600 mt-2 bg-white border rounded px-2 py-0.5 w-full"
                        />
                      )}
                      {section.data_callout && !editing && (
                        <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" /> {section.data_callout}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            {(piece.cta || editing) && (
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <span className="text-xs font-semibold text-green-700">CTA:</span>
                {editing ? (
                  <Textarea
                    value={editCta}
                    onChange={(e) => setEditCta(e.target.value)}
                    rows={2}
                    className="text-sm mt-1 resize-none bg-white"
                  />
                ) : (
                  <p className="text-sm mt-1">{piece.cta}</p>
                )}
              </div>
            )}

            {/* Social Posts */}
            {(editing ? editSocialPosts : piece.social_posts)?.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Posts Sociais</h4>
                <div className="space-y-2">
                  {(editing ? editSocialPosts : piece.social_posts).map((post, i) => {
                    const PlatformIcon = post.platform === 'linkedin' ? Linkedin : post.platform === 'x' ? Twitter : MessageSquare;
                    return (
                      <div key={i} className="p-3 bg-muted/30 rounded-lg border">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <PlatformIcon className="w-3.5 h-3.5" />
                            <span className="text-xs font-semibold capitalize">{post.platform}</span>
                            <span className="text-[10px] text-muted-foreground">{editing ? post.content.length : post.char_count} chars</span>
                          </div>
                          {!editing && (
                            <button
                              onClick={() => copyToClipboard(`${post.content}\n\n${post.hashtags?.join(' ') || ''}`, `social-${i}`)}
                              className="p-1 hover:bg-muted rounded"
                            >
                              {copiedField === `social-${i}` ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                            </button>
                          )}
                        </div>
                        {editing ? (
                          <Textarea
                            value={post.content}
                            onChange={(e) => {
                              const updated = [...editSocialPosts];
                              updated[i] = { ...updated[i], content: e.target.value };
                              setEditSocialPosts(updated);
                            }}
                            rows={4}
                            className="text-sm resize-y bg-white"
                          />
                        ) : (
                          <p className="text-sm whitespace-pre-wrap">{post.content}</p>
                        )}
                        {post.hashtags?.length > 0 && !editing && (
                          <p className="text-xs text-blue-600 mt-2">{post.hashtags.join(' ')}</p>
                        )}
                        {editing && (
                          <input
                            type="text"
                            value={(post.hashtags || []).join(' ')}
                            onChange={(e) => {
                              const updated = [...editSocialPosts];
                              updated[i] = { ...updated[i], hashtags: e.target.value.split(/\s+/).filter(Boolean) };
                              setEditSocialPosts(updated);
                            }}
                            placeholder="Hashtags separadas por espaco"
                            className="text-xs text-blue-600 mt-2 bg-white border rounded px-2 py-0.5 w-full"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SEO Metadata */}
            {piece.seo_metadata?.youtube_title && !editing && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">SEO / YouTube</h4>
                <div className="p-3 bg-red-50/50 rounded-lg border space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-muted-foreground">Titulo:</span>
                      <p className="text-sm font-medium">{piece.seo_metadata.youtube_title}</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(piece.seo_metadata.youtube_title!, 'yt-title')}
                      className="p-1 hover:bg-muted rounded"
                    >
                      {copiedField === 'yt-title' ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                    </button>
                  </div>
                  {piece.seo_metadata.youtube_description && (
                    <div>
                      <span className="text-xs text-muted-foreground">Descricao:</span>
                      <p className="text-xs whitespace-pre-wrap mt-1">{piece.seo_metadata.youtube_description}</p>
                    </div>
                  )}
                  {piece.seo_metadata.tags?.length && (
                    <div className="flex flex-wrap gap-1">
                      {piece.seo_metadata.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
                      ))}
                    </div>
                  )}
                  {piece.seo_metadata.thumbnail_ideas?.length && (
                    <div>
                      <span className="text-xs text-muted-foreground">Thumbnails:</span>
                      <ul className="text-xs mt-1 space-y-1">
                        {piece.seo_metadata.thumbnail_ideas.map((idea, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <Eye className="w-3 h-3 text-muted-foreground mt-0.5 shrink-0" />
                            {idea}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Visuais (compact preview) */}
            {hasVisuals && !editing && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Visuais</h4>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {slideAssets.map((asset) => (
                    <img
                      key={asset.id}
                      src={asset.public_url || ''}
                      alt={`Slide ${asset.position}`}
                      className="w-20 h-20 rounded border object-cover shrink-0 cursor-pointer hover:ring-2 hover:ring-orange-300 transition-all"
                      onClick={() => setShowAssetSheet(true)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Meta info */}
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-2 border-t">
              {piece.model_used && <span>Modelo: {piece.model_used}</span>}
              {piece.tokens_used && <span>{piece.tokens_used} tokens</span>}
              {piece.generation_duration_ms && <span>{(piece.generation_duration_ms / 1000).toFixed(1)}s</span>}
              {piece.duration_estimate_seconds && <span>~{piece.duration_estimate_seconds}s video</span>}
            </div>
          </div>
        )}

        {/* Asset Generator Sheet */}
        {showAssetSheet && (
          <AssetGeneratorSheet
            open={showAssetSheet}
            onClose={() => setShowAssetSheet(false)}
            piece={piece}
          />
        )}

        {/* PublishSheet removed — replaced by inline PublishPopover */}
      </CardContent>
    </Card>
  );
}

// ── Docs Sheet ───────────────────────────────────────────────────────────

function DocsSheet({ onClose }: { onClose: () => void }) {
  return (
    <Sheet open onOpenChange={() => onClose()}>
      <SheetContent className="w-full sm:w-[560px] md:w-[640px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-orange-500" />
            Content Factory — Documentacao
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-6 text-sm">
          {/* Overview */}
          <section>
            <h3 className="font-semibold text-base mb-2">O que e a Content Factory?</h3>
            <p className="text-muted-foreground leading-relaxed">
              Ferramenta de IA para gerar ideias de conteudo viral e roteiros completos (hooks, script, posts sociais, SEO)
              a partir de trending topics ou temas manuais. Inspirada em ferramentas como Opus Clip, vidIQ, Castmagic e Jasper.
            </p>
          </section>

          {/* Architecture */}
          <section>
            <h3 className="font-semibold text-base mb-2">Arquitetura</h3>
            <div className="space-y-3">
              <div className="p-3 bg-muted/50 rounded-lg space-y-1.5">
                <p className="font-medium text-xs uppercase text-muted-foreground">Tabelas (Supabase PostgreSQL)</p>
                <ul className="space-y-1 text-xs">
                  <li><span className="font-mono bg-muted px-1 rounded">content_trending_cache</span> — Cache de trending topics (TTL 12h). Populado pela Perplexity.</li>
                  <li><span className="font-mono bg-muted px-1 rounded">content_pieces</span> — Conteudos gerados: titulo, hooks, roteiro, posts sociais, SEO, status.</li>
                  <li><span className="font-mono bg-muted px-1 rounded">app_configs</span> — Prompts e API keys configuraveis (trending_prompt, generate_prompt, etc).</li>
                  <li><span className="font-mono bg-muted px-1 rounded">api_configs</span> — Credenciais das APIs (Perplexity, OpenAI, Anthropic, OpenRouter).</li>
                </ul>
              </div>

              <div className="p-3 bg-muted/50 rounded-lg space-y-1.5">
                <p className="font-medium text-xs uppercase text-muted-foreground">Edge Functions (Supabase Deno)</p>
                <ul className="space-y-1 text-xs">
                  <li><span className="font-mono bg-muted px-1 rounded">content-trending</span> — Busca trending topics via LLM com acesso web (Perplexity). Cacheia por 12h.</li>
                  <li><span className="font-mono bg-muted px-1 rounded">content-generate</span> — Gera conteudo completo (hooks, roteiro, posts, SEO) a partir de qualquer input.</li>
                </ul>
              </div>

              <div className="p-3 bg-muted/50 rounded-lg space-y-1.5">
                <p className="font-medium text-xs uppercase text-muted-foreground">Servicos Compartilhados</p>
                <ul className="space-y-1 text-xs">
                  <li><span className="font-mono bg-muted px-1 rounded">callLLM()</span> — Servico provider-agnostico com fallback automatico. Suporta OpenAI, Anthropic, OpenRouter.</li>
                  <li><span className="font-mono bg-muted px-1 rounded">apiCostService</span> — Log automatico de custos por chamada (tokens, modelo, duracao).</li>
                  <li><span className="font-mono bg-muted px-1 rounded">jsonParser</span> — Parser robusto de JSON retornado por LLMs (limpa markdown, extrai arrays/objetos).</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Tabs */}
          <section>
            <h3 className="font-semibold text-base mb-2">Abas</h3>
            <div className="space-y-3">
              <div className="flex gap-3">
                <Flame className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Trending</p>
                  <p className="text-xs text-muted-foreground">
                    Busca trending topics em tempo real usando Perplexity (via OpenRouter). Mostra topicos com scores de
                    relevancia e viralidade. Clique em um topico para gerar conteudo a partir dele. Use "Limpar" para
                    resetar o cache e buscar novos topicos.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Sparkles className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Criar</p>
                  <p className="text-xs text-muted-foreground">
                    Gere conteudo a partir de qualquer tema manual. Escolha formato (Short, Video Longo, Carrossel, Stories)
                    e tom (Polemico, Educativo, Storytelling, Roast, Data, Mitos). Opcionalmente enriqueca com dados da
                    plataforma (barreiras dos leads, areas mais buscadas no job board).
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <FileText className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Historico</p>
                  <p className="text-xs text-muted-foreground">
                    Lista de todos os conteudos gerados com filtros por status e formato. Cada card pode ser expandido
                    para ver o conteudo completo, editado inline, e ter o status atualizado.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Workflow */}
          <section>
            <h3 className="font-semibold text-base mb-2">Fluxo de Trabalho</h3>
            <ol className="space-y-2 text-xs text-muted-foreground list-decimal list-inside">
              <li><span className="text-foreground font-medium">Buscar ideias:</span> Aba Trending ou digite manualmente na aba Criar</li>
              <li><span className="text-foreground font-medium">Gerar roteiro:</span> Escolha formato e tom, clique em "Gerar Roteiro"</li>
              <li><span className="text-foreground font-medium">Revisar e editar:</span> Expanda o card, clique em "Editar", ajuste hooks, roteiro, posts e CTA</li>
              <li><span className="text-foreground font-medium">Salvar:</span> Clique em "Salvar" para persistir as edicoes</li>
              <li><span className="text-foreground font-medium">Aprovar:</span> Mude o status para "Aprovado" quando estiver pronto para producao</li>
              <li><span className="text-foreground font-medium">Copiar:</span> Use "Copiar Roteiro" para copiar tudo formatado, ou copie secoes individuais</li>
            </ol>
          </section>

          {/* Content Output */}
          <section>
            <h3 className="font-semibold text-base mb-2">O que e gerado</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: '🎣', label: 'Hooks', desc: '4 variacoes (pergunta, afirmacao, dado, provocacao) com score' },
                { icon: '🎬', label: 'Roteiro', desc: 'Secoes completas com falas, notas de camera e grafismos' },
                { icon: '📱', label: 'Posts Sociais', desc: 'LinkedIn, X/Twitter, Instagram — conteudo independente por plataforma' },
                { icon: '🔍', label: 'SEO/YouTube', desc: 'Titulo otimizado, descricao, tags, ideias de thumbnail' },
                { icon: '📢', label: 'CTA', desc: 'Call to action final provocativo e especifico' },
                { icon: '📊', label: 'Virality Score', desc: 'Estimativa 0-100 de potencial viral do conteudo' },
              ].map((item) => (
                <div key={item.label} className="p-2 bg-muted/30 rounded-lg">
                  <p className="text-xs font-medium">{item.icon} {item.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* LLM Config */}
          <section>
            <h3 className="font-semibold text-base mb-2">Configuracao de LLMs</h3>
            <p className="text-xs text-muted-foreground mb-2">
              Clique no botao "LLMs" no header para configurar qual API usar para cada funcao:
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg">
                <Flame className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                <div>
                  <p className="text-xs font-medium">Trending — Recomendado: Perplexity (via OpenRouter)</p>
                  <p className="text-[10px] text-muted-foreground">Tem acesso a web em tempo real para pesquisar noticias e tendencias atuais.</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg">
                <Sparkles className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                <div>
                  <p className="text-xs font-medium">Geracao — Recomendado: Claude ou GPT-4o</p>
                  <p className="text-[10px] text-muted-foreground">Melhor qualidade de escrita criativa e aderencia ao formato JSON estruturado.</p>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">
              Os prompts podem ser visualizados e editados clicando em "ver prompt" ao lado de cada API.
              Deixe vazio para usar o prompt padrao embutido no sistema. Gerenciar APIs e credenciais em /admin/configuracoes-apis.
            </p>
          </section>

          {/* Integrations */}
          <section>
            <h3 className="font-semibold text-base mb-2">Integracoes</h3>
            <div className="space-y-2 text-xs">
              <div className="p-2 bg-muted/30 rounded-lg">
                <p className="font-medium">Perplexity AI (via OpenRouter)</p>
                <p className="text-muted-foreground">Pesquisa web em tempo real para trending topics. Configurado em api_configs como "perplexity_api".</p>
              </div>
              <div className="p-2 bg-muted/30 rounded-lg">
                <p className="font-medium">OpenAI / Anthropic / OpenRouter</p>
                <p className="text-muted-foreground">Geracao de conteudo. callLLM() com fallback automatico — se a API primaria falhar (429, 500), tenta a API de fallback configurada.</p>
              </div>
              <div className="p-2 bg-muted/30 rounded-lg">
                <p className="font-medium">Dados da Plataforma (opcional)</p>
                <p className="text-muted-foreground">Quando "Enriquecer com dados da plataforma" esta ativo, o sistema consulta career_evaluations (barreiras dos leads nos ultimos 30 dias) e usage_logs do job board (areas mais buscadas nos ultimos 14 dias) para dar contexto real ao conteudo gerado.</p>
              </div>
              <div className="p-2 bg-muted/30 rounded-lg">
                <p className="font-medium">API Cost Tracking</p>
                <p className="text-muted-foreground">Cada chamada LLM e logada automaticamente em api_cost_logs (tokens, custo, modelo, duracao). Visivel em /admin/custos-api.</p>
              </div>
            </div>
          </section>

          {/* Status Flow */}
          <section>
            <h3 className="font-semibold text-base mb-2">Status do Conteudo</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <Badge key={key} className={`text-[10px] ${cfg.color}`}>{cfg.label}</Badge>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">
              Draft → Aprovado → Agendado → Publicado. Ou Rejeitado se o conteudo nao for utilizado.
            </p>
          </section>

          {/* Formats & Tones */}
          <section>
            <h3 className="font-semibold text-base mb-2">Formatos e Tons</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-medium mb-1">Formatos</p>
                <ul className="space-y-0.5 text-[10px] text-muted-foreground">
                  <li>Short — Reels/TikTok/Shorts (30-60s)</li>
                  <li>Video Longo — YouTube (8-15min)</li>
                  <li>Carrossel — Instagram (7-10 slides)</li>
                  <li>Stories — Instagram (5-7 stories)</li>
                </ul>
              </div>
              <div>
                <p className="text-xs font-medium mb-1">Tons</p>
                <ul className="space-y-0.5 text-[10px] text-muted-foreground">
                  <li>Polemico — Opiniao forte, confronto</li>
                  <li>Educativo — Dados claros, passo-a-passo</li>
                  <li>Story — Arco narrativo, emocao</li>
                  <li>Roast — Critica com humor acido</li>
                  <li>Data — Lidere com numeros</li>
                  <li>Mitos — Destrua crencas populares</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Deploy info */}
          <section className="border-t pt-4">
            <p className="text-[10px] text-muted-foreground">
              <span className="font-medium">Deploy:</span> npx supabase functions deploy content-trending content-generate<br />
              <span className="font-medium">Migration:</span> 20260323100000_content_factory.sql + 20260323500000_content_factory_prompts.sql<br />
              <span className="font-medium">Auth:</span> Admin-only (requireAdmin). verify_jwt = false no config.toml.
            </p>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `${diffMin}min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}d`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

// ── Product Showcases Management Sheet ───────────────────────────────────

function ProductShowcasesSheet({ onClose }: { onClose: () => void }) {
  const { data: products = [], isLoading } = useProductShowcases();
  const saveProduct = useSaveProductShowcase();
  const deleteProduct = useDeleteProductShowcase();
  const [editing, setEditing] = useState<ProductShowcase | null>(null);
  const [isNew, setIsNew] = useState(false);

  const handleNew = () => {
    setIsNew(true);
    setEditing({
      id: '',
      product_key: '',
      display_name: '',
      description: '',
      key_features: [],
      talking_points: [],
      demo_instructions: '',
      cta_suggestion: '',
      enabled: true,
      sort_order: products.length,
    });
  };

  const handleSave = () => {
    if (!editing?.product_key?.trim() || !editing?.display_name?.trim()) return;
    saveProduct.mutate({
      product_key: editing.product_key,
      display_name: editing.display_name,
      description: editing.description,
      key_features: editing.key_features,
      talking_points: editing.talking_points,
      demo_instructions: editing.demo_instructions,
      cta_suggestion: editing.cta_suggestion,
      enabled: editing.enabled,
      sort_order: editing.sort_order,
    }, {
      onSuccess: () => {
        setEditing(null);
        setIsNew(false);
      },
    });
  };

  return (
    <Sheet open onOpenChange={() => onClose()}>
      <SheetContent className="w-full sm:w-[600px] md:w-[700px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-base">
            <FileText className="w-4 h-4" />
            Produtos para Showcase
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          <p className="text-xs text-muted-foreground">
            Configure os produtos da plataforma que podem ser integrados nos roteiros de conteudo.
            Cada produto tem talking points, instrucoes de demo e CTA que a IA usa para gerar o roteiro.
          </p>

          <Button size="sm" onClick={handleNew} className="gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Novo Produto
          </Button>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-3">
              {products.map((p) => (
                <Card key={p.id} className={`${!p.enabled ? 'opacity-50' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{p.display_name}</span>
                          <Badge variant="secondary" className="text-[10px] font-mono">{p.product_key}</Badge>
                          {!p.enabled && <Badge variant="outline" className="text-[10px]">desativado</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.description}</p>
                        <div className="flex gap-4 mt-2 text-[10px] text-muted-foreground">
                          <span>{(p.key_features as any)?.length || 0} features</span>
                          <span>{(p.talking_points as any)?.length || 0} talking points</span>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="sm" onClick={() => { setEditing(p); setIsNew(false); }}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Remover "${p.display_name}"?`)) {
                              deleteProduct.mutate(p.id);
                            }
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Edit/Create Dialog */}
        {editing && (
          <Dialog open onOpenChange={() => { setEditing(null); setIsNew(false); }}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <h3 className="font-semibold text-base mb-4">
                {isNew ? 'Novo Produto' : `Editar: ${editing.display_name}`}
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Chave (unica)</Label>
                    <Input
                      value={editing.product_key}
                      onChange={(e) => setEditing({ ...editing, product_key: e.target.value })}
                      placeholder="resume_pass"
                      disabled={!isNew}
                      className="text-sm font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Nome de exibicao</Label>
                    <Input
                      value={editing.display_name}
                      onChange={(e) => setEditing({ ...editing, display_name: e.target.value })}
                      placeholder="ResumePass AI"
                      className="text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Descricao</Label>
                  <Textarea
                    value={editing.description || ''}
                    onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                    placeholder="O que o produto faz, em 1-2 frases..."
                    rows={2}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Key Features (uma por linha)</Label>
                  <Textarea
                    value={Array.isArray(editing.key_features) ? editing.key_features.join('\n') : ''}
                    onChange={(e) => setEditing({ ...editing, key_features: e.target.value.split('\n').filter(Boolean) })}
                    placeholder="Formato ATS-friendly&#10;Traducao contextual&#10;PDF pronto em minutos"
                    rows={4}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Talking Points (um por linha) — frases prontas pra IA usar no roteiro</Label>
                  <Textarea
                    value={Array.isArray(editing.talking_points) ? editing.talking_points.join('\n') : ''}
                    onChange={(e) => setEditing({ ...editing, talking_points: e.target.value.split('\n').filter(Boolean) })}
                    placeholder="Seu curriculo brasileiro? Lixo nos EUA...&#10;O ATS rejeita 75% dos curriculos..."
                    rows={5}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Instrucoes de demo (camera notes pro editor)</Label>
                  <Textarea
                    value={editing.demo_instructions || ''}
                    onChange={(e) => setEditing({ ...editing, demo_instructions: e.target.value })}
                    placeholder="CUTAWAY: tela do produto. Mostrar upload → resultado..."
                    rows={3}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">CTA sugerido</Label>
                  <Input
                    value={editing.cta_suggestion || ''}
                    onChange={(e) => setEditing({ ...editing, cta_suggestion: e.target.value })}
                    placeholder="Link do produto na descricao."
                    className="text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Ordem</Label>
                    <Input
                      type="number"
                      value={editing.sort_order}
                      onChange={(e) => setEditing({ ...editing, sort_order: parseInt(e.target.value) || 0 })}
                      className="text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-5">
                    <Switch
                      checked={editing.enabled}
                      onCheckedChange={(v) => setEditing({ ...editing, enabled: v })}
                    />
                    <Label className="text-xs">{editing.enabled ? 'Ativo' : 'Desativado'}</Label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => { setEditing(null); setIsNew(false); }}>
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={saveProduct.isPending || !editing.product_key?.trim() || !editing.display_name?.trim()}
                    className="gap-1.5"
                  >
                    {saveProduct.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Salvar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </SheetContent>
    </Sheet>
  );
}
