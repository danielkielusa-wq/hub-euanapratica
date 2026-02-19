import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Settings, FileCheck, Users, Hash, Zap, Trash2, Plus, FileText, Link2, Globe, Sparkles, ShoppingBag } from 'lucide-react';
import { useAppConfigs } from '@/hooks/useAppConfigs';
import { useCommunityCategories } from '@/hooks/useCommunityCategories';
import { useGamificationRules } from '@/hooks/useGamification';
import { useAdminApis } from '@/hooks/useAdminApis';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AdminSettings() {
  const { configs, isLoading, isSaving, updateConfig, getConfigValue } = useAppConfigs();
  const { apis, isLoading: apisLoading } = useAdminApis();

  const [resumePrompt, setResumePrompt] = useState('');
  const [hasResumeChanges, setHasResumeChanges] = useState(false);
  const [leadPrompt, setLeadPrompt] = useState('');
  const [hasLeadChanges, setHasLeadChanges] = useState(false);

  // Product recommendation prompt
  const [recPrompt, setRecPrompt] = useState('');
  const [hasRecChanges, setHasRecChanges] = useState(false);

  // Report webhook config
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookEnabled, setWebhookEnabled] = useState(false);
  const [reportBaseUrl, setReportBaseUrl] = useState('');
  const [hasWebhookChanges, setHasWebhookChanges] = useState(false);

  // Title Translator config
  const [ttPrompt, setTtPrompt] = useState('');
  const [ttApiConfig, setTtApiConfig] = useState('openai_api');
  const [hasTtChanges, setHasTtChanges] = useState(false);

  // Upsell config
  const [upsellEnabled, setUpsellEnabled] = useState(true);
  const [upsellPrompt, setUpsellPrompt] = useState('');
  const [upsellModel, setUpsellModel] = useState('claude-haiku-4-5-20251001');
  const [upsellMaxTokens, setUpsellMaxTokens] = useState('150');
  const [upsellTemperature, setUpsellTemperature] = useState('0');
  const [upsellRateLimitDays, setUpsellRateLimitDays] = useState('7');
  const [upsellBlacklistDays, setUpsellBlacklistDays] = useState('30');
  const [hasUpsellChanges, setHasUpsellChanges] = useState(false);

  useEffect(() => {
    const resumeValue = getConfigValue('resume_analyzer_prompt');
    if (resumeValue) setResumePrompt(resumeValue);
    const leadValue = getConfigValue('lead_report_formatter_prompt');
    if (leadValue) setLeadPrompt(leadValue);
    const recValue = getConfigValue('llm_product_recommendation_prompt');
    if (recValue) setRecPrompt(recValue);

    // Load webhook configs
    const webhookUrlValue = getConfigValue('lead_webhook_url');
    if (webhookUrlValue) setWebhookUrl(webhookUrlValue);
    const webhookEnabledValue = getConfigValue('lead_webhook_enabled');
    setWebhookEnabled(webhookEnabledValue === 'true');
    const baseUrlValue = getConfigValue('lead_report_base_url');
    if (baseUrlValue) setReportBaseUrl(baseUrlValue);

    // Load title translator configs
    const ttPromptValue = getConfigValue('title_translator_prompt');
    if (ttPromptValue) setTtPrompt(ttPromptValue);
    const ttApiConfigValue = getConfigValue('title_translator_api_config');
    if (ttApiConfigValue) setTtApiConfig(ttApiConfigValue);

    // Load upsell configs
    const upsellEnabledValue = getConfigValue('upsell_enabled');
    setUpsellEnabled(upsellEnabledValue !== 'false');
    const upsellPromptValue = getConfigValue('upsell_prompt_template');
    if (upsellPromptValue) setUpsellPrompt(upsellPromptValue);
    const upsellModelValue = getConfigValue('upsell_model');
    if (upsellModelValue) setUpsellModel(upsellModelValue);
    const upsellMaxTokensValue = getConfigValue('upsell_max_tokens');
    if (upsellMaxTokensValue) setUpsellMaxTokens(upsellMaxTokensValue);
    const upsellTemperatureValue = getConfigValue('upsell_temperature');
    if (upsellTemperatureValue) setUpsellTemperature(upsellTemperatureValue);
    const upsellRateLimitValue = getConfigValue('upsell_rate_limit_days');
    if (upsellRateLimitValue) setUpsellRateLimitDays(upsellRateLimitValue);
    const upsellBlacklistValue = getConfigValue('upsell_blacklist_days');
    if (upsellBlacklistValue) setUpsellBlacklistDays(upsellBlacklistValue);
  }, [configs]);

  useEffect(() => {
    const originalValue = getConfigValue('resume_analyzer_prompt');
    setHasResumeChanges(resumePrompt !== originalValue && resumePrompt !== '');
  }, [resumePrompt, configs]);

  useEffect(() => {
    const originalValue = getConfigValue('lead_report_formatter_prompt');
    setHasLeadChanges(leadPrompt !== originalValue && leadPrompt !== '');
  }, [leadPrompt, configs]);

  useEffect(() => {
    const originalValue = getConfigValue('llm_product_recommendation_prompt');
    setHasRecChanges(recPrompt !== originalValue && recPrompt !== '');
  }, [recPrompt, configs]);

  useEffect(() => {
    const originalUrl = getConfigValue('lead_webhook_url');
    const originalEnabled = getConfigValue('lead_webhook_enabled') === 'true';
    const originalBaseUrl = getConfigValue('lead_report_base_url');
    const hasChanges =
      webhookUrl !== originalUrl ||
      webhookEnabled !== originalEnabled ||
      reportBaseUrl !== originalBaseUrl;
    setHasWebhookChanges(hasChanges);
  }, [webhookUrl, webhookEnabled, reportBaseUrl, configs]);

  useEffect(() => {
    const originalPrompt = getConfigValue('title_translator_prompt');
    const originalApi = getConfigValue('title_translator_api_config');
    const hasChanges =
      ttPrompt !== originalPrompt ||
      ttApiConfig !== (originalApi || 'openai_api');
    setHasTtChanges(hasChanges);
  }, [ttPrompt, ttApiConfig, configs]);

  useEffect(() => {
    const originalEnabled = getConfigValue('upsell_enabled') !== 'false';
    const originalPrompt = getConfigValue('upsell_prompt_template');
    const originalModel = getConfigValue('upsell_model');
    const originalMaxTokens = getConfigValue('upsell_max_tokens');
    const originalTemperature = getConfigValue('upsell_temperature');
    const originalRateLimit = getConfigValue('upsell_rate_limit_days');
    const originalBlacklist = getConfigValue('upsell_blacklist_days');
    const hasChanges =
      upsellEnabled !== originalEnabled ||
      upsellPrompt !== originalPrompt ||
      upsellModel !== originalModel ||
      upsellMaxTokens !== originalMaxTokens ||
      upsellTemperature !== originalTemperature ||
      upsellRateLimitDays !== originalRateLimit ||
      upsellBlacklistDays !== originalBlacklist;
    setHasUpsellChanges(hasChanges);
  }, [upsellEnabled, upsellPrompt, upsellModel, upsellMaxTokens, upsellTemperature, upsellRateLimitDays, upsellBlacklistDays, configs]);

  const handleSaveResume = async () => {
    await updateConfig('resume_analyzer_prompt', resumePrompt);
    setHasResumeChanges(false);
  };

  const handleSaveLead = async () => {
    await updateConfig('lead_report_formatter_prompt', leadPrompt);
    setHasLeadChanges(false);
  };

  const handleSaveRecPrompt = async () => {
    await updateConfig('llm_product_recommendation_prompt', recPrompt);
    setHasRecChanges(false);
  };

  const handleSaveWebhook = async () => {
    await Promise.all([
      updateConfig('lead_webhook_url', webhookUrl),
      updateConfig('lead_webhook_enabled', webhookEnabled ? 'true' : 'false'),
      updateConfig('lead_report_base_url', reportBaseUrl),
    ]);
    setHasWebhookChanges(false);
  };

  const handleSaveTitleTranslator = async () => {
    await Promise.all([
      updateConfig('title_translator_prompt', ttPrompt),
      updateConfig('title_translator_api_config', ttApiConfig),
    ]);
    setHasTtChanges(false);
  };

  const handleSaveUpsellConfigs = async () => {
    await Promise.all([
      updateConfig('upsell_enabled', upsellEnabled ? 'true' : 'false'),
      updateConfig('upsell_prompt_template', upsellPrompt),
      updateConfig('upsell_model', upsellModel),
      updateConfig('upsell_max_tokens', upsellMaxTokens),
      updateConfig('upsell_temperature', upsellTemperature),
      updateConfig('upsell_rate_limit_days', upsellRateLimitDays),
      updateConfig('upsell_blacklist_days', upsellBlacklistDays),
    ]);
    setHasUpsellChanges(false);
  };

  const resumeConfig = configs.find(c => c.key === 'resume_analyzer_prompt');
  const leadConfig = configs.find(c => c.key === 'lead_report_formatter_prompt');
  const recConfig = configs.find(c => c.key === 'llm_product_recommendation_prompt');
  const webhookUrlConfig = configs.find(c => c.key === 'lead_webhook_url');
  const webhookEnabledConfig = configs.find(c => c.key === 'lead_webhook_enabled');
  const reportBaseUrlConfig = configs.find(c => c.key === 'lead_report_base_url');

  const { categories, createCategory, updateCategory, deleteCategory, isLoading: categoriesLoading } = useCommunityCategories();
  const { rules, updateRule, isLoading: rulesLoading } = useGamificationRules();
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    const slug = newCategoryName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    await createCategory({ name: newCategoryName, slug, icon_name: 'hash' });
    setNewCategoryName('');
  };

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
            <Settings className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Configurações da Plataforma</h1>
            <p className="text-sm text-muted-foreground">Gerencie as configurações globais do sistema</p>
          </div>
        </div>

        <Tabs defaultValue="prompts" className="space-y-6">
          <TabsList className="rounded-xl">
            <TabsTrigger value="prompts" className="gap-2 rounded-lg"><FileCheck className="h-4 w-4" />Prompts IA</TabsTrigger>
            <TabsTrigger value="reports" className="gap-2 rounded-lg"><FileText className="h-4 w-4" />Relatórios de Carreira</TabsTrigger>
            <TabsTrigger value="community" className="gap-2 rounded-lg"><Users className="h-4 w-4" />Comunidade</TabsTrigger>
            <TabsTrigger value="title-translator" className="gap-2 rounded-lg"><Globe className="h-4 w-4" />Title Translator</TabsTrigger>
            <TabsTrigger value="upsell" className="gap-2 rounded-lg"><Sparkles className="h-4 w-4" />Upsell Contextual</TabsTrigger>
          </TabsList>

          <TabsContent value="prompts" className="space-y-6">
            <Card className="rounded-[24px]">
              <CardHeader>
                <div className="flex items-center gap-2"><FileCheck className="w-5 h-5 text-primary" /><CardTitle>Analisador de Currículos</CardTitle></div>
                <CardDescription>Prompt usado pela IA para analisar currículos.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? <Skeleton className="h-64 w-full rounded-xl" /> : (
                  <>
                    <Textarea value={resumePrompt} onChange={(e) => setResumePrompt(e.target.value)} className="min-h-[300px] font-mono text-sm rounded-xl" />
                    {resumeConfig?.updated_at && <p className="text-xs text-muted-foreground">Última atualização: {format(new Date(resumeConfig.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>}
                    <div className="flex justify-end"><Button onClick={handleSaveResume} disabled={!hasResumeChanges || isSaving} className="rounded-[12px] gap-2"><Save className="w-4 h-4" />{isSaving ? 'Salvando...' : 'Salvar'}</Button></div>
                  </>
                )}
              </CardContent>
            </Card>
            <Card className="rounded-[24px]">
              <CardHeader>
                <div className="flex items-center gap-2"><Users className="w-5 h-5 text-primary" /><CardTitle>Formatador de Relatórios de Leads</CardTitle></div>
                <CardDescription>Prompt para formatar relatórios de diagnóstico.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? <Skeleton className="h-64 w-full rounded-xl" /> : (
                  <>
                    <Textarea value={leadPrompt} onChange={(e) => setLeadPrompt(e.target.value)} className="min-h-[300px] font-mono text-sm rounded-xl" />
                    {leadConfig?.updated_at && <p className="text-xs text-muted-foreground">Última atualização: {format(new Date(leadConfig.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>}
                    <div className="flex justify-end"><Button onClick={handleSaveLead} disabled={!hasLeadChanges || isSaving} className="rounded-[12px] gap-2"><Save className="w-4 h-4" />{isSaving ? 'Salvando...' : 'Salvar'}</Button></div>
                  </>
                )}
              </CardContent>
            </Card>
            <Card className="rounded-[24px]">
              <CardHeader>
                <div className="flex items-center gap-2"><ShoppingBag className="w-5 h-5 text-primary" /><CardTitle>Recomendador de Produtos</CardTitle></div>
                <CardDescription>Prompt usado pela IA para recomendar produtos/serviços aos leads com base no tier e perfil.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? <Skeleton className="h-64 w-full rounded-xl" /> : (
                  <>
                    <Textarea value={recPrompt} onChange={(e) => setRecPrompt(e.target.value)} className="min-h-[300px] font-mono text-sm rounded-xl" />
                    <p className="text-xs text-muted-foreground">
                      Use {'{{lead_data}}'}, {'{{tier}}'} e {'{{services}}'} como placeholders
                    </p>
                    {recConfig?.updated_at && <p className="text-xs text-muted-foreground">Última atualização: {format(new Date(recConfig.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>}
                    <div className="flex justify-end"><Button onClick={handleSaveRecPrompt} disabled={!hasRecChanges || isSaving} className="rounded-[12px] gap-2"><Save className="w-4 h-4" />{isSaving ? 'Salvando...' : 'Salvar'}</Button></div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Card className="rounded-[24px]">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-primary" />
                  <CardTitle>Webhook de Novos Leads</CardTitle>
                </div>
                <CardDescription>
                  Configure o webhook automático que dispara quando um novo lead é inserido na tabela career_evaluations.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <Skeleton className="h-48 w-full rounded-xl" />
                ) : (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Link2 className="w-4 h-4" />
                        URL do Webhook
                      </label>
                      <Input
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        placeholder="https://n8n.sapunplugged.com/webhook/..."
                        className="rounded-xl font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        URL do endpoint n8n que receberá os dados dos novos leads
                      </p>
                      {webhookUrlConfig?.updated_at && (
                        <p className="text-xs text-muted-foreground">
                          Última atualização: {format(new Date(webhookUrlConfig.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        URL Base dos Relatórios
                      </label>
                      <Input
                        value={reportBaseUrl}
                        onChange={(e) => setReportBaseUrl(e.target.value)}
                        placeholder="https://hub.euanapratica.com"
                        className="rounded-xl font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        URL base usada para gerar os links de relatórios (será concatenada com /report/:token)
                      </p>
                      {reportBaseUrlConfig?.updated_at && (
                        <p className="text-xs text-muted-foreground">
                          Última atualização: {format(new Date(reportBaseUrlConfig.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Webhook Ativo</p>
                        <p className="text-xs text-muted-foreground">
                          {webhookEnabled ? 'Webhooks serão enviados automaticamente' : 'Webhooks estão desativados'}
                        </p>
                      </div>
                      <Switch
                        checked={webhookEnabled}
                        onCheckedChange={setWebhookEnabled}
                      />
                    </div>

                    {webhookEnabledConfig?.updated_at && (
                      <p className="text-xs text-muted-foreground">
                        Status alterado em: {format(new Date(webhookEnabledConfig.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    )}

                    <div className="border-t pt-4">
                      <div className="flex justify-end">
                        <Button
                          onClick={handleSaveWebhook}
                          disabled={!hasWebhookChanges || isSaving}
                          className="rounded-[12px] gap-2"
                        >
                          <Save className="w-4 h-4" />
                          {isSaving ? 'Salvando...' : 'Salvar Configurações'}
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-[24px] border-blue-500/20 bg-blue-500/5">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  <CardTitle className="text-blue-500">Documentação</CardTitle>
                </div>
                <CardDescription>
                  Informações sobre o funcionamento do webhook de leads
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Como funciona</h4>
                  <p className="text-sm text-muted-foreground">
                    Sempre que um novo lead é inserido na tabela <code className="px-1.5 py-0.5 bg-muted rounded text-xs">career_evaluations</code>,
                    um trigger PostgreSQL dispara automaticamente e envia todos os dados do lead via POST para o webhook configurado.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Payload enviado</h4>
                  <p className="text-sm text-muted-foreground">
                    O webhook recebe um JSON com todos os campos do lead + o campo <code className="px-1.5 py-0.5 bg-muted rounded text-xs">report_link</code> contendo
                    o link completo para acessar o relatório.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Funciona para</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Leads importados via planilha CSV</li>
                    <li>Leads inseridos manualmente no Supabase</li>
                    <li>Leads inseridos via API</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Documentação completa</h4>
                  <p className="text-sm text-muted-foreground">
                    Consulte <code className="px-1.5 py-0.5 bg-muted rounded text-xs">docs/LEAD_WEBHOOK.md</code> para detalhes técnicos,
                    troubleshooting e exemplos de uso.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="community" className="space-y-6">
            <Card className="rounded-[24px]">
              <CardHeader>
                <div className="flex items-center gap-2"><Hash className="w-5 h-5 text-primary" /><CardTitle>Categorias da Comunidade</CardTitle></div>
                <CardDescription>Adicione, remova ou ative/desative categorias.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Nova categoria..." className="rounded-xl" />
                  <Button onClick={handleAddCategory} className="rounded-xl gap-2"><Plus className="h-4 w-4" />Adicionar</Button>
                </div>
                {categoriesLoading ? <Skeleton className="h-32 w-full rounded-xl" /> : (
                  <div className="space-y-2">
                    {categories.map(cat => (
                      <div key={cat.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                        <div className="flex items-center gap-3"><Hash className="h-4 w-4 text-muted-foreground" /><span className="font-medium">{cat.name}</span></div>
                        <div className="flex items-center gap-2">
                          <Switch checked={cat.is_active} onCheckedChange={(checked) => updateCategory(cat.id, { is_active: checked })} />
                          <Button variant="ghost" size="icon" onClick={() => deleteCategory(cat.id)} className="text-destructive h-8 w-8"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="rounded-[24px]">
              <CardHeader>
                <div className="flex items-center gap-2"><Zap className="w-5 h-5 text-primary" /><CardTitle>Regras de Gamificação</CardTitle></div>
                <CardDescription>Configure pontos por ação.</CardDescription>
              </CardHeader>
              <CardContent>
                {rulesLoading ? <Skeleton className="h-32 w-full rounded-xl" /> : (
                  <div className="space-y-3">
                    {rules.map(rule => (
                      <div key={rule.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                        <div><p className="font-medium">{rule.description || rule.action_type}</p><p className="text-xs text-muted-foreground">{rule.action_type}</p></div>
                        <div className="flex items-center gap-2">
                          <Input type="number" value={rule.points} onChange={(e) => updateRule(rule.id, parseInt(e.target.value) || 0)} className="w-20 rounded-xl text-center" />
                          <span className="text-sm text-muted-foreground">pts</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="title-translator" className="space-y-6">
            <Card className="rounded-[24px]">
              <CardHeader>
                <div className="flex items-center gap-2"><Globe className="w-5 h-5 text-primary" /><CardTitle>Title Translator - Configuracao da IA</CardTitle></div>
                <CardDescription>Configure a API, modelo e prompt usados pela ferramenta de traducao de titulos.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoading ? <Skeleton className="h-64 w-full rounded-xl" /> : (
                  <>
                    <div className="space-y-2">
                      <Label>API Provider</Label>
                      {apisLoading ? (
                        <Skeleton className="h-10 w-full rounded-xl" />
                      ) : (
                        <Select value={ttApiConfig} onValueChange={setTtApiConfig}>
                          <SelectTrigger className="rounded-xl">
                            <SelectValue placeholder="Selecione uma API..." />
                          </SelectTrigger>
                          <SelectContent>
                            {apis.filter(api => api.is_active).length === 0 ? (
                              <div className="p-2 text-sm text-muted-foreground">
                                Nenhuma API ativa configurada
                              </div>
                            ) : (
                              apis
                                .filter(api => api.is_active)
                                .map(api => (
                                  <SelectItem key={api.api_key} value={api.api_key}>
                                    {api.name}
                                  </SelectItem>
                                ))
                            )}
                          </SelectContent>
                        </Select>
                      )}
                      <p className="text-xs text-muted-foreground">
                        A API selecionada e seu modelo serão configurados em <Link to="/admin/configuracoes-apis" className="text-primary hover:underline">/admin/configuracoes-apis</Link>
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Prompt da IA</Label>
                      <Textarea
                        value={ttPrompt}
                        onChange={(e) => setTtPrompt(e.target.value)}
                        className="min-h-[300px] font-mono text-sm rounded-xl"
                      />
                      <p className="text-xs text-muted-foreground">
                        Use {'{title_br}'}, {'{area}'}, {'{responsibilities}'} e {'{years_experience}'} como placeholders
                      </p>
                    </div>

                    <div className="flex justify-end pt-4 border-t">
                      <Button
                        onClick={handleSaveTitleTranslator}
                        disabled={!hasTtChanges || isSaving}
                        className="rounded-[12px] gap-2"
                      >
                        <Save className="w-4 h-4" />
                        {isSaving ? 'Salvando...' : 'Salvar Configuracoes'}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upsell" className="space-y-6">
            <Card className="rounded-[24px]">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <CardTitle>Sistema de Upsell Contextual</CardTitle>
                </div>
                <CardDescription>
                  Configure como a IA analisa posts e sugere serviços relevantes na comunidade
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Toggle global */}
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Sistema Ativo</p>
                    <p className="text-xs text-muted-foreground">
                      Liga/desliga o upsell contextual globalmente
                    </p>
                  </div>
                  <Switch
                    checked={upsellEnabled}
                    onCheckedChange={setUpsellEnabled}
                  />
                </div>

                {/* Prompt Template */}
                <div className="space-y-2">
                  <Label>Prompt Template</Label>
                  <Textarea
                    value={upsellPrompt}
                    onChange={(e) => setUpsellPrompt(e.target.value)}
                    className="min-h-[300px] font-mono text-sm rounded-xl"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use {'{post_content}'} e {'{services_json}'} como placeholders
                  </p>
                </div>

                {/* Configurações do modelo */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Modelo Claude</Label>
                    <Select value={upsellModel} onValueChange={setUpsellModel}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="claude-haiku-4-5-20251001">Haiku 4.5 (Recomendado)</SelectItem>
                        <SelectItem value="claude-sonnet-4-5-20250929">Sonnet 4.5</SelectItem>
                        <SelectItem value="claude-opus-4-6">Opus 4.6</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Max Tokens</Label>
                    <Input
                      type="number"
                      value={upsellMaxTokens}
                      onChange={(e) => setUpsellMaxTokens(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Temperature</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="1"
                      value={upsellTemperature}
                      onChange={(e) => setUpsellTemperature(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                </div>

                {/* Rate limiting */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Intervalo entre Cards (dias)</Label>
                    <Input
                      type="number"
                      value={upsellRateLimitDays}
                      onChange={(e) => setUpsellRateLimitDays(e.target.value)}
                      className="rounded-xl"
                    />
                    <p className="text-xs text-muted-foreground">
                      Tempo mínimo entre cards para o mesmo usuário
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Blacklist Duration (dias)</Label>
                    <Input
                      type="number"
                      value={upsellBlacklistDays}
                      onChange={(e) => setUpsellBlacklistDays(e.target.value)}
                      className="rounded-xl"
                    />
                    <p className="text-xs text-muted-foreground">
                      Tempo de blacklist após 2 dismissals
                    </p>
                  </div>
                </div>

                {/* Botão salvar */}
                <div className="flex justify-end pt-4 border-t">
                  <Button
                    onClick={handleSaveUpsellConfigs}
                    disabled={!hasUpsellChanges || isSaving}
                    className="rounded-[12px] gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Salvando...' : 'Salvar Configurações'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Card de documentação */}
            <Card className="rounded-[24px] border-blue-500/20 bg-blue-500/5">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  <CardTitle className="text-blue-500">Como Funciona</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="space-y-2">
                  <h4 className="font-medium text-foreground">Fluxo do Sistema</h4>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Usuário cria um post na comunidade</li>
                    <li>Sistema verifica rate limit e blacklist</li>
                    <li>Pre-filtro compara keywords dos serviços com o texto do post</li>
                    <li>Se houver match, Claude API analisa o post e sugere serviço</li>
                    <li>Se confidence {'>='} 0.7, card de upsell é exibido no post</li>
                    <li>Após 2 dismissals, serviço entra em blacklist por 30 dias</li>
                  </ol>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-foreground">Otimizações de Custo</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Pre-filtro de keywords economiza ~90% de chamadas à API</li>
                    <li>Rate limiting previne spam de cards para o mesmo usuário</li>
                    <li>Haiku 4.5 é 20x mais barato que Sonnet</li>
                    <li>Max 1 card por post (constraint no banco)</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-foreground">Métricas Disponíveis</h4>
                  <p>
                    Todas as interações são rastreadas em <code className="px-1 py-0.5 bg-muted rounded text-xs">upsell_impressions</code>:
                    impressões, clicks, dismissals e conversões.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
