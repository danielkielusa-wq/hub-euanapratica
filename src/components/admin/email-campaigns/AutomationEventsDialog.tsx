import { useState } from 'react';
import {
  MailOpen, MousePointerClick, AlertTriangle, ShieldAlert, CheckCircle2,
  Loader2, ExternalLink, Send, Users,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  useAutomationEvents,
  useAutomationHistory,
  useDripEnrollments,
  useCancelEnrollment,
  computeEventStats,
  type EmailAutomation,
  type EmailCampaignEvent,
  type EmailLogEntry,
} from '@/hooks/useAdminEmailCampaigns';

interface Props {
  automation: EmailAutomation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EVENT_COLORS: Record<string, string> = {
  open: 'text-blue-600 bg-blue-50',
  click: 'text-green-600 bg-green-50',
  bounce: 'text-red-600 bg-red-50',
  complaint: 'text-orange-600 bg-orange-50',
  delivered: 'text-emerald-600 bg-emerald-50',
};

const EVENT_LABELS: Record<string, string> = {
  open: 'Abertura',
  click: 'Clique',
  bounce: 'Bounce',
  complaint: 'Spam',
  delivered: 'Entregue',
};

const EVENT_ICONS: Record<string, typeof MailOpen> = {
  open: MailOpen,
  click: MousePointerClick,
  bounce: AlertTriangle,
  complaint: ShieldAlert,
  delivered: CheckCircle2,
};

const LOG_STATUS_COLORS: Record<string, string> = {
  sent: 'bg-green-50 text-green-700 border-green-200',
  failed: 'bg-red-50 text-red-700 border-red-200',
  skipped: 'bg-gray-50 text-gray-700 border-gray-200',
};

const ENROLLMENT_STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-50 text-green-700 border-green-200',
  completed: 'bg-blue-50 text-blue-700 border-blue-200',
  cancelled: 'bg-gray-50 text-gray-700 border-gray-200',
  paused: 'bg-amber-50 text-amber-700 border-amber-200',
};

export function AutomationEventsDialog({ automation, open, onOpenChange }: Props) {
  const [tab, setTab] = useState('resumo');
  const { data: events = [], isLoading: eventsLoading } = useAutomationEvents(open ? automation?.id ?? null : null);
  const { data: logs = [], isLoading: logsLoading } = useAutomationHistory(open ? automation : null);
  const { data: enrollments = [], isLoading: enrollmentsLoading } = useDripEnrollments(
    open && automation?.is_drip ? automation.id : null
  );
  const cancelEnrollment = useCancelEnrollment();

  const totalSent = automation?.total_sent || 0;
  const stats = computeEventStats(events, totalSent);
  const isLoading = eventsLoading || logsLoading;

  const sentCount = logs.filter(l => l.status === 'sent').length;
  const failedCount = logs.filter(l => l.status === 'failed').length;

  const tabCount = automation?.is_drip ? 4 : 3;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[780px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Metricas — {automation?.name}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs value={tab} onValueChange={setTab} className="flex-1 min-h-0 flex flex-col">
            <TabsList className={`grid w-full grid-cols-${tabCount}`}>
              <TabsTrigger value="resumo">Resumo</TabsTrigger>
              <TabsTrigger value="envios">Envios ({logs.length})</TabsTrigger>
              {automation?.is_drip && (
                <TabsTrigger value="enrollments">
                  Enrollments ({enrollments.length})
                </TabsTrigger>
              )}
              <TabsTrigger value="eventos">Eventos ({events.length})</TabsTrigger>
            </TabsList>

            {/* ── RESUMO ── */}
            <TabsContent value="resumo" className="space-y-4 mt-4 overflow-auto">
              {/* Engagement metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <MetricCard icon={Send} label="Enviados" value={totalSent} color="text-slate-600" />
                <MetricCard icon={MailOpen} label="Aberturas unicas" value={stats.uniqueOpens}
                  sub={totalSent > 0 ? `${stats.openRate.toFixed(1)}%` : undefined} color="text-blue-600" />
                <MetricCard icon={MousePointerClick} label="Cliques unicos" value={stats.uniqueClicks}
                  sub={totalSent > 0 ? `${stats.clickRate.toFixed(1)}%` : undefined} color="text-green-600" />
                <MetricCard icon={AlertTriangle} label="Bounces" value={stats.bounces}
                  sub={stats.bounces > 0 ? `${stats.bounceRate.toFixed(1)}%` : undefined} color="text-red-600" />
              </div>

              {/* Send summary */}
              <div className="bg-muted/50 rounded-lg p-3 space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">Envios</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                  <span className="text-muted-foreground">Enviados com sucesso</span>
                  <span className="font-medium text-green-700">{sentCount}</span>
                  <span className="text-muted-foreground">Falharam</span>
                  <span className="font-medium text-red-600">{failedCount}</span>
                  <span className="text-muted-foreground">Pulados</span>
                  <span className="font-medium">{automation?.total_skipped || 0}</span>
                  <span className="text-muted-foreground">Entregues (confirmado)</span>
                  <span className="font-medium text-emerald-600">{stats.delivered}</span>
                </div>
              </div>

              {/* Drip progress */}
              {automation?.is_drip && enrollments.length > 0 && (
                <div className="bg-muted/50 rounded-lg p-3 space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Drip</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center">
                      <p className="text-lg font-bold text-green-700">
                        {enrollments.filter(e => e.status === 'active').length}
                      </p>
                      <p className="text-xs text-muted-foreground">Ativos</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-blue-700">
                        {enrollments.filter(e => e.status === 'completed').length}
                      </p>
                      <p className="text-xs text-muted-foreground">Concluidos</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-500">
                        {enrollments.filter(e => e.status === 'cancelled').length}
                      </p>
                      <p className="text-xs text-muted-foreground">Cancelados</p>
                    </div>
                  </div>
                </div>
              )}

              {stats.complaints > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-orange-600 shrink-0" />
                  <p className="text-sm font-medium text-orange-800">
                    {stats.complaints} reclamacao(oes) de spam
                  </p>
                </div>
              )}

              {events.length === 0 && logs.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-4">
                  Nenhum dado registrado ainda.
                </p>
              )}
            </TabsContent>

            {/* ── ENVIOS (History) ── */}
            <TabsContent value="envios" className="mt-4 flex-1 min-h-0 overflow-auto">
              {logsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : logs.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">Nenhum envio registrado</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Destinatario</TableHead>
                      <TableHead>Template</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm font-mono truncate max-w-[200px]">
                          {log.recipient}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {log.template_name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={LOG_STATUS_COLORS[log.status] || ''}>
                            {log.status === 'sent' ? 'Enviado' : log.status === 'failed' ? 'Falhou' : 'Pulado'}
                          </Badge>
                          {log.error_message && (
                            <p className="text-[10px] text-destructive mt-0.5 truncate max-w-[150px]" title={log.error_message}>
                              {log.error_message}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {log.created_at ? new Date(log.created_at).toLocaleString('pt-BR') : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            {/* ── ENROLLMENTS (drip only) ── */}
            {automation?.is_drip && (
              <TabsContent value="enrollments" className="mt-4 flex-1 min-h-0 overflow-auto">
                {enrollmentsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : enrollments.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">Nenhum enrollment</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Step</TableHead>
                        <TableHead>Proximo envio</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {enrollments.map((e) => (
                        <TableRow key={e.id}>
                          <TableCell className="text-sm font-mono truncate max-w-[180px]">{e.email}</TableCell>
                          <TableCell className="text-sm">
                            {e.current_step}/{automation.drip_steps?.length || 0}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                            {e.status === 'active'
                              ? new Date(e.next_send_at).toLocaleString('pt-BR')
                              : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={ENROLLMENT_STATUS_COLORS[e.status] || ''}>
                              {e.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {e.status === 'active' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => cancelEnrollment.mutate(e.id)}
                                disabled={cancelEnrollment.isPending}
                              >
                                Cancelar
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            )}

            {/* ── EVENTOS (Resend webhooks) ── */}
            <TabsContent value="eventos" className="mt-4 flex-1 min-h-0 overflow-auto">
              {events.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">
                  Nenhum evento de interacao registrado. Os eventos aparecem conforme os destinatarios abrem ou clicam no email.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Tipo</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Detalhes</TableHead>
                      <TableHead className="w-[150px]">Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.map((event) => {
                      const Icon = EVENT_ICONS[event.event_type] || MailOpen;
                      const colorClass = EVENT_COLORS[event.event_type] || '';
                      return (
                        <TableRow key={event.id}>
                          <TableCell>
                            <Badge variant="outline" className={`${colorClass} border-0 gap-1`}>
                              <Icon className="h-3 w-3" />
                              {EVENT_LABELS[event.event_type] || event.event_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm font-mono truncate max-w-[180px]" title={event.email}>
                            {event.email}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {event.link_url && (
                              <a href={event.link_url} target="_blank" rel="noopener noreferrer"
                                className="text-blue-600 hover:underline truncate block max-w-[180px] inline-flex items-center gap-1">
                                {event.link_url.replace(/^https?:\/\//, '').slice(0, 40)}
                                <ExternalLink className="h-3 w-3 shrink-0" />
                              </a>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(event.created_at).toLocaleString('pt-BR')}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

function MetricCard({
  icon: Icon, label, value, sub, color,
}: {
  icon: typeof MailOpen; label: string; value: number; sub?: string; color: string;
}) {
  return (
    <div className="bg-background border rounded-lg p-3 text-center">
      <Icon className={`h-5 w-5 mx-auto mb-1 ${color}`} />
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}
