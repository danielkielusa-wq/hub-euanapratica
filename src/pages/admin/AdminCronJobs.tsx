import { useState, useMemo } from 'react';
import { Loader2, Timer, RefreshCw, Pencil, Check, X, Search, Info, Filter, Zap, Clock, AlertCircle, Mail } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import {
  useAllCronJobs,
  useUpdateCronSchedule,
} from '@/hooks/useAdminAutomations';
import type { CronJob } from '@/hooks/useAdminAutomations';
import { useQueryClient } from '@tanstack/react-query';

// ── Job metadata ─────────────────────────────────────────────────────

const JOB_DESCRIPTIONS: Record<string, { label: string; help: string }> = {
  'send-booking-reminder-24h': {
    label: 'Lembrete de agendamento 24h antes',
    help: 'Envia notificacao para usuarios que tem agendamento marcado nas proximas 24h. Roda a cada 15 minutos para pegar novos agendamentos.',
  },
  'send-booking-reminder-1h': {
    label: 'Lembrete de agendamento 1h antes',
    help: 'Lembrete urgente 1h antes do horario. Roda a cada 15 minutos. Evita duplicatas verificando se ja foi enviado.',
  },
  'send-session-reminder-24h': {
    label: 'Notificacao de sessao 24h antes',
    help: 'Cria notificacao in-app para sessoes de mentoria agendadas. Diferente do booking reminder, atua sobre sessoes ja confirmadas.',
  },
  'send-session-reminder-1h': {
    label: 'Notificacao de sessao 1h antes',
    help: 'Notificacao urgente in-app 1h antes da sessao de mentoria. Complementa o lembrete de 24h.',
  },
  'send-prime-jobs-digest-weekly': {
    label: 'Digest semanal Prime Jobs',
    help: 'Email semanal com vagas curadas para assinantes do Prime Jobs. Roda nas segundas-feiras. Usa Resend diretamente.',
  },
  'check-abandoned-carts': {
    label: 'Detectar carrinhos abandonados',
    help: 'Identifica usuarios que iniciaram checkout mas nao finalizaram. Dispara automacoes de recuperacao (email/WhatsApp).',
  },
  'generate-content-insights-weekly': {
    label: 'Insights de conteudo (semanal)',
    help: 'Analise semanal de performance de conteudo publicado na comunidade. Gera metricas de engajamento e sugestoes.',
  },
  'check-unfinished-lives': {
    label: 'Verificar lives nao finalizadas',
    help: 'Detecta lives que passaram do horario previsto sem serem finalizadas. Permite acao manual ou auto-finalizacao.',
  },
  'generate-weekly-intelligence-report': {
    label: 'Relatorio semanal de inteligencia',
    help: 'Gera relatorio executivo com metricas da semana: leads, conversoes, receita, churn. Dispara webhook para N8N.',
  },
  'resume-flow-delayed-sessions': {
    label: 'Retomar fluxos WhatsApp com delay',
    help: 'Verifica sessoes de fluxo WhatsApp pausadas (step tipo "delay") e retoma execucao quando o tempo expirou. Tambem trata timeouts de wait_reply.',
  },
  'process-whatsapp-batch': {
    label: 'Processar lote WhatsApp',
    help: 'Processa a fila de envio em lote de WhatsApp. Respeita horario comercial (9-20h BRT), delays anti-bloqueio e limite de erro.',
  },
  'generate-daily-analytics': {
    label: 'Snapshot diario de analytics',
    help: 'Coleta todas as metricas do dia (leads, assinaturas, receita, WhatsApp, email, etc.) e salva snapshot. Dispara webhook analytics.daily.',
  },
  'send-daily-agenda-6am-brt': {
    label: 'Agenda diaria do admin (6h BRT)',
    help: 'Envia resumo matinal para o admin com agendamentos do dia, tarefas pendentes e alertas importantes. 6h horario de Brasilia.',
  },
  'process-email-campaign': {
    label: 'Processar campanhas de email',
    help: 'Processa filas de campanhas de email ativas. Envia em lotes com delay entre mensagens para evitar blocklist.',
  },
  'process-email-drips': {
    label: 'Processar drip automations',
    help: 'Verifica enrollments de drip (ex: pos-diagnostico D0/D3/D7/D14) e envia emails quando o delay expirou.',
  },
  'process-email-automations-daily': {
    label: 'Automacoes de email (diario)',
    help: 'Processa automacoes de email com frequencia diaria. Verifica triggers e envia emails programados para o dia.',
  },
  'process-email-automations-weekly': {
    label: 'Automacoes de email (semanal)',
    help: 'Processa automacoes de email com frequencia semanal. Tipicamente newsletters e resumos periodicos.',
  },
  'check-espaco-deadlines': {
    label: 'Verificar deadlines de espacos',
    help: 'Monitora prazos de espacos de trabalho/projetos. Notifica responsaveis quando deadlines estao proximos ou vencidos.',
  },
  'send-live-reminder-24h': {
    label: 'Lembrete de live 24h antes',
    help: 'Envia email para todos os inscritos em lives agendadas nas proximas 24h. Inclui link do Google Calendar e detalhes da live. Usa coluna reminder_24h_sent_at para evitar duplicatas.',
  },
  'send-live-reminder-1h': {
    label: 'Lembrete de live 1h antes',
    help: 'Lembrete urgente 1h antes da live. Destaca horario e link de acesso. Roda a cada 15 minutos. Usa coluna reminder_1h_sent_at para evitar duplicatas.',
  },
  'send-live-reminder-15min': {
    label: 'Lembrete de live 15min antes',
    help: 'Ultimo aviso antes da live comecar. Prioriza o botao de entrar na live. Roda a cada 5 minutos. Usa coluna reminder_15m_sent_at para evitar duplicatas.',
  },
  'generate-group-content-daily': {
    label: 'Conteudo diario para grupo WhatsApp/Telegram',
    help: 'Gera textos prontos por IA para copiar e colar no grupo. Usa dados anonimos dos diagnosticos. Configuravel em /admin/conteudo-grupo (LLM, prompt, qtd). Dispara webhook group_content.generated para N8N/Telegram.',
  },
};

const JOB_CATEGORIES: Record<string, string> = {
  'send-booking-reminder': 'Agendamento',
  'send-session-reminder': 'Agendamento',
  'send-prime-jobs': 'Email',
  'check-abandoned': 'Campanha',
  'generate-content': 'Conteudo',
  'generate-group': 'Conteudo',
  'check-unfinished': 'Lives',
  'send-live-reminder': 'Lives',
  'generate-weekly': 'Inteligencia',
  'resume-flow': 'WhatsApp',
  'process-whatsapp': 'WhatsApp',
  'generate-daily': 'Analytics',
  'send-daily-agenda': 'Admin',
  'process-email': 'Email',
  'check-espaco': 'Espacos',
};

// Map cron jobs to the email templates they use
const JOB_EMAIL_TEMPLATES: Record<string, string[]> = {
  'send-booking-reminder-24h': ['booking_reminder', 'booking_reminder_mentor'],
  'send-booking-reminder-1h': ['booking_reminder_1h', 'booking_reminder_1h_mentor'],
  'send-prime-jobs-digest-weekly': ['prime_jobs_digest'],
  'check-abandoned-carts': ['abandoned_cart_reminder'],
  'check-unfinished-lives': ['live_unfinished_warning', 'live_expired_mentor'],
  'send-live-reminder-24h': ['live_reminder_24h'],
  'send-live-reminder-1h': ['live_reminder_1h'],
  'send-live-reminder-15min': ['live_reminder_15min'],
  'send-daily-agenda-6am-brt': ['daily_agenda_admin'],
  'process-email-campaign': ['(template da campanha)'],
  'process-email-drips': ['drip_report_d0', 'drip_report_d3', 'drip_report_d7', 'drip_report_d14'],
  'process-email-automations-daily': ['(template da automacao)'],
  'process-email-automations-weekly': ['(template da automacao)'],
  'check-espaco-deadlines': ['espaco_deadline_reminder'],
};

function getCategory(jobName: string): string {
  for (const [prefix, cat] of Object.entries(JOB_CATEGORIES)) {
    if (jobName.startsWith(prefix)) return cat;
  }
  return 'Outro';
}

const CATEGORY_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  'Agendamento': { bg: 'bg-blue-500/10', text: 'text-blue-600', dot: 'bg-blue-500' },
  'Email': { bg: 'bg-violet-500/10', text: 'text-violet-600', dot: 'bg-violet-500' },
  'Campanha': { bg: 'bg-amber-500/10', text: 'text-amber-600', dot: 'bg-amber-500' },
  'Conteudo': { bg: 'bg-pink-500/10', text: 'text-pink-600', dot: 'bg-pink-500' },
  'Lives': { bg: 'bg-red-500/10', text: 'text-red-600', dot: 'bg-red-500' },
  'Inteligencia': { bg: 'bg-indigo-500/10', text: 'text-indigo-600', dot: 'bg-indigo-500' },
  'WhatsApp': { bg: 'bg-emerald-500/10', text: 'text-emerald-600', dot: 'bg-emerald-500' },
  'Analytics': { bg: 'bg-cyan-500/10', text: 'text-cyan-600', dot: 'bg-cyan-500' },
  'Admin': { bg: 'bg-slate-500/10', text: 'text-slate-600', dot: 'bg-slate-500' },
  'Espacos': { bg: 'bg-orange-500/10', text: 'text-orange-600', dot: 'bg-orange-500' },
  'Outro': { bg: 'bg-gray-500/10', text: 'text-gray-500', dot: 'bg-gray-400' },
};

// ── Cron description ─────────────────────────────────────────────────

function describeCron(schedule: string): string {
  const parts = schedule.split(/\s+/);
  if (parts.length !== 5) return schedule;
  const [min, hour, , , dow] = parts;

  const dowNames: Record<string, string> = {
    '0': 'Dom', '1': 'Seg', '2': 'Ter', '3': 'Qua',
    '4': 'Qui', '5': 'Sex', '6': 'Sab',
    '1-5': 'Seg-Sex', '*': 'Todos os dias',
  };

  if (min.startsWith('*/')) {
    const interval = min.replace('*/', '');
    if (hour === '*') return `A cada ${interval} min`;
    return `A cada ${interval} min (${hour}h UTC)`;
  }

  if (hour === '*' && min === '0') return 'A cada hora';

  const dowLabel = dowNames[dow] || (dow === '*' ? '' : `(dow=${dow})`);
  const timeStr = `${hour.padStart(2, '0')}:${min.padStart(2, '0')} UTC`;

  if (dow === '*') return `Diario ${timeStr}`;
  return `${dowLabel} ${timeStr}`;
}

// ── Inline Schedule Editor ───────────────────────────────────────────

function InlineScheduleEditor({ job }: { job: CronJob }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(job.schedule);
  const updateSchedule = useUpdateCronSchedule();
  const queryClient = useQueryClient();

  const handleSave = () => {
    if (!value.trim() || value.trim() === job.schedule) {
      setEditing(false);
      return;
    }
    updateSchedule.mutate(
      { jobName: job.jobname, schedule: value.trim() },
      {
        onSuccess: () => {
          setEditing(false);
          queryClient.invalidateQueries({ queryKey: ['cron-jobs-all'] });
        },
      }
    );
  };

  if (!editing) {
    return (
      <div className="flex items-center gap-2 group">
        <code className="text-[13px] bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md font-mono text-slate-700 dark:text-slate-300 tracking-wide">
          {job.schedule}
        </code>
        <button
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-slate-100"
          onClick={() => { setValue(job.schedule); setEditing(true); }}
        >
          <Pencil className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-8 text-[13px] font-mono w-40 border-indigo-300 focus-visible:ring-indigo-500/20"
        onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false); }}
        autoFocus
        placeholder="*/15 * * * *"
      />
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0 text-emerald-600 hover:bg-emerald-50"
        onClick={handleSave}
        disabled={updateSchedule.isPending}
      >
        {updateSchedule.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0 text-slate-400 hover:bg-slate-100"
        onClick={() => setEditing(false)}
      >
        <X className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}

// ── Extract function name from command ───────────────────────────────

function extractFunctionName(command: string): string | null {
  const match = command.match(/invoke_edge_function\(\s*'([^']+)'/);
  return match?.[1] ?? null;
}

// ── Column Helper ────────────────────────────────────────────────────

function ColumnHelper({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors">
          <Info className="w-3.5 h-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" align="start" className="w-80 text-sm">
        <p className="font-semibold text-slate-900 mb-1.5">{title}</p>
        <div className="text-slate-600 text-[13px] leading-relaxed space-y-2">
          {children}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ── Category Badge ───────────────────────────────────────────────────

function CategoryBadge({ category }: { category: string }) {
  const style = CATEGORY_STYLES[category] || CATEGORY_STYLES['Outro'];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {category}
    </span>
  );
}

// ── Stat Card ────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color }: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className={`flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm`}>
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${color}`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900 leading-none">{value}</p>
        <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────

export default function AdminCronJobs() {
  const { data: jobs = [], isLoading, refetch } = useAllCronJobs();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Derived data
  const allCategories = useMemo(() => {
    const cats = new Set(jobs.map(j => getCategory(j.jobname)));
    return Array.from(cats).sort();
  }, [jobs]);

  const filtered = useMemo(() => {
    return jobs.filter(j => {
      const cat = getCategory(j.jobname);
      if (categoryFilter !== 'all' && cat !== categoryFilter) return false;
      if (statusFilter === 'active' && !j.active) return false;
      if (statusFilter === 'inactive' && j.active) return false;
      if (search) {
        const q = search.toLowerCase();
        const desc = JOB_DESCRIPTIONS[j.jobname];
        return (
          j.jobname.toLowerCase().includes(q) ||
          (desc?.label || '').toLowerCase().includes(q) ||
          cat.toLowerCase().includes(q) ||
          j.schedule.includes(q)
        );
      }
      return true;
    });
  }, [jobs, search, categoryFilter, statusFilter]);

  const activeCount = jobs.filter(j => j.active).length;
  const hasFilters = search || categoryFilter !== 'all' || statusFilter !== 'all';

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-[1400px]">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Cron Jobs
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Tarefas agendadas via pg_cron. Monitore schedules, status e edite frequencias em tempo real.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="gap-1.5 text-slate-600 border-slate-200"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Atualizar
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total de jobs" value={jobs.length} icon={Timer} color="bg-indigo-500" />
          <StatCard label="Ativos" value={activeCount} icon={Zap} color="bg-emerald-500" />
          <StatCard label="Inativos" value={jobs.length - activeCount} icon={AlertCircle} color="bg-slate-400" />
          <StatCard label="Categorias" value={allCategories.length} icon={Filter} color="bg-violet-500" />
        </div>

        {/* Filters */}
        <Card className="border-slate-200/80 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por nome, descricao ou schedule..."
                  className="pl-9 h-9 text-sm border-slate-200"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[160px] h-9 text-sm border-slate-200">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas categorias</SelectItem>
                  {allCategories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] h-9 text-sm border-slate-200">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                </SelectContent>
              </Select>
              {hasFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-500 text-xs h-9"
                  onClick={() => { setSearch(''); setCategoryFilter('all'); setStatusFilter('all'); }}
                >
                  <X className="w-3.5 h-3.5 mr-1" /> Limpar filtros
                </Button>
              )}
              <span className="text-xs text-slate-400 ml-auto">
                {filtered.length} de {jobs.length} jobs
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border-slate-200/80 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <TooltipProvider delayDuration={200}>
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                    <TableHead className="w-10 text-xs font-semibold text-slate-500">#</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500">
                      <span className="flex items-center gap-1.5">
                        Job
                        <ColumnHelper title="Nome do Job">
                          <p>Identificador unico do cron job no pg_cron. Corresponde ao <code className="px-1 py-0.5 bg-slate-100 rounded text-xs">jobname</code> na tabela <code className="px-1 py-0.5 bg-slate-100 rounded text-xs">cron.job</code>.</p>
                          <p>Passe o mouse sobre o nome para ver a descricao completa do que o job faz.</p>
                        </ColumnHelper>
                      </span>
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500">
                      <span className="flex items-center gap-1.5">
                        Categoria
                        <ColumnHelper title="Categoria">
                          <p>Agrupamento automatico baseado no prefixo do nome. Ajuda a filtrar jobs relacionados (ex: todos de Email, WhatsApp, etc).</p>
                        </ColumnHelper>
                      </span>
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500">
                      <span className="flex items-center gap-1.5">
                        Schedule
                        <ColumnHelper title="Schedule (formato cron)">
                          <p>Expressao cron com 5 campos, sempre em <strong>UTC</strong>:</p>
                          <code className="block bg-slate-100 px-2 py-1.5 rounded text-xs font-mono mt-1">
                            minuto hora dia-mes mes dia-semana
                          </code>
                          <div className="mt-2 space-y-1">
                            <p className="font-medium text-slate-700">Exemplos:</p>
                            <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs">
                              <code className="font-mono text-indigo-600">*/15 * * * *</code>
                              <span>A cada 15 minutos</span>
                              <code className="font-mono text-indigo-600">0 9 * * 1</code>
                              <span>Segunda 09:00 UTC</span>
                              <code className="font-mono text-indigo-600">0 */2 * * *</code>
                              <span>A cada 2 horas</span>
                              <code className="font-mono text-indigo-600">30 6 * * *</code>
                              <span>Diario 06:30 UTC</span>
                              <code className="font-mono text-indigo-600">0 12 * * 1-5</code>
                              <span>Seg-Sex 12:00 UTC</span>
                            </div>
                          </div>
                          <p className="mt-2 text-slate-500">Clique no icone de lapis para editar. Use <strong>Enter</strong> para salvar ou <strong>Esc</strong> para cancelar.</p>
                        </ColumnHelper>
                      </span>
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500">
                      <span className="flex items-center gap-1.5">
                        Frequencia
                        <ColumnHelper title="Frequencia">
                          <p>Traducao automatica do schedule cron para linguagem natural. Mostra com que frequencia o job executa.</p>
                          <p className="mt-1">Horarios sao exibidos em <strong>UTC</strong>. Para converter para BRT, subtraia 3 horas.</p>
                        </ColumnHelper>
                      </span>
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500">
                      <span className="flex items-center gap-1.5">
                        Edge Function
                        <ColumnHelper title="Edge Function">
                          <p>Nome da Supabase Edge Function que o job invoca. Extraido automaticamente do comando <code className="px-1 py-0.5 bg-slate-100 rounded text-xs">invoke_edge_function()</code>.</p>
                          <p className="mt-1">Jobs que mostram "SQL direto" executam queries SQL diretamente, sem chamar Edge Function.</p>
                        </ColumnHelper>
                      </span>
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500">
                      <span className="flex items-center gap-1.5">
                        Templates
                        <ColumnHelper title="Email Templates">
                          <p>Templates de email usados por este cron job. Clique no nome para abrir o editor de templates.</p>
                          <p className="mt-1">Jobs que nao enviam email (ex: analytics, WhatsApp) nao mostram templates.</p>
                          <p className="mt-1">Templates entre parenteses indicam que o template eh dinamico (definido na campanha/automacao, nao fixo no cron).</p>
                        </ColumnHelper>
                      </span>
                    </TableHead>
                    <TableHead className="w-20 text-xs font-semibold text-slate-500">
                      <span className="flex items-center gap-1.5">
                        Status
                        <ColumnHelper title="Status (Ativo/Inativo)">
                          <p>Indica se o job esta habilitado no pg_cron. Jobs inativos ficam com opacidade reduzida.</p>
                          <p className="mt-1">Para ativar/desativar, use SQL: <code className="px-1 py-0.5 bg-slate-100 rounded text-xs">UPDATE cron.job SET active = true/false WHERE jobname = '...'</code></p>
                        </ColumnHelper>
                      </span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-slate-400">
                        <div className="flex flex-col items-center gap-2">
                          <Search className="w-5 h-5" />
                          <p className="text-sm">Nenhum job encontrado com os filtros atuais</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  {filtered.map((job, i) => {
                    const category = getCategory(job.jobname);
                    const meta = JOB_DESCRIPTIONS[job.jobname];
                    const fn = extractFunctionName(job.command);
                    const templates = JOB_EMAIL_TEMPLATES[job.jobname];
                    return (
                      <TableRow
                        key={job.jobid}
                        className={`transition-colors ${!job.active ? 'opacity-40' : 'hover:bg-slate-50/50'}`}
                      >
                        <TableCell className="text-xs text-slate-400 font-mono tabular-nums">
                          {i + 1}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="text-sm font-medium text-slate-900 cursor-help">
                                    {job.jobname}
                                  </span>
                                </TooltipTrigger>
                                {meta && (
                                  <TooltipContent side="top" className="max-w-xs">
                                    <p className="text-xs font-medium">{meta.label}</p>
                                    <p className="text-xs text-slate-400 mt-1">{meta.help}</p>
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </div>
                            {meta && (
                              <p className="text-xs text-slate-400 leading-snug">{meta.label}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <CategoryBadge category={category} />
                        </TableCell>
                        <TableCell>
                          <InlineScheduleEditor job={job} />
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {describeCron(job.schedule)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {fn ? (
                            <code className="text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md font-mono">
                              {fn}
                            </code>
                          ) : (
                            <span className="text-xs text-slate-400 italic">SQL direto</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {templates ? (
                            <div className="flex flex-wrap gap-1">
                              {templates.map(t => {
                                const isDynamic = t.startsWith('(');
                                return (
                                  <Tooltip key={t}>
                                    <TooltipTrigger asChild>
                                      {isDynamic ? (
                                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded italic">
                                          <Mail className="w-3 h-3" />
                                          {t}
                                        </span>
                                      ) : (
                                        <a
                                          href={`/admin/email-templates?edit=${encodeURIComponent(t)}`}
                                          className="inline-flex items-center gap-1 text-[11px] text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded font-mono hover:bg-violet-100 transition-colors"
                                        >
                                          <Mail className="w-3 h-3" />
                                          {t}
                                        </a>
                                      )}
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                      <p className="text-xs">{isDynamic ? 'Template definido dinamicamente' : `Template: ${t}`}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-300">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {job.active ? (
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-medium shadow-none">
                              Ativo
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-slate-400 text-xs font-medium shadow-none">
                              Inativo
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TooltipProvider>
          </CardContent>
        </Card>

        {/* Footer help */}
        <div className="flex items-start gap-3 rounded-xl bg-slate-50 border border-slate-200/80 p-4">
          <Info className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
          <div className="text-xs text-slate-500 space-y-1">
            <p>
              Todos os schedules usam <strong>cron syntax</strong> em <strong>UTC</strong>.
              Para converter para BRT (Brasilia), subtraia 3 horas. Ex: 09:00 UTC = 06:00 BRT.
            </p>
            <p>
              Clique no <Pencil className="w-3 h-3 inline -mt-0.5" /> ao passar o mouse sobre um schedule para editar.
              A alteracao eh aplicada imediatamente no pg_cron (unschedule + reschedule).
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
