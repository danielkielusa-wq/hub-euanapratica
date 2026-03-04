import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  ExternalLink,
  RotateCcw,
  CalendarDays,
  BookOpen,
  Send,
  Loader2,
  Copy,
  CheckCheck,
  Terminal,
  Smartphone,
  Mail,
  Zap,
  CheckCircle2,
  Circle,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = 'fundador' | 'crm' | 'creator';
type TimeOfDay = 'morning' | 'evening';
type RoleFilter = 'all' | Role;

interface AgendaTask {
  id: string;
  day: number; // 0 = Mon … 4 = Fri
  timeOfDay: TimeOfDay;
  role: Role;
  title: string;
  description: string;
  action?: { label: string; href: string };
}

// ─── Role Config ──────────────────────────────────────────────────────────────

const ROLE_CONFIG: Record<Role, {
  label: string;
  badgeClass: string;
  dotClass: string;
  // kept for docs sheet (dark theme)
  color: string;
  bg: string;
  border: string;
}> = {
  fundador: {
    label: 'Fundador',
    badgeClass: 'text-amber-700 bg-amber-100',
    dotClass: 'bg-amber-500',
    color: '#d4a84b',
    bg: 'rgba(212,168,75,0.10)',
    border: 'rgba(212,168,75,0.28)',
  },
  crm: {
    label: 'Assistente CRM',
    badgeClass: 'text-emerald-700 bg-emerald-100',
    dotClass: 'bg-emerald-500',
    color: '#5eead4',
    bg: 'rgba(94,234,212,0.08)',
    border: 'rgba(94,234,212,0.22)',
  },
  creator: {
    label: 'Creator',
    badgeClass: 'text-orange-700 bg-orange-100',
    dotClass: 'bg-orange-500',
    color: '#fb923c',
    bg: 'rgba(251,146,60,0.10)',
    border: 'rgba(251,146,60,0.25)',
  },
};

const DAYS_LONG = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
const DAYS_SHORT = ['SEG', 'TER', 'QUA', 'QUI', 'SEX'];
const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

// ─── Weekly Tasks ─────────────────────────────────────────────────────────────

const TASKS: AgendaTask[] = [
  // ── Segunda (0) ──────────────────────────────────────────────────────────
  { id: 'mon-m-1', day: 0, timeOfDay: 'morning', role: 'fundador',
    title: 'Revisão da semana anterior',
    description: 'Métricas de crescimento, novos usuários, MRR e conversões da última semana',
    action: { label: 'Leads Dashboard', href: '/admin/leads-dashboard' } },
  { id: 'mon-m-2', day: 0, timeOfDay: 'morning', role: 'crm',
    title: 'Leads novos + WhatsApp pendentes',
    description: 'Verificar novos leads e mensagens sem resposta desde sexta-feira',
    action: { label: 'Ver leads', href: '/admin/leads-dashboard' } },
  { id: 'mon-m-3', day: 0, timeOfDay: 'morning', role: 'creator',
    title: 'Planejar pauta da semana',
    description: 'Definir temas, formatos e datas de publicação para os próximos 5 dias' },
  { id: 'mon-e-1', day: 0, timeOfDay: 'evening', role: 'fundador',
    title: 'Definir 3 prioridades da semana',
    description: 'O que precisa fechar? O que está travado? O que vai mover o negócio?' },
  { id: 'mon-e-2', day: 0, timeOfDay: 'evening', role: 'crm',
    title: 'Configurar disparos programados',
    description: 'Agendar fluxos WhatsApp e campanhas para os próximos dias',
    action: { label: 'Fluxos WA', href: '/admin/whatsapp-flows' } },
  { id: 'mon-e-3', day: 0, timeOfDay: 'evening', role: 'creator',
    title: 'Agendar posts e conteúdos',
    description: 'Subir conteúdos criados para as ferramentas de agendamento' },

  // ── Terça (1) ────────────────────────────────────────────────────────────
  { id: 'tue-m-1', day: 1, timeOfDay: 'morning', role: 'crm',
    title: 'Follow-up leads quentes',
    description: 'Quem não respondeu ontem? Retomar contato com os mais quentes',
    action: { label: 'Dashboard', href: '/admin/leads-dashboard' } },
  { id: 'tue-m-2', day: 1, timeOfDay: 'morning', role: 'fundador',
    title: 'Saúde do sistema + custos de API',
    description: 'Verificar alertas, erros e gastos com IA da semana',
    action: { label: 'Saúde', href: '/admin/saude-sistema' } },
  { id: 'tue-m-3', day: 1, timeOfDay: 'morning', role: 'creator',
    title: 'Analisar engajamento recente',
    description: 'O que teve mais alcance e respostas? Identificar padrões no conteúdo' },
  { id: 'tue-e-1', day: 1, timeOfDay: 'evening', role: 'crm',
    title: 'Atualizar pipeline de leads',
    description: 'Registrar interações, mudar fases e anotar objeções dos leads ativos' },
  { id: 'tue-e-2', day: 1, timeOfDay: 'evening', role: 'creator',
    title: 'Criar rascunho de conteúdo',
    description: 'Escrever ou gravar os primeiros conteúdos da pauta da semana' },

  // ── Quarta (2) ───────────────────────────────────────────────────────────
  { id: 'wed-m-1', day: 2, timeOfDay: 'morning', role: 'fundador',
    title: 'Assinaturas: novos e cancelamentos',
    description: 'Verificar churn, novos assinantes e inadimplências pendentes',
    action: { label: 'Assinaturas', href: '/admin/assinaturas' } },
  { id: 'wed-m-2', day: 2, timeOfDay: 'morning', role: 'crm',
    title: 'Agendamentos e sessões do dia',
    description: 'Confirmar sessões agendadas, verificar no-shows e pendências',
    action: { label: 'Agendamentos', href: '/admin/agendamentos' } },
  { id: 'wed-m-3', day: 2, timeOfDay: 'morning', role: 'creator',
    title: 'Publicar conteúdo de meio de semana',
    description: 'Quarta é pico de engajamento — aproveitar para conteúdo estratégico' },
  { id: 'wed-e-1', day: 2, timeOfDay: 'evening', role: 'fundador',
    title: 'Análise de custos da semana',
    description: 'Revisar gastos com APIs, tendência de uso e oportunidades de otimização',
    action: { label: 'Custos API', href: '/admin/custos-api' } },
  { id: 'wed-e-2', day: 2, timeOfDay: 'evening', role: 'crm',
    title: 'Contato ativo: leads em decisão',
    description: 'Leads na fase final — enviar proposta, tirar dúvidas ou dar nudge' },

  // ── Quinta (3) ───────────────────────────────────────────────────────────
  { id: 'thu-m-1', day: 3, timeOfDay: 'morning', role: 'crm',
    title: 'Lote WA: leads inativos',
    description: 'Enviar fluxo de reativação para leads sem resposta há 7+ dias',
    action: { label: 'Envio em Lote', href: '/admin/whatsapp-flows' } },
  { id: 'thu-m-2', day: 3, timeOfDay: 'morning', role: 'creator',
    title: 'Produzir ou gravar conteúdo',
    description: 'Quinta é o melhor dia para gravações — produzir o próximo ciclo' },
  { id: 'thu-m-3', day: 3, timeOfDay: 'morning', role: 'fundador',
    title: 'Revisar automações N8N',
    description: 'Verificar logs de automações, erros e oportunidades de novos fluxos',
    action: { label: 'Automações', href: '/admin/automacoes' } },
  { id: 'thu-e-1', day: 3, timeOfDay: 'evening', role: 'crm',
    title: 'Follow-up de agendamentos',
    description: 'Acompanhar sessões da semana e garantir próximos passos para cada cliente' },
  { id: 'thu-e-2', day: 3, timeOfDay: 'evening', role: 'creator',
    title: 'Editar e preparar conteúdo',
    description: 'Editar o gravado e preparar publicações para sexta e semana seguinte' },

  // ── Sexta (4) ────────────────────────────────────────────────────────────
  { id: 'fri-m-1', day: 4, timeOfDay: 'morning', role: 'fundador',
    title: 'Retrospectiva da semana',
    description: 'O que funcionou? O que travou? O que repetir ou abandonar?' },
  { id: 'fri-m-2', day: 4, timeOfDay: 'morning', role: 'crm',
    title: 'Fechar ciclo de leads',
    description: 'Atualizar status final de todos os leads trabalhados na semana' },
  { id: 'fri-m-3', day: 4, timeOfDay: 'morning', role: 'creator',
    title: 'Publicar conteúdo de fechamento',
    description: 'Sexta traz boa tração para bastidores, resultados e depoimentos' },
  { id: 'fri-e-1', day: 4, timeOfDay: 'evening', role: 'fundador',
    title: 'Inteligência Semanal',
    description: 'Gerar relatório de IA com insights consolidados de leads e atividades',
    action: { label: 'Ver relatório', href: '/admin/inteligencia-semanal' } },
  { id: 'fri-e-2', day: 4, timeOfDay: 'evening', role: 'crm',
    title: 'Relatório de atividades CRM',
    description: 'Registrar métricas: leads contatados, conversões, agendamentos',
    action: { label: 'Atividades', href: '/admin/atividades' } },
  { id: 'fri-e-3', day: 4, timeOfDay: 'evening', role: 'creator',
    title: 'Análise de métricas de conteúdo',
    description: 'Quais posts performaram melhor? O que o público mais respondeu?' },
];

// ─── Date Helpers ─────────────────────────────────────────────────────────────

function getMondayKey(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

function getWeekDates(mondayKey: string): Date[] {
  const base = new Date(mondayKey + 'T12:00:00');
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    return d;
  });
}

function getWeekRange(dates: Date[]): string {
  const s = dates[0];
  const e = dates[4];
  if (s.getMonth() === e.getMonth()) {
    return `${s.getDate()} – ${e.getDate()} de ${MONTHS[s.getMonth()]}. ${s.getFullYear()}`;
  }
  return `${s.getDate()} ${MONTHS[s.getMonth()]}. – ${e.getDate()} ${MONTHS[e.getMonth()]}. ${s.getFullYear()}`;
}

// ─── Task Card ────────────────────────────────────────────────────────────────

function TaskCard({
  task,
  isCompleted,
  onToggle,
}: {
  task: AgendaTask;
  isCompleted: boolean;
  onToggle: () => void;
}) {
  const cfg = ROLE_CONFIG[task.role];
  return (
    <div
      onClick={onToggle}
      className={`group relative p-4 rounded-xl border transition-all duration-200 hover:shadow-md cursor-pointer ${
        isCompleted ? 'bg-gray-50 border-gray-200 opacity-60' : 'bg-white border-gray-200'
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${cfg.badgeClass}`}>
          {cfg.label}
        </span>
        <button
          onClick={e => { e.stopPropagation(); onToggle(); }}
          className={`transition-colors duration-200 ${
            isCompleted ? 'text-emerald-500' : 'text-gray-300 hover:text-gray-400'
          }`}
        >
          {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
        </button>
      </div>

      <h3 className={`text-sm font-bold mb-1.5 leading-tight ${
        isCompleted ? 'text-gray-500 line-through' : 'text-gray-900'
      }`}>
        {task.title}
      </h3>

      {!isCompleted && (
        <p className="text-xs leading-relaxed mb-3 text-gray-500">
          {task.description}
        </p>
      )}

      {task.action && !isCompleted && (
        <Link
          to={task.action.href}
          onClick={e => e.stopPropagation()}
          className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors uppercase tracking-wide"
        >
          {task.action.label}
          <ExternalLink className="w-2.5 h-2.5" />
        </Link>
      )}
    </div>
  );
}

// ─── Day Column ───────────────────────────────────────────────────────────────

function DayColumn({
  dayIndex,
  date,
  isToday,
  tasks,
  completed,
  onToggle,
}: {
  dayIndex: number;
  date: Date;
  isToday: boolean;
  tasks: AgendaTask[];
  completed: Record<string, boolean>;
  onToggle: (id: string) => void;
}) {
  const morning = tasks.filter(t => t.timeOfDay === 'morning');
  const evening = tasks.filter(t => t.timeOfDay === 'evening');

  return (
    <div className="flex flex-col min-w-[260px]">
      {/* Column Header */}
      <div className={`flex items-baseline justify-between mb-4 px-2 border-b pb-2 ${
        isToday ? 'border-amber-300' : 'border-gray-200'
      }`}>
        <span className={`text-xs font-bold uppercase tracking-widest ${
          isToday ? 'text-amber-500' : 'text-gray-400'
        }`}>
          {DAYS_SHORT[dayIndex]}
        </span>
        <span
          className={`text-3xl font-medium ${
            isToday ? 'text-amber-500 opacity-60' : 'text-gray-900 opacity-20'
          }`}
          style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
        >
          {date.getDate()}
        </span>
      </div>

      <div className="space-y-6">
        {/* Morning Section */}
        {morning.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-2">
              <Sun className="w-3 h-3 text-amber-500" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Manhã</span>
            </div>
            {morning.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                isCompleted={!!completed[task.id]}
                onToggle={() => onToggle(task.id)}
              />
            ))}
          </div>
        )}

        {/* Evening Section */}
        {evening.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-2 pt-2">
              <Moon className="w-3 h-3 text-indigo-400" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Final do dia</span>
            </div>
            {evening.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                isCompleted={!!completed[task.id]}
                onToggle={() => onToggle(task.id)}
              />
            ))}
          </div>
        )}

        {tasks.length === 0 && (
          <div className="text-center text-gray-300 text-xs py-4">—</div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminAgendaSemanal() {
  const today = new Date();
  const todayDayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1; // 0=Mon..6=Sun

  const [weekKey, setWeekKey] = useState(() => getMondayKey(today));
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [docsOpen, setDocsOpen] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const FUNCTION_URL = 'https://seqgnxynrcylxsdzbloa.supabase.co/functions/v1/send-daily-agenda';

  const sendTestNow = async () => {
    setIsTesting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast({ title: '✅ Enviado!', description: `Telegram: ${json.telegram ?? '—'} | Email: ${json.email ?? '—'}` });
      } else {
        toast({ title: 'Erro ao enviar', description: json.error ?? JSON.stringify(json), variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Erro de rede', description: String(err), variant: 'destructive' });
    } finally {
      setIsTesting(false);
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(FUNCTION_URL).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const storageKey = `agenda-semanal-${weekKey}`;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      setCompleted(saved ? JSON.parse(saved) : {});
    } catch {
      setCompleted({});
    }
  }, [storageKey]);

  const toggleTask = (taskId: string) => {
    setCompleted(prev => {
      const next = { ...prev, [taskId]: !prev[taskId] };
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  };

  const navigateWeek = (delta: number) => {
    const base = new Date(weekKey + 'T12:00:00');
    base.setDate(base.getDate() + delta * 7);
    setWeekKey(getMondayKey(base));
  };

  const weekDates = useMemo(() => getWeekDates(weekKey), [weekKey]);
  const isCurrentWeek = getMondayKey(today) === weekKey;

  const filteredTasks = useMemo(
    () => (roleFilter === 'all' ? TASKS : TASKS.filter(t => t.role === roleFilter)),
    [roleFilter]
  );

  const totalTasks = filteredTasks.length;
  const completedCount = filteredTasks.filter(t => completed[t.id]).length;
  const completionPct = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  const resetWeek = () => {
    localStorage.removeItem(storageKey);
    setCompleted({});
  };

  return (
    <DashboardLayout>
      {/* Font imports */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600&display=swap');
      `}</style>

      <div className="p-8 max-w-[1800px] mx-auto space-y-8" style={{ fontFamily: 'DM Sans, sans-serif' }}>

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
          {/* Title */}
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Planejamento
            </div>
            <h1
              className="text-4xl font-bold tracking-tight text-gray-900 mb-2"
              style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
            >
              Agenda Semanal
            </h1>
            <p className="text-gray-500 text-lg">
              Rituais diários para cada papel do negócio
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full xl:w-auto">
            {/* Progress Widget */}
            <div className="bg-gray-900 text-white p-4 rounded-xl w-full sm:w-64 shadow-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Progresso da semana
                </span>
                <span className={`text-xl font-bold ${completionPct === 100 ? 'text-emerald-400' : 'text-yellow-400'}`}>
                  {completionPct}%
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-1.5 mb-2">
                <div
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    completionPct === 100 ? 'bg-emerald-400' : 'bg-yellow-400'
                  }`}
                  style={{ width: `${completionPct}%` }}
                />
              </div>
              <div className="text-[10px] text-gray-400 text-right">
                {completedCount} de {totalTasks} tarefas concluídas
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setDocsOpen(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:text-gray-900 transition-all whitespace-nowrap"
              >
                <BookOpen className="w-4 h-4" />
                Documentação
              </button>
              <button
                onClick={sendTestNow}
                disabled={isTesting}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTesting
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Send className="w-4 h-4" />}
                {isTesting ? 'Enviando...' : 'Testar agora'}
              </button>
            </div>
          </div>
        </div>

        {/* ── Controls Bar ─────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-2 rounded-2xl border border-gray-200 shadow-sm">
          {/* Week Navigation */}
          <div className="flex items-center gap-2 p-1">
            <button
              onClick={() => navigateWeek(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 px-4 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
              <CalendarDays className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-semibold text-gray-700">
                {getWeekRange(weekDates)}
              </span>
              {isCurrentWeek && (
                <span className="text-[10px] font-bold bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full uppercase tracking-wide ml-2">
                  Esta Semana
                </span>
              )}
            </div>

            <button
              onClick={() => navigateWeek(1)}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <button
              onClick={resetWeek}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-red-500 transition-colors ml-2"
            >
              <RotateCcw className="w-3 h-3" />
              Resetar semana
            </button>
          </div>

          {/* Role Filter */}
          <div className="flex gap-1 p-1 overflow-x-auto w-full md:w-auto">
            {(['all', 'fundador', 'crm', 'creator'] as const).map(r => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  roleFilter === r
                    ? 'bg-gray-900 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {r === 'all' ? 'Todos os papéis' : ROLE_CONFIG[r].label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Kanban Grid ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6 overflow-x-auto pb-4">
          {DAYS_LONG.map((_, dayIndex) => (
            <DayColumn
              key={dayIndex}
              dayIndex={dayIndex}
              date={weekDates[dayIndex]}
              isToday={isCurrentWeek && dayIndex === todayDayIndex}
              tasks={filteredTasks.filter(t => t.day === dayIndex)}
              completed={completed}
              onToggle={toggleTask}
            />
          ))}
        </div>

        {/* ── Legend ────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-6 flex-wrap">
          {(Object.entries(ROLE_CONFIG) as [Role, typeof ROLE_CONFIG[Role]][]).map(([role, cfg]) => (
            <div key={role} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${cfg.dotClass}`} />
              <span className="text-xs text-gray-500">{cfg.label}</span>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <Sun className="w-3 h-3 text-amber-500 opacity-70" />
            <span className="text-xs text-gray-400">Manhã</span>
          </div>
          <div className="flex items-center gap-2">
            <Moon className="w-3 h-3 text-indigo-400 opacity-70" />
            <span className="text-xs text-gray-400">Final do dia</span>
          </div>
        </div>

      </div>

      {/* ── Documentation Sheet ─────────────────────────────────────── */}
      <Sheet open={docsOpen} onOpenChange={setDocsOpen}>
        <SheetContent side="right" style={{ width: '100%', maxWidth: '540px', background: '#0f0d0a', border: 'none', overflowY: 'auto' }}>
          <SheetHeader style={{ borderBottom: '1px solid #1e1c18', paddingBottom: '16px', marginBottom: '24px' }}>
            <SheetTitle style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '22px', color: '#f0e6d3', fontWeight: 700 }}>
              📖 Documentação
            </SheetTitle>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#5a5045', margin: 0 }}>
              Agenda Semanal + Notificações Diárias
            </p>
          </SheetHeader>

          <div style={{ fontFamily: 'DM Sans, sans-serif', display: 'flex', flexDirection: 'column', gap: '28px', paddingBottom: '40px' }}>

            <DocSection icon={<CalendarDays size={14} />} title="O que é a Agenda Semanal">
              <p style={docText}>
                Um planner de rituais semanais dividido por <b style={{ color: '#d4a84b' }}>papel</b>: Fundador, Assistente CRM e Creator. Cada dia tem tarefas de <b>manhã</b> e <b>final do dia</b> com links diretos para as telas relevantes da plataforma.
              </p>
              <p style={docText}>
                O progresso é salvo no <b>navegador</b> (localStorage) por semana — toda segunda-feira começa do zero. Use os filtros de papel para focar no que importa para o seu momento.
              </p>
            </DocSection>

            <DocSection icon={<Zap size={14} />} title="Notificações Diárias às 6h BRT">
              <p style={docText}>
                Todo dia de semana às <b style={{ color: '#d4a84b' }}>6h da manhã</b> (horário de Brasília), a plataforma pode enviar automaticamente a agenda do dia via <b>Telegram</b> e <b>Email</b>.
              </p>
              <p style={docText}>
                O disparo usa a Edge Function <code style={codeInline}>send-daily-agenda</code>. Você pode ativá-la via <b>N8N</b> ou via <b>pg_cron</b> (já configurado na migração).
              </p>
            </DocSection>

            <DocSection icon={<Smartphone size={14} />} title="Configurar Telegram">
              <ol style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  <>Abra o Telegram e busque <b>@BotFather</b></>,
                  <>Envie <code style={codeInline}>/newbot</code> e siga as instruções para criar seu bot</>,
                  <>Copie o <b>Token</b> que o BotFather te enviou</>,
                  <>Inicie uma conversa com o seu bot (clique em Start)</>,
                  <>Busque <b>@userinfobot</b> e envie qualquer mensagem para descobrir seu <b>Chat ID</b></>,
                  <>No Supabase Dashboard → <b>Edge Functions → Secrets</b>, adicione:<br />
                    <code style={{ ...codeBlock, marginTop: '6px', display: 'block' }}>TELEGRAM_BOT_TOKEN = &lt;seu token&gt;</code>
                    <code style={{ ...codeBlock, marginTop: '4px', display: 'block' }}>TELEGRAM_CHAT_ID = &lt;seu chat id&gt;</code>
                  </>,
                ].map((step, i) => (
                  <li key={i} style={{ fontSize: '13px', color: '#a09080', lineHeight: 1.5 }}>{step}</li>
                ))}
              </ol>
            </DocSection>

            <DocSection icon={<Mail size={14} />} title="Configurar Email">
              <p style={docText}>O email é enviado via Resend usando a API key já configurada em <b>Configurações → APIs Externas</b>. Apenas adicione o segredo abaixo no Supabase:</p>
              <code style={{ ...codeBlock, display: 'block' }}>ADMIN_NOTIFICATION_EMAIL = seu@email.com</code>
              <p style={{ ...docText, marginTop: '8px' }}>Vá em <b>Supabase Dashboard → Edge Functions → Secrets</b> e adicione essa variável.</p>
            </DocSection>

            <DocSection icon={<Terminal size={14} />} title="Webhook para N8N">
              <p style={docText}>URL que o N8N deve chamar com <b>HTTP Request (POST)</b>:</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                <code style={{ ...codeBlock, flex: 1, fontSize: '10px', wordBreak: 'break-all' }}>
                  {FUNCTION_URL}
                </code>
                <button
                  onClick={copyUrl}
                  style={{ background: '#1a1712', border: '1px solid #2a2620', borderRadius: '8px', padding: '6px 10px', color: copied ? '#5eead4' : '#7a6e61', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '5px', fontFamily: 'DM Mono, monospace', fontSize: '10px', transition: 'all 0.15s ease' }}
                >
                  {copied ? <CheckCheck size={12} /> : <Copy size={12} />}
                  {copied ? 'Copiado' : 'Copiar'}
                </button>
              </div>
              <p style={{ ...docText, marginTop: '16px' }}>Header obrigatório:</p>
              <code style={{ ...codeBlock, display: 'block' }}>x-internal-secret: &lt;valor de INTERNAL_FUNCTION_SECRET&gt;</code>
              <p style={{ ...docText, marginTop: '8px', fontSize: '11px', color: '#4a4538' }}>
                Esse valor está em <b>app_configs → internal_function_secret</b> (ou na variável de ambiente do Supabase).
              </p>
            </DocSection>

            <DocSection icon={<Zap size={14} />} title="Flow N8N — passo a passo">
              <ol style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  <>No N8N, crie um novo workflow</>,
                  <>Adicione um nó <b>Schedule Trigger</b></>,
                  <>Configure: <code style={codeInline}>Cron Expression</code> → <code style={codeInline}>0 6 * * 1-5</code> (6h, seg-sex)<br />
                    <span style={{ fontSize: '11px', color: '#4a4538' }}>⚠️ Ative o fuso BRT no N8N: Settings → Timezone → America/Sao_Paulo</span></>,
                  <>Adicione um nó <b>HTTP Request</b> após o Schedule</>,
                  <>Configure: Method = <code style={codeInline}>POST</code>, URL = a URL acima</>,
                  <>Em Headers adicione: <code style={codeInline}>x-internal-secret</code> com o valor do segredo</>,
                  <>Ative o workflow — pronto! ✅</>,
                ].map((step, i) => (
                  <li key={i} style={{ fontSize: '13px', color: '#a09080', lineHeight: 1.5 }}>{step}</li>
                ))}
              </ol>
            </DocSection>

            <DocSection icon={<Terminal size={14} />} title="pg_cron (alternativa ao N8N)">
              <p style={docText}>
                A migração <code style={codeInline}>20260303100000_schedule_daily_agenda.sql</code> já cria um job pg_cron que dispara às <b>9h UTC (6h BRT)</b>, de segunda a sexta. Para ativá-lo, execute:
              </p>
              <code style={{ ...codeBlock, display: 'block', fontSize: '11px', lineHeight: 1.7 }}>
                npx supabase db push --include-all
              </code>
              <p style={{ ...docText, marginTop: '8px' }}>Para verificar o job criado:</p>
              <code style={{ ...codeBlock, display: 'block', fontSize: '11px', lineHeight: 1.7 }}>
                SELECT * FROM cron.job WHERE jobname = 'send-daily-agenda-6am-brt';
              </code>
            </DocSection>

            <DocSection icon={<Send size={14} />} title="Testar agora">
              <p style={docText}>
                Use o botão <b>Testar agora</b> na tela para disparar manualmente a função e verificar se Telegram e Email estão configurados. O resultado aparece em um toast no canto da tela.
              </p>
              <p style={{ ...docText, color: '#4a4538', fontSize: '11px' }}>
                ⚠️ O teste usa a autenticação do usuário logado (não o internal secret). Para testar via terminal:
              </p>
              <code style={{ ...codeBlock, display: 'block', fontSize: '10px', lineHeight: 1.8 }}>
                {`curl -X POST "${FUNCTION_URL}" \\\n  -H "x-internal-secret: <seu_secret>"`}
              </code>
            </DocSection>

          </div>
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
}

// ─── Doc helpers ──────────────────────────────────────────────────────────────

const docText: React.CSSProperties = {
  fontSize: '13px',
  color: '#a09080',
  lineHeight: 1.6,
  margin: 0,
};

const codeInline: React.CSSProperties = {
  fontFamily: 'DM Mono, monospace',
  fontSize: '11px',
  background: '#1a1712',
  border: '1px solid #2a2620',
  borderRadius: '4px',
  padding: '1px 6px',
  color: '#d4a84b',
};

const codeBlock: React.CSSProperties = {
  fontFamily: 'DM Mono, monospace',
  fontSize: '11px',
  background: '#1a1712',
  border: '1px solid #2a2620',
  borderRadius: '8px',
  padding: '10px 12px',
  color: '#5eead4',
  lineHeight: 1.6,
};

function DocSection({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div style={{ borderLeft: '2px solid #2a2620', paddingLeft: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <span style={{ color: '#d4a84b' }}>{icon}</span>
        <h3 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '15px', fontWeight: 600, color: '#d8cfbe', margin: 0 }}>
          {title}
        </h3>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {children}
      </div>
    </div>
  );
}
