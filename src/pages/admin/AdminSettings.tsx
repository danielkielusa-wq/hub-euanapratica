import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Settings, FileCheck, Users, Hash, Zap, Trash2, Plus, FileText, Link2, Globe, Sparkles, ShoppingBag, Brain, ListTodo, Menu, Image, Upload, Loader2, X, BarChart2, Video, Send, ChevronDown, ChevronUp, Play, History} from 'lucide-react';
import { PageHeader } from '@/components/admin/shared/PageHeader';
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
  { key: 'biblioteca',       label: 'Biblioteca',        group: 'DISCOVERY' },
  { key: 'dashboard',        label: 'Dashboard',         group: 'MENTORIA' },
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

  const [expandedCard, setExpandedCard] = useState<string | null>(null);

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
  const [hasDpChanges, setHasDpChanges] = useState(false);

  // Suggest Tasks config
  const [stApiConfig, setStApiConfig] = useState('anthropic_api');
  const [stPrompt, setStPrompt] = useState('');
  const [stMaxTokens, setStMaxTokens] = useState('3000');
  const [hasStChanges, setHasStChanges] = useState(false);

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

  // Daily Analytics config
  const [daPrompt, setDaPrompt] = useState('');
  const [daApiConfig, setDaApiConfig] = useState('openai_api');
  const [daModel, setDaModel] = useState('');
  const [hasDaChanges, setHasDaChanges] = useState(false);

  // Mentor AI config (session summary, session prep, student suggestions)
  const [mentorSummaryPrompt, setMentorSummaryPrompt] = useState('');
  const [mentorPrepPrompt, setMentorPrepPrompt] = useState('');
  const [mentorSuggestionPrompt, setMentorSuggestionPrompt] = useState('');
  const [mentorApiConfig, setMentorApiConfig] = useState('openai_api');
  const [hasMentorChanges, setHasMentorChanges] = useState(false);

  // Telegram config
  const [tgBotToken, setTgBotToken] = useState('');
  const [tgChatId, setTgChatId] = useState('');
  const [tgEnabled, setTgEnabled] = useState(true);
  const [hasTgChanges, setHasTgChanges] = useState(false);

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
    // Load suggest tasks configs
    const stApiValue = getConfigValue('suggest_tasks_api_config');
    if (stApiValue) setStApiConfig(stApiValue);
    const stPromptValue = getConfigValue('suggest_tasks_prompt');
    if (stPromptValue !== undefined) setStPrompt(stPromptValue);
    const stMaxTokensValue = getConfigValue('suggest_tasks_max_tokens');
    if (stMaxTokensValue) setStMaxTokens(stMaxTokensValue);

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

    // Load Daily Analytics configs
    const daPromptValue = getConfigValue('daily_analytics_prompt');
    if (daPromptValue) setDaPrompt(daPromptValue);
    const daApiValue = getConfigValue('daily_analytics_api_key');
    if (daApiValue) setDaApiConfig(daApiValue);
    const daModelValue = getConfigValue('daily_analytics_model');
    if (daModelValue) setDaModel(daModelValue);

    // Load Mentor AI configs
    const mentorSummaryValue = getConfigValue('ai_session_summary_prompt');
    if (mentorSummaryValue) setMentorSummaryPrompt(mentorSummaryValue);
    const mentorPrepValue = getConfigValue('ai_session_prep_prompt');
    if (mentorPrepValue) setMentorPrepPrompt(mentorPrepValue);
    const mentorSuggestionValue = getConfigValue('ai_student_suggestion_prompt');
    if (mentorSuggestionValue) setMentorSuggestionPrompt(mentorSuggestionValue);
    const mentorApiValue = getConfigValue('ai_mentor_api_config_key');
    if (mentorApiValue) setMentorApiConfig(mentorApiValue);

    // Load Telegram configs
    const tgTokenValue = getConfigValue('telegram_bot_token');
    if (tgTokenValue) setTgBotToken(tgTokenValue);
    const tgChatIdValue = getConfigValue('telegram_chat_id');
    if (tgChatIdValue) setTgChatId(tgChatIdValue);
    const tgEnabledValue = getConfigValue('telegram_notifications_enabled');
    setTgEnabled(tgEnabledValue !== 'false');
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
    setHasDpChanges(
      dpPrompt !== originalPrompt ||
      dpApiConfig !== (originalApi || 'anthropic_api')
    );
  }, [dpPrompt, dpApiConfig, configs]);

  useEffect(() => {
    const originalApi = getConfigValue('suggest_tasks_api_config');
    const originalPrompt = getConfigValue('suggest_tasks_prompt');
    const originalMaxTokens = getConfigValue('suggest_tasks_max_tokens');
    setHasStChanges(
      stApiConfig !== (originalApi || 'anthropic_api') ||
      stPrompt !== (originalPrompt || '') ||
      stMaxTokens !== (originalMaxTokens || '3000')
    );
  }, [stApiConfig, stPrompt, stMaxTokens, configs]);

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
    const originalPrompt = getConfigValue('daily_analytics_prompt');
    const originalApi = getConfigValue('daily_analytics_api_key') || 'openai_api';
    const originalModel = getConfigValue('daily_analytics_model') || '';
    setHasDaChanges(
      (daPrompt !== originalPrompt && daPrompt !== '') ||
      daApiConfig !== originalApi ||
      daModel !== originalModel
    );
  }, [daPrompt, daApiConfig, daModel, configs]);

  useEffect(() => {
    const origSummary = getConfigValue('ai_session_summary_prompt') || '';
    const origPrep = getConfigValue('ai_session_prep_prompt') || '';
    const origSuggestion = getConfigValue('ai_student_suggestion_prompt') || '';
    const origApi = getConfigValue('ai_mentor_api_config_key') || 'openai_api';
    setHasMentorChanges(
      (mentorSummaryPrompt !== origSummary && mentorSummaryPrompt !== '') ||
      (mentorPrepPrompt !== origPrep && mentorPrepPrompt !== '') ||
      (mentorSuggestionPrompt !== origSuggestion && mentorSuggestionPrompt !== '') ||
      mentorApiConfig !== origApi
    );
  }, [mentorSummaryPrompt, mentorPrepPrompt, mentorSuggestionPrompt, mentorApiConfig, configs]);

  useEffect(() => {
    const origToken = getConfigValue('telegram_bot_token');
    const origChat = getConfigValue('telegram_chat_id');
    const origEnabled = getConfigValue('telegram_notifications_enabled') !== 'false';
    setHasTgChanges(
      tgBotToken !== origToken ||
      tgChatId !== origChat ||
      tgEnabled !== origEnabled
    );
  }, [tgBotToken, tgChatId, tgEnabled, configs]);

  const handleSaveTelegram = async () => {
    await Promise.all([
      updateConfig('telegram_bot_token', tgBotToken),
      updateConfig('telegram_chat_id', tgChatId),
      updateConfig('telegram_notifications_enabled', tgEnabled ? 'true' : 'false'),
    ]);
    setHasTgChanges(false);
  };

  const handleSaveDailyAnalytics = async () => {
    await Promise.all([
      updateConfig('daily_analytics_prompt', daPrompt),
      updateConfig('daily_analytics_api_key', daApiConfig),
      updateConfig('daily_analytics_model', daModel),
    ]);
    setHasDaChanges(false);
  };

  const handleSaveMentorAI = async () => {
    await Promise.all([
      updateConfig('ai_session_summary_prompt', mentorSummaryPrompt),
      updateConfig('ai_session_prep_prompt', mentorPrepPrompt),
      updateConfig('ai_student_suggestion_prompt', mentorSuggestionPrompt),
      updateConfig('ai_mentor_api_config_key', mentorApiConfig),
    ]);
    setHasMentorChanges(false);
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
    ]);
    setHasDpChanges(false);
  };

  const handleSaveSuggestTasks = async () => {
    await Promise.all([
      updateConfig('suggest_tasks_api_config', stApiConfig),
      updateConfig('suggest_tasks_prompt', stPrompt),
      updateConfig('suggest_tasks_max_tokens', stMaxTokens),
    ]);
    setHasStChanges(false);
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

  // Helper to find API display name by api_key
  const getApiName = (apiKey: string) => {
    const api = apis.find(a => a.api_key === apiKey);
    return api ? api.name : apiKey;
  };

  // Shared API Provider Select renderer
  const renderApiSelect = (value: string, onChange: (v: string) => void) => (
    <>
      {apisLoading ? (
        <Skeleton className="h-10 w-full rounded-xl" />
      ) : (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="rounded-lg bg-slate-50 border-slate-200">
            <SelectValue placeholder="Selecione uma API..." />
          </SelectTrigger>
          <SelectContent>
            {apis.filter(api => api.is_active).length === 0 ? (
              <div className="p-2 text-sm text-slate-500">
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
                        <span className="text-xs text-slate-500">{api.parameters.model}</span>
                      )}
                    </div>
                  </SelectItem>
                ))
            )}
          </SelectContent>
        </Select>
      )}
      <p className="text-xs text-slate-500 mt-1.5">
        A API selecionada e seu modelo serão configurados em <Link to="/admin/configuracoes-apis" className="text-blue-600 hover:underline">Configurações de APIs</Link>
      </p>
    </>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader title="Configurações da Plataforma" subtitle="Gerencie as configurações globais do sistema" icon={Settings} />

        <Tabs defaultValue="prompts" className="flex flex-col lg:flex-row gap-6" orientation="vertical">
          <TabsList className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible gap-1 p-1.5 rounded-xl lg:w-56 lg:min-w-[14rem] shrink-0 h-auto items-stretch bg-slate-50 lg:sticky lg:top-0 lg:self-start">
            <p className="hidden lg:block text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 pt-1 pb-1.5">IA &amp; Prompts</p>
            <TabsTrigger value="prompts" className="gap-2 rounded-lg justify-start text-left"><FileCheck className="h-4 w-4 shrink-0" /><span className="truncate">Prompts IA</span></TabsTrigger>
            <TabsTrigger value="suggest-tasks" className="gap-2 rounded-lg justify-start text-left"><ListTodo className="h-4 w-4 shrink-0" /><span className="truncate">Sugestão Tarefas</span></TabsTrigger>
            <TabsTrigger value="upsell" className="gap-2 rounded-lg justify-start text-left"><Sparkles className="h-4 w-4 shrink-0" /><span className="truncate">Upsell</span></TabsTrigger>
            <TabsTrigger value="mentor-ai" className="gap-2 rounded-lg justify-start text-left"><Video className="h-4 w-4 shrink-0" /><span className="truncate">Mentor IA</span></TabsTrigger>

            <p className="hidden lg:block text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 pt-3 pb-1.5">Integrações</p>
            <TabsTrigger value="reports" className="gap-2 rounded-lg justify-start text-left"><FileText className="h-4 w-4 shrink-0" /><span className="truncate">Relatórios</span></TabsTrigger>
            <TabsTrigger value="telegram" className="gap-2 rounded-lg justify-start text-left"><Send className="h-4 w-4 shrink-0" /><span className="truncate">Telegram</span></TabsTrigger>

            <p className="hidden lg:block text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 pt-3 pb-1.5">Aparência</p>
            <TabsTrigger value="community" className="gap-2 rounded-lg justify-start text-left"><Users className="h-4 w-4 shrink-0" /><span className="truncate">Comunidade</span></TabsTrigger>
            <TabsTrigger value="menu-config" className="gap-2 rounded-lg justify-start text-left"><Menu className="h-4 w-4 shrink-0" /><span className="truncate">Menu do App</span></TabsTrigger>
            <TabsTrigger value="branding" className="gap-2 rounded-lg justify-start text-left"><Image className="h-4 w-4 shrink-0" /><span className="truncate">Identidade Visual</span></TabsTrigger>
          </TabsList>

          <div className="flex-1 min-w-0">

          {/* ═══════════════ PROMPTS IA TAB (6 accordion cards) ═══════════════ */}
          <TabsContent value="prompts" className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
              </div>
            ) : (
              <>
                {/* 1. Analisador de Currículos */}
                <div className={`bg-white rounded-xl border transition-all duration-200 ${expandedCard === 'resume' ? 'border-blue-200 shadow-md' : 'border-slate-200 shadow-sm hover:border-slate-300'}`}>
                  <div className="p-5 flex items-center justify-between cursor-pointer select-none" onClick={() => setExpandedCard(expandedCard === 'resume' ? null : 'resume')}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                        <FileCheck className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800">Analisador de Currículos</h3>
                        <p className="text-sm text-slate-500 mt-0.5">
                          {expandedCard === 'resume' ? 'Prompt usado pela IA para analisar currículos.' : getApiName(resumeApiConfig)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {expandedCard !== 'resume' && resumeConfig?.updated_at && (
                        <span className="text-xs text-slate-400 hidden sm:inline">
                          Atualizado {format(new Date(resumeConfig.updated_at), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      )}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${expandedCard === 'resume' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>
                        {expandedCard === 'resume' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </div>
                  </div>
                  {expandedCard === 'resume' && (
                    <div className="px-5 pb-5 pt-2 border-t border-slate-100 animate-in slide-in-from-top-2 fade-in duration-200">
                      <div className="mb-5">
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">API Provider</label>
                        {renderApiSelect(resumeApiConfig, setResumeApiConfig)}
                      </div>
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-sm font-medium text-slate-700">Prompt da IA</label>
                          <button className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium transition-colors">
                            <History size={14} />
                            Ver histórico
                          </button>
                        </div>
                        <textarea value={resumePrompt} onChange={(e) => setResumePrompt(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-mono rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all min-h-[200px] max-h-[400px] resize-y" />
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-6">
                        <span className="text-xs text-slate-500">
                          {resumeConfig?.updated_at ? `Última atualização: ${format(new Date(resumeConfig.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}` : ''}
                        </span>
                        <div className="flex gap-3">
                          <button className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-blue-600 hover:border-blue-300 transition-all flex items-center gap-2 shadow-sm">
                            <Play size={16} />
                            Testar Prompt
                          </button>
                          <Button onClick={handleSaveResume} disabled={!hasResumeChanges || isSaving} className="px-6 py-2 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors gap-2 shadow-sm">
                            <Save className="w-4 h-4" />{isSaving ? 'Salvando...' : 'Salvar'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Formatador de Relatórios de Leads */}
                <div className={`bg-white rounded-xl border transition-all duration-200 ${expandedCard === 'leads' ? 'border-blue-200 shadow-md' : 'border-slate-200 shadow-sm hover:border-slate-300'}`}>
                  <div className="p-5 flex items-center justify-between cursor-pointer select-none" onClick={() => setExpandedCard(expandedCard === 'leads' ? null : 'leads')}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                        <Users className="w-5 h-5 text-purple-500" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800">Formatador de Relatórios de Leads</h3>
                        <p className="text-sm text-slate-500 mt-0.5">
                          {expandedCard === 'leads' ? 'Prompt para formatar relatórios de diagnóstico.' : getApiName(leadApiConfig)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {expandedCard !== 'leads' && leadConfig?.updated_at && (
                        <span className="text-xs text-slate-400 hidden sm:inline">
                          Atualizado {format(new Date(leadConfig.updated_at), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      )}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${expandedCard === 'leads' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>
                        {expandedCard === 'leads' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </div>
                  </div>
                  {expandedCard === 'leads' && (
                    <div className="px-5 pb-5 pt-2 border-t border-slate-100 animate-in slide-in-from-top-2 fade-in duration-200">
                      <div className="mb-5">
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">API Provider</label>
                        {renderApiSelect(leadApiConfig, setLeadApiConfig)}
                      </div>
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-sm font-medium text-slate-700">Prompt da IA</label>
                          <button className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium transition-colors">
                            <History size={14} />
                            Ver histórico
                          </button>
                        </div>
                        <textarea value={leadPrompt} onChange={(e) => setLeadPrompt(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-mono rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all min-h-[200px] max-h-[400px] resize-y" />
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-6">
                        <span className="text-xs text-slate-500">
                          {leadConfig?.updated_at ? `Última atualização: ${format(new Date(leadConfig.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}` : ''}
                        </span>
                        <div className="flex gap-3">
                          <button className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-blue-600 hover:border-blue-300 transition-all flex items-center gap-2 shadow-sm">
                            <Play size={16} />
                            Testar Prompt
                          </button>
                          <Button onClick={handleSaveLead} disabled={!hasLeadChanges || isSaving} className="px-6 py-2 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors gap-2 shadow-sm">
                            <Save className="w-4 h-4" />{isSaving ? 'Salvando...' : 'Salvar'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Recomendador de Produtos */}
                <div className={`bg-white rounded-xl border transition-all duration-200 ${expandedCard === 'products' ? 'border-blue-200 shadow-md' : 'border-slate-200 shadow-sm hover:border-slate-300'}`}>
                  <div className="p-5 flex items-center justify-between cursor-pointer select-none" onClick={() => setExpandedCard(expandedCard === 'products' ? null : 'products')}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                        <ShoppingBag className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800">Recomendador de Produtos</h3>
                        <p className="text-sm text-slate-500 mt-0.5">
                          {expandedCard === 'products' ? 'Prompt usado pela IA para recomendar produtos/serviços aos leads com base no tier e perfil.' : getApiName(recApiConfig)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {expandedCard !== 'products' && recConfig?.updated_at && (
                        <span className="text-xs text-slate-400 hidden sm:inline">
                          Atualizado {format(new Date(recConfig.updated_at), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      )}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${expandedCard === 'products' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>
                        {expandedCard === 'products' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </div>
                  </div>
                  {expandedCard === 'products' && (
                    <div className="px-5 pb-5 pt-2 border-t border-slate-100 animate-in slide-in-from-top-2 fade-in duration-200">
                      <div className="mb-5">
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">API Provider</label>
                        {renderApiSelect(recApiConfig, setRecApiConfig)}
                      </div>
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-sm font-medium text-slate-700">Prompt da IA</label>
                          <button className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium transition-colors">
                            <History size={14} />
                            Ver histórico
                          </button>
                        </div>
                        <textarea value={recPrompt} onChange={(e) => setRecPrompt(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-mono rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all min-h-[200px] max-h-[400px] resize-y" />
                        <p className="text-xs text-slate-500 mt-2">
                          Use {'{{lead_data}}'}, {'{{tier}}'} e {'{{services}}'} como placeholders
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-6">
                        <span className="text-xs text-slate-500">
                          {recConfig?.updated_at ? `Última atualização: ${format(new Date(recConfig.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}` : ''}
                        </span>
                        <div className="flex gap-3">
                          <button className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-blue-600 hover:border-blue-300 transition-all flex items-center gap-2 shadow-sm">
                            <Play size={16} />
                            Testar Prompt
                          </button>
                          <Button onClick={handleSaveRecPrompt} disabled={!hasRecChanges || isSaving} className="px-6 py-2 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors gap-2 shadow-sm">
                            <Save className="w-4 h-4" />{isSaving ? 'Salvando...' : 'Salvar'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Title Translator */}
                <div className={`bg-white rounded-xl border transition-all duration-200 ${expandedCard === 'title-translator' ? 'border-blue-200 shadow-md' : 'border-slate-200 shadow-sm hover:border-slate-300'}`}>
                  <div className="p-5 flex items-center justify-between cursor-pointer select-none" onClick={() => setExpandedCard(expandedCard === 'title-translator' ? null : 'title-translator')}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                        <Globe className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800">Title Translator</h3>
                        <p className="text-sm text-slate-500 mt-0.5">
                          {expandedCard === 'title-translator' ? 'Configure a API, modelo e prompt usados pela ferramenta de traducao de titulos.' : getApiName(ttApiConfig)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {expandedCard !== 'title-translator' && configs.find(c => c.key === 'title_translator_prompt')?.updated_at && (
                        <span className="text-xs text-slate-400 hidden sm:inline">
                          Atualizado {format(new Date(configs.find(c => c.key === 'title_translator_prompt')!.updated_at), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      )}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${expandedCard === 'title-translator' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>
                        {expandedCard === 'title-translator' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </div>
                  </div>
                  {expandedCard === 'title-translator' && (
                    <div className="px-5 pb-5 pt-2 border-t border-slate-100 animate-in slide-in-from-top-2 fade-in duration-200">
                      <div className="mb-5">
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">API Provider</label>
                        {renderApiSelect(ttApiConfig, setTtApiConfig)}
                      </div>
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-sm font-medium text-slate-700">Prompt da IA</label>
                          <button className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium transition-colors">
                            <History size={14} />
                            Ver histórico
                          </button>
                        </div>
                        <textarea value={ttPrompt} onChange={(e) => setTtPrompt(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-mono rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all min-h-[200px] max-h-[400px] resize-y" />
                        <p className="text-xs text-slate-500 mt-2">
                          Use {'{title_br}'}, {'{area}'}, {'{responsibilities}'} e {'{years_experience}'} como placeholders
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-6">
                        <span className="text-xs text-slate-500">
                          {configs.find(c => c.key === 'title_translator_prompt')?.updated_at
                            ? `Última atualização: ${format(new Date(configs.find(c => c.key === 'title_translator_prompt')!.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`
                            : ''}
                        </span>
                        <div className="flex gap-3">
                          <button className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-blue-600 hover:border-blue-300 transition-all flex items-center gap-2 shadow-sm">
                            <Play size={16} />
                            Testar Prompt
                          </button>
                          <Button onClick={handleSaveTitleTranslator} disabled={!hasTtChanges || isSaving} className="px-6 py-2 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors gap-2 shadow-sm">
                            <Save className="w-4 h-4" />{isSaving ? 'Salvando...' : 'Salvar'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 5. Prioridades do Dia */}
                <div className={`bg-white rounded-xl border transition-all duration-200 ${expandedCard === 'priorities' ? 'border-blue-200 shadow-md' : 'border-slate-200 shadow-sm hover:border-slate-300'}`}>
                  <div className="p-5 flex items-center justify-between cursor-pointer select-none" onClick={() => setExpandedCard(expandedCard === 'priorities' ? null : 'priorities')}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                        <Brain className="w-5 h-5 text-indigo-500" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800">Prioridades do Dia</h3>
                        <p className="text-sm text-slate-500 mt-0.5">
                          {expandedCard === 'priorities' ? 'Configure a API e o prompt usados para gerar prioridades diarias de leads no dashboard.' : getApiName(dpApiConfig)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {expandedCard !== 'priorities' && configs.find(c => c.key === 'daily_priorities_prompt')?.updated_at && (
                        <span className="text-xs text-slate-400 hidden sm:inline">
                          Atualizado {format(new Date(configs.find(c => c.key === 'daily_priorities_prompt')!.updated_at), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      )}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${expandedCard === 'priorities' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>
                        {expandedCard === 'priorities' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </div>
                  </div>
                  {expandedCard === 'priorities' && (
                    <div className="px-5 pb-5 pt-2 border-t border-slate-100 animate-in slide-in-from-top-2 fade-in duration-200">
                      <div className="mb-5">
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">API Provider</label>
                        {renderApiSelect(dpApiConfig, setDpApiConfig)}
                      </div>
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-sm font-medium text-slate-700">System Prompt</label>
                          <button className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium transition-colors">
                            <History size={14} />
                            Ver histórico
                          </button>
                        </div>
                        <textarea
                          value={dpPrompt}
                          onChange={(e) => setDpPrompt(e.target.value)}
                          placeholder="Deixe vazio para usar o prompt padrao embutido na Edge Function..."
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-mono rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all min-h-[200px] max-h-[400px] resize-y"
                        />
                        <p className="text-xs text-slate-500 mt-2">
                          Use {'{{today}}'} como placeholder para a data atual. Deixe vazio para usar o prompt padrao.
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-6">
                        <span className="text-xs text-slate-500">
                          {configs.find(c => c.key === 'daily_priorities_prompt')?.updated_at
                            ? `Última atualização: ${format(new Date(configs.find(c => c.key === 'daily_priorities_prompt')!.updated_at), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })}`
                            : ''}
                        </span>
                        <div className="flex gap-3">
                          <button className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-blue-600 hover:border-blue-300 transition-all flex items-center gap-2 shadow-sm">
                            <Play size={16} />
                            Testar Prompt
                          </button>
                          <Button onClick={handleSaveDailyPriorities} disabled={!hasDpChanges || isSaving} className="px-6 py-2 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors gap-2 shadow-sm">
                            <Save className="w-4 h-4" />{isSaving ? 'Salvando...' : 'Salvar'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 6. Analytics Diário */}
                <div className={`bg-white rounded-xl border transition-all duration-200 ${expandedCard === 'analytics' ? 'border-blue-200 shadow-md' : 'border-slate-200 shadow-sm hover:border-slate-300'}`}>
                  <div className="p-5 flex items-center justify-between cursor-pointer select-none" onClick={() => setExpandedCard(expandedCard === 'analytics' ? null : 'analytics')}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                        <BarChart2 className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800">Analytics Diário</h3>
                        <p className="text-sm text-slate-500 mt-0.5">
                          {expandedCard === 'analytics' ? 'Configure a API, modelo e prompt usados para gerar o resumo diario de analytics.' : getApiName(daApiConfig)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {expandedCard !== 'analytics' && configs.find(c => c.key === 'daily_analytics_prompt')?.updated_at && (
                        <span className="text-xs text-slate-400 hidden sm:inline">
                          Atualizado {format(new Date(configs.find(c => c.key === 'daily_analytics_prompt')!.updated_at), "dd/MM/yyyy")}
                        </span>
                      )}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${expandedCard === 'analytics' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>
                        {expandedCard === 'analytics' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </div>
                  </div>
                  {expandedCard === 'analytics' && (
                    <div className="px-5 pb-5 pt-2 border-t border-slate-100 animate-in slide-in-from-top-2 fade-in duration-200">
                      <div className="mb-5">
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">API Provider</label>
                        {renderApiSelect(daApiConfig, setDaApiConfig)}
                      </div>
                      <div className="mb-5">
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Modelo (override)</label>
                        <input
                          type="text"
                          value={daModel}
                          onChange={(e) => setDaModel(e.target.value)}
                          placeholder="ex: google/gemini-2.0-flash (vazio = usa modelo padrao da API)"
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-mono rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                        <p className="text-xs text-slate-500 mt-1.5">
                          Se preenchido, sobrescreve o modelo configurado na API. Use nomes do OpenRouter (ex: google/gemini-2.0-flash, openai/gpt-4.1-mini). Deixe vazio para usar o modelo padrao.
                        </p>
                      </div>
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-sm font-medium text-slate-700">Prompt do Analista</label>
                          <button className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium transition-colors">
                            <History size={14} />
                            Ver histórico
                          </button>
                        </div>
                        <textarea
                          value={daPrompt}
                          onChange={(e) => setDaPrompt(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-mono rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all min-h-[200px] max-h-[400px] resize-y"
                          placeholder="Prompt do sistema para gerar o resumo diario..."
                        />
                        <p className="text-xs text-slate-500 mt-2">
                          O LLM recebe este prompt como instrucao do sistema + os dados do dia em JSON como mensagem do usuario. Escreva em portugues, tom analitico. Max 250 palavras de saida.
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-6">
                        <span className="text-xs text-slate-500">
                          {configs.find(c => c.key === 'daily_analytics_prompt')?.updated_at
                            ? `Última atualização: ${format(new Date(configs.find(c => c.key === 'daily_analytics_prompt')!.updated_at), "dd/MM/yyyy 'as' HH:mm")}`
                            : ''}
                        </span>
                        <div className="flex gap-3">
                          <button className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-blue-600 hover:border-blue-300 transition-all flex items-center gap-2 shadow-sm">
                            <Play size={16} />
                            Testar Prompt
                          </button>
                          <Button onClick={handleSaveDailyAnalytics} disabled={!hasDaChanges || isSaving} className="px-6 py-2 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors gap-2 shadow-sm">
                            <Save className="w-4 h-4" />{isSaving ? 'Salvando...' : 'Salvar'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </TabsContent>

          {/* ═══════════════ SUGGEST TASKS TAB ═══════════════ */}
          <TabsContent value="suggest-tasks" className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="p-6 space-y-6">
                {isLoading ? <Skeleton className="h-64 w-full rounded-xl" /> : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">API Provider</label>
                      {renderApiSelect(stApiConfig, setStApiConfig)}
                      <p className="text-xs text-slate-500 mt-1.5">
                        A API selecionada e seu modelo serão configurados em <Link to="/admin/configuracoes-apis" className="text-blue-600 hover:underline">Configurações de APIs</Link>. O fallback automático entre APIs também é respeitado.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Max Tokens (resposta da IA)</label>
                      <input
                        type="number"
                        min={500}
                        max={8000}
                        step={500}
                        value={stMaxTokens}
                        onChange={(e) => setStMaxTokens(e.target.value)}
                        className="w-48 bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                      <p className="text-xs text-slate-500 mt-1.5">
                        Tokens máximos na resposta. Recomendado: 3000 com mensagens WhatsApp, 1500 sem. JSON truncado causa erro 500.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">System Prompt</label>
                      <textarea
                        value={stPrompt}
                        onChange={(e) => setStPrompt(e.target.value)}
                        placeholder="Deixe vazio para usar o prompt padrão embutido na Edge Function..."
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-mono rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all min-h-[300px] resize-y"
                      />
                      <p className="text-xs text-slate-500 mt-2">
                        Deixe vazio para usar o prompt padrão. O contexto enviado à IA inclui: perfil do lead, scores, barreiras, últimas interações (incluindo WhatsApp) e tarefas já existentes. A resposta deve ser um JSON com o campo <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">suggestions[]</code>.
                      </p>
                    </div>
                  </>
                )}
              </div>
              <div className="p-6 border-t border-slate-100 bg-slate-50/50 rounded-b-xl flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  {configs.find(c => c.key === 'suggest_tasks_prompt')?.updated_at
                    ? `Última atualização: ${format(new Date(configs.find(c => c.key === 'suggest_tasks_prompt')!.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`
                    : ''}
                </span>
                <button
                  onClick={handleSaveSuggestTasks}
                  disabled={!hasStChanges || isSaving}
                  className="px-6 py-2 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={16} />
                  {isSaving ? 'Salvando...' : 'Salvar Configurações'}
                </button>
              </div>
            </div>

            {/* How it Works Card */}
            <div className="bg-purple-50/30 rounded-xl border border-purple-100 p-8">
              <div className="flex items-center gap-3 mb-6">
                <FileText size={24} className="text-purple-600" />
                <h3 className="text-lg font-semibold text-purple-900">Como Funciona</h3>
              </div>
              <div className="space-y-8">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 mb-3">Fluxo</h4>
                  <ol className="list-decimal list-inside space-y-2.5 text-sm text-slate-600">
                    <li>Admin abre o detalhe de um lead (aba Tarefas ou WhatsApp)</li>
                    <li>Clica em "Sugerir com IA"</li>
                    <li>A Edge Function <code className="bg-white border border-purple-100 px-1.5 py-0.5 rounded text-purple-700 text-xs font-mono">suggest-lead-tasks</code> busca perfil, interações e tarefas existentes</li>
                    <li>A IA analisa tudo e retorna 2-5 sugestões com título, tipo, prioridade e prazo</li>
                    <li>Admin seleciona quais criar (todas marcadas por padrão) e clica em "Criar X tarefas"</li>
                    <li>Tarefas criadas ficam marcadas com fonte <code className="bg-white border border-purple-100 px-1.5 py-0.5 rounded text-purple-700 text-xs font-mono">ai_suggestion</code> na aba Tarefas</li>
                  </ol>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 mb-3">Contexto enviado à IA</h4>
                  <ul className="list-disc list-inside space-y-2.5 text-sm text-slate-600">
                    <li>Perfil completo: área, nível, inglês, situação de visto, família, objetivo</li>
                    <li>Scores: prontidão, temperatura, prioridade, LTV estimado, fase ROTA</li>
                    <li>Barreiras identificadas (7 dimensões)</li>
                    <li>Últimas 20 interações dos 60 dias anteriores (incluindo WhatsApp)</li>
                    <li>Follow-ups agendados e ações de milestone</li>
                    <li>Títulos das tarefas pendentes (para evitar duplicatas)</li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ═══════════════ UPSELL TAB ═══════════════ */}
          <TabsContent value="upsell" className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="p-6 space-y-6">
                {/* Toggle global */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <div>
                    <h3 className="text-sm font-medium text-slate-800">Sistema Ativo</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Liga/desliga o upsell contextual globalmente</p>
                  </div>
                  <Switch
                    checked={upsellEnabled}
                    onCheckedChange={setUpsellEnabled}
                  />
                </div>

                {/* API Provider */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">API Provider</label>
                  {renderApiSelect(upsellApiConfig, setUpsellApiConfig)}
                  <p className="text-xs text-slate-500 mt-1.5">
                    A API selecionada e seu modelo serão configurados em <Link to="/admin/configuracoes-apis" className="text-blue-600 hover:underline">Configurações de APIs</Link>
                  </p>
                </div>

                {/* Prompt Template */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Prompt Template</label>
                  <textarea
                    value={upsellPrompt}
                    onChange={(e) => setUpsellPrompt(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-mono rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all min-h-[300px] resize-y"
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    Use <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">{'{post_content}'} e {'{services_json}'}</code> como placeholders
                  </p>
                </div>

                {/* 3 Column Grid for Model Settings */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Modelo (override)</label>
                    <input
                      type="text"
                      value={upsellModel}
                      onChange={(e) => setUpsellModel(e.target.value)}
                      placeholder="Ex: claude-haiku-4-5-20251001"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                    <p className="text-xs text-slate-500 mt-1.5">
                      Sobrescreve o modelo da API. Deixe vazio para usar o modelo padrão da API selecionada.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Max Tokens</label>
                    <input
                      type="number"
                      value={upsellMaxTokens}
                      onChange={(e) => setUpsellMaxTokens(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Temperature</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="2"
                      value={upsellTemperature}
                      onChange={(e) => setUpsellTemperature(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                {/* 2 Column Grid for Limits */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Intervalo entre Cards (dias)</label>
                    <input
                      type="number"
                      value={upsellRateLimitDays}
                      onChange={(e) => setUpsellRateLimitDays(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                    <p className="text-xs text-slate-500 mt-1.5">
                      Tempo mínimo entre cards para o mesmo usuário
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Blacklist Duration (dias)</label>
                    <input
                      type="number"
                      value={upsellBlacklistDays}
                      onChange={(e) => setUpsellBlacklistDays(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                    <p className="text-xs text-slate-500 mt-1.5">
                      Tempo de blacklist após 2 dismissals
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 bg-slate-50/50 rounded-b-xl flex items-center justify-end">
                <button
                  onClick={handleSaveUpsellConfigs}
                  disabled={!hasUpsellChanges || isSaving}
                  className="px-6 py-2 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={16} />
                  {isSaving ? 'Salvando...' : 'Salvar Configurações'}
                </button>
              </div>
            </div>

            {/* How it Works Card */}
            <div className="bg-blue-50/30 rounded-xl border border-blue-100 p-8">
              <div className="flex items-center gap-3 mb-6">
                <FileText size={24} className="text-blue-600" />
                <h3 className="text-lg font-semibold text-blue-900">Como Funciona</h3>
              </div>
              <div className="space-y-8">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 mb-3">Fluxo do Sistema</h4>
                  <ol className="list-decimal list-inside space-y-2.5 text-sm text-slate-600">
                    <li>Usuário cria um post na comunidade</li>
                    <li>Sistema verifica rate limit e blacklist</li>
                    <li>Pré-filtro compara keywords dos serviços com o texto do post</li>
                    <li>Se houver match, Claude API analisa o post e sugere serviço</li>
                    <li>Se confidence {'>='} 0.7, card de upsell é exibido no post</li>
                    <li>Após 2 dismissals, serviço entra em blacklist por 30 dias</li>
                  </ol>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 mb-3">Otimizações de Custo</h4>
                  <ul className="list-disc list-inside space-y-2.5 text-sm text-slate-600">
                    <li>Pré-filtro de keywords economiza ~90% de chamadas à API</li>
                    <li>Rate limiting previne spam de cards para o mesmo usuário</li>
                    <li>Haiku 4.5 é 20x mais barato que Sonnet</li>
                    <li>Max 1 card por post (constraint no banco)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 mb-3">Métricas Disponíveis</h4>
                  <p className="text-sm text-slate-600">
                    Todas as interações são rastreadas em <code className="bg-white border border-blue-100 px-1.5 py-0.5 rounded text-blue-700 text-xs font-mono">upsell_impressions</code>: impressões, clicks, dismissals e conversões.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ═══════════════ MENTOR AI TAB ═══════════════ */}
          <TabsContent value="mentor-ai" className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="p-6 space-y-8">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">API Provider Global (Mentor IA)</label>
                  <Select value={mentorApiConfig} onValueChange={(v) => setMentorApiConfig(v)}>
                    <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {apis?.map((api) => (
                        <SelectItem key={api.api_key} value={api.api_key}>{api.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500 mt-1.5">Este provedor será usado para todas as funções do Mentor IA abaixo.</p>
                </div>

                {/* Section 1: Resumo Pós-Sessão */}
                <div className="pt-6 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <FileText size={18} className="text-blue-500" />
                      <h3 className="text-md font-semibold text-slate-800">Resumo Pós-Sessão</h3>
                    </div>
                    <button className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium transition-colors">
                      <History size={14} />
                      Ver histórico
                    </button>
                  </div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Prompt Template (<code className="text-xs text-blue-600">ai_session_summary_prompt</code>)</label>
                  <textarea
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-mono rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all min-h-[200px] resize-y"
                    value={mentorSummaryPrompt}
                    onChange={(e) => setMentorSummaryPrompt(e.target.value)}
                    placeholder="Prompt do sistema para gerar resumos de sessão..."
                  />
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-slate-500">
                      Use <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">{'{transcription}'}, {'{student_name}'} e {'{session_date}'}</code> como placeholders.
                    </p>
                    <button className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-blue-600 hover:border-blue-300 transition-all flex items-center gap-1.5 shadow-sm">
                      <Play size={14} />
                      Testar Prompt
                    </button>
                  </div>
                </div>

                {/* Section 2: Briefing Pré-Sessão */}
                <div className="pt-6 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Brain size={18} className="text-purple-500" />
                      <h3 className="text-md font-semibold text-slate-800">Briefing Pré-Sessão</h3>
                    </div>
                    <button className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium transition-colors">
                      <History size={14} />
                      Ver histórico
                    </button>
                  </div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Prompt Template (<code className="text-xs text-purple-600">ai_session_prep_prompt</code>)</label>
                  <textarea
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-mono rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all min-h-[200px] resize-y"
                    value={mentorPrepPrompt}
                    onChange={(e) => setMentorPrepPrompt(e.target.value)}
                    placeholder="Prompt do sistema para gerar briefing pré-sessão..."
                  />
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-slate-500">
                      Use <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">{'{student_profile}'}, {'{past_sessions}'} e {'{current_goals}'}</code> como placeholders.
                    </p>
                    <button className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-blue-600 hover:border-blue-300 transition-all flex items-center gap-1.5 shadow-sm">
                      <Play size={14} />
                      Testar Prompt
                    </button>
                  </div>
                </div>

                {/* Section 3: Sugestões por Aluno */}
                <div className="pt-6 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Sparkles size={18} className="text-emerald-500" />
                      <h3 className="text-md font-semibold text-slate-800">Sugestões por Aluno</h3>
                    </div>
                    <button className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium transition-colors">
                      <History size={14} />
                      Ver histórico
                    </button>
                  </div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Prompt Template (<code className="text-xs text-emerald-600">ai_student_suggestion_prompt</code>)</label>
                  <textarea
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-mono rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all min-h-[200px] resize-y"
                    value={mentorSuggestionPrompt}
                    onChange={(e) => setMentorSuggestionPrompt(e.target.value)}
                    placeholder="Prompt do sistema para sugestões de engajamento por aluno..."
                  />
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-slate-500">
                      Use <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">{'{student_data}'}, {'{performance_metrics}'} e {'{available_resources}'}</code> como placeholders.
                    </p>
                    <button className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-blue-600 hover:border-blue-300 transition-all flex items-center gap-1.5 shadow-sm">
                      <Play size={14} />
                      Testar Prompt
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 bg-slate-50/50 rounded-b-xl flex items-center justify-between">
                <span className="text-xs text-slate-500">&nbsp;</span>
                <button onClick={handleSaveMentorAI} disabled={!hasMentorChanges || isSaving} className="px-6 py-2 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                  <Save size={16} />{isSaving ? 'Salvando...' : 'Salvar Configurações'}
                </button>
              </div>
            </div>
          </TabsContent>

          {/* ═══════════════ REPORTS TAB ═══════════════ */}
          <TabsContent value="reports" className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="p-6 space-y-6">
                {isLoading ? (
                  <Skeleton className="h-48 w-full rounded-xl" />
                ) : (
                  <>
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                        <Link2 size={16} />
                        URL do Webhook
                      </label>
                      <input
                        type="text"
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        placeholder="https://n8n.sapunplugged.com/webhook/..."
                        className="w-full bg-white border border-slate-200 text-slate-800 text-sm font-mono rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                      <p className="text-xs text-slate-500 mt-1.5">
                        URL do endpoint n8n que receberá os dados dos novos leads
                      </p>
                      {webhookUrlConfig?.updated_at && (
                        <p className="text-xs text-slate-400 mt-1">
                          Última atualização: {format(new Date(webhookUrlConfig.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                        <Globe size={16} />
                        URL Base dos Relatórios
                      </label>
                      <input
                        type="text"
                        value={reportBaseUrl}
                        onChange={(e) => setReportBaseUrl(e.target.value)}
                        placeholder="https://hub.euanapratica.com"
                        className="w-full bg-white border border-slate-200 text-slate-800 text-sm font-mono rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                      <p className="text-xs text-slate-500 mt-1.5">
                        URL base usada para gerar os links de relatórios (será concatenada com /report/:token)
                      </p>
                      {reportBaseUrlConfig?.updated_at && (
                        <p className="text-xs text-slate-400 mt-1">
                          Última atualização: {format(new Date(reportBaseUrlConfig.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                        <Link2 size={16} />
                        URL de Agendamento da Sessão de Diagnóstico
                      </label>
                      <input
                        type="text"
                        value={consultoriaBookingUrl}
                        onChange={(e) => setConsultoriaBookingUrl(e.target.value)}
                        placeholder="https://hub.euanapratica.com/servicos/rota60min"
                        className="w-full bg-white border border-slate-200 text-slate-800 text-sm font-mono rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                      <p className="text-xs text-slate-500 mt-1.5">
                        Link exibido no CTA "Agendar sessão" do relatório de lead (modo acesso limitado)
                      </p>
                      {consultoriaUrlConfig?.updated_at && (
                        <p className="text-xs text-slate-400 mt-1">
                          Última atualização: {format(new Date(consultoriaUrlConfig.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                      <div>
                        <h3 className="text-sm font-medium text-slate-800">Webhook Ativo</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {webhookEnabled ? 'Webhooks serão enviados automaticamente' : 'Webhooks estão desativados'}
                        </p>
                      </div>
                      <Switch
                        checked={webhookEnabled}
                        onCheckedChange={setWebhookEnabled}
                      />
                    </div>
                    {webhookEnabledConfig?.updated_at && (
                      <p className="text-xs text-slate-400">
                        Status alterado em: {format(new Date(webhookEnabledConfig.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    )}
                  </>
                )}
              </div>
              <div className="p-6 border-t border-slate-100 bg-slate-50/50 rounded-b-xl flex items-center justify-end">
                <button
                  onClick={handleSaveWebhook}
                  disabled={!hasWebhookChanges || isSaving}
                  className="px-6 py-2 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={16} />
                  {isSaving ? 'Salvando...' : 'Salvar Configurações'}
                </button>
              </div>
            </div>

            {/* Documentation Card */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-8">
              <div className="flex items-center gap-3 mb-6">
                <FileText size={24} className="text-blue-600" />
                <h3 className="text-lg font-semibold text-blue-900">Documentação</h3>
              </div>
              <p className="text-sm text-slate-500 mb-6">Informações sobre o funcionamento do webhook de leads</p>
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 mb-2">Como funciona</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Sempre que um novo lead é inserido na tabela <code className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-700 text-xs font-mono">career_evaluations</code>, um trigger PostgreSQL dispara automaticamente e envia todos os dados do lead via POST para o webhook configurado.
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 mb-2">Payload enviado</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    O webhook recebe um JSON com todos os campos do lead + o campo <code className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-700 text-xs font-mono">report_link</code> contendo o link completo para acessar o relatório.
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 mb-2">Funciona para</h4>
                  <ul className="list-disc list-inside space-y-1.5 text-sm text-slate-600">
                    <li>Leads importados via planilha CSV</li>
                    <li>Leads inseridos manualmente no Supabase</li>
                    <li>Leads inseridos via API</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 mb-2">Documentação completa</h4>
                  <p className="text-sm text-slate-600">
                    Consulte <code className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-700 text-xs font-mono">docs/LEAD_WEBHOOK.md</code> para detalhes técnicos, troubleshooting e exemplos de uso.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ═══════════════ TELEGRAM TAB ═══════════════ */}
          <TabsContent value="telegram" className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="p-6 space-y-6">
                {isLoading ? (
                  <Skeleton className="h-48 w-full rounded-xl" />
                ) : (
                  <>
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                        <span className="text-slate-400">#</span>
                        Bot Token
                      </label>
                      <input
                        type="password"
                        value={tgBotToken}
                        onChange={(e) => setTgBotToken(e.target.value)}
                        placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                        className="w-full bg-white border border-slate-200 text-slate-800 text-sm font-mono rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                      <p className="text-xs text-slate-500 mt-1.5">
                        Obtido via <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">@BotFather</code> no Telegram. Crie um bot → copie o token aqui.
                      </p>
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                        <Users size={16} className="text-slate-400" />
                        Chat ID
                      </label>
                      <input
                        type="text"
                        value={tgChatId}
                        onChange={(e) => setTgChatId(e.target.value)}
                        placeholder="-1001234567890"
                        className="w-full bg-white border border-slate-200 text-slate-800 text-sm font-mono rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                      <p className="text-xs text-slate-500 mt-1.5">
                        Seu chat ID pessoal ou de grupo. Envie <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">/start</code> para <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">@userinfobot</code> para descobrir.
                      </p>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                      <div>
                        <h3 className="text-sm font-medium text-slate-800">Notificações Ativas</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {tgEnabled ? 'Alertas serão enviados via Telegram' : 'Notificações do Telegram estão desativadas'}
                        </p>
                      </div>
                      <Switch
                        checked={tgEnabled}
                        onCheckedChange={setTgEnabled}
                      />
                    </div>
                  </>
                )}
              </div>
              <div className="p-6 border-t border-slate-100 bg-slate-50/50 rounded-b-xl flex items-center justify-end">
                <button
                  onClick={handleSaveTelegram}
                  disabled={!hasTgChanges || isSaving}
                  className="px-6 py-2 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={16} />
                  {isSaving ? 'Salvando...' : 'Salvar Configurações'}
                </button>
              </div>
            </div>

            {/* Documentation Card */}
            <div className="bg-blue-50/30 rounded-xl border border-blue-100 p-8">
              <div className="flex items-center gap-3 mb-6">
                <FileText size={24} className="text-blue-600" />
                <h3 className="text-lg font-semibold text-blue-900">O que você recebe</h3>
              </div>
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 mb-2">Publicação de Conteúdo</h4>
                  <ul className="list-disc list-inside space-y-1.5 text-sm text-slate-600">
                    <li>Alerta de falha com tipo do erro e ação sugerida</li>
                    <li>Detecção de post fantasma (API aceitou mas post não existe)</li>
                    <li>Conta desconectada — avisa para reconectar</li>
                    <li>Auto-fix de publicações travadas</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 mb-2">Agenda Diária</h4>
                  <ul className="list-disc list-inside space-y-1.5 text-sm text-slate-600">
                    <li>Resumo do dia com agendamentos e tarefas</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 mb-2">Retries automáticos</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Erros temporários (rate limit, servidor) são retentados automaticamente com backoff: 5min → 15min → 45min → 2h → 4h. Você só precisa agir se receber "Sem mais retries".
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ═══════════════ COMMUNITY TAB ═══════════════ */}
          <TabsContent value="community" className="space-y-8">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Hash size={20} className="text-blue-600" />
                <h3 className="text-sm font-semibold text-slate-800">Categorias da Comunidade</h3>
              </div>
              <div className="flex gap-3 mb-6">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Nova categoria..."
                  className="flex-1 bg-white border border-slate-200 text-slate-800 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
                <button onClick={handleAddCategory} className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                  <Plus size={16} />
                  Adicionar
                </button>
              </div>
              {categoriesLoading ? <Skeleton className="h-32 w-full rounded-xl" /> : (
                <div className="space-y-3">
                  {categories.map(cat => (
                    <div key={cat.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-3">
                        <Hash size={16} className="text-slate-400" />
                        <span className="text-sm font-medium text-slate-700">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <Switch checked={cat.is_active} onCheckedChange={(checked) => updateCategory(cat.id, { is_active: checked })} />
                        <button onClick={() => deleteCategory(cat.id)} className="text-red-400 hover:text-red-600 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Zap size={20} className="text-blue-600" />
                <h3 className="text-sm font-semibold text-slate-800">Regras de Gamificação</h3>
              </div>
              <p className="text-xs text-slate-500 mb-4">Configure pontos por ação.</p>
              {rulesLoading ? <Skeleton className="h-32 w-full rounded-xl" /> : (
                <div className="space-y-3">
                  {rules.map(rule => (
                    <div key={rule.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                      <div>
                        <h4 className="text-sm font-medium text-slate-800">{rule.description || rule.action_type}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">{rule.action_type}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          value={rule.points}
                          onChange={(e) => updateRule(rule.id, parseInt(e.target.value) || 0)}
                          className="w-20 bg-white border border-slate-200 text-slate-800 text-sm text-center rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                        <span className="text-sm text-slate-500 font-medium w-6">pts</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* ═══════════════ MENU CONFIG TAB ═══════════════ */}
          <TabsContent value="menu-config" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Student Menu */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="p-6 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-slate-800">Menu dos Alunos</h3>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">
                    Itens visíveis no menu lateral para usuários com perfil de aluno. Mudanças aplicadas imediatamente.
                  </p>
                </div>
                <div className="p-6 space-y-6">
                  {menuLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full rounded-xl" />
                      ))}
                    </div>
                  ) : (
                    Object.entries(groupMenuItems(STUDENT_MENU_ITEMS)).map(([groupLabel, items]) => (
                      <div key={groupLabel} className="space-y-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-1">
                          {groupLabel}
                        </p>
                        <div className="space-y-1">
                          {items.map(item => {
                            const visible = isItemVisible('student' as MenuRole, item.key);
                            return (
                              <div key={item.key} className="flex items-center justify-between px-4 py-3 rounded-lg bg-slate-50 border border-slate-100">
                                <span className={`text-sm font-medium ${visible ? 'text-slate-800' : 'text-slate-400 line-through'}`}>
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
                </div>
              </div>

              {/* Mentor Menu */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="p-6 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-slate-800">Menu dos Mentores</h3>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">
                    Itens visíveis no menu lateral para usuários com perfil de mentor. Mudanças aplicadas imediatamente.
                  </p>
                </div>
                <div className="p-6 space-y-6">
                  {menuLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full rounded-xl" />
                      ))}
                    </div>
                  ) : (
                    Object.entries(groupMenuItems(MENTOR_MENU_ITEMS)).map(([groupLabel, items]) => (
                      <div key={groupLabel} className="space-y-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-1">
                          {groupLabel}
                        </p>
                        <div className="space-y-1">
                          {items.map(item => {
                            const visible = isItemVisible('mentor' as MenuRole, item.key);
                            return (
                              <div key={item.key} className="flex items-center justify-between px-4 py-3 rounded-lg bg-slate-50 border border-slate-100">
                                <span className={`text-sm font-medium ${visible ? 'text-slate-800' : 'text-slate-400 line-through'}`}>
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
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ═══════════════ BRANDING TAB ═══════════════ */}
          <TabsContent value="branding" className="space-y-6">
            <BrandingTab
              getConfigValue={getConfigValue}
              updateConfig={updateConfig}
              isSaving={isSaving}
              isLoading={isLoading}
            />
          </TabsContent>

          </div>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

/* ───── Branding / Logo Upload Tab ───── */

interface BrandingTabProps {
  getConfigValue: (key: string) => string;
  updateConfig: (key: string, value: string) => Promise<void>;
  isSaving: boolean;
  isLoading: boolean;
}

function BrandingTab({ getConfigValue, updateConfig, isSaving, isLoading }: BrandingTabProps) {
  const [uploadingH, setUploadingH] = useState(false);
  const [uploadingS, setUploadingS] = useState(false);

  const logoH = getConfigValue('platform_logo_horizontal');
  const logoS = getConfigValue('platform_logo_square');

  const handleUpload = async (file: File, type: 'horizontal' | 'square') => {
    const setUploading = type === 'horizontal' ? setUploadingH : setUploadingS;
    const configKey = type === 'horizontal' ? 'platform_logo_horizontal' : 'platform_logo_square';

    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'png';
      const path = `logos/${type}_${Date.now()}.${ext}`;

      const { supabase } = await import('@/integrations/supabase/client');

      const { error: uploadError } = await supabase.storage
        .from('platform-assets')
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('platform-assets')
        .getPublicUrl(path);

      await updateConfig(configKey, urlData.publicUrl);
    } catch (err: any) {
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async (type: 'horizontal' | 'square') => {
    const configKey = type === 'horizontal' ? 'platform_logo_horizontal' : 'platform_logo_square';
    await updateConfig(configKey, '');
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Horizontal Logo */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
        <div className="flex items-center gap-2 mb-1.5">
          <Image size={20} className="text-blue-600" />
          <h3 className="text-sm font-semibold text-slate-800">Logo Horizontal</h3>
        </div>
        <p className="text-xs text-slate-500 mb-6">
          Usado no sidebar, header e paginas publicas. Recomendado: 400x100px, PNG ou SVG com fundo transparente.
        </p>
        <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center bg-slate-50/50 mb-6 flex-1 min-h-[140px]">
          {logoH ? (
            <img src={logoH} alt="Logo horizontal" className="max-h-16 max-w-full object-contain" />
          ) : (
            <>
              <Image size={24} className="text-slate-400 mb-2" />
              <p className="text-xs text-slate-500">Nenhum logo enviado (usando padrao)</p>
            </>
          )}
        </div>
        <div className="flex gap-2">
          <label className="flex-1">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file, 'horizontal');
                e.target.value = '';
              }}
            />
            <button className="w-full flex items-center justify-center gap-2 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors" disabled={uploadingH || isSaving}>
              {uploadingH ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload size={16} />}
              {uploadingH ? 'Enviando...' : 'Enviar Logo'}
            </button>
          </label>
          {logoH && (
            <button
              className="p-2.5 border border-slate-200 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
              onClick={() => handleRemove('horizontal')}
              disabled={isSaving}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Square Logo */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
        <div className="flex items-center gap-2 mb-1.5">
          <Image size={20} className="text-blue-600" />
          <h3 className="text-sm font-semibold text-slate-800">Logo Quadrado</h3>
        </div>
        <p className="text-xs text-slate-500 mb-6">
          Usado como icone e em espacos compactos. Recomendado: 200x200px, PNG ou SVG com fundo transparente.
        </p>
        <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center bg-slate-50/50 mb-6 flex-1 min-h-[140px]">
          {logoS ? (
            <img src={logoS} alt="Logo quadrado" className="max-h-16 max-w-16 object-contain" />
          ) : (
            <>
              <Image size={24} className="text-slate-400 mb-2" />
              <p className="text-xs text-slate-500">Nenhum logo quadrado enviado</p>
            </>
          )}
        </div>
        <div className="flex gap-2">
          <label className="flex-1">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file, 'square');
                e.target.value = '';
              }}
            />
            <button className="w-full flex items-center justify-center gap-2 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors" disabled={uploadingS || isSaving}>
              {uploadingS ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload size={16} />}
              {uploadingS ? 'Enviando...' : 'Enviar Logo'}
            </button>
          </label>
          {logoS && (
            <button
              className="p-2.5 border border-slate-200 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
              onClick={() => handleRemove('square')}
              disabled={isSaving}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
