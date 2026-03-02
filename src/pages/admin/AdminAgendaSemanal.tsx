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

const ROLE_CONFIG: Record<Role, { label: string; color: string; bg: string; border: string }> = {
  fundador: {
    label: 'Fundador',
    color: '#d4a84b',
    bg: 'rgba(212,168,75,0.10)',
    border: 'rgba(212,168,75,0.28)',
  },
  crm: {
    label: 'Assistente CRM',
    color: '#5eead4',
    bg: 'rgba(94,234,212,0.08)',
    border: 'rgba(94,234,212,0.22)',
  },
  creator: {
    label: 'Creator',
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
      style={{
        background: isCompleted ? 'rgba(255,255,255,0.02)' : cfg.bg,
        border: `1px solid ${isCompleted ? '#222018' : cfg.border}`,
        borderRadius: '10px',
        padding: '9px 10px',
        cursor: 'pointer',
        opacity: isCompleted ? 0.45 : 1,
        transition: 'opacity 0.2s ease, transform 0.15s ease, box-shadow 0.15s ease',
      }}
      onMouseEnter={e => {
        if (!isCompleted) {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = `0 4px 16px ${cfg.color}18`;
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
        {/* Checkbox */}
        <button
          onClick={e => { e.stopPropagation(); onToggle(); }}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            flexShrink: 0,
            marginTop: '1px',
          }}
        >
          {isCompleted ? (
            <div style={{
              width: '15px', height: '15px', borderRadius: '4px',
              background: cfg.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                <path d="M1 3.5L3.2 5.8L8 1" stroke="#0f0d0a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          ) : (
            <div style={{
              width: '15px', height: '15px', borderRadius: '4px',
              border: `1.5px solid ${cfg.border}`,
              background: 'transparent', flexShrink: 0,
              transition: 'border-color 0.15s ease',
            }} />
          )}
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Role pill */}
          <span style={{
            fontFamily: 'DM Mono, monospace',
            fontSize: '8px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: cfg.color,
            opacity: 0.75,
            display: 'block',
            marginBottom: '2px',
          }}>
            {cfg.label}
          </span>

          {/* Title */}
          <div style={{
            fontFamily: 'Playfair Display, Georgia, serif',
            fontSize: '11.5px',
            fontWeight: 600,
            lineHeight: 1.35,
            color: isCompleted ? '#4a4538' : '#d8cfbe',
            textDecoration: isCompleted ? 'line-through' : 'none',
          }}>
            {task.title}
          </div>

          {/* Description */}
          {!isCompleted && (
            <div style={{
              fontSize: '10px',
              color: '#5a5348',
              lineHeight: 1.45,
              marginTop: '3px',
              fontFamily: 'DM Sans, sans-serif',
            }}>
              {task.description}
            </div>
          )}

          {/* Action */}
          {task.action && !isCompleted && (
            <Link
              to={task.action.href}
              onClick={e => e.stopPropagation()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                marginTop: '5px',
                fontSize: '9px',
                fontFamily: 'DM Mono, monospace',
                letterSpacing: '0.04em',
                color: cfg.color,
                textDecoration: 'none',
                opacity: 0.7,
                transition: 'opacity 0.15s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '1'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '0.7'; }}
            >
              {task.action.label}
              <ExternalLink size={8} />
            </Link>
          )}
        </div>
      </div>
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
  const doneCount = tasks.filter(t => completed[t.id]).length;
  const total = tasks.length;
  const allDone = total > 0 && doneCount === total;

  return (
    <div style={{
      background: isToday ? '#1c1910' : '#121009',
      border: `1px solid ${isToday ? 'rgba(212,168,75,0.35)' : '#1d1b15'}`,
      borderRadius: '16px',
      overflow: 'hidden',
      minWidth: '195px',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: '13px 13px 10px',
        borderBottom: `1px solid ${isToday ? '#2a2518' : '#1d1b15'}`,
        background: isToday ? 'rgba(212,168,75,0.04)' : 'transparent',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{
              fontFamily: 'DM Mono, monospace',
              fontSize: '9.5px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: isToday ? '#d4a84b' : '#4a4538',
              marginBottom: '2px',
            }}>
              {DAYS_SHORT[dayIndex]}
            </div>
            <div style={{
              fontFamily: 'Playfair Display, Georgia, serif',
              fontSize: '22px',
              fontWeight: 700,
              lineHeight: 1,
              color: isToday ? '#f0e6d3' : '#6a6050',
            }}>
              {date.getDate()}
            </div>
          </div>
          {total > 0 && (
            <div style={{
              fontFamily: 'DM Mono, monospace',
              fontSize: '10px',
              color: allDone ? '#5eead4' : '#3a3528',
              paddingTop: '2px',
            }}>
              {doneCount}/{total}
              {allDone && ' ✓'}
            </div>
          )}
        </div>

        {/* Day progress bar */}
        {total > 0 && (
          <div style={{
            height: '2px',
            background: '#222018',
            borderRadius: '1px',
            overflow: 'hidden',
            marginTop: '10px',
          }}>
            <div style={{
              width: `${(doneCount / total) * 100}%`,
              height: '100%',
              background: isToday
                ? 'linear-gradient(90deg, #d4a84b, #f0c570)'
                : '#3a3528',
              borderRadius: '1px',
              transition: 'width 0.4s cubic-bezier(0.4,0,0.2,1)',
            }} />
          </div>
        )}
      </div>

      {/* Task area */}
      <div style={{ padding: '10px', flex: 1 }}>
        {total === 0 && (
          <div style={{
            fontFamily: 'DM Mono, monospace',
            fontSize: '10px',
            color: '#2a2820',
            textAlign: 'center',
            paddingTop: '12px',
          }}>
            —
          </div>
        )}

        {/* Morning */}
        {morning.length > 0 && (
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              marginBottom: '7px',
            }}>
              <Sun size={9} style={{ color: '#d4a84b', opacity: 0.6 }} />
              <span style={{
                fontFamily: 'DM Mono, monospace',
                fontSize: '8.5px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#4a4538',
              }}>
                Manhã
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {morning.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  isCompleted={!!completed[task.id]}
                  onToggle={() => onToggle(task.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Divider */}
        {morning.length > 0 && evening.length > 0 && (
          <div style={{ height: '1px', background: '#1d1b15', margin: '10px 0' }} />
        )}

        {/* Evening */}
        {evening.length > 0 && (
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              marginBottom: '7px',
            }}>
              <Moon size={9} style={{ color: '#8b7ff0', opacity: 0.6 }} />
              <span style={{
                fontFamily: 'DM Mono, monospace',
                fontSize: '8.5px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#4a4538',
              }}>
                Final do dia
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {evening.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  isCompleted={!!completed[task.id]}
                  onToggle={() => onToggle(task.id)}
                />
              ))}
            </div>
          </div>
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
          // Internal secret fallback handled server-side via pg_cron; frontend test uses auth token
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

      <div
        style={{
          minHeight: '100vh',
          background: '#0f0d0a',
          paddingBottom: '64px',
          fontFamily: 'DM Sans, sans-serif',
        }}
      >
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 20px 0' }}>

          {/* ── Header ──────────────────────────────────────────────────── */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
              {/* Title */}
              <div>
                <div style={{
                  fontFamily: 'DM Mono, monospace',
                  fontSize: '10px',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: '#5a5045',
                  marginBottom: '6px',
                }}>
                  Planejamento
                </div>
                <h1 style={{
                  fontFamily: 'Playfair Display, Georgia, serif',
                  fontSize: '30px',
                  fontWeight: 700,
                  color: '#f0e6d3',
                  margin: 0,
                  lineHeight: 1.1,
                }}>
                  Agenda Semanal
                </h1>
                <p style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '13px',
                  color: '#5a5045',
                  margin: '6px 0 0',
                }}>
                  Rituais diários para cada papel do negócio
                </p>
              </div>

              {/* Progress card */}
              <div style={{
                background: '#1a1712',
                border: '1px solid #2a2620',
                borderRadius: '16px',
                padding: '16px 20px',
                minWidth: '220px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{
                    fontFamily: 'DM Mono, monospace',
                    fontSize: '10px',
                    color: '#5a5045',
                    letterSpacing: '0.04em',
                  }}>
                    Progresso da semana
                  </span>
                  <span style={{
                    fontFamily: 'DM Mono, monospace',
                    fontSize: '16px',
                    fontWeight: 500,
                    color: completionPct === 100 ? '#5eead4' : '#d4a84b',
                  }}>
                    {completionPct}%
                  </span>
                </div>
                <div style={{ height: '4px', background: '#2a2620', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${completionPct}%`,
                    height: '100%',
                    background: completionPct === 100
                      ? 'linear-gradient(90deg, #5eead4, #99f6e4)'
                      : 'linear-gradient(90deg, #d4a84b, #f0c96a)',
                    borderRadius: '2px',
                    transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
                  }} />
                </div>
                <div style={{
                  fontFamily: 'DM Mono, monospace',
                  fontSize: '10px',
                  color: '#3a3528',
                  marginTop: '6px',
                }}>
                  {completedCount} de {totalTasks} tarefas concluídas
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignSelf: 'stretch', justifyContent: 'center' }}>
                <button
                  onClick={() => setDocsOpen(true)}
                  style={{
                    background: '#1a1712',
                    border: '1px solid #2a2620',
                    borderRadius: '10px',
                    padding: '9px 16px',
                    color: '#d8cfbe',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                    fontFamily: 'DM Mono, monospace',
                    fontSize: '11px',
                    letterSpacing: '0.03em',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#d4a84b'; e.currentTarget.style.color = '#d4a84b'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2620'; e.currentTarget.style.color = '#d8cfbe'; }}
                >
                  <BookOpen size={13} />
                  Documentação
                </button>
                <button
                  onClick={sendTestNow}
                  disabled={isTesting}
                  style={{
                    background: isTesting ? '#1a1712' : 'rgba(212,168,75,0.12)',
                    border: '1px solid rgba(212,168,75,0.3)',
                    borderRadius: '10px',
                    padding: '9px 16px',
                    color: isTesting ? '#5a5045' : '#d4a84b',
                    cursor: isTesting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                    fontFamily: 'DM Mono, monospace',
                    fontSize: '11px',
                    letterSpacing: '0.03em',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {isTesting ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={13} />}
                  {isTesting ? 'Enviando...' : 'Testar agora'}
                </button>
              </div>
            </div>

            {/* Week nav */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
              {/* Prev */}
              <NavButton onClick={() => navigateWeek(-1)}>
                <ChevronLeft size={15} />
              </NavButton>

              {/* Week label */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalendarDays size={13} style={{ color: '#d4a84b' }} />
                <span style={{
                  fontFamily: 'DM Mono, monospace',
                  fontSize: '12px',
                  color: '#d8cfbe',
                  letterSpacing: '0.02em',
                }}>
                  {getWeekRange(weekDates)}
                </span>
                {isCurrentWeek && (
                  <span style={{
                    fontFamily: 'DM Mono, monospace',
                    fontSize: '9px',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    padding: '3px 8px',
                    borderRadius: '100px',
                    background: 'rgba(212,168,75,0.12)',
                    color: '#d4a84b',
                    border: '1px solid rgba(212,168,75,0.28)',
                  }}>
                    Esta semana
                  </span>
                )}
              </div>

              {/* Next */}
              <NavButton onClick={() => navigateWeek(1)}>
                <ChevronRight size={15} />
              </NavButton>

              {/* Reset */}
              <button
                onClick={resetWeek}
                title="Limpar progresso desta semana"
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '6px 10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontFamily: 'DM Mono, monospace',
                  fontSize: '10px',
                  color: '#3a3528',
                  borderRadius: '8px',
                  transition: 'color 0.15s ease',
                  letterSpacing: '0.03em',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#3a3528'; }}
              >
                <RotateCcw size={11} />
                Resetar semana
              </button>
            </div>

            {/* Role filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '14px', flexWrap: 'wrap' }}>
              {(['all', 'fundador', 'crm', 'creator'] as const).map(r => {
                const isActive = roleFilter === r;
                const cfg = r !== 'all' ? ROLE_CONFIG[r] : null;
                return (
                  <button
                    key={r}
                    onClick={() => setRoleFilter(r)}
                    style={{
                      padding: '5px 13px',
                      borderRadius: '100px',
                      border: `1px solid ${isActive ? (cfg?.color ?? '#d4a84b') : '#2a2620'}`,
                      background: isActive ? (cfg?.bg ?? 'rgba(212,168,75,0.10)') : 'transparent',
                      color: isActive ? (cfg?.color ?? '#d4a84b') : '#4a4538',
                      fontFamily: 'DM Mono, monospace',
                      fontSize: '10.5px',
                      fontWeight: 500,
                      letterSpacing: '0.04em',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {r === 'all' ? 'Todos os papéis' : cfg!.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Week Grid ────────────────────────────────────────────────── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '10px',
            overflowX: 'auto',
          }}>
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

          {/* ── Legend ───────────────────────────────────────────────────── */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            marginTop: '24px',
            flexWrap: 'wrap',
          }}>
            {(Object.entries(ROLE_CONFIG) as [Role, typeof ROLE_CONFIG[Role]][]).map(([role, cfg]) => (
              <div key={role} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <div style={{
                  width: '7px', height: '7px',
                  borderRadius: '50%',
                  background: cfg.color,
                  flexShrink: 0,
                }} />
                <span style={{
                  fontFamily: 'DM Mono, monospace',
                  fontSize: '10px',
                  color: '#4a4538',
                  letterSpacing: '0.03em',
                }}>
                  {cfg.label}
                </span>
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <Sun size={9} style={{ color: '#d4a84b', opacity: 0.7 }} />
              <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: '#3a3528' }}>Manhã</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <Moon size={9} style={{ color: '#8b7ff0', opacity: 0.7 }} />
              <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: '#3a3528' }}>Final do dia</span>
            </div>
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

            {/* Section: What is it */}
            <DocSection icon={<CalendarDays size={14} />} title="O que é a Agenda Semanal">
              <p style={docText}>
                Um planner de rituais semanais dividido por <b style={{ color: '#d4a84b' }}>papel</b>: Fundador, Assistente CRM e Creator. Cada dia tem tarefas de <b>manhã</b> e <b>final do dia</b> com links diretos para as telas relevantes da plataforma.
              </p>
              <p style={docText}>
                O progresso é salvo no <b>navegador</b> (localStorage) por semana — toda segunda-feira começa do zero. Use os filtros de papel para focar no que importa para o seu momento.
              </p>
            </DocSection>

            {/* Section: Notifications */}
            <DocSection icon={<Zap size={14} />} title="Notificações Diárias às 6h BRT">
              <p style={docText}>
                Todo dia de semana às <b style={{ color: '#d4a84b' }}>6h da manhã</b> (horário de Brasília), a plataforma pode enviar automaticamente a agenda do dia via <b>Telegram</b> e <b>Email</b>.
              </p>
              <p style={docText}>
                O disparo usa a Edge Function <code style={codeInline}>send-daily-agenda</code>. Você pode ativá-la via <b>N8N</b> ou via <b>pg_cron</b> (já configurado na migração).
              </p>
            </DocSection>

            {/* Section: Telegram */}
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

            {/* Section: Email */}
            <DocSection icon={<Mail size={14} />} title="Configurar Email">
              <p style={docText}>O email é enviado via Resend usando a API key já configurada em <b>Configurações → APIs Externas</b>. Apenas adicione o segredo abaixo no Supabase:</p>
              <code style={{ ...codeBlock, display: 'block' }}>ADMIN_NOTIFICATION_EMAIL = seu@email.com</code>
              <p style={{ ...docText, marginTop: '8px' }}>Vá em <b>Supabase Dashboard → Edge Functions → Secrets</b> e adicione essa variável.</p>
            </DocSection>

            {/* Section: Webhook URL */}
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

            {/* Section: N8N Setup */}
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

            {/* Section: pg_cron alternative */}
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

            {/* Section: Test */}
            <DocSection icon={<Send size={14} />} title="Testar agora">
              <p style={docText}>
                Use o botão <b>Testar agora</b> na tela para disparar manualmente a função e verificar se Telegram e Email estão configurados. O resultado aparece em um toast no canto da tela.
              </p>
              <p style={{ ...docText, color: '#4a4538', fontSize: '11px' }}>
                ⚠️ O teste usa a autenticação do usuário logado (não o internal secret). Para testar via terminal:
              </p>
              <code style={{ ...codeBlock, display: 'block', fontSize: '10px', lineHeight: 1.8 }}>
                {`curl -X POST "${FUNCTION_URL}" \\
  -H "x-internal-secret: <seu_secret>"`}
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

// ─── Tiny NavButton helper ────────────────────────────────────────────────────

function NavButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: '#1a1712',
        border: '1px solid #2a2620',
        borderRadius: '9px',
        padding: '7px',
        color: '#5a5045',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = '#d4a84b';
        e.currentTarget.style.color = '#d4a84b';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = '#2a2620';
        e.currentTarget.style.color = '#5a5045';
      }}
    >
      {children}
    </button>
  );
}
