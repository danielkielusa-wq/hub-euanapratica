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
import { Save, Settings, FileCheck, Users, Hash, Zap, Trash2, Plus, FileText, Link2, Globe, Sparkles, ShoppingBag, Brain, ListTodo, MessageSquare, Menu } from 'lucide-react';
import { WhatsAppConnectionStatus } from '@/components/admin/whatsapp/WhatsAppConnectionStatus';
import { useAppConfigs } from '@/hooks/useAppConfigs';
import { useCommunityCategories } from '@/hooks/useCommunityCategories';
import { useGamificationRules } from '@/hooks/useGamification';
import { useAdminApis } from '@/hooks/useAdminApis';
import { useMenuVisibility, type MenuRole } from '@/hooks/useMenuVisibility';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const STUDENT_MENU_ITEMS = [
  { key: 'hub',              label: 'Meu Hub',          group: 'DISCOVERY' },
  { key: 'comunidade',       label: 'Comunidade',        group: 'DISCOVERY' },
  { key: 'agendamentos',     label: 'Agendamentos',      group: 'DISCOVERY' },
  { key: 'catalogo',         label: 'Explore',           group: 'DISCOVERY' },
  { key: 'cursos',           label: 'Meus Cursos',       group: 'DISCOVERY' },
  { key: 'espacos',          label: 'Minha Jornada',     group: 'DISCOVERY' },
  { key: 'dashboard',        label: 'Dashboard',         group: 'MENTORIA' },
  { key: 'biblioteca',       label: 'Biblioteca',        group: 'MENTORIA' },
  { key: 'tarefas',          label: 'Tarefas',           group: 'MENTORIA' },
  { key: 'curriculo',        label: 'ResumePass AI',     group: 'TOOLS & AI' },
  { key: 'title_translator', label: 'Title Translator',  group: 'TOOLS & AI' },
  { key: 'prime_jobs',       label: 'Prime Jobs',        group: 'TOOLS & AI' },
  { key: 'pricing',          label: 'Planos',            group: 'MINHA CONTA' },
  { key: 'assinatura',       label: 'Assinatura',        group: 'MINHA CONTA' },
  { key: 'perfil',           label: 'Perfil',            group: 'MINHA CONTA' },
  { key: 'pedidos',          label: 'Meus Pedidos',      group: 'MINHA CONTA' },
  { key: 'suporte',          label: 'Suporte',           group: 'MINHA CONTA' },
];

const MENTOR_MENU_ITEMS = [
  { key: 'dashboard',        label: 'Dashboard',         group: 'GESTÃO' },
  { key: 'espacos',          label: 'Meus Espaços',      group: 'GESTÃO' },
  { key: 'agendamentos',     label: 'Agendamentos',      group: 'GESTÃO' },
  { key: 'disponibilidade',  label: 'Disponibilidade',   group: 'GESTÃO' },
  { key: 'agenda',           label: 'Agenda',            group: 'GESTÃO' },
  { key: 'tarefas',          label: 'Tarefas',           group: 'GESTÃO' },
  { key: 'biblioteca',       label: 'Biblioteca',        group: 'CONTEÚDO' },
  { key: 'upload_materiais', label: 'Upload Materiais',  group: 'CONTEÚDO' },
  { key: 'perfil',           label: 'Perfil',            group: 'MINHA CONTA' },
  { key: 'suporte',          label: 'Suporte',           group: 'MINHA CONTA' },
];

function groupMenuItems(items: { key: string; label: string; group: string }[]) {
  return items.reduce<Record<string, { key: string; label: string }[]>>((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push({ key: item.key, label: item.label });
    return acc;
  }, {});
}

export default function AdminSettings() {
  const { configs, isLoading, isSaving, updateConfig, getConfigValue } = useAppConfigs();
  const { apis, isLoading: apisLoading } = useAdminApis();
  const { isLoading: menuLoading, isItemVisible, updateVisibility } = useMenuVisibility();

  const [resumePrompt, setResumePrompt] = useState('');
  const [resumeApiConfig, setResumeApiConfig] = useState('openai_api');
  const [hasResumeChanges, setHasResumeChanges] = useState(false);
  const [leadPrompt, setLeadPrompt] = useState('');
  const [leadApiConfig, setLeadApiConfig] = useState('openai_api');
  const [hasLeadChanges, setHasLeadChanges] = useState(false);

  // Product recommendation prompt
  const [recPrompt, setRecPrompt] = useState('');
  const [recApiConfig, setRecApiConfig] = useState('openai_api');
  const [hasRecChanges, setHasRecChanges] = useState(false);

  // Report webhook config
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookEnabled, setWebhookEnabled] = useState(false);
  const [reportBaseUrl, setReportBaseUrl] = useState('');
  const [consultoriaBookingUrl, setConsultoriaBookingUrl] = useState('');
  const [hasWebhookChanges, setHasWebhookChanges] = useState(false);

  // Title Translator config
  const [ttPrompt, setTtPrompt] = useState('');
  const [ttApiConfig, setTtApiConfig] = useState('openai_api');
  const [hasTtChanges, setHasTtChanges] = useState(false);

  // Daily Priorities config
  const [dpPrompt, setDpPrompt] = useState('');
  const [dpApiConfig, setDpApiConfig] = useState('anthropic_api');
  const [dpLeadLimit, setDpLeadLimit] = useState('80');
  const [hasDpChanges, setHasDpChanges] = useState(false);

  // Suggest Tasks config
  const [stApiConfig, setStApiConfig] = useState('anthropic_api');
  const [stPrompt, setStPrompt] = useState('');
  const [hasStChanges, setHasStChanges] = useState(false);

  // Suggest WhatsApp config
  const [swApiConfig, setSwApiConfig] = useState('anthropic_api');
  const [swPrompt, setSwPrompt] = useState('');
  const [hasSwChanges, setHasSwChanges] = useState(false);

  // Upsell config
  const [upsellEnabled, setUpsellEnabled] = useState(true);
  const [upsellPrompt, setUpsellPrompt] = useState('');
  const [upsellApiConfig, setUpsellApiConfig] = useState('anthropic_api');
  const [upsellModel, setUpsellModel] = useState('claude-haiku-4-5-20251001');
  const [upsellMaxTokens, setUpsellMaxTokens] = useState('150');
  const [upsellTemperature, setUpsellTemperature] = useState('0');
  const [upsellRateLimitDays, setUpsellRateLimitDays] = useState('7');
  const [upsellBlacklistDays, setUpsellBlacklistDays] = useState('30');
  const [hasUpsellChanges, setHasUpsellChanges] = useState(false);

  // WhatsApp config
  const [waEnabled, setWaEnabled] = useState(false);
  const [waWebhookSecret, setWaWebhookSecret] = useState('');
  const [waCountryCode, setWaCountryCode] = useState('55');
  const [hasWaChanges, setHasWaChanges] = useState(false);

  useEffect(() => {
    const resumeValue = getConfigValue('resume_analyzer_prompt');
    if (resumeValue) setResumePrompt(resumeValue);
    const resumeApiValue = getConfigValue('resume_analyzer_api_config');
    if (resumeApiValue) setResumeApiConfig(resumeApiValue);
    const leadValue = getConfigValue('lead_report_formatter_prompt');
    if (leadValue) setLeadPrompt(leadValue);
    const leadApiValue = getConfigValue('lead_report_api_config');
    if (leadApiValue) setLeadApiConfig(leadApiValue);
    const recValue = getConfigValue('llm_product_recommendation_prompt');
    if (recValue) setRecPrompt(recValue);
    const recApiValue = getConfigValue('llm_product_recommendation_api');
    if (recApiValue) setRecApiConfig(recApiValue);

    // Load webhook configs
    const webhookUrlValue = getConfigValue('lead_webhook_url');
    if (webhookUrlValue) setWebhookUrl(webhookUrlValue);
    const webhookEnabledValue = getConfigValue('lead_webhook_enabled');
    setWebhookEnabled(webhookEnabledValue === 'true');
    const baseUrlValue = getConfigValue('lead_report_base_url');
    if (baseUrlValue) setReportBaseUrl(baseUrlValue);
    const consultoriaUrlValue = getConfigValue('report_cta_consultoria_url');
    if (consultoriaUrlValue) setConsultoriaBookingUrl(consultoriaUrlValue);

    // Load title translator configs
    const ttPromptValue = getConfigValue('title_translator_prompt');
    if (ttPromptValue) setTtPrompt(ttPromptValue);
    const ttApiConfigValue = getConfigValue('title_translator_api_config');
    if (ttApiConfigValue) setTtApiConfig(ttApiConfigValue);

    // Load daily priorities configs
    const dpPromptValue = getConfigValue('daily_priorities_prompt');
    if (dpPromptValue) setDpPrompt(dpPromptValue);
    const dpApiValue = getConfigValue('daily_priorities_api_config');
    if (dpApiValue) setDpApiConfig(dpApiValue);
    const dpLimitValue = getConfigValue('daily_priorities_lead_limit');
    if (dpLimitValue) setDpLeadLimit(dpLimitValue);

    // Load suggest tasks configs
    const stApiValue = getConfigValue('suggest_tasks_api_config');
    if (stApiValue) setStApiConfig(stApiValue);
    const stPromptValue = getConfigValue('suggest_tasks_prompt');
    if (stPromptValue !== undefined) setStPrompt(stPromptValue);

    // Load suggest whatsapp configs
    const swApiValue = getConfigValue('suggest_whatsapp_api_config');
    if (swApiValue) setSwApiConfig(swApiValue);
    const swPromptValue = getConfigValue('suggest_whatsapp_prompt');
    if (swPromptValue !== undefined) setSwPrompt(swPromptValue);

    // Load upsell configs
    const upsellEnabledValue = getConfigValue('upsell_enabled');
    setUpsellEnabled(upsellEnabledValue !== 'false');
    const upsellPromptValue = getConfigValue('upsell_prompt_template');
    if (upsellPromptValue) setUpsellPrompt(upsellPromptValue);
    const upsellApiValue = getConfigValue('upsell_api_config');
    if (upsellApiValue) setUpsellApiConfig(upsellApiValue);
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

    // Load WhatsApp configs
    const waEnabledValue = getConfigValue('whatsapp_enabled');
    setWaEnabled(waEnabledValue === 'true');
    const waSecretValue = getConfigValue('whatsapp_webhook_secret');
    if (waSecretValue) setWaWebhookSecret(waSecretValue);
    const waCodeValue = getConfigValue('whatsapp_default_country_code');
    if (waCodeValue) setWaCountryCode(waCodeValue);
  }, [configs]);

  useEffect(() => {
    const originalValue = getConfigValue('resume_analyzer_prompt');
    const originalApi = getConfigValue('resume_analyzer_api_config');
    setHasResumeChanges(
      (resumePrompt !== originalValue && resumePrompt !== '') ||
      resumeApiConfig !== (originalApi || 'openai_api')
    );
  }, [resumePrompt, resumeApiConfig, configs]);

  useEffect(() => {
    const originalValue = getConfigValue('lead_report_formatter_prompt');
    const originalApi = getConfigValue('lead_report_api_config');
    setHasLeadChanges(
      (leadPrompt !== originalValue && leadPrompt !== '') ||
      leadApiConfig !== (originalApi || 'openai_api')
    );
  }, [leadPrompt, leadApiConfig, configs]);

  useEffect(() => {
    const originalValue = getConfigValue('llm_product_recommendation_prompt');
    const originalApi = getConfigValue('llm_product_recommendation_api');
    setHasRecChanges(
      (recPrompt !== originalValue && recPrompt !== '') ||
      recApiConfig !== (originalApi || 'openai_api')
    );
  }, [recPrompt, recApiConfig, configs]);

  useEffect(() => {
    const originalUrl = getConfigValue('lead_webhook_url');
    const originalEnabled = getConfigValue('lead_webhook_enabled') === 'true';
    const originalBaseUrl = getConfigValue('lead_report_base_url');
    const originalConsultoriaUrl = getConfigValue('report_cta_consultoria_url');
    const hasChanges =
      webhookUrl !== originalUrl ||
      webhookEnabled !== originalEnabled ||
      reportBaseUrl !== originalBaseUrl ||
      consultoriaBookingUrl !== (originalConsultoriaUrl || '');
    setHasWebhookChanges(hasChanges);
  }, [webhookUrl, webhookEnabled, reportBaseUrl, consultoriaBookingUrl, configs]);

  useEffect(() => {
    const originalPrompt = getConfigValue('title_translator_prompt');
    const originalApi = getConfigValue('title_translator_api_config');
    const hasChanges =
      ttPrompt !== originalPrompt ||
      ttApiConfig !== (originalApi || 'openai_api');
    setHasTtChanges(hasChanges);
  }, [ttPrompt, ttApiConfig, configs]);

  useEffect(() => {
    const originalPrompt = getConfigValue('daily_priorities_prompt');
    const originalApi = getConfigValue('daily_priorities_api_config');
    const originalLimit = getConfigValue('daily_priorities_lead_limit');
    setHasDpChanges(
      dpPrompt !== originalPrompt ||
      dpApiConfig !== (originalApi || 'anthropic_api') ||
      dpLeadLimit !== (originalLimit || '80')
    );
  }, [dpPrompt, dpApiConfig, dpLeadLimit, configs]);

  useEffect(() => {
    const originalApi = getConfigValue('suggest_tasks_api_config');
    const originalPrompt = getConfigValue('suggest_tasks_prompt');
    setHasStChanges(
      stApiConfig !== (originalApi || 'anthropic_api') ||
      stPrompt !== (originalPrompt || '')
    );
  }, [stApiConfig, stPrompt, configs]);

  useEffect(() => {
    const originalApi = getConfigValue('suggest_whatsapp_api_config');
    const originalPrompt = getConfigValue('suggest_whatsapp_prompt');
    setHasSwChanges(
      swApiConfig !== (originalApi || 'anthropic_api') ||
      swPrompt !== (originalPrompt || '')
    );
  }, [swApiConfig, swPrompt, configs]);

  useEffect(() => {
    const originalEnabled = getConfigValue('upsell_enabled') !== 'false';
    const originalPrompt = getConfigValue('upsell_prompt_template');
    const originalApi = getConfigValue('upsell_api_config');
    const originalModel = getConfigValue('upsell_model');
    const originalMaxTokens = getConfigValue('upsell_max_tokens');
    const originalTemperature = getConfigValue('upsell_temperature');
    const originalRateLimit = getConfigValue('upsell_rate_limit_days');
    const originalBlacklist = getConfigValue('upsell_blacklist_days');
    const hasChanges =
      upsellEnabled !== originalEnabled ||
      upsellPrompt !== originalPrompt ||
      upsellApiConfig !== (originalApi || 'anthropic_api') ||
      upsellModel !== originalModel ||
      upsellMaxTokens !== originalMaxTokens ||
      upsellTemperature !== originalTemperature ||
      upsellRateLimitDays !== originalRateLimit ||
      upsellBlacklistDays !== originalBlacklist;
    setHasUpsellChanges(hasChanges);
  }, [upsellEnabled, upsellPrompt, upsellApiConfig, upsellModel, upsellMaxTokens, upsellTemperature, upsellRateLimitDays, upsellBlacklistDays, configs]);

  useEffect(() => {
    const originalEnabled = getConfigValue('whatsapp_enabled') === 'true';
    const originalSecret = getConfigValue('whatsapp_webhook_secret') || '';
    const originalCode = getConfigValue('whatsapp_default_country_code') || '55';
    setHasWaChanges(
      waEnabled !== originalEnabled ||
      waWebhookSecret !== originalSecret ||
      waCountryCode !== originalCode
    );
  }, [waEnabled, waWebhookSecret, waCountryCode, configs]);

  const handleSaveWhatsApp = async () => {
    await Promise.all([
      updateConfig('whatsapp_enabled', waEnabled ? 'true' : 'false'),
      updateConfig('whatsapp_webhook_secret', waWebhookSecret),
      updateConfig('whatsapp_default_country_code', waCountryCode),
    ]);
    setHasWaChanges(false);
  };

  const handleSaveResume = async () => {
    await Promise.all([
      updateConfig('resume_analyzer_prompt', resumePrompt),
      updateConfig('resume_analyzer_api_config', resumeApiConfig),
    ]);
    setHasResumeChanges(false);
  };

  const handleSaveLead = async () => {
    await Promise.all([
      updateConfig('lead_report_formatter_prompt', leadPrompt),
      updateConfig('lead_report_api_config', leadApiConfig),
    ]);
    setHasLeadChanges(false);
  };

  const handleSaveRecPrompt = async () => {
    await Promise.all([
      updateConfig('llm_product_recommendation_prompt', recPrompt),
      updateConfig('llm_product_recommendation_api', recApiConfig),
    ]);
    setHasRecChanges(false);
  };

  const handleSaveWebhook = async () => {
    await Promise.all([
      updateConfig('lead_webhook_url', webhookUrl),
      updateConfig('lead_webhook_enabled', webhookEnabled ? 'true' : 'false'),
      updateConfig('lead_report_base_url', reportBaseUrl),
      updateConfig('report_cta_consultoria_url', consultoriaBookingUrl),
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

  const handleSaveDailyPriorities = async () => {
    await Promise.all([
      updateConfig('daily_priorities_prompt', dpPrompt),
      updateConfig('daily_priorities_api_config', dpApiConfig),
      updateConfig('daily_priorities_lead_limit', dpLeadLimit),
    ]);
    setHasDpChanges(false);
  };

  const handleSaveSuggestTasks = async () => {
    await Promise.all([
      updateConfig('suggest_tasks_api_config', stApiConfig),
      updateConfig('suggest_tasks_prompt', stPrompt),
    ]);
    setHasStChanges(false);
  };

  const handleSaveSuggestWhatsApp = async () => {
    await Promise.all([
      updateConfig('suggest_whatsapp_api_config', swApiConfig),
      updateConfig('suggest_whatsapp_prompt', swPrompt),
    ]);
    setHasSwChanges(false);
  };

  const handleSaveUpsellConfigs = async () => {
    await Promise.all([
      updateConfig('upsell_enabled', upsellEnabled ? 'true' : 'false'),
      updateConfig('upsell_prompt_template', upsellPrompt),
      updateConfig('upsell_api_config', upsellApiConfig),
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
  const consultoriaUrlConfig = configs.find(c => c.key === 'report_cta_consultoria_url');

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
            <TabsTrigger value="daily-priorities" className="gap-2 rounded-lg"><Brain className="h-4 w-4" />Prioridades do Dia</TabsTrigger>
            <TabsTrigger value="upsell" className="gap-2 rounded-lg"><Sparkles className="h-4 w-4" />Upsell Contextual</TabsTrigger>
            <TabsTrigger value="suggest-tasks" className="gap-2 rounded-lg"><ListTodo className="h-4 w-4" />Sugestão de Tarefas</TabsTrigger>
            <TabsTrigger value="suggest-whatsapp" className="gap-2 rounded-lg"><MessageSquare className="h-4 w-4" />Sugestão WhatsApp</TabsTrigger>
            <TabsTrigger value="whatsapp" className="gap-2 rounded-lg"><MessageSquare className="h-4 w-4" />WhatsApp</TabsTrigger>
            <TabsTrigger value="menu-config" className="gap-2 rounded-lg"><Menu className="h-4 w-4" />Menu do App</TabsTrigger>
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
                    <div className="space-y-2">
                      <Label>API Provider</Label>
                      {apisLoading ? (
                        <Skeleton className="h-10 w-full rounded-xl" />
                      ) : (
                        <Select value={resumeApiConfig} onValueChange={setResumeApiConfig}>
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
                                    <div className="flex flex-col gap-0.5">
                                      <span>{api.name}</span>
                                      {api.parameters?.model && (
                                        <span className="text-xs text-muted-foreground">{api.parameters.model}</span>
                                      )}
                                    </div>
                                  </SelectItem>
                                ))
                            )}
                          </SelectContent>
                        </Select>
                      )}
                      <p className="text-xs text-muted-foreground">
                        A API selecionada e seu modelo serao configurados em <Link to="/admin/configuracoes-apis" className="text-primary hover:underline">Configuracoes de APIs</Link>
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Prompt da IA</Label>
                      <Textarea value={resumePrompt} onChange={(e) => setResumePrompt(e.target.value)} className="min-h-[300px] font-mono text-sm rounded-xl" />
                    </div>
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
                    <div className="space-y-2">
                      <Label>API Provider</Label>
                      {apisLoading ? (
                        <Skeleton className="h-10 w-full rounded-xl" />
                      ) : (
                        <Select value={leadApiConfig} onValueChange={setLeadApiConfig}>
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
                                    <div className="flex flex-col gap-0.5">
                                      <span>{api.name}</span>
                                      {api.parameters?.model && (
                                        <span className="text-xs text-muted-foreground">{api.parameters.model}</span>
                                      )}
                                    </div>
                                  </SelectItem>
                                ))
                            )}
                          </SelectContent>
                        </Select>
                      )}
                      <p className="text-xs text-muted-foreground">
                        A API selecionada e seu modelo serao configurados em <Link to="/admin/configuracoes-apis" className="text-primary hover:underline">Configuracoes de APIs</Link>
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Prompt da IA</Label>
                      <Textarea value={leadPrompt} onChange={(e) => setLeadPrompt(e.target.value)} className="min-h-[300px] font-mono text-sm rounded-xl" />
                    </div>
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
                    <div className="space-y-2">
                      <Label>API Provider</Label>
                      {apisLoading ? (
                        <Skeleton className="h-10 w-full rounded-xl" />
                      ) : (
                        <Select value={recApiConfig} onValueChange={setRecApiConfig}>
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
                                    <div className="flex flex-col gap-0.5">
                                      <span>{api.name}</span>
                                      {api.parameters?.model && (
                                        <span className="text-xs text-muted-foreground">{api.parameters.model}</span>
                                      )}
                                    </div>
                                  </SelectItem>
                                ))
                            )}
                          </SelectContent>
                        </Select>
                      )}
                      <p className="text-xs text-muted-foreground">
                        A API selecionada e seu modelo serao configurados em <Link to="/admin/configuracoes-apis" className="text-primary hover:underline">Configuracoes de APIs</Link>
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Prompt da IA</Label>
                      <Textarea value={recPrompt} onChange={(e) => setRecPrompt(e.target.value)} className="min-h-[300px] font-mono text-sm rounded-xl" />
                      <p className="text-xs text-muted-foreground">
                        Use {'{{lead_data}}'}, {'{{tier}}'} e {'{{services}}'} como placeholders
                      </p>
                    </div>
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

                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Link2 className="w-4 h-4" />
                        URL de Agendamento da Sessão de Diagnóstico
                      </label>
                      <Input
                        value={consultoriaBookingUrl}
                        onChange={(e) => setConsultoriaBookingUrl(e.target.value)}
                        placeholder="https://calendly.com/euanapratica/sessao-diagnostico"
                        className="rounded-xl font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        Link exibido no CTA "Agendar sessão" do relatório de lead (modo acesso limitado)
                      </p>
                      {consultoriaUrlConfig?.updated_at && (
                        <p className="text-xs text-muted-foreground">
                          Última atualização: {format(new Date(consultoriaUrlConfig.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
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
                                    <div className="flex flex-col gap-0.5">
                                      <span>{api.name}</span>
                                      {api.parameters?.model && (
                                        <span className="text-xs text-muted-foreground">{api.parameters.model}</span>
                                      )}
                                    </div>
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

          <TabsContent value="daily-priorities" className="space-y-6">
            <Card className="rounded-[24px]">
              <CardHeader>
                <div className="flex items-center gap-2"><Brain className="w-5 h-5 text-indigo-600" /><CardTitle>Prioridades do Dia - IA</CardTitle></div>
                <CardDescription>Configure a API e o prompt usados para gerar prioridades diarias de leads no dashboard.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoading ? <Skeleton className="h-64 w-full rounded-xl" /> : (
                  <>
                    <div className="space-y-2">
                      <Label>API Provider</Label>
                      {apisLoading ? (
                        <Skeleton className="h-10 w-full rounded-xl" />
                      ) : (
                        <Select value={dpApiConfig} onValueChange={setDpApiConfig}>
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
                                    <div className="flex flex-col gap-0.5">
                                      <span>{api.name}</span>
                                      {api.parameters?.model && (
                                        <span className="text-xs text-muted-foreground">{api.parameters.model}</span>
                                      )}
                                    </div>
                                  </SelectItem>
                                ))
                            )}
                          </SelectContent>
                        </Select>
                      )}
                      <p className="text-xs text-muted-foreground">
                        A API selecionada e seu modelo serao configurados em <Link to="/admin/configuracoes-apis" className="text-primary hover:underline">Configuracoes de APIs</Link>
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Limite de Leads</Label>
                      <Input
                        type="number"
                        min="5"
                        max="500"
                        value={dpLeadLimit}
                        onChange={(e) => setDpLeadLimit(e.target.value)}
                        className="w-32 rounded-xl"
                      />
                      <p className="text-xs text-muted-foreground">
                        Quantidade maxima de leads enviados para a IA analisar (ordenados por priority score). Min: 5, Max: 500. Valores maiores geram analises mais completas mas custam mais tokens e demoram mais.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>System Prompt</Label>
                      <Textarea
                        value={dpPrompt}
                        onChange={(e) => setDpPrompt(e.target.value)}
                        placeholder="Deixe vazio para usar o prompt padrao embutido na Edge Function..."
                        className="min-h-[300px] font-mono text-sm rounded-xl"
                      />
                      <p className="text-xs text-muted-foreground">
                        Use {'{{today}}'} como placeholder para a data atual. Deixe vazio para usar o prompt padrao.
                      </p>
                    </div>

                    {configs.find(c => c.key === 'daily_priorities_prompt')?.updated_at && (
                      <p className="text-xs text-muted-foreground">
                        Ultima atualizacao: {format(new Date(configs.find(c => c.key === 'daily_priorities_prompt')!.updated_at), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })}
                      </p>
                    )}

                    <div className="flex justify-end pt-4 border-t">
                      <Button onClick={handleSaveDailyPriorities} disabled={!hasDpChanges || isSaving} className="rounded-[12px] gap-2">
                        <Save className="w-4 h-4" />
                        {isSaving ? 'Salvando...' : 'Salvar Configuracoes'}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="suggest-tasks" className="space-y-6">
            <Card className="rounded-[24px]">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ListTodo className="w-5 h-5 text-violet-600" />
                  <CardTitle>Sugestão de Tarefas — IA</CardTitle>
                </div>
                <CardDescription>
                  Configure a API e o prompt usados quando o admin clica em "Sugerir Tarefas" no detalhe de um lead (aba Tarefas).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoading ? <Skeleton className="h-64 w-full rounded-xl" /> : (
                  <>
                    <div className="space-y-2">
                      <Label>API Provider</Label>
                      {apisLoading ? (
                        <Skeleton className="h-10 w-full rounded-xl" />
                      ) : (
                        <Select value={stApiConfig} onValueChange={setStApiConfig}>
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
                                    <div className="flex flex-col gap-0.5">
                                      <span>{api.name}</span>
                                      {api.parameters?.model && (
                                        <span className="text-xs text-muted-foreground">{api.parameters.model}</span>
                                      )}
                                    </div>
                                  </SelectItem>
                                ))
                            )}
                          </SelectContent>
                        </Select>
                      )}
                      <p className="text-xs text-muted-foreground">
                        A API selecionada e seu modelo serão configurados em{' '}
                        <Link to="/admin/configuracoes-apis" className="text-primary hover:underline">Configurações de APIs</Link>.
                        O fallback automático entre APIs também é respeitado.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>System Prompt</Label>
                      <Textarea
                        value={stPrompt}
                        onChange={(e) => setStPrompt(e.target.value)}
                        placeholder="Deixe vazio para usar o prompt padrão embutido na Edge Function..."
                        className="min-h-[320px] font-mono text-sm rounded-xl"
                      />
                      <p className="text-xs text-muted-foreground">
                        Deixe vazio para usar o prompt padrão. O contexto enviado à IA inclui: perfil do lead, scores, barreiras, últimas interações (incluindo WhatsApp) e tarefas já existentes. A resposta deve ser um JSON com o campo <code className="px-1 py-0.5 bg-muted rounded">suggestions[]</code>.
                      </p>
                    </div>

                    {configs.find(c => c.key === 'suggest_tasks_prompt')?.updated_at && (
                      <p className="text-xs text-muted-foreground">
                        Última atualização: {format(new Date(configs.find(c => c.key === 'suggest_tasks_prompt')!.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    )}

                    <div className="flex justify-end pt-4 border-t">
                      <Button
                        onClick={handleSaveSuggestTasks}
                        disabled={!hasStChanges || isSaving}
                        className="rounded-[12px] gap-2"
                      >
                        <Save className="w-4 h-4" />
                        {isSaving ? 'Salvando...' : 'Salvar Configurações'}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-[24px] border-violet-500/20 bg-violet-500/5">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-violet-500" />
                  <CardTitle className="text-violet-600">Como Funciona</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="space-y-2">
                  <h4 className="font-medium text-foreground">Fluxo</h4>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Admin abre o detalhe de um lead (aba Tarefas ou WhatsApp)</li>
                    <li>Clica em "Sugerir com IA"</li>
                    <li>A Edge Function <code className="px-1 py-0.5 bg-muted rounded text-xs">suggest-lead-tasks</code> busca perfil, interações e tarefas existentes</li>
                    <li>A IA analisa tudo e retorna 2–5 sugestões com título, tipo, prioridade e prazo</li>
                    <li>Admin seleciona quais criar (todas marcadas por padrão) e clica em "Criar X tarefas"</li>
                    <li>Tarefas criadas ficam marcadas com fonte <code className="px-1 py-0.5 bg-muted rounded text-xs">ai_suggestion</code> na aba Tarefas</li>
                  </ol>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-foreground">Contexto enviado à IA</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Perfil completo: área, nível, inglês, situação de visto, família, objetivo</li>
                    <li>Scores: prontidão, temperatura, prioridade, LTV estimado, fase ROTA</li>
                    <li>Barreiras identificadas (7 dimensões)</li>
                    <li>Últimas 20 interações dos 60 dias anteriores (incluindo WhatsApp)</li>
                    <li>Follow-ups agendados e ações de milestone</li>
                    <li>Títulos das tarefas pendentes (para evitar duplicatas)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="suggest-whatsapp" className="space-y-6">
            <Card className="rounded-[24px]">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-green-600" />
                  <CardTitle>Sugestão de WhatsApp — IA</CardTitle>
                </div>
                <CardDescription>
                  Configure a API e o prompt usados quando o admin clica em "Sugerir WhatsApp" no detalhe de um lead (aba WhatsApp).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoading ? <Skeleton className="h-64 w-full rounded-xl" /> : (
                  <>
                    <div className="space-y-2">
                      <Label>API Provider</Label>
                      {apisLoading ? (
                        <Skeleton className="h-10 w-full rounded-xl" />
                      ) : (
                        <Select value={swApiConfig} onValueChange={setSwApiConfig}>
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
                                    <div className="flex flex-col gap-0.5">
                                      <span>{api.name}</span>
                                      {api.parameters?.model && (
                                        <span className="text-xs text-muted-foreground">{api.parameters.model}</span>
                                      )}
                                    </div>
                                  </SelectItem>
                                ))
                            )}
                          </SelectContent>
                        </Select>
                      )}
                      <p className="text-xs text-muted-foreground">
                        A API selecionada e seu modelo serão configurados em{' '}
                        <Link to="/admin/configuracoes-apis" className="text-primary hover:underline">Configurações de APIs</Link>.
                        O fallback automático entre APIs também é respeitado.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>System Prompt</Label>
                      <Textarea
                        value={swPrompt}
                        onChange={(e) => setSwPrompt(e.target.value)}
                        placeholder="Deixe vazio para usar o prompt padrão embutido na Edge Function..."
                        className="min-h-[320px] font-mono text-sm rounded-xl"
                      />
                      <p className="text-xs text-muted-foreground">
                        Deixe vazio para usar o prompt padrão. O contexto enviado à IA inclui: perfil do lead, scores, barreiras, histórico de WhatsApp e outras interações. A resposta deve ser um JSON com o campo <code className="px-1 py-0.5 bg-muted rounded">suggestions[]</code> contendo <code className="px-1 py-0.5 bg-muted rounded">message</code>, <code className="px-1 py-0.5 bg-muted rounded">intent</code>, <code className="px-1 py-0.5 bg-muted rounded">tone</code> e <code className="px-1 py-0.5 bg-muted rounded">reasoning</code>.
                      </p>
                    </div>

                    {configs.find(c => c.key === 'suggest_whatsapp_prompt')?.updated_at && (
                      <p className="text-xs text-muted-foreground">
                        Última atualização: {format(new Date(configs.find(c => c.key === 'suggest_whatsapp_prompt')!.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    )}

                    <div className="flex justify-end pt-4 border-t">
                      <Button
                        onClick={handleSaveSuggestWhatsApp}
                        disabled={!hasSwChanges || isSaving}
                        className="rounded-[12px] gap-2"
                      >
                        <Save className="w-4 h-4" />
                        {isSaving ? 'Salvando...' : 'Salvar Configurações'}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-[24px] border-green-500/20 bg-green-500/5">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-500" />
                  <CardTitle className="text-green-600">Como Funciona</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="space-y-2">
                  <h4 className="font-medium text-foreground">Fluxo</h4>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Admin abre o detalhe de um lead (aba WhatsApp)</li>
                    <li>Clica em "Sugerir WhatsApp"</li>
                    <li>A Edge Function <code className="px-1 py-0.5 bg-muted rounded text-xs">suggest-whatsapp-messages</code> busca perfil, interações e histórico WhatsApp</li>
                    <li>A IA analisa tudo e retorna 2–4 sugestões de mensagens com intent e tom</li>
                    <li>Admin seleciona uma mensagem e clica em "Enviar selecionada" ou "Copiar"</li>
                  </ol>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-foreground">Contexto enviado à IA</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Perfil: área, objetivo, inglês, visto, barreiras</li>
                    <li>Scores: temperatura, prontidão, fase ROTA, urgência</li>
                    <li>Histórico WhatsApp: mensagens enviadas e recebidas (últimos 60 dias)</li>
                    <li>Outras interações: notas, emails, ligações</li>
                    <li>Produto recomendado e descrição</li>
                  </ul>
                </div>
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

                {/* API Provider */}
                <div className="space-y-2">
                  <Label>API Provider</Label>
                  {apisLoading ? (
                    <Skeleton className="h-10 w-full rounded-xl" />
                  ) : (
                    <Select value={upsellApiConfig} onValueChange={setUpsellApiConfig}>
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
                                <div className="flex flex-col gap-0.5">
                                  <span>{api.name}</span>
                                  {api.parameters?.model && (
                                    <span className="text-xs text-muted-foreground">{api.parameters.model}</span>
                                  )}
                                </div>
                              </SelectItem>
                            ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
                  <p className="text-xs text-muted-foreground">
                    A API selecionada e seu modelo serao configurados em <Link to="/admin/configuracoes-apis" className="text-primary hover:underline">Configuracoes de APIs</Link>
                  </p>
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
                    <Label>Modelo (override)</Label>
                    <Input
                      value={upsellModel}
                      onChange={(e) => setUpsellModel(e.target.value)}
                      placeholder="Ex: claude-haiku-4-5-20251001 ou gpt-4o-mini"
                      className="rounded-xl font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Sobrescreve o modelo da API. Deixe vazio para usar o modelo padrao da API selecionada.
                    </p>
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

          <TabsContent value="whatsapp" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Connection status */}
              <WhatsAppConnectionStatus />

              {/* WhatsApp settings */}
              <Card className="rounded-[24px]">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-green-600" />
                    <CardTitle>Configurações WhatsApp</CardTitle>
                  </div>
                  <CardDescription>Feature flag, webhook secret e código de país</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLoading ? <Skeleton className="h-48 w-full rounded-xl" /> : (
                    <>
                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">WhatsApp Ativo</p>
                          <p className="text-xs text-muted-foreground">
                            {waEnabled ? 'Integração WhatsApp habilitada' : 'Integração WhatsApp desabilitada'}
                          </p>
                        </div>
                        <Switch checked={waEnabled} onCheckedChange={setWaEnabled} />
                      </div>

                      <div className="space-y-2">
                        <Label>Webhook Secret</Label>
                        <Input
                          value={waWebhookSecret}
                          onChange={(e) => setWaWebhookSecret(e.target.value)}
                          placeholder="Secret para validar webhooks da Evolution API"
                          className="rounded-xl font-mono text-sm"
                        />
                        <p className="text-xs text-muted-foreground">
                          Usado no header <code className="px-1 py-0.5 bg-muted rounded text-xs">x-webhook-secret</code> para autenticar webhooks recebidos.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Código de País Padrão</Label>
                        <Input
                          value={waCountryCode}
                          onChange={(e) => setWaCountryCode(e.target.value)}
                          placeholder="55"
                          className="w-24 rounded-xl"
                        />
                        <p className="text-xs text-muted-foreground">
                          Adicionado automaticamente a números sem código de país (ex: 55 para Brasil)
                        </p>
                      </div>

                      <div className="flex justify-end pt-4 border-t">
                        <Button
                          onClick={handleSaveWhatsApp}
                          disabled={!hasWaChanges || isSaving}
                          className="rounded-[12px] gap-2"
                        >
                          <Save className="w-4 h-4" />
                          {isSaving ? 'Salvando...' : 'Salvar'}
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Documentation card */}
            <Card className="rounded-[24px] border-green-500/20 bg-green-500/5">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-600" />
                  <CardTitle className="text-green-700">Setup da Evolution API</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="space-y-2">
                  <h4 className="font-medium text-foreground">Passo a passo</h4>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Configure a Evolution API no VPS (Docker Compose)</li>
                    <li>Aponte DNS <code className="px-1 py-0.5 bg-muted rounded text-xs">wa.euanapratica.com</code> para o IP do VPS</li>
                    <li>Em <Link to="/admin/configuracoes-apis" className="text-primary hover:underline">APIs Externas</Link>, edite "Evolution API (WhatsApp)" com a URL e API key</li>
                    <li>Gere e cole o Webhook Secret acima</li>
                    <li>Configure o mesmo secret no webhook da Evolution API</li>
                    <li>Escaneie o QR Code no card de conexão acima</li>
                    <li>Ative o toggle "WhatsApp Ativo"</li>
                  </ol>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-foreground">Funcionalidades</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Envio de mensagens direto do CRM (texto livre ou template)</li>
                    <li>Recebimento automático de respostas dos leads</li>
                    <li>Histórico completo na aba WhatsApp do lead</li>
                    <li>Status de entrega (enviado, entregue, lido)</li>
                    <li>Templates WhatsApp gerenciáveis em <Link to="/admin/whatsapp-templates" className="text-primary hover:underline">Templates WhatsApp</Link></li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="menu-config" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Student Menu */}
              <Card className="rounded-[24px]">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    <CardTitle>Menu dos Alunos</CardTitle>
                  </div>
                  <CardDescription>
                    Itens visíveis no menu lateral para usuários com perfil de aluno. Mudanças aplicadas imediatamente.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {menuLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full rounded-xl" />
                      ))}
                    </div>
                  ) : (
                    Object.entries(groupMenuItems(STUDENT_MENU_ITEMS)).map(([groupLabel, items]) => (
                      <div key={groupLabel} className="space-y-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1">
                          {groupLabel}
                        </p>
                        <div className="space-y-1">
                          {items.map(item => {
                            const visible = isItemVisible('student' as MenuRole, item.key);
                            return (
                              <div key={item.key} className="flex items-center justify-between px-4 py-3 rounded-xl bg-muted/40">
                                <span className={`text-sm font-medium ${visible ? 'text-foreground' : 'text-muted-foreground line-through'}`}>
                                  {item.label}
                                </span>
                                <Switch
                                  checked={visible}
                                  onCheckedChange={(checked) => updateVisibility('student' as MenuRole, item.key, checked)}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Mentor Menu */}
              <Card className="rounded-[24px]">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    <CardTitle>Menu dos Mentores</CardTitle>
                  </div>
                  <CardDescription>
                    Itens visíveis no menu lateral para usuários com perfil de mentor. Mudanças aplicadas imediatamente.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {menuLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full rounded-xl" />
                      ))}
                    </div>
                  ) : (
                    Object.entries(groupMenuItems(MENTOR_MENU_ITEMS)).map(([groupLabel, items]) => (
                      <div key={groupLabel} className="space-y-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1">
                          {groupLabel}
                        </p>
                        <div className="space-y-1">
                          {items.map(item => {
                            const visible = isItemVisible('mentor' as MenuRole, item.key);
                            return (
                              <div key={item.key} className="flex items-center justify-between px-4 py-3 rounded-xl bg-muted/40">
                                <span className={`text-sm font-medium ${visible ? 'text-foreground' : 'text-muted-foreground line-through'}`}>
                                  {item.label}
                                </span>
                                <Switch
                                  checked={visible}
                                  onCheckedChange={(checked) => updateVisibility('mentor' as MenuRole, item.key, checked)}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
