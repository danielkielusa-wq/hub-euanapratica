import { useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Link2, Key, Globe, Plus, Edit, Trash2, TestTube, Lock, AlertCircle, CheckCircle2, Loader2, ShieldAlert, HelpCircle, BookOpen, ChevronRight, Wrench } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useAdminApis, type ApiConfigInput, type ApiConfig } from '@/hooks/useAdminApis';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Credential fields expected per known API
const KNOWN_CREDENTIAL_KEYS: Record<string, string[]> = {
  openai_api: ['api_key'],
  resend_email: ['api_key'],
  ticto_webhook: ['secret_key'],
  anthropic_api: ['api_key'],
};

export default function AdminApis() {
  const { apis, isLoading, isSaving, isTesting, createApi, updateApi, deleteApi, testConnection } = useAdminApis();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingApi, setEditingApi] = useState<ApiConfig | null>(null);
  const [deletingApiId, setDeletingApiId] = useState<string | null>(null);

  // Form fields (non-credential)
  const [formName, setFormName] = useState('');
  const [formApiKey, setFormApiKey] = useState('');
  const [formBaseUrl, setFormBaseUrl] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formParameters, setFormParameters] = useState<Record<string, any>>({});
  const [formFallback, setFormFallback] = useState<string | null>(null);

  // Credential rows: array of { key, value } for direct editing
  const [credRows, setCredRows] = useState<{ key: string; value: string }[]>([{ key: '', value: '' }]);

  // Parameter rows for create dialog
  const [paramRows, setParamRows] = useState<{ key: string; value: string }[]>([]);

  const resetForm = () => {
    setFormName('');
    setFormApiKey('');
    setFormBaseUrl('');
    setFormDescription('');
    setFormIsActive(true);
    setFormParameters({});
    setFormFallback(null);
    setCredRows([{ key: '', value: '' }]);
    setParamRows([]);
  };

  const openCreateDialog = () => {
    resetForm();
    setShowCreateDialog(true);
  };

  const openEditDialog = (api: ApiConfig) => {
    setFormName(api.name);
    setFormApiKey(api.api_key);
    setFormBaseUrl(api.base_url || '');
    setFormDescription(api.description || '');
    setFormIsActive(api.is_active);
    setFormParameters(api.parameters || {});
    setFormFallback(api.fallback_api_key || null);

    // Pre-populate credential rows based on known keys or existing credential keys
    const knownKeys = KNOWN_CREDENTIAL_KEYS[api.api_key];
    const existingKeys = Object.keys(api.credentials || {});
    const keys = knownKeys || (existingKeys.length > 0 ? existingKeys : ['api_key']);
    setCredRows(keys.map(k => ({ key: k, value: '' })));

    // Parameter rows from existing parameters
    const paramEntries = Object.entries(api.parameters || {});
    setParamRows(paramEntries.map(([k, v]) => ({ key: k, value: String(v) })));

    setEditingApi(api);
  };

  const buildCredentials = (): Record<string, string> => {
    const creds: Record<string, string> = {};
    for (const row of credRows) {
      const k = row.key.trim();
      const v = row.value.trim();
      if (k && v) {
        creds[k] = v;
      }
    }
    return creds;
  };

  const buildParameters = (): Record<string, any> => {
    const params: Record<string, any> = {};
    for (const row of paramRows) {
      const k = row.key.trim();
      const v = row.value.trim();
      if (k && v) {
        params[k] = v;
      }
    }
    return params;
  };

  const handleCreate = async () => {
    const input: ApiConfigInput = {
      name: formName,
      api_key: formApiKey,
      base_url: formBaseUrl || undefined,
      credentials: buildCredentials(),
      parameters: buildParameters(),
      description: formDescription || undefined,
      is_active: formIsActive,
      fallback_api_key: formFallback,
    };
    await createApi(input);
    setShowCreateDialog(false);
    resetForm();
  };

  const handleUpdate = async () => {
    if (!editingApi) return;
    const credentials = buildCredentials();
    const input: Partial<ApiConfigInput> = {
      name: formName,
      api_key: formApiKey,
      base_url: formBaseUrl || undefined,
      credentials,
      parameters: buildParameters(),
      description: formDescription || undefined,
      is_active: formIsActive,
      fallback_api_key: formFallback,
    };
    await updateApi(editingApi.id, input);
    setEditingApi(null);
    resetForm();
  };

  const handleDelete = async () => {
    if (!deletingApiId) return;
    await deleteApi(deletingApiId);
    setDeletingApiId(null);
  };

  const updateCredRow = (index: number, field: 'key' | 'value', val: string) => {
    setCredRows(prev => prev.map((row, i) => i === index ? { ...row, [field]: val } : row));
  };

  const addCredRow = () => {
    setCredRows(prev => [...prev, { key: '', value: '' }]);
  };

  const removeCredRow = (index: number) => {
    setCredRows(prev => prev.filter((_, i) => i !== index));
  };

  const updateParamRow = (index: number, field: 'key' | 'value', val: string) => {
    setParamRows(prev => prev.map((row, i) => i === index ? { ...row, [field]: val } : row));
  };

  const addParamRow = () => {
    setParamRows(prev => [...prev, { key: '', value: '' }]);
  };

  const removeParamRow = (index: number) => {
    setParamRows(prev => prev.filter((_, i) => i !== index));
  };

  // Shared credential fields component
  const CredentialFields = ({ isEdit }: { isEdit?: boolean }) => (
    <div className="space-y-2">
      <Label>Credenciais {!isEdit && '*'}</Label>
      {isEdit && (
        <p className="text-xs text-muted-foreground">
          Preencha os valores para atualizar. Deixe em branco para manter os atuais.
        </p>
      )}
      <div className="space-y-2">
        {credRows.map((row, i) => (
          <div key={i} className="flex gap-2 items-center">
            <Input
              placeholder="Chave (ex: api_key)"
              value={row.key}
              onChange={e => updateCredRow(i, 'key', e.target.value)}
              className="rounded-xl font-mono w-1/3"
              disabled={isEdit && KNOWN_CREDENTIAL_KEYS[formApiKey]?.includes(row.key)}
            />
            <Input
              placeholder={isEdit ? 'Novo valor...' : 'Valor (ex: sk-proj-abc...)'}
              type="password"
              value={row.value}
              onChange={e => updateCredRow(i, 'value', e.target.value)}
              className="rounded-xl font-mono flex-1"
            />
            {credRows.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeCredRow(i)}
                className="h-8 w-8 flex-shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addCredRow} className="rounded-xl gap-1">
          <Plus className="w-3 h-3" /> Adicionar campo
        </Button>
      </div>
    </div>
  );

  // Non-LLM API slugs that shouldn't appear as fallback options
  const NON_LLM_SLUGS = ['resend_email', 'ticto_webhook'];

  // Fallback select component
  const FallbackSelect = () => {
    const fallbackOptions = apis.filter(
      a => a.api_key !== formApiKey && a.is_active && !NON_LLM_SLUGS.includes(a.api_key)
    );
    return (
      <div className="space-y-2">
        <Label>API de Fallback</Label>
        <p className="text-xs text-muted-foreground">
          Se esta API falhar (créditos, rate limit, erro de servidor), o sistema tentará automaticamente a API de fallback.
        </p>
        <Select
          value={formFallback || '_none'}
          onValueChange={v => setFormFallback(v === '_none' ? null : v)}
        >
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder="Nenhum (sem fallback)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_none">Nenhum (sem fallback)</SelectItem>
            {fallbackOptions.map(api => (
              <SelectItem key={api.api_key} value={api.api_key}>
                {api.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  };

  // Shared parameter fields component
  const ParameterFields = () => (
    <div className="space-y-2">
      <Label>Parâmetros (opcional)</Label>
      <p className="text-xs text-muted-foreground">Configurações não-sensíveis como modelo, timeout, etc.</p>
      <div className="space-y-2">
        {paramRows.map((row, i) => (
          <div key={i} className="flex gap-2 items-center">
            <Input
              placeholder="Chave (ex: model)"
              value={row.key}
              onChange={e => updateParamRow(i, 'key', e.target.value)}
              className="rounded-xl font-mono w-1/3"
            />
            <Input
              placeholder="Valor (ex: gpt-4)"
              value={row.value}
              onChange={e => updateParamRow(i, 'value', e.target.value)}
              className="rounded-xl font-mono flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeParamRow(i)}
              className="h-8 w-8 flex-shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addParamRow} className="rounded-xl gap-1">
          <Plus className="w-3 h-3" /> Adicionar parâmetro
        </Button>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-100">
              <Settings className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Configurações de APIs</h1>
              <p className="text-sm text-muted-foreground">Gerencie as integrações externas do sistema</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-[12px] gap-2">
                  <HelpCircle className="w-4 h-4" />
                  Documentação
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    Documentação — APIs Externas
                  </SheetTitle>
                  <SheetDescription>Slugs do sistema, fallback automático e troubleshooting</SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-6 text-sm">
                  <section className="space-y-2">
                    <h3 className="font-semibold text-base flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">1</span>
                      Propósito
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Gerencia as credenciais de APIs externas usadas pelas Edge Functions. As chaves são armazenadas de forma criptografada e acessíveis apenas por admins e Edge Functions via RLS. Alterações entram em vigor imediatamente, sem redeploy.
                    </p>
                  </section>
                  <div className="border-t" />
                  <section className="space-y-3">
                    <h3 className="font-semibold text-base flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">2</span>
                      Slugs reservados do sistema
                    </h3>
                    <div className="rounded-lg border overflow-hidden">
                      <table className="w-full text-xs">
                        <thead><tr className="bg-muted/50"><th className="text-left px-3 py-2 font-medium">Slug (api_key)</th><th className="text-left px-3 py-2 font-medium">Uso</th></tr></thead>
                        <tbody className="divide-y">
                          {[
                            ["openai_api", "OpenAI — GPT-4o, embeddings, etc."],
                            ["anthropic_api", "Anthropic — Claude Haiku, Sonnet, etc."],
                            ["resend_email", "Resend — envio de todos os emails transacionais."],
                            ["ticto_webhook", "Ticto — validação de assinatura nos callbacks de pagamento."],
                          ].map(([s, d], i) => (
                            <tr key={i}><td className="px-3 py-2 font-mono text-[10px] text-foreground">{s}</td><td className="px-3 py-2 text-muted-foreground">{d}</td></tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-xs text-muted-foreground">O slug deve corresponder exatamente ao que as Edge Functions usam em <code className="bg-muted px-1 rounded">getApiConfig("slug")</code>.</p>
                  </section>
                  <div className="border-t" />
                  <section className="space-y-3">
                    <h3 className="font-semibold text-base flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">3</span>
                      Sistema de Fallback (LLMs)
                    </h3>
                    <ul className="space-y-2 text-muted-foreground">
                      {[
                        { item: "Como configurar", detail: "No formulário de edição, selecione a \"API de Fallback\". Ex: openai_api → anthropic_api e vice-versa." },
                        { item: "Quando é acionado", detail: "HTTP 402, 429, 500+, timeout, ou body contendo insufficient_quota / overloaded_error." },
                        { item: "Registro de custo", detail: "Ambas as tentativas são registradas em api_cost_logs. O fallback inclui metadata.used_fallback: true." },
                        { item: "Não se aplica a", detail: "resend_email e ticto_webhook — apenas LLMs têm fallback." },
                      ].map((i, idx) => (
                        <li key={idx} className="flex gap-3">
                          <ChevronRight className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                          <div><span className="font-medium text-foreground">{i.item}: </span>{i.detail}</div>
                        </li>
                      ))}
                    </ul>
                  </section>
                  <div className="border-t" />
                  <section className="space-y-3">
                    <h3 className="font-semibold text-base flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-primary" />
                      Troubleshooting
                    </h3>
                    <div className="space-y-3">
                      {[
                        { p: "Botão \"Testar Conexão\" falha com 401", c: "Credencial inválida ou expirada.", f: "Regenere a chave no painel do provedor, clique em Editar e atualize o valor." },
                        { p: "Edge Function não encontra a API", c: "O slug cadastrado não corresponde ao que a função usa em getApiConfig().", f: "Verifique o slug (campo Identificador) — deve ser idêntico ao string passado para getApiConfig." },
                        { p: "Fallback não é acionado", c: "A API de fallback está inativa ou não foi configurada.", f: "Confirme que a API de fallback está Ativa e que o campo \"API de Fallback\" está preenchido." },
                        { p: "Credencial atualizada mas função ainda usa a antiga", c: "As Edge Functions leem as credenciais em tempo de execução — não há cache persistente.", f: "Verifique se o valor foi salvo corretamente (observe o toast de sucesso). Tente o botão de teste." },
                      ].map((item, i) => (
                        <div key={i} className="rounded-lg border p-3 space-y-1">
                          <p className="font-medium text-destructive text-xs">{item.p}</p>
                          <p className="text-muted-foreground text-xs"><span className="font-medium text-foreground">Causa:</span> {item.c}</p>
                          <p className="text-muted-foreground text-xs"><span className="font-medium text-foreground">Fix:</span> {item.f}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </SheetContent>
            </Sheet>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="rounded-[12px] gap-2" onClick={openCreateDialog}>
                <Plus className="w-4 h-4" />
                Nova API
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[24px] max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Adicionar Nova API</DialogTitle>
                <DialogDescription>Configure uma nova integração externa</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome *</Label>
                    <Input
                      placeholder="Ex: OpenAI API"
                      value={formName}
                      onChange={e => setFormName(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Identificador (slug) *</Label>
                    <Input
                      placeholder="Ex: openai_api"
                      value={formApiKey}
                      onChange={e => setFormApiKey(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                      className="rounded-xl font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>URL Base</Label>
                  <Input
                    placeholder="Ex: https://api.openai.com/v1"
                    value={formBaseUrl}
                    onChange={e => setFormBaseUrl(e.target.value)}
                    className="rounded-xl font-mono"
                  />
                </div>

                <CredentialFields />
                <ParameterFields />
                <FallbackSelect />

                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    placeholder="Descreva o propósito desta API..."
                    value={formDescription}
                    onChange={e => setFormDescription(e.target.value)}
                    className="rounded-xl"
                    rows={3}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Switch checked={formIsActive} onCheckedChange={setFormIsActive} />
                  <Label>API ativa</Label>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setShowCreateDialog(false); resetForm(); }}
                  className="rounded-xl"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleCreate}
                  disabled={!formName || !formApiKey || isSaving === 'creating'}
                  className="rounded-xl gap-2"
                >
                  {isSaving === 'creating' && <Loader2 className="w-4 h-4 animate-spin" />}
                  Salvar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Dialog */}
          <Dialog open={!!editingApi} onOpenChange={open => { if (!open) { setEditingApi(null); resetForm(); } }}>
            <DialogContent className="rounded-[24px] max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Editar API</DialogTitle>
                <DialogDescription>Atualize as configurações da API</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome *</Label>
                    <Input
                      value={formName}
                      onChange={e => setFormName(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Identificador (slug)</Label>
                    <Input
                      value={formApiKey}
                      disabled
                      className="rounded-xl font-mono bg-muted"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>URL Base</Label>
                  <Input
                    value={formBaseUrl}
                    onChange={e => setFormBaseUrl(e.target.value)}
                    className="rounded-xl font-mono"
                  />
                </div>

                <CredentialFields isEdit />
                <ParameterFields />
                <FallbackSelect />

                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    value={formDescription}
                    onChange={e => setFormDescription(e.target.value)}
                    className="rounded-xl"
                    rows={3}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Switch checked={formIsActive} onCheckedChange={setFormIsActive} />
                  <Label>API ativa</Label>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setEditingApi(null); resetForm(); }}
                  className="rounded-xl"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleUpdate}
                  disabled={!formName || isSaving === editingApi?.id}
                  className="rounded-xl gap-2"
                >
                  {isSaving === editingApi?.id && <Loader2 className="w-4 h-4 animate-spin" />}
                  Salvar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation */}
          <AlertDialog open={!!deletingApiId} onOpenChange={() => setDeletingApiId(null)}>
            <AlertDialogContent className="rounded-[24px]">
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja remover esta API? Esta ação não pode ser desfeita e pode afetar funcionalidades do sistema.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="rounded-xl bg-destructive hover:bg-destructive/90"
                >
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          </div>
        </div>

        {/* API Cards Grid */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-64 rounded-[24px]" />
            ))}
          </div>
        ) : apis.length === 0 ? (
          <Card className="rounded-[24px] border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Settings className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma API configurada</h3>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Adicione sua primeira integração para começar
              </p>
              <Button onClick={openCreateDialog} className="rounded-xl">
                <Plus className="w-4 h-4 mr-2" />
                Nova API
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {apis.map(api => (
              <Card key={api.id} className="rounded-[24px]">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <Link2 className="w-5 h-5 text-primary" />
                        <CardTitle className="text-base">{api.name}</CardTitle>
                      </div>
                      {api.is_active ? (
                        <Badge className="bg-green-100 text-green-700 text-xs">Ativo</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Inativo</Badge>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => testConnection(api.api_key)}
                        disabled={isTesting === api.api_key}
                        className="h-8 w-8"
                        title="Testar conexão"
                      >
                        {isTesting === api.api_key ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <TestTube className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(api)}
                        className="h-8 w-8"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingApiId(api.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription className="font-mono text-xs mt-1">{api.api_key}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {api.base_url && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <Globe className="w-3 h-3" /> URL Base
                      </p>
                      <p className="text-sm font-mono bg-muted px-2 py-1 rounded-lg text-xs break-all">
                        {api.base_url}
                      </p>
                    </div>
                  )}

                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Key className="w-3 h-3" /> Credenciais
                    </p>
                    <div className="space-y-1">
                      {Object.keys(api.credentials || {}).length > 0 ? (
                        Object.entries(api.credentials).map(([key, value]) => (
                          <div key={key} className="flex justify-between text-xs">
                            <span className="text-muted-foreground">{key}:</span>
                            <span className="font-mono">{value}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-amber-600">Nenhuma credencial configurada</p>
                      )}
                    </div>
                  </div>

                  {api.parameters && Object.keys(api.parameters).length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <Settings className="w-3 h-3" /> Parâmetros
                      </p>
                      <div className="space-y-1">
                        {Object.entries(api.parameters).map(([key, value]) => (
                          <div key={key} className="flex justify-between text-xs">
                            <span className="text-muted-foreground">{key}:</span>
                            <span className="font-mono">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {api.fallback_api_key && (
                    <div className="flex items-center gap-1.5 pt-2 border-t">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-xs text-amber-600 font-medium">
                        Fallback: {apis.find(a => a.api_key === api.fallback_api_key)?.name || api.fallback_api_key}
                      </span>
                    </div>
                  )}

                  {api.description && (
                    <p className="text-sm text-muted-foreground pt-2 border-t">{api.description}</p>
                  )}

                  <p className="text-xs text-muted-foreground pt-2">
                    Última atualização: {format(new Date(api.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Info Card */}
        <Card className="rounded-[24px] border-blue-500/20 bg-blue-500/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-blue-500" />
              <CardTitle className="text-blue-500">Sobre Segurança</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p>Credenciais são protegidas por RLS - apenas administradores podem acessar</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p>As chaves são lidas apenas pelas edge functions no momento do uso</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p>Alterações nas configurações não requerem redeploy das funções</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p>APIs LLM com fallback configurado tentam automaticamente a API secundária em caso de falha (créditos, rate limit, erro de servidor)</p>
            </div>
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <p>Use o botão "Testar Conexão" para validar as credenciais após salvar</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
