import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Flame, Sparkles, Database, Loader2, Copy, Check,
  Trash2, ChevronDown, ChevronRight, Video, FileText,
  Image, MessageSquare, TrendingUp, Zap, RefreshCw,
  Linkedin, Twitter, Youtube, Eye, Settings2, Save,
} from 'lucide-react';
import {
  useTrendingTopics,
  useContentPieces,
  useFetchTrending,
  useClearTrendingCache,
  useGenerateContent,
  useUpdatePieceStatus,
  useDeletePiece,
  useAvailableApis,
  useContentFactoryConfig,
  useSaveContentFactoryConfig,
  type ContentPiece,
  type TrendingTopic,
  type ContentFormat,
  type ContentTone,
} from '@/hooks/useAdminContentFactory';
import { useToast } from '@/hooks/use-toast';

// ── Constants ────────────────────────────────────────────────────────────

const FORMAT_OPTIONS: { value: ContentFormat; label: string; icon: typeof Video }[] = [
  { value: 'short', label: 'Short (Reels/TikTok)', icon: Video },
  { value: 'long_video', label: 'YouTube Longo', icon: Youtube },
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

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: 'Rascunho', color: 'bg-gray-100 text-gray-700' },
  approved: { label: 'Aprovado', color: 'bg-blue-100 text-blue-700' },
  in_production: { label: 'Producao', color: 'bg-amber-100 text-amber-700' },
  recorded: { label: 'Gravado', color: 'bg-purple-100 text-purple-700' },
  published: { label: 'Publicado', color: 'bg-green-100 text-green-700' },
  discarded: { label: 'Descartado', color: 'bg-red-100 text-red-700' },
};

const FORMAT_LABELS: Record<string, string> = {
  short: 'Short', long_video: 'YouTube', carousel: 'Carrossel', stories: 'Stories',
};

const TONE_LABELS: Record<string, string> = {
  polemic: 'Polemico', educational: 'Educativo', storytelling: 'Story',
  roast: 'Roast', data_story: 'Data', myth_busting: 'Mitos',
};

// ── Main Component ───────────────────────────────────────────────────────

export default function AdminContentFactory() {
  const [activeMode, setActiveMode] = useState<'trending' | 'create' | 'history'>('create');
  const [showConfig, setShowConfig] = useState(false);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-orange-100 to-red-100 rounded-xl">
              <Zap className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Content Factory</h1>
              <p className="text-sm text-muted-foreground">
                Trending topics, ideias e roteiros completos com IA.
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className={`gap-1.5 ${showConfig ? 'bg-muted' : ''}`}
            onClick={() => setShowConfig((v) => !v)}
          >
            <Settings2 className="w-4 h-4" />
            LLMs
          </Button>
        </div>

        {/* LLM Config Panel */}
        {showConfig && <LLMConfigPanel />}

        {/* Mode Tabs */}
        <div className="flex bg-muted rounded-lg p-1 gap-1">
          {[
            { id: 'trending' as const, label: 'Trending', icon: Flame },
            { id: 'create' as const, label: 'Criar', icon: Sparkles },
            { id: 'history' as const, label: 'Historico', icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveMode(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeMode === tab.id
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

        {activeMode === 'trending' && <TrendingTab />}
        {activeMode === 'create' && <CreateTab />}
        {activeMode === 'history' && <HistoryTab />}
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
  const [trendingPrompt, setTrendingPrompt] = useState('');
  const [generatePrompt, setGeneratePrompt] = useState('');
  const [showPrompt, setShowPrompt] = useState<'trending' | 'generate' | null>(null);

  useEffect(() => {
    if (config) {
      setTrendingApi(config.trending_api_key);
      setGenerateApi(config.generate_api_key);
      setTrendingPrompt(config.trending_prompt);
      setGeneratePrompt(config.generate_prompt);
    }
  }, [config]);

  const isLoading = apisLoading || configLoading;
  const effectiveTrending = trendingApi || config?.trending_api_key || '';
  const effectiveGenerate = generateApi || config?.generate_api_key || '';

  const handleSave = () => {
    saveConfig.mutate({
      trending_api_key: effectiveTrending,
      generate_api_key: effectiveGenerate,
      trending_prompt: trendingPrompt,
      generate_prompt: generatePrompt,
    });
  };

  return (
    <Card className="border-orange-200 bg-orange-50/30">
      <CardContent className="p-4 space-y-4">
        {/* API selectors row */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-6 flex-1 flex-wrap">
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

        <p className="text-[10px] text-muted-foreground">
          Recomendado: Perplexity para Trending (acesso a web em tempo real), Claude ou GPT-4o para Geracao.
        </p>
      </CardContent>
    </Card>
  );
}

// ── Trending Tab ──────────────────────────────────────────────────────────

function TrendingTab() {
  const { data: topics = [], isLoading } = useTrendingTopics();
  const fetchTrending = useFetchTrending();
  const clearCache = useClearTrendingCache();
  const [selectedTopic, setSelectedTopic] = useState<TrendingTopic | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {topics.length > 0
            ? `${topics.length} trending topics no cache`
            : 'Nenhum trending topic. Clique para buscar.'}
        </p>
        <div className="flex items-center gap-2">
          {topics.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => clearCache.mutate()}
              disabled={clearCache.isPending || fetchTrending.isPending}
              className="gap-1.5 text-muted-foreground"
            >
              {clearCache.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              Limpar
            </Button>
          )}
          <Button
            onClick={() => fetchTrending.mutate({ force_refresh: true })}
            disabled={fetchTrending.isPending}
            className="gap-2"
          >
            {fetchTrending.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {fetchTrending.isPending ? 'Pesquisando...' : 'Buscar Trending'}
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}

      <div className="grid gap-3">
        {topics.map((topic) => (
          <Card
            key={topic.id}
            className="cursor-pointer hover:border-orange-300 transition-colors"
            onClick={() => setSelectedTopic(topic)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Flame className="w-4 h-4 text-orange-500 shrink-0" />
                    <h3 className="font-semibold text-sm truncate">{topic.topic}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{topic.summary}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {topic.keywords?.slice(0, 3).map((kw) => (
                      <Badge key={kw} variant="secondary" className="text-[10px]">{kw}</Badge>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Badge className={topic.virality_potential >= 80 ? 'bg-red-100 text-red-700' : topic.virality_potential >= 60 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}>
                    {topic.virality_potential}% viral
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">{topic.source}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
  const [format, setFormat] = useState<ContentFormat>('short');
  const [tone, setTone] = useState<ContentTone>('polemic');
  const [usePlatformData, setUsePlatformData] = useState(false);
  const [customInstructions, setCustomInstructions] = useState('');
  const generateContent = useGenerateContent();

  const handleGenerate = () => {
    generateContent.mutate({
      input_text: `${topic.topic}\n\nContexto: ${topic.summary}\n\nAngulo sugerido: ${topic.angle}`,
      input_type: 'trending',
      trending_topic_id: topic.id,
      format,
      tone,
      use_platform_data: usePlatformData,
      custom_instructions: customInstructions || undefined,
    }, { onSuccess: () => onClose() });
  };

  return (
    <Sheet open onOpenChange={() => onClose()}>
      <SheetContent className="w-[480px] sm:w-[540px] overflow-y-auto">
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

function CreateTab() {
  const [inputText, setInputText] = useState('');
  const [format, setFormat] = useState<ContentFormat>('short');
  const [tone, setTone] = useState<ContentTone>('polemic');
  const [usePlatformData, setUsePlatformData] = useState(false);
  const [customInstructions, setCustomInstructions] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const generateContent = useGenerateContent();
  const { data: recentPieces = [] } = useContentPieces();

  const handleGenerate = () => {
    if (!inputText.trim()) return;
    generateContent.mutate({
      input_text: inputText,
      input_type: 'manual',
      format,
      tone,
      use_platform_data: usePlatformData,
      custom_instructions: customInstructions || undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Generator Card */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Sobre o que voce quer criar?</label>
            <Textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder='Ex: "Novas medidas de Trump na imigracao", "5 erros fatais ao imigrar para os EUA", ou cole um link de artigo...'
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Formato</label>
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
              <label className="text-xs font-medium text-muted-foreground">Tom</label>
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

          <div className="flex items-center gap-2">
            <Checkbox
              id="platform-data-create"
              checked={usePlatformData}
              onCheckedChange={(v) => setUsePlatformData(!!v)}
            />
            <label htmlFor="platform-data-create" className="text-sm flex items-center gap-1.5 cursor-pointer">
              <Database className="w-3.5 h-3.5 text-blue-500" />
              Enriquecer com dados da plataforma
            </label>
          </div>

          {/* Advanced toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            {showAdvanced ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            Instrucoes adicionais
          </button>

          {showAdvanced && (
            <Textarea
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="Instrucoes extras para a IA..."
              rows={2}
              className="resize-none"
            />
          )}

          <Button
            onClick={handleGenerate}
            disabled={generateContent.isPending || !inputText.trim()}
            className="w-full gap-2"
            size="lg"
          >
            {generateContent.isPending
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Gerando roteiro completo...</>
              : <><Zap className="w-4 h-4" /> Gerar Roteiro</>}
          </Button>
        </CardContent>
      </Card>

      {/* Recent pieces */}
      {recentPieces.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Ultimas criacoes</h2>
          {recentPieces.slice(0, 5).map((piece) => (
            <PieceCard key={piece.id} piece={piece} compact />
          ))}
        </div>
      )}
    </div>
  );
}

// ── History Tab ───────────────────────────────────────────────────────────

function HistoryTab() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [formatFilter, setFormatFilter] = useState<string>('all');
  const { data: pieces = [], isLoading } = useContentPieces({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    format: formatFilter !== 'all' ? formatFilter : undefined,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={formatFilter} onValueChange={setFormatFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Formato" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {FORMAT_OPTIONS.map((f) => (
              <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ml-auto">{pieces.length} itens</span>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}

      <div className="space-y-3">
        {pieces.map((piece) => (
          <PieceCard key={piece.id} piece={piece} />
        ))}
      </div>

      {!isLoading && pieces.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-12">
          Nenhum conteudo gerado ainda. Use a aba "Criar" ou "Trending" para comecar.
        </p>
      )}
    </div>
  );
}

// ── Piece Card ────────────────────────────────────────────────────────────

function PieceCard({ piece, compact }: { piece: ContentPiece; compact?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const updateStatus = useUpdatePieceStatus();
  const deletePiece = useDeletePiece();

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const copyFullScript = () => {
    const sections = (piece.script_sections || [])
      .map((s) => {
        let text = `## ${s.heading}\n\n${s.content}`;
        if (s.camera_note) text += `\n\n_Camera: ${s.camera_note}_`;
        if (s.data_callout) text += `\n\n> ${s.data_callout}`;
        return text;
      })
      .join('\n\n---\n\n');

    const hooks = (piece.hook_variations || [])
      .map((h, i) => `${i + 1}. [${h.style}] ${h.text}`)
      .join('\n');

    const full = `# ${piece.title}\n\n## Hooks\n${hooks}\n\n---\n\n${sections}\n\n---\n\n**CTA:** ${piece.cta || 'N/A'}`;
    copyToClipboard(full, 'full');
  };

  const statusCfg = STATUS_CONFIG[piece.status] || STATUS_CONFIG.draft;
  const createdAt = new Date(piece.created_at);
  const timeAgo = getTimeAgo(createdAt);

  return (
    <Card className={`transition-colors ${expanded ? 'border-orange-300' : ''}`}>
      <CardContent className="p-4">
        {/* Header */}
        <div
          className="flex items-start justify-between gap-3 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-sm truncate">{piece.title || 'Sem titulo'}</h3>
              {piece.virality_score > 0 && (
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
              <span className="text-[10px] text-muted-foreground">{timeAgo}</span>
            </div>
          </div>
          {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </div>

        {/* Expanded content */}
        {expanded && !compact && (
          <div className="mt-4 space-y-4 border-t pt-4">
            {/* Actions */}
            <div className="flex items-center gap-2 flex-wrap">
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
              <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" onClick={copyFullScript}>
                {copiedField === 'full' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                Copiar Roteiro
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 ml-auto"
                onClick={() => deletePiece.mutate(piece.id)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>

            {/* Hooks */}
            {piece.hook_variations?.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Hooks</h4>
                <div className="space-y-2">
                  {piece.hook_variations.map((hook, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 bg-muted/50 rounded-md">
                      <Badge variant="outline" className="text-[10px] shrink-0 mt-0.5">{hook.style}</Badge>
                      <p className="text-sm flex-1">{hook.text}</p>
                      <button
                        onClick={() => copyToClipboard(hook.text, `hook-${i}`)}
                        className="shrink-0 p-1 hover:bg-muted rounded"
                      >
                        {copiedField === `hook-${i}` ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Script sections */}
            {piece.script_sections?.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Roteiro</h4>
                <div className="space-y-3">
                  {piece.script_sections.map((section, i) => (
                    <div key={i} className="p-3 bg-muted/30 rounded-lg border">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold">{section.heading}</span>
                        <button
                          onClick={() => copyToClipboard(section.content, `section-${i}`)}
                          className="p-1 hover:bg-muted rounded"
                        >
                          {copiedField === `section-${i}` ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                        </button>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{section.content}</p>
                      {section.camera_note && (
                        <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                          <Video className="w-3 h-3" /> {section.camera_note}
                        </p>
                      )}
                      {section.data_callout && (
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
            {piece.cta && (
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <span className="text-xs font-semibold text-green-700">CTA:</span>
                <p className="text-sm mt-1">{piece.cta}</p>
              </div>
            )}

            {/* Social Posts */}
            {piece.social_posts?.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Posts Sociais</h4>
                <div className="space-y-2">
                  {piece.social_posts.map((post, i) => {
                    const PlatformIcon = post.platform === 'linkedin' ? Linkedin : post.platform === 'x' ? Twitter : MessageSquare;
                    return (
                      <div key={i} className="p-3 bg-muted/30 rounded-lg border">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <PlatformIcon className="w-3.5 h-3.5" />
                            <span className="text-xs font-semibold capitalize">{post.platform}</span>
                            <span className="text-[10px] text-muted-foreground">{post.char_count} chars</span>
                          </div>
                          <button
                            onClick={() => copyToClipboard(`${post.content}\n\n${post.hashtags?.join(' ') || ''}`, `social-${i}`)}
                            className="p-1 hover:bg-muted rounded"
                          >
                            {copiedField === `social-${i}` ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                          </button>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{post.content}</p>
                        {post.hashtags?.length > 0 && (
                          <p className="text-xs text-blue-600 mt-2">{post.hashtags.join(' ')}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SEO Metadata */}
            {piece.seo_metadata?.youtube_title && (
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

            {/* Meta info */}
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-2 border-t">
              {piece.model_used && <span>Modelo: {piece.model_used}</span>}
              {piece.tokens_used && <span>{piece.tokens_used} tokens</span>}
              {piece.generation_duration_ms && <span>{(piece.generation_duration_ms / 1000).toFixed(1)}s</span>}
              {piece.duration_estimate_seconds && <span>~{piece.duration_estimate_seconds}s video</span>}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
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
