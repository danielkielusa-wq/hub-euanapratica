import { useState } from 'react';
import {
  Loader2, Mail, Plus, RefreshCw, Pause, Play, XCircle,
  Eye, Settings2, Users, Zap, Ban, BarChart3,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { PageHeader } from '@/components/admin/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  useCampaigns,
  useActiveCampaignRefresh,
  usePauseCampaign,
  useResumeCampaign,
  useCancelCampaign,
  useDeleteCampaign,
  useCampaignStats,
  useEmailAutomations,
  useToggleEmailAutomation,
  type EmailCampaign,
  type EmailAutomation,
} from '@/hooks/useAdminEmailCampaigns';
import { CampaignWizardDialog } from '@/components/admin/email-campaigns/CampaignWizardDialog';
import { CampaignContactsSheet } from '@/components/admin/email-campaigns/CampaignContactsSheet';
import { AutomationConfigDialog } from '@/components/admin/email-campaigns/AutomationConfigDialog';
import { AutomationEnrollmentsSheet } from '@/components/admin/email-campaigns/AutomationEnrollmentsSheet';
import { UnsubscribesSheet } from '@/components/admin/email-campaigns/UnsubscribesSheet';
import { TestAutomationDialog } from '@/components/admin/email-campaigns/TestAutomationDialog';

// ── Status labels/colors ───────────────────────────────────────────

const CAMPAIGN_STATUS: Record<string, { label: string; color: string }> = {
  draft: { label: 'Rascunho', color: 'bg-gray-50 text-gray-700 border-gray-200' },
  scheduled: { label: 'Agendada', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  queued: { label: 'Na fila', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  processing: { label: 'Enviando', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  completed: { label: 'Concluida', color: 'bg-green-50 text-green-700 border-green-200' },
  paused: { label: 'Pausada', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  cancelled: { label: 'Cancelada', color: 'bg-red-50 text-red-700 border-red-200' },
};

const TRIGGER_LABELS: Record<string, string> = {
  event: 'Evento',
  cron: 'Cron',
  inline: 'Inline',
};

const TRIGGER_COLORS: Record<string, string> = {
  event: 'bg-blue-50 text-blue-700 border-blue-200',
  cron: 'bg-purple-50 text-purple-700 border-purple-200',
  inline: 'bg-amber-50 text-amber-700 border-amber-200',
};

// ── Main Page ──────────────────────────────────────────────────────

export default function AdminEmailCampaigns() {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [contactsCampaign, setContactsCampaign] = useState<EmailCampaign | null>(null);
  const [configAutomation, setConfigAutomation] = useState<EmailAutomation | null>(null);
  const [enrollmentsAutomation, setEnrollmentsAutomation] = useState<EmailAutomation | null>(null);
  const [unsubscribesOpen, setUnsubscribesOpen] = useState(false);
  const [testAutomation, setTestAutomation] = useState<EmailAutomation | null>(null);

  const { data: campaigns = [], isLoading: campaignsLoading, refetch: refetchCampaigns } = useCampaigns();
  const { data: stats } = useCampaignStats();
  const { data: automations = [], isLoading: automationsLoading, refetch: refetchAutomations } = useEmailAutomations();

  const pauseCampaign = usePauseCampaign();
  const resumeCampaign = useResumeCampaign();
  const cancelCampaign = useCancelCampaign();
  const deleteCampaign = useDeleteCampaign();
  const toggleAutomation = useToggleEmailAutomation();

  useActiveCampaignRefresh();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Campanhas de Email"
          subtitle="Campanhas manuais e automacoes de email marketing"
          icon={Mail}
        >
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setUnsubscribesOpen(true)}>
              <Ban className="h-4 w-4 mr-1" /> Opt-outs
            </Button>
            <Button size="sm" onClick={() => setWizardOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Nova Campanha
            </Button>
          </div>
        </PageHeader>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard label="Total Campanhas" value={stats.total} />
            <StatCard label="Ativas" value={stats.active} />
            <StatCard label="Emails Enviados" value={stats.totalSent} />
            <StatCard label="Taxa de Abertura" value={`${stats.openRate.toFixed(1)}%`} />
            <StatCard label="Taxa de Clique" value={`${stats.clickRate.toFixed(1)}%`} />
          </div>
        )}

        <Tabs defaultValue="campaigns">
          <TabsList>
            <TabsTrigger value="campaigns">Campanhas ({campaigns.length})</TabsTrigger>
            <TabsTrigger value="automations">Automacoes ({automations.length})</TabsTrigger>
          </TabsList>

          {/* ── TAB: CAMPANHAS ── */}
          <TabsContent value="campaigns" className="space-y-4 mt-4">
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => refetchCampaigns()}>
                <RefreshCw className="h-4 w-4 mr-1" /> Atualizar
              </Button>
            </div>

            {campaignsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : campaigns.length === 0 ? (
              <Card className="rounded-[24px]">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Mail className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-1">Nenhuma campanha ainda</p>
                  <p className="text-sm text-muted-foreground mb-4">Crie sua primeira campanha de email</p>
                  <Button onClick={() => setWizardOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" /> Nova Campanha
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {campaigns.map((campaign) => (
                  <CampaignCard
                    key={campaign.id}
                    campaign={campaign}
                    onViewContacts={() => setContactsCampaign(campaign)}
                    onPause={() => pauseCampaign.mutate(campaign.id)}
                    onResume={() => resumeCampaign.mutate(campaign.id)}
                    onCancel={() => cancelCampaign.mutate(campaign.id)}
                    onDelete={() => deleteCampaign.mutate(campaign.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── TAB: AUTOMACOES ── */}
          <TabsContent value="automations" className="space-y-4 mt-4">
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => refetchAutomations()}>
                <RefreshCw className="h-4 w-4 mr-1" /> Atualizar
              </Button>
            </div>

            {automationsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {automations.map((automation) => (
                  <AutomationCard
                    key={automation.id}
                    automation={automation}
                    onToggle={(enabled) => toggleAutomation.mutate({ id: automation.id, enabled })}
                    onConfigure={() => setConfigAutomation(automation)}
                    onViewEnrollments={() => setEnrollmentsAutomation(automation)}
                    onTest={() => setTestAutomation(automation)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs & Sheets */}
      <CampaignWizardDialog open={wizardOpen} onOpenChange={setWizardOpen} />
      <CampaignContactsSheet
        campaign={contactsCampaign}
        open={!!contactsCampaign}
        onOpenChange={(open) => !open && setContactsCampaign(null)}
      />
      <AutomationConfigDialog
        automation={configAutomation}
        open={!!configAutomation}
        onOpenChange={(open) => !open && setConfigAutomation(null)}
      />
      <AutomationEnrollmentsSheet
        automation={enrollmentsAutomation}
        open={!!enrollmentsAutomation}
        onOpenChange={(open) => !open && setEnrollmentsAutomation(null)}
      />
      <UnsubscribesSheet open={unsubscribesOpen} onOpenChange={setUnsubscribesOpen} />
      <TestAutomationDialog
        automation={testAutomation}
        open={!!testAutomation}
        onOpenChange={(open) => !open && setTestAutomation(null)}
      />
    </DashboardLayout>
  );
}

// ── Sub-components ─────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="rounded-[20px]">
      <CardContent className="pt-4 pb-4 text-center">
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

function CampaignCard({
  campaign,
  onViewContacts,
  onPause,
  onResume,
  onCancel,
  onDelete,
}: {
  campaign: EmailCampaign;
  onViewContacts: () => void;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
  onDelete: () => void;
}) {
  const st = CAMPAIGN_STATUS[campaign.status] || CAMPAIGN_STATUS.draft;
  const progress = campaign.total_contacts > 0
    ? ((campaign.contacts_sent + campaign.contacts_failed + campaign.contacts_skipped) / campaign.total_contacts) * 100
    : 0;

  return (
    <Card className="rounded-[20px]">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base leading-tight">{campaign.name}</CardTitle>
          <Badge variant="outline" className={st.color}>{st.label}</Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Template: {campaign.template_name}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {campaign.total_contacts > 0 && (
          <>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{campaign.contacts_sent} enviados</span>
              <span>{campaign.contacts_failed} falharam</span>
              <span>{campaign.contacts_queued} na fila</span>
            </div>
          </>
        )}

        {campaign.error_rate > 0 && (
          <p className="text-xs text-destructive">
            Taxa de erro: {campaign.error_rate.toFixed(1)}%
            {campaign.metadata?.auto_paused_reason && ` (auto-pausada)`}
          </p>
        )}

        <div className="flex gap-1.5 flex-wrap">
          <Button variant="outline" size="sm" onClick={onViewContacts}>
            <Eye className="h-3.5 w-3.5 mr-1" /> Contatos
          </Button>
          {['queued', 'processing'].includes(campaign.status) && (
            <Button variant="outline" size="sm" onClick={onPause}>
              <Pause className="h-3.5 w-3.5 mr-1" /> Pausar
            </Button>
          )}
          {campaign.status === 'paused' && (
            <Button variant="outline" size="sm" onClick={onResume}>
              <Play className="h-3.5 w-3.5 mr-1" /> Retomar
            </Button>
          )}
          {['queued', 'processing', 'paused'].includes(campaign.status) && (
            <Button variant="outline" size="sm" onClick={onCancel}>
              <XCircle className="h-3.5 w-3.5 mr-1" /> Cancelar
            </Button>
          )}
          {['draft', 'completed', 'cancelled'].includes(campaign.status) && (
            <Button variant="ghost" size="sm" className="text-destructive" onClick={onDelete}>
              Excluir
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Criada em {new Date(campaign.created_at).toLocaleDateString('pt-BR')}
          {campaign.scheduled_at && ` — Agendada: ${new Date(campaign.scheduled_at).toLocaleString('pt-BR')}`}
        </p>
      </CardContent>
    </Card>
  );
}

function AutomationCard({
  automation,
  onToggle,
  onConfigure,
  onViewEnrollments,
  onTest,
}: {
  automation: EmailAutomation;
  onToggle: (enabled: boolean) => void;
  onConfigure: () => void;
  onViewEnrollments: () => void;
  onTest: () => void;
}) {
  const triggerColor = TRIGGER_COLORS[automation.trigger_type] || '';
  const triggerLabel = TRIGGER_LABELS[automation.trigger_type] || automation.trigger_type;

  return (
    <Card className="rounded-[20px]">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base leading-tight">{automation.name}</CardTitle>
            <div className="flex gap-1.5 mt-1.5">
              <Badge variant="outline" className={triggerColor}>{triggerLabel}</Badge>
              {automation.is_drip && (
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  Drip ({automation.drip_steps?.length || 0} steps)
                </Badge>
              )}
            </div>
          </div>
          <Switch
            checked={automation.enabled}
            onCheckedChange={onToggle}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {automation.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{automation.description}</p>
        )}

        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Enviados: {automation.total_sent}</span>
          <span>Pulados: {automation.total_skipped}</span>
        </div>

        {automation.last_triggered_at && (
          <p className="text-xs text-muted-foreground">
            Ultimo: {new Date(automation.last_triggered_at).toLocaleString('pt-BR')}
          </p>
        )}

        <div className="flex gap-1.5">
          <Button variant="outline" size="sm" onClick={onConfigure}>
            <Settings2 className="h-3.5 w-3.5 mr-1" /> Configurar
          </Button>
          {automation.is_drip && (
            <Button variant="outline" size="sm" onClick={onViewEnrollments}>
              <Users className="h-3.5 w-3.5 mr-1" /> Enrollments
            </Button>
          )}
          {automation.trigger_type === 'event' && (
            <Button variant="outline" size="sm" onClick={onTest}>
              <Play className="h-3.5 w-3.5 mr-1" /> Testar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
