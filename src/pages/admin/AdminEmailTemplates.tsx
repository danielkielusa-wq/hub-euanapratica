import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Mail, Plus, Edit, Trash2, MoreVertical, Search, Eye, Send, HelpCircle, BookOpen, ChevronRight, Wrench, Copy, Info, Zap, Target, Code2, ArrowUpDown, ArrowUp, ArrowDown, X } from 'lucide-react';
import { PageHeader } from '@/components/admin/shared/PageHeader';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useAdminEmailTemplates, type EmailTemplate } from '@/hooks/useAdminEmailTemplates';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { EmailTemplateDialog } from '@/components/admin/email-templates/EmailTemplateDialog';
import { EmailTemplatePreviewDialog } from '@/components/admin/email-templates/EmailTemplatePreviewDialog';
import { SendTestEmailDialog } from '@/components/admin/email-templates/SendTestEmailDialog';

const CATEGORY_LABELS: Record<string, string> = {
  subscription: 'Assinatura',
  booking: 'Agendamento',
  espaco: 'Espaço',
  system: 'Sistema',
  live: 'Live',
  automation: 'Automação',
  campaign: 'Campanha',
};

const CATEGORY_COLORS: Record<string, string> = {
  subscription: 'bg-blue-100 text-blue-700',
  booking: 'bg-green-100 text-green-700',
  espaco: 'bg-purple-100 text-purple-700',
  system: 'bg-gray-100 text-gray-700',
  live: 'bg-orange-100 text-orange-700',
  automation: 'bg-cyan-100 text-cyan-700',
  campaign: 'bg-pink-100 text-pink-700',
};

type SortColumn = 'display_name' | 'category' | 'subject' | 'enabled' | 'updated_at';
type SortDirection = 'asc' | 'desc';
type StatusFilter = 'all' | 'active' | 'inactive';

interface TemplateDoc {
  descricao: string;
  disparo: string;
  objetivo: string;
  edgeFunction: string;
  dica?: string;
}

const TEMPLATE_DOCS: Record<string, TemplateDoc> = {
  // ── Sistema / Onboarding ──────────────────────────────
  onboarding_welcome: {
    descricao: 'Email de boas-vindas enviado ao novo usuário.',
    disparo: 'Automático — ao concluir o onboarding (useCompleteOnboarding).',
    objetivo: 'Dar boas-vindas, apresentar a plataforma e incentivar o primeiro uso.',
    edgeFunction: 'send-welcome-email',
    dica: 'Se o usuário não receber, verifique se o onboarding finalizou corretamente.',
  },

  // ── Assinatura ────────────────────────────────────────
  subscription_confirmation: {
    descricao: 'Confirmação de ativação de assinatura.',
    disparo: 'Automático — webhook Ticto (evento "activated").',
    objetivo: 'Confirmar que a assinatura está ativa e informar os benefícios do plano.',
    edgeFunction: 'ticto-webhook → send-subscription-email',
  },
  subscription_payment_failure: {
    descricao: 'Aviso de falha no pagamento (dunning).',
    disparo: 'Automático — webhook Ticto (evento "dunning_updated").',
    objetivo: 'Alertar o usuário sobre a falha e orientar a regularização do pagamento.',
    edgeFunction: 'ticto-webhook → send-subscription-email',
    dica: 'Template crítico — se desativado, o usuário não saberá que o pagamento falhou.',
  },
  subscription_cancellation: {
    descricao: 'Confirmação de cancelamento de assinatura.',
    disparo: 'Automático — webhook Ticto (evento "cancelled") ou cancelamento manual.',
    objetivo: 'Confirmar o cancelamento e tentar retenção com benefícios ou link de reativação.',
    edgeFunction: 'ticto-webhook / cancel-subscription → send-subscription-email',
  },
  subscription_payment_recovered: {
    descricao: 'Confirmação de pagamento recuperado após falha.',
    disparo: 'Automático — webhook Ticto (evento de recuperação de pagamento).',
    objetivo: 'Informar que o pagamento foi regularizado e o acesso está restaurado.',
    edgeFunction: 'ticto-webhook → send-subscription-email',
  },

  // ── Agendamento (Aluno) ───────────────────────────────
  booking_confirmation: {
    descricao: 'Confirmação de agendamento de sessão para o aluno.',
    disparo: 'Automático — ao criar um agendamento (useCreateBooking).',
    objetivo: 'Confirmar data, horário e link da reunião ao aluno.',
    edgeFunction: 'send-booking-confirmation',
    dica: 'Variáveis importantes: {{date}}, {{time}}, {{meetingLinkSection}}.',
  },
  booking_reminder: {
    descricao: 'Lembrete 24h antes da sessão para o aluno.',
    disparo: 'Automático — cron job a cada 15 min verifica sessões nas próximas 24h.',
    objetivo: 'Reduzir no-shows lembrando o aluno da sessão agendada.',
    edgeFunction: 'send-booking-reminder (cron)',
  },
  booking_reminder_1h: {
    descricao: 'Lembrete 1h antes da sessão para o aluno.',
    disparo: 'Automático — cron job a cada 15 min verifica sessões na próxima 1h.',
    objetivo: 'Último lembrete antes da sessão para maximizar comparecimento.',
    edgeFunction: 'send-booking-reminder (cron)',
  },
  booking_rescheduled: {
    descricao: 'Notificação de reagendamento de sessão para o aluno.',
    disparo: 'Automático — ao reagendar (useRescheduleBooking).',
    objetivo: 'Informar a nova data/horário e manter o link de reunião atualizado.',
    edgeFunction: 'send-booking-rescheduled',
    dica: 'Inclui {{oldDateSection}} com a data anterior para referência.',
  },
  booking_cancelled: {
    descricao: 'Confirmação de cancelamento de sessão para o aluno.',
    disparo: 'Automático — ao cancelar um agendamento (useCancelBooking).',
    objetivo: 'Confirmar o cancelamento e oferecer reagendamento.',
    edgeFunction: 'send-booking-cancelled',
  },

  // ── Agendamento (Mentor) ──────────────────────────────
  booking_confirmation_mentor: {
    descricao: 'Notificação ao mentor de que uma sessão foi agendada.',
    disparo: 'Automático — ao criar um agendamento (useCreateBooking).',
    objetivo: 'Informar o mentor sobre data, horário e dados do aluno.',
    edgeFunction: 'send-booking-confirmation',
  },
  booking_reminder_mentor: {
    descricao: 'Lembrete 24h antes da sessão para o mentor.',
    disparo: 'Automático — cron job a cada 15 min.',
    objetivo: 'Garantir que o mentor esteja preparado para a sessão.',
    edgeFunction: 'send-booking-reminder (cron)',
  },
  booking_rescheduled_mentor: {
    descricao: 'Notificação ao mentor de que a sessão foi reagendada.',
    disparo: 'Automático — ao reagendar (useRescheduleBooking).',
    objetivo: 'Manter o mentor atualizado com a nova data/horário.',
    edgeFunction: 'send-booking-rescheduled',
  },
  booking_cancelled_mentor: {
    descricao: 'Notificação ao mentor de que a sessão foi cancelada.',
    disparo: 'Automático — ao cancelar um agendamento (useCancelBooking).',
    objetivo: 'Liberar a agenda do mentor e informar o motivo.',
    edgeFunction: 'send-booking-cancelled',
  },
  booking_no_show_mentor: {
    descricao: 'Notificação ao mentor de não comparecimento do aluno.',
    disparo: 'Manual ou automático — quando registrado como no-show.',
    objetivo: 'Informar o mentor e registrar o evento para acompanhamento.',
    edgeFunction: 'send-booking-no-show',
  },

  // ── Espaço ────────────────────────────────────────────
  espaco_invitation: {
    descricao: 'Convite para participar do Espaço.',
    disparo: 'Manual — quando um admin convida um usuário para o Espaço.',
    objetivo: 'Enviar link de convite e explicar o que é o Espaço e seus benefícios.',
    edgeFunction: 'send-espaco-invitation',
  },

  // ── Lives ─────────────────────────────────────────────
  live_registration_confirmation: {
    descricao: 'Confirmação de inscrição em uma live.',
    disparo: 'Automático — ao se inscrever em uma live.',
    objetivo: 'Confirmar a inscrição e informar data/horário da live.',
    edgeFunction: 'send-live-email',
  },
  live_going_live: {
    descricao: 'Notificação de que a live está começando agora.',
    disparo: 'Automático — quando o mentor inicia a live.',
    objetivo: 'Chamar os inscritos para assistirem em tempo real.',
    edgeFunction: 'send-live-email',
    dica: 'Enviado para todos os inscritos — verifique o volume antes de ativar.',
  },
  live_unfinished_warning: {
    descricao: 'Aviso ao mentor de que a live ainda está ao vivo.',
    disparo: 'Automático — cron verifica lives abertas há muito tempo.',
    objetivo: 'Lembrar o mentor de encerrar a transmissão para evitar custos.',
    edgeFunction: 'send-live-email',
  },
  live_cancelled_participant: {
    descricao: 'Notificação ao participante de que a live foi cancelada.',
    disparo: 'Automático — quando o admin/mentor cancela a live.',
    objetivo: 'Informar o participante e sugerir próximas lives.',
    edgeFunction: 'send-live-email',
  },
  live_cancelled_mentor: {
    descricao: 'Confirmação ao mentor de que a live foi cancelada.',
    disparo: 'Automático — quando a live é cancelada.',
    objetivo: 'Confirmar o cancelamento e liberar a agenda do mentor.',
    edgeFunction: 'send-live-email',
  },
  live_expired_mentor: {
    descricao: 'Aviso ao mentor de que a live expirou sem ser iniciada.',
    disparo: 'Automático — quando a live passa do horário sem ser iniciada.',
    objetivo: 'Informar o mentor e sugerir reagendamento.',
    edgeFunction: 'send-live-email',
  },
  live_promotion: {
    descricao: 'Email de divulgação de uma live futura.',
    disparo: 'Manual — enviado pelo admin para divulgar a live.',
    objetivo: 'Atrair inscrições mostrando tema, data e mentor.',
    edgeFunction: 'send-live-email',
  },
  live_thankyou: {
    descricao: 'Agradecimento ao participante após a live.',
    disparo: 'Automático — após o encerramento da live.',
    objetivo: 'Agradecer a participação e compartilhar materiais/replay.',
    edgeFunction: 'send-live-email',
  },

  // ── Relatório / Lead ──────────────────────────────────
  report_ready: {
    descricao: 'Fallback por email quando o relatório de diagnóstico fica pronto.',
    disparo: 'Automático — N8N envia 24h após WhatsApp (fallback) ou via automação.',
    objetivo: 'Garantir que o lead receba o link do relatório mesmo sem WhatsApp.',
    edgeFunction: 'send-lead-email (via N8N)',
    dica: 'Usado como fallback — o canal primário é o WhatsApp.',
  },
  report_feedback_request: {
    descricao: 'Pedido de feedback sobre o relatório de diagnóstico.',
    disparo: 'Automático — N8N envia alguns dias após o relatório.',
    objetivo: 'Coletar feedback do lead e reengajar quem não abriu o relatório.',
    edgeFunction: 'send-lead-email (via N8N)',
  },

  // ── Automações / Carrinho ─────────────────────────────
  abandoned_cart_reminder: {
    descricao: 'Lembrete de carrinho abandonado.',
    disparo: 'Automático — quando o lead visita página de serviço sem completar.',
    objetivo: 'Recuperar a conversão lembrando o lead do serviço visitado.',
    edgeFunction: 'send-abandoned-cart-email',
  },

  // ── Campanha: Drip pós-diagnóstico ────────────────────
  drip_report_d0: {
    descricao: 'Dia 0 do drip — link direto para o relatório.',
    disparo: 'Automático — sistema de campanhas, logo após o relatório ficar pronto.',
    objetivo: 'Entregar o relatório por email como canal complementar.',
    edgeFunction: 'Campanhas (send-campaign-email)',
  },
  drip_report_d3: {
    descricao: 'Dia 3 do drip — 3 dicas baseadas no diagnóstico.',
    disparo: 'Automático — 3 dias após D0.',
    objetivo: 'Entregar valor educativo e apresentar a plataforma como solução.',
    edgeFunction: 'Campanhas (send-campaign-email)',
  },
  drip_report_d7: {
    descricao: 'Dia 7 do drip — lembrete do plano de ação.',
    disparo: 'Automático — 7 dias após D0.',
    objetivo: 'Resgatar leads inativos mostrando o plano de ação personalizado.',
    edgeFunction: 'Campanhas (send-campaign-email)',
  },
  drip_report_d14: {
    descricao: 'Dia 14 do drip — última chance / oferta.',
    disparo: 'Automático — 14 dias após D0.',
    objetivo: 'Conversão final com urgência e oferta de consultoria.',
    edgeFunction: 'Campanhas (send-campaign-email)',
    dica: 'Último email da sequência — se não converter aqui, cai em lead frio.',
  },

  // ── Campanha: Onboarding assinante ────────────────────
  onboarding_sub_d1: {
    descricao: 'Dia 1 — boas-vindas ao novo assinante.',
    disparo: 'Automático — 1 dia após ativação da assinatura.',
    objetivo: 'Guiar o primeiro uso: ResumePass, Title Translator, Prime Jobs.',
    edgeFunction: 'Campanhas (send-campaign-email)',
  },
  onboarding_sub_d3: {
    descricao: 'Dia 3 — incentivo ao uso do ResumePass AI.',
    disparo: 'Automático — 3 dias após ativação.',
    objetivo: 'Ativar o uso da feature mais popular e gerar hábito.',
    edgeFunction: 'Campanhas (send-campaign-email)',
  },
  onboarding_sub_d7: {
    descricao: 'Dia 7 — comunidade e mentoria.',
    disparo: 'Automático — 7 dias após ativação.',
    objetivo: 'Apresentar mentoria e comunidade para engajamento contínuo.',
    edgeFunction: 'Campanhas (send-campaign-email)',
  },

  // ── Campanha: Emails avulsos ──────────────────────────
  lead_hot_no_conversion: {
    descricao: 'Oferta para leads quentes que não converteram.',
    disparo: 'Automático — campanha segmentada por temperatura quente/muito-quente.',
    objetivo: 'Converter leads com alto potencial destacando seu perfil.',
    edgeFunction: 'Campanhas (send-campaign-email)',
  },
  upgrade_nudge_credits: {
    descricao: 'Nudge quando os créditos unificados acabam.',
    disparo: 'Automático — campanha detecta créditos esgotados.',
    objetivo: 'Incentivar upgrade de plano mostrando benefícios Pro/VIP.',
    edgeFunction: 'Campanhas (send-campaign-email)',
  },
  subscriber_inactive: {
    descricao: 'Reativação de assinante inativo.',
    disparo: 'Automático — campanha detecta inatividade prolongada.',
    objetivo: 'Reengajar mostrando novidades e lembrando dos créditos disponíveis.',
    edgeFunction: 'Campanhas (send-campaign-email)',
  },
  winback_30d: {
    descricao: 'Win-back 30 dias após cancelamento.',
    disparo: 'Automático — 30 dias após cancelamento da assinatura.',
    objetivo: 'Reconquistar ex-assinante com novidades e incentivo à reativação.',
    edgeFunction: 'Campanhas (send-campaign-email)',
  },
  lead_cold_reengagement: {
    descricao: 'Reengajamento de leads frios (30+ dias).',
    disparo: 'Automático — campanha segmentada por leads frios.',
    objetivo: 'Resgatar leads dormentes lembrando do relatório disponível.',
    edgeFunction: 'Campanhas (send-campaign-email)',
  },
  followup_post_booking: {
    descricao: 'Follow-up 24h após consultoria concluída.',
    disparo: 'Automático — 24h após sessão de consultoria.',
    objetivo: 'Capitalizar o momento pós-consultoria para converter em assinatura.',
    edgeFunction: 'Campanhas (send-campaign-email)',
  },
  usage_milestone: {
    descricao: 'Celebração de marcos de uso (5, 10, 25 usos).',
    disparo: 'Automático — campanha detecta milestone atingido.',
    objetivo: 'Reforçar engajamento celebrando progresso do usuário.',
    edgeFunction: 'Campanhas (send-campaign-email)',
  },

  // ── Mentoria em Grupo ──────────────────────────────────
  convite_espera_mentoria_grupo: {
    descricao: 'Convite para lista de espera de mentoria em grupo.',
    disparo: 'Manual — enviado pelo admin para leads selecionados.',
    objetivo: 'Captar interessados para a próxima turma de mentoria em grupo com prioridade e condição especial.',
    edgeFunction: 'Manual (send-lead-email ou envio direto)',
    dica: 'Variáveis: {{leadName}}, {{mentorName}}, {{groupTopic}}, {{nextCohortDate}}, {{waitlistLink}}',
  },
};

function TemplateInfoPopover({ templateName }: { templateName: string }) {
  const doc = TEMPLATE_DOCS[templateName];

  if (!doc) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button className="inline-flex items-center justify-center h-5 w-5 rounded-full hover:bg-muted transition-colors">
            <Info className="h-3.5 w-3.5 text-muted-foreground/50" />
          </button>
        </PopoverTrigger>
        <PopoverContent side="right" align="start" className="w-64 rounded-xl p-3">
          <p className="text-xs text-muted-foreground">
            Template personalizado — sem documentação automática. Use o campo "Descrição" ao editar para registrar o propósito deste template.
          </p>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="inline-flex items-center justify-center h-5 w-5 rounded-full hover:bg-muted transition-colors">
          <Info className="h-3.5 w-3.5 text-muted-foreground/60 hover:text-primary transition-colors" />
        </button>
      </PopoverTrigger>
      <PopoverContent side="right" align="start" className="w-80 rounded-xl p-0">
        <div className="p-3 space-y-2.5 text-xs">
          <div className="flex items-start gap-2">
            <HelpCircle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-blue-500" />
            <div>
              <p className="font-medium text-foreground mb-0.5">O que é</p>
              <p className="text-muted-foreground leading-relaxed">{doc.descricao}</p>
            </div>
          </div>
          <div className="border-t" />
          <div className="flex items-start gap-2">
            <Zap className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-500" />
            <div>
              <p className="font-medium text-foreground mb-0.5">Quando dispara</p>
              <p className="text-muted-foreground leading-relaxed">{doc.disparo}</p>
            </div>
          </div>
          <div className="border-t" />
          <div className="flex items-start gap-2">
            <Target className="h-3.5 w-3.5 mt-0.5 shrink-0 text-green-500" />
            <div>
              <p className="font-medium text-foreground mb-0.5">Objetivo</p>
              <p className="text-muted-foreground leading-relaxed">{doc.objetivo}</p>
            </div>
          </div>
          <div className="border-t" />
          <div className="flex items-start gap-2">
            <Code2 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-purple-500" />
            <div>
              <p className="font-medium text-foreground mb-0.5">Edge Function</p>
              <p className="text-muted-foreground font-mono text-[10px]">{doc.edgeFunction}</p>
            </div>
          </div>
          {doc.dica && (
            <>
              <div className="border-t" />
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-amber-800 leading-relaxed">
                <span className="font-medium">Dica:</span> {doc.dica}
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function AdminEmailTemplates() {
  const { templates, isLoading, toggleEnabled, deleteTemplate } = useAdminEmailTemplates();

  const [search, setSearch] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);
  const [testEmailTemplate, setTestEmailTemplate] = useState<EmailTemplate | null>(null);
  const [cloningTemplate, setCloningTemplate] = useState<EmailTemplate | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortColumn, setSortColumn] = useState<SortColumn>('display_name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [searchParams, setSearchParams] = useSearchParams();

  // Auto-open editor when navigated with ?edit=template_name
  useEffect(() => {
    const editName = searchParams.get('edit');
    if (editName && templates.length > 0 && !editingTemplate) {
      const match = templates.find(t => t.name === editName);
      if (match) {
        setEditingTemplate(match);
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, templates, editingTemplate, setSearchParams]);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const availableCategories = useMemo(() => {
    const cats = new Set(templates.map(t => t.category).filter(Boolean) as string[]);
    return Array.from(cats).sort();
  }, [templates]);

  const hasActiveFilters = !!categoryFilter || statusFilter !== 'all';

  const filteredTemplates = useMemo(() => {
    let result = templates;

    // Text search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(t =>
        t.display_name.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (categoryFilter) {
      result = result.filter(t => t.category === categoryFilter);
    }

    // Status filter
    if (statusFilter === 'active') {
      result = result.filter(t => t.enabled);
    } else if (statusFilter === 'inactive') {
      result = result.filter(t => !t.enabled);
    }

    // Sort
    result = [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortColumn) {
        case 'display_name':
          cmp = a.display_name.localeCompare(b.display_name, 'pt-BR');
          break;
        case 'category':
          cmp = (a.category || '').localeCompare(b.category || '', 'pt-BR');
          break;
        case 'subject':
          cmp = a.subject.localeCompare(b.subject, 'pt-BR');
          break;
        case 'enabled':
          cmp = (a.enabled === b.enabled) ? 0 : a.enabled ? -1 : 1;
          break;
        case 'updated_at':
          cmp = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
          break;
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [templates, search, categoryFilter, statusFilter, sortColumn, sortDirection]);

  const handleDelete = async () => {
    if (!deletingTemplateId) return;
    await deleteTemplate(deletingTemplateId);
    setDeletingTemplateId(null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader title="Templates de Email" subtitle="Gerencie os templates de email do sistema" icon={Mail}>
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
                    Documentação — Templates de Email
                  </SheetTitle>
                  <SheetDescription>Variáveis, templates do sistema e troubleshooting</SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-6 text-sm">
                  <section className="space-y-2">
                    <h3 className="font-semibold text-base flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">1</span>
                      Propósito
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Gerencia os templates HTML enviados pelo sistema via Resend. Cada template é editado no editor visual Unlayer. As variáveis <code className="bg-muted px-1 rounded text-xs">{'{{nome}}'}</code> são substituídas pela Edge Function antes do envio.
                    </p>
                  </section>
                  <div className="border-t" />
                  <section className="space-y-3">
                    <h3 className="font-semibold text-base flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">2</span>
                      Como usar
                    </h3>
                    <ul className="space-y-2 text-muted-foreground">
                      {[
                        { item: "Novo Template", detail: "Abre o editor Unlayer para criar um template do zero." },
                        { item: "Editar (⋮ → Editar)", detail: "Reabre o editor visual com o design salvo. Alterações são salvas ao clicar em Salvar." },
                        { item: "Visualizar (⋮ → Visualizar)", detail: "Exibe o HTML renderizado com variáveis de exemplo preenchidas." },
                        { item: "Enviar Teste (⋮ → Enviar Teste)", detail: "Envia um email real para o endereço informado. O assunto é prefixado com [TESTE]." },
                        { item: "Toggle de Status", detail: "Desabilita o template sem excluí-lo. Templates desabilitados não são enviados pelo sistema." },
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
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">3</span>
                      Templates do sistema (12 seeds)
                    </h3>
                    <div className="rounded-lg border overflow-hidden">
                      <table className="w-full text-xs">
                        <thead><tr className="bg-muted/50"><th className="text-left px-3 py-2 font-medium">Nome (slug)</th><th className="text-left px-3 py-2 font-medium">Acionado por</th></tr></thead>
                        <tbody className="divide-y">
                          {[
                            ["onboarding_welcome", "Conclusão do onboarding (Onboarding.tsx → send-welcome-email)"],
                            ["subscription_activated", "Assinatura ativada via Ticto webhook"],
                            ["subscription_cancelled", "Assinatura cancelada"],
                            ["subscription_*", "Outros eventos de assinatura"],
                            ["booking_confirmation", "Confirmação de agendamento"],
                            ["booking_reminder / reminder_1h", "Lembretes 24h e 1h antes"],
                            ["booking_rescheduled", "Reagendamento de sessão"],
                            ["booking_cancelled / no_show", "Cancelamento ou não comparecimento"],
                            ["espaco_invitation", "Convite para o Espaço"],
                          ].map(([n, d], i) => (
                            <tr key={i}><td className="px-3 py-2 font-mono text-[10px] text-foreground">{n}</td><td className="px-3 py-2 text-muted-foreground">{d}</td></tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                  <div className="border-t" />
                  <section className="space-y-2">
                    <h3 className="font-semibold text-base flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">4</span>
                      Variáveis
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Sintaxe: <code className="bg-muted px-1 rounded text-xs">{'{{nomeVariavel}}'}</code>. As variáveis são substituídas por regex na Edge Function antes do envio. Declare as variáveis usadas no campo "Variáveis" ao criar/editar o template — isso serve como documentação para quem editar a Edge Function.
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Blocos condicionais HTML (ex: seção de link de reunião) devem ser pré-renderizados na Edge Function e passados como variável (ex: <code className="bg-muted px-1 rounded">{'{{meetingLinkSection}}'}</code>).
                    </p>
                  </section>
                  <div className="border-t" />
                  <section className="space-y-3">
                    <h3 className="font-semibold text-base flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-primary" />
                      Troubleshooting
                    </h3>
                    <div className="space-y-3">
                      {[
                        { p: "Email não enviado pelo sistema", c: "Template desabilitado ou nome (slug) incorreto na Edge Function.", f: "Ative o toggle e confirme que o slug no código corresponde ao campo \"name\" do template." },
                        { p: "Variável não substituída (aparece {{nome}} no email)", c: "A Edge Function não está passando a variável correta.", f: "Verifique o código da Edge Function — o objeto variables deve incluir a chave correspondente." },
                        { p: "Email com layout quebrado", c: "HTML inválido gerado pelo editor ou variável com conteúdo que quebra a estrutura.", f: "Use \"Visualizar\" para inspecionar o HTML. Escapeie caracteres especiais nas variáveis." },
                        { p: "Erro 500 ao enviar (Edge Function)", c: "Falha no Resend (chave inválida, template malformado) ou erro interno.", f: "Verifique os logs em Supabase → Edge Functions → send-[nome] → Logs. Use \"Enviar Teste\" para isolar o problema." },
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
            <Button
              className="rounded-[12px] gap-2"
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="w-4 h-4" />
              Novo Template
            </Button>
          </div>
        </PageHeader>

        {/* Search + Filters */}
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar templates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 rounded-xl"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status filter */}
            <div className="flex items-center rounded-lg border p-0.5 gap-0.5">
              {([['all', 'Todos'], ['active', 'Ativos'], ['inactive', 'Inativos']] as const).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setStatusFilter(value)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    statusFilter === value
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="w-px h-6 bg-border" />

            {/* Category filter */}
            {availableCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(prev => prev === cat ? null : cat)}
                className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md border transition-colors ${
                  categoryFilter === cat
                    ? `${CATEGORY_COLORS[cat] || 'bg-primary/10 text-primary'} border-current/20`
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted border-transparent'
                }`}
              >
                {CATEGORY_LABELS[cat] || cat}
              </button>
            ))}

            {hasActiveFilters && (
              <>
                <div className="w-px h-6 bg-border" />
                <button
                  onClick={() => { setCategoryFilter(null); setStatusFilter('all'); }}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-3 h-3" />
                  Limpar filtros
                </button>
              </>
            )}

            <span className="ml-auto text-xs text-muted-foreground">
              {filteredTemplates.length} de {templates.length} templates
            </span>
          </div>
        </div>

        {/* Templates Table */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : filteredTemplates.length === 0 ? (
          <Card className="rounded-[24px] border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Mail className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {search || hasActiveFilters ? 'Nenhum template encontrado' : 'Nenhum template criado'}
              </h3>
              <p className="text-sm text-muted-foreground text-center mb-4">
                {search || hasActiveFilters
                  ? 'Tente ajustar seus filtros ou busca'
                  : 'Crie seu primeiro template de email'
                }
              </p>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={() => { setCategoryFilter(null); setStatusFilter('all'); setSearch(''); }}
                  className="rounded-xl gap-2"
                >
                  <X className="w-4 h-4" />
                  Limpar filtros
                </Button>
              )}
              {!search && !hasActiveFilters && (
                <Button onClick={() => setShowCreateDialog(true)} className="rounded-xl">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Template
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="rounded-[24px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <button onClick={() => handleSort('display_name')} className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
                      Template
                      {sortColumn === 'display_name' ? (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button onClick={() => handleSort('category')} className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
                      Categoria
                      {sortColumn === 'category' ? (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button onClick={() => handleSort('subject')} className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
                      Assunto
                      {sortColumn === 'subject' ? (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                    </button>
                  </TableHead>
                  <TableHead>Variáveis</TableHead>
                  <TableHead>
                    <button onClick={() => handleSort('enabled')} className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
                      Status
                      {sortColumn === 'enabled' ? (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button onClick={() => handleSort('updated_at')} className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
                      Atualizado
                      {sortColumn === 'updated_at' ? (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                    </button>
                  </TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTemplates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <p className="font-medium">{template.display_name}</p>
                          <TemplateInfoPopover templateName={template.name} />
                        </div>
                        <p className="text-xs text-muted-foreground font-mono">
                          {template.name}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {template.category && (
                        <Badge
                          variant="secondary"
                          className={CATEGORY_COLORS[template.category] || ''}
                        >
                          {CATEGORY_LABELS[template.category] || template.category}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="truncate text-sm">{template.subject}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {template.variables?.slice(0, 3).map((v, i) => (
                          <Badge key={i} variant="outline" className="text-xs font-mono">
                            {typeof v === 'string' ? v : (v as any)?.key || (v as any)?.label || JSON.stringify(v)}
                          </Badge>
                        ))}
                        {template.variables && template.variables.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{template.variables.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={template.enabled}
                        onCheckedChange={(checked) => toggleEnabled(template.id, checked)}
                      />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(template.updated_at), 'dd/MM/yy', { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem
                            onClick={() => setPreviewTemplate(template)}
                            className="gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            Visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setTestEmailTemplate(template)}
                            className="gap-2"
                          >
                            <Send className="w-4 h-4" />
                            Enviar Teste
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setEditingTemplate(template)}
                            className="gap-2"
                          >
                            <Edit className="w-4 h-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setCloningTemplate(template)}
                            className="gap-2"
                          >
                            <Copy className="w-4 h-4" />
                            Clonar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeletingTemplateId(template.id)}
                            className="gap-2 text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

        {/* Dialogs */}
        <EmailTemplateDialog
          open={showCreateDialog || !!editingTemplate || !!cloningTemplate}
          onOpenChange={(open) => {
            if (!open) {
              setShowCreateDialog(false);
              setEditingTemplate(null);
              setCloningTemplate(null);
            }
          }}
          template={editingTemplate || cloningTemplate}
          isClone={!!cloningTemplate}
        />

        <EmailTemplatePreviewDialog
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
          onSendTest={(t) => {
            setPreviewTemplate(null);
            setTestEmailTemplate(t);
          }}
        />

        <SendTestEmailDialog
          template={testEmailTemplate}
          onClose={() => setTestEmailTemplate(null)}
        />

        {/* Delete Confirmation */}
        <AlertDialog open={!!deletingTemplateId} onOpenChange={() => setDeletingTemplateId(null)}>
          <AlertDialogContent className="rounded-[24px]">
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja remover este template? Esta ação não pode ser desfeita.
                Emails que dependem deste template deixarão de funcionar.
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
    </DashboardLayout>
  );
}
