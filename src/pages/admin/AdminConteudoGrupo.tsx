import { useState } from 'react';
import {
  MessageSquare, RefreshCw, Loader2, Copy, Check, Settings2, Save,
  Sparkles, Trash2, Calendar, Bot, Send, ChevronDown, ChevronUp, BookOpen,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { PageHeader } from '@/components/admin/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet';
import { useAdminGroupContent, type ContentItem, type GroupContentConfig } from '@/hooks/useAdminGroupContent';
import { useAdminApis } from '@/hooks/useAdminApis';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ── Content Card ──────────────────────────────────────────────

function ContentCard({ item, onCopy }: { item: ContentItem; onCopy: (text: string) => void }) {
  const [copied, setCopied] = useState(false);

  const fullText = `${item.title}\n\n${item.body}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    onCopy(fullText);
    setTimeout(() => setCopied(false), 2000);
  };

  const typeColors: Record<string, string> = {
    insight: 'bg-blue-100 text-blue-800',
    question: 'bg-amber-100 text-amber-800',
    cta: 'bg-green-100 text-green-800',
    tip: 'bg-purple-100 text-purple-800',
  };

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className={typeColors[item.type] || 'bg-gray-100 text-gray-800'}>
                {item.type}
              </Badge>
            </div>
            <p className="font-medium text-sm mb-1">{item.title}</p>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.body}</p>
          </div>
          <Button
            size="sm"
            variant={copied ? 'default' : 'outline'}
            onClick={handleCopy}
            className="shrink-0"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span className="ml-1">{copied ? 'Copiado!' : 'Copiar'}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Page ─────────────────────────────────────────────────

export default function AdminConteudoGrupo() {
  const {
    suggestions, config, prompt,
    isLoading, isGenerating, isSavingConfig,
    generateNow, saveConfig, deleteSuggestion, refetch,
  } = useAdminGroupContent();
  const { apis } = useAdminApis();
  const { toast } = useToast();

  // Local state for config editing
  const [showConfig, setShowConfig] = useState(false);
  const [editConfig, setEditConfig] = useState<GroupContentConfig | null>(null);
  const [editPrompt, setEditPrompt] = useState<string | null>(null);

  const currentConfig = editConfig || config;
  const currentPrompt = editPrompt ?? prompt;

  const handleOpenConfig = () => {
    setEditConfig({ ...config });
    setEditPrompt(prompt);
    setShowConfig(true);
  };

  const handleSaveConfig = async () => {
    if (!editConfig) return;
    await saveConfig(editConfig, currentPrompt);
    setShowConfig(false);
    setEditConfig(null);
    setEditPrompt(null);
  };

  const handleCopy = (text: string) => {
    toast({ title: 'Texto copiado!', description: 'Cole no seu grupo de WhatsApp/Telegram.' });
  };

  const handleCopyAll = (contents: ContentItem[]) => {
    const allText = contents.map(c => `${c.title}\n\n${c.body}`).join('\n\n---\n\n');
    navigator.clipboard.writeText(allText);
    toast({ title: 'Todos os textos copiados!', description: `${contents.length} textos prontos para colar.` });
  };

  // LLM API options for dropdown
  const llmApis = apis.filter(a =>
    a.base_url?.includes('openai.com') ||
    a.base_url?.includes('anthropic.com') ||
    a.base_url?.includes('openrouter.ai')
  );

  return (
    <DashboardLayout>
      <PageHeader
        title="Conteúdo para Grupo"
        subtitle="Textos gerados por IA, prontos para copiar e colar no WhatsApp/Telegram"
        icon={MessageSquare}
      >
        <div className="flex gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <BookOpen className="h-4 w-4 mr-1" />
                Documentacao
              </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto sm:max-w-lg">
              <SheetHeader>
                <SheetTitle>Conteudo para Grupo — Documentacao</SheetTitle>
                <SheetDescription>Como funciona a geracao automatica de conteudo</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-5 text-sm">
                <section>
                  <h3 className="font-semibold mb-1">O que e?</h3>
                  <p className="text-muted-foreground">
                    Gera textos prontos por IA para voce copiar e colar no grupo de WhatsApp/Telegram.
                    Os textos usam dados reais (anonimizados) dos diagnosticos de carreira para criar conteudo relevante e personalizado.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold mb-1">Geracao Automatica (Cron)</h3>
                  <p className="text-muted-foreground">
                    Quando ativada, roda <strong>todo dia as 6h BRT (9h UTC)</strong> via cron job.
                    Se ja existir conteudo gerado para o dia, nao gera novamente (evita duplicatas).
                    Pode ser ligada/desligada no painel de configuracoes.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold mb-1">Geracao Manual</h3>
                  <p className="text-muted-foreground">
                    Clique em <strong>"Gerar Agora"</strong> para gerar conteudo imediatamente.
                    Use <strong>"Regerar"</strong> em um dia especifico para substituir os textos (util se nao gostou do resultado).
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold mb-1">Configuracoes</h3>
                  <ul className="text-muted-foreground space-y-1 list-disc pl-4">
                    <li><strong>API / LLM</strong> — qual modelo de IA usar (OpenAI, Anthropic, OpenRouter). Conecta as APIs de <em>/admin/configuracoes-apis</em></li>
                    <li><strong>Quantidade</strong> — quantos textos gerar por dia (padrao: 3)</li>
                    <li><strong>Prompt</strong> — totalmente editavel. Use {'{{count}}'} e {'{{diagnosticData}}'} como variaveis</li>
                    <li><strong>Evento webhook</strong> — evento N8N disparado apos geracao</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-semibold mb-1">Webhook N8N / Telegram</h3>
                  <p className="text-muted-foreground mb-2">
                    Apos cada geracao, dispara o evento <code className="bg-muted px-1 rounded">group_content.generated</code> para automacoes N8N ativas.
                  </p>
                  <p className="text-muted-foreground mb-2">
                    Configure em <em>/admin/automacoes</em> apontando para seu N8N → Telegram bot.
                  </p>
                  <div className="bg-muted rounded p-3 font-mono text-xs">
                    <p className="font-semibold mb-1">Expressao N8N para o Telegram:</p>
                    <code>{'{{ $json.body.contents.map(c => c.title + "\\n\\n" + c.body).join("\\n\\n---\\n\\n") }}'}</code>
                  </div>
                </section>

                <section>
                  <h3 className="font-semibold mb-1">Dados dos Diagnosticos</h3>
                  <p className="text-muted-foreground">
                    A IA recebe dados agregados e anonimos dos ultimos 30 dias: quantidade de diagnosticos,
                    score medio e media por dimensao. Isso gera conteudo baseado em dados reais sem expor informacoes individuais.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold mb-1">Tipos de Texto</h3>
                  <ul className="text-muted-foreground space-y-1 list-disc pl-4">
                    <li><Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">insight</Badge> — dado/estatistica interessante</li>
                    <li><Badge variant="secondary" className="bg-amber-100 text-amber-800 text-xs">question</Badge> — pergunta para gerar engajamento</li>
                    <li><Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">cta</Badge> — chamada para acao suave (diagnostico, plataforma)</li>
                    <li><Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs">tip</Badge> — dica pratica</li>
                  </ul>
                </section>
              </div>
            </SheetContent>
          </Sheet>
          <Button variant="outline" size="sm" onClick={handleOpenConfig}>
            <Settings2 className="h-4 w-4 mr-1" />
            Configurar
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Atualizar
          </Button>
          <Button size="sm" onClick={() => generateNow()} disabled={isGenerating}>
            {isGenerating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
            Gerar Agora
          </Button>
        </div>
      </PageHeader>

      {/* ── Config Panel ─────────────────────────────────────── */}
      <Collapsible open={showConfig} onOpenChange={setShowConfig}>
        <CollapsibleContent>
          <Card className="mb-6 border-blue-200 bg-blue-50/30">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                Configurações de Geração
              </CardTitle>
              <CardDescription>
                Defina o LLM, prompt e frequência. Tudo configurável, sem hardcode.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* API / LLM */}
                <div className="space-y-2">
                  <Label>API / LLM</Label>
                  <Select
                    value={currentConfig.api_config_key}
                    onValueChange={(v) => setEditConfig(prev => prev ? { ...prev, api_config_key: v } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a API" />
                    </SelectTrigger>
                    <SelectContent>
                      {llmApis.map(api => (
                        <SelectItem key={api.api_key} value={api.api_key}>
                          {api.name} ({api.api_key})
                        </SelectItem>
                      ))}
                      {/* Fallback if no APIs loaded yet */}
                      {llmApis.length === 0 && (
                        <SelectItem value={currentConfig.api_config_key}>
                          {currentConfig.api_config_key}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Count */}
                <div className="space-y-2">
                  <Label>Quantidade de textos</Label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={currentConfig.count}
                    onChange={(e) => setEditConfig(prev => prev ? { ...prev, count: parseInt(e.target.value) || 3 } : null)}
                  />
                </div>

                {/* Webhook event */}
                <div className="space-y-2">
                  <Label>Evento webhook (N8N)</Label>
                  <Input
                    value={currentConfig.webhook_event}
                    onChange={(e) => setEditConfig(prev => prev ? { ...prev, webhook_event: e.target.value } : null)}
                    placeholder="group_content.generated"
                  />
                </div>
              </div>

              {/* Enabled toggle */}
              <div className="flex items-center gap-3">
                <Switch
                  checked={currentConfig.enabled}
                  onCheckedChange={(v) => setEditConfig(prev => prev ? { ...prev, enabled: v } : null)}
                />
                <Label>Geração automática ativada (cron diário às 6h BRT)</Label>
              </div>

              {/* Prompt */}
              <div className="space-y-2">
                <Label>Prompt do Sistema</Label>
                <Textarea
                  value={currentPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  rows={10}
                  className="font-mono text-xs"
                  placeholder="Prompt para gerar os textos..."
                />
                <p className="text-xs text-muted-foreground">
                  Variáveis disponíveis: {'{{count}}'} (qtd textos), {'{{diagnosticData}}'} (dados anônimos dos diagnósticos)
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setShowConfig(false); setEditConfig(null); setEditPrompt(null); }}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveConfig} disabled={isSavingConfig}>
                  {isSavingConfig ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                  Salvar Configurações
                </Button>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* ── Content List ─────────────────────────────────────── */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : suggestions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Bot className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum conteúdo gerado ainda</h3>
            <p className="text-muted-foreground mb-4">
              Clique em "Gerar Agora" para criar textos prontos para o grupo.
            </p>
            <Button onClick={() => generateNow()} disabled={isGenerating}>
              {isGenerating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
              Gerar Primeiro Conteúdo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {suggestions.map((suggestion) => (
            <div key={suggestion.id}>
              {/* Day header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-medium">
                    {format(new Date(suggestion.generated_date + 'T12:00:00'), "EEEE, d 'de' MMMM", { locale: ptBR })}
                  </h3>
                  {suggestion.model && (
                    <Badge variant="outline" className="text-xs">
                      <Bot className="h-3 w-3 mr-1" />
                      {suggestion.model}
                    </Badge>
                  )}
                  {suggestion.status === 'error' && (
                    <Badge variant="destructive">Erro</Badge>
                  )}
                  {suggestion.webhook_dispatched && (
                    <Badge variant="outline" className="text-xs text-green-700 border-green-300">
                      <Send className="h-3 w-3 mr-1" />
                      Webhook enviado
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopyAll(suggestion.contents)}
                    disabled={!suggestion.contents?.length}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copiar Todos
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => generateNow(suggestion.generated_date)}
                    disabled={isGenerating}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Regerar
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remover conteúdo?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Isso vai remover os textos gerados para este dia.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteSuggestion(suggestion.id)}>
                          Remover
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              {/* Content cards */}
              {suggestion.status === 'error' ? (
                <Card className="border-destructive">
                  <CardContent className="p-4 text-destructive text-sm">
                    {suggestion.error_message || 'Erro desconhecido na geração'}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(suggestion.contents || []).map((item, idx) => (
                    <ContentCard key={idx} item={item} onCopy={handleCopy} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
