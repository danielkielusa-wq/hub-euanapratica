import { useState, useEffect, useMemo } from 'react';
import { Loader2, Zap, Play, Settings2, ScrollText, RefreshCw, ExternalLink, HelpCircle, Copy, CheckCircle2, XCircle, Clock, AlertTriangle, Timer, Search } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  useAutomations,
  useWebhookLogs,
  useToggleAutomation,
  useUpdateAutomation,
  useTestAutomation,
  useCronSchedule,
  useUpdateCronSchedule,
} from '@/hooks/useAdminAutomations';
import type { N8NAutomation, N8NWebhookLog } from '@/hooks/useAdminAutomations';
import { useUserTimezone } from '@/hooks/useUserTimezone';
import { getTimezoneAbbr, TIMEZONE_OPTIONS } from '@/lib/timezone';

const CATEGORY_LABELS: Record<string, string> = {
  subscription: 'Assinatura',
  lead: 'Lead',
  notification: 'Notificacao',
  campaign: 'Campanha',
  analytics: 'Analytics',
  intelligence: 'Inteligencia',
  general: 'Geral',
};

const CATEGORY_COLORS: Record<string, string> = {
  subscription: 'bg-green-50 text-green-700 border-green-200',
  lead: 'bg-blue-50 text-blue-700 border-blue-200',
  notification: 'bg-amber-50 text-amber-700 border-amber-200',
  campaign: 'bg-purple-50 text-purple-700 border-purple-200',
  analytics: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  intelligence: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  general: 'bg-gray-50 text-gray-600 border-gray-200',
};

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; color: string }> = {
  success: { icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: 'bg-green-50 text-green-700 border-green-200' },
  error: { icon: <XCircle className="w-3.5 h-3.5" />, color: 'bg-red-50 text-red-700 border-red-200' },
  timeout: { icon: <Clock className="w-3.5 h-3.5" />, color: 'bg-amber-50 text-amber-700 border-amber-200' },
  skipped: { icon: <AlertTriangle className="w-3.5 h-3.5" />, color: 'bg-gray-50 text-gray-500 border-gray-200' },
  pending: { icon: <Clock className="w-3.5 h-3.5" />, color: 'bg-blue-50 text-blue-600 border-blue-200' },
};

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return 'Nunca';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Agora';
  if (mins < 60) return `${mins}min atras`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h atras`;
  const days = Math.floor(hours / 24);
  return `${days}d atras`;
}

/** Get UTC offset in hours for a given IANA timezone at the current moment */
function getUtcOffsetHours(tz: string): number {
  const now = new Date();
  // Format the timezone offset using Intl to get the actual offset
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    timeZoneName: 'shortOffset',
  }).formatToParts(now);
  const offsetPart = parts.find(p => p.type === 'timeZoneName')?.value || '';
  // offsetPart is like "GMT-3", "GMT+1", "GMT+5:30", "GMT"
  const match = offsetPart.match(/GMT([+-]?)(\d+)(?::(\d+))?/);
  if (!match) return -3; // fallback to BRT
  const sign = match[1] === '-' ? -1 : 1;
  const hours = parseInt(match[2]) || 0;
  const mins = parseInt(match[3]) || 0;
  return sign * (hours + mins / 60);
}

/** Convert a cron expression to human-readable time in the user's timezone */
function cronToHumanTz(cron: string, tz: string): string {
  const parts = cron.trim().split(/\s+/);
  if (parts.length < 5) return cron;
  const minute = parseInt(parts[0]);
  const hour = parseInt(parts[1]);
  if (isNaN(minute) || isNaN(hour)) return cron;

  const offset = getUtcOffsetHours(tz);
  let localHour = hour + offset;
  if (localHour < 0) localHour += 24;
  if (localHour >= 24) localHour -= 24;
  const pad = (n: number) => String(n).padStart(2, '0');
  const abbr = getTimezoneAbbr(tz);
  return `${pad(Math.floor(localHour))}:${pad(minute)} ${abbr}`;
}

/** Build cron expression from local hour:minute (daily) in the user's timezone */
function localToCron(localHour: number, localMinute: number, tz: string): string {
  const offset = getUtcOffsetHours(tz);
  let utcHour = localHour - offset;
  if (utcHour < 0) utcHour += 24;
  if (utcHour >= 24) utcHour -= 24;
  return `${localMinute} ${Math.floor(utcHour)} * * *`;
}

// ── Cron Schedule Badge (shown on card) ──────────────────────────────
function CronBadge({ jobName }: { jobName: string }) {
  const { data: schedule } = useCronSchedule(jobName);
  const tz = useUserTimezone();
  if (!schedule) return null;

  return (
    <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 gap-1">
      <Timer className="w-3 h-3" />
      {cronToHumanTz(schedule.schedule, tz)}
    </Badge>
  );
}

// ── Cron Schedule Editor (shown in edit dialog) ──────────────────────
function CronScheduleEditor({ jobName }: { jobName: string }) {
  const { data: schedule, isLoading } = useCronSchedule(jobName);
  const updateSchedule = useUpdateCronSchedule();
  const tz = useUserTimezone();
  const tzAbbr = getTimezoneAbbr(tz);
  const [hour, setHour] = useState('23');
  const [minute, setMinute] = useState('00');

  useEffect(() => {
    if (schedule) {
      const parts = schedule.schedule.trim().split(/\s+/);
      if (parts.length >= 5) {
        const utcMin = parseInt(parts[0]);
        const utcHr = parseInt(parts[1]);
        if (!isNaN(utcMin) && !isNaN(utcHr)) {
          const offset = getUtcOffsetHours(tz);
          let localHr = utcHr + offset;
          if (localHr < 0) localHr += 24;
          if (localHr >= 24) localHr -= 24;
          setHour(String(Math.floor(localHr)).padStart(2, '0'));
          setMinute(String(utcMin).padStart(2, '0'));
        }
      }
    }
  }, [schedule, tz]);

  if (isLoading) return <div className="text-xs text-gray-400">Carregando horario...</div>;
  if (!schedule) return <div className="text-xs text-gray-400">Cron job nao encontrado no banco.</div>;

  const handleSave = () => {
    const cronExpr = localToCron(parseInt(hour), parseInt(minute), tz);
    updateSchedule.mutate({ jobName, schedule: cronExpr });
  };

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutes = ['00', '15', '30', '45'];

  return (
    <div className="space-y-3 p-3 bg-indigo-50/50 rounded-lg border border-indigo-100">
      <div className="flex items-center gap-2">
        <Timer className="w-4 h-4 text-indigo-600" />
        <Label className="text-sm font-semibold text-indigo-900">Horario do Cron ({tzAbbr})</Label>
      </div>
      <p className="text-xs text-indigo-700">
        Este webhook e disparado automaticamente todo dia no horario abaixo. Altere para reagendar.
      </p>
      <div className="flex items-center gap-2">
        <Select value={hour} onValueChange={setHour}>
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {hours.map(h => (
              <SelectItem key={h} value={h}>{h}h</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-lg font-bold text-indigo-600">:</span>
        <Select value={minute} onValueChange={setMinute}>
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {minutes.map(m => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-indigo-600 font-medium">{tzAbbr}</span>
        <Button
          size="sm"
          variant="outline"
          className="ml-auto text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-100"
          onClick={handleSave}
          disabled={updateSchedule.isPending}
        >
          {updateSchedule.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
          Salvar Horario
        </Button>
      </div>
      <p className="text-[10px] text-indigo-500">
        Cron atual: <code className="font-mono">{schedule.schedule}</code> (UTC)
      </p>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────

export default function AdminAutomations() {
  const { data: automations = [], isLoading, refetch } = useAutomations();
  const toggleAutomation = useToggleAutomation();
  const updateAutomation = useUpdateAutomation();
  const testAutomation = useTestAutomation();

  const [editingAutomation, setEditingAutomation] = useState<N8NAutomation | null>(null);
  const [logsAutomation, setLogsAutomation] = useState<N8NAutomation | null>(null);
  const [editUrl, setEditUrl] = useState('');
  const [editTimeout, setEditTimeout] = useState('10000');
  const [editHeaders, setEditHeaders] = useState('{}');
  const [docsOpen, setDocsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredAutomations = useMemo(() => {
    return automations.filter((auto) => {
      // Search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          auto.display_name.toLowerCase().includes(q) ||
          auto.trigger_event.toLowerCase().includes(q) ||
          (auto.description || '').toLowerCase().includes(q) ||
          (auto.category || '').toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }
      // Status filter
      if (statusFilter === 'active') return auto.enabled;
      if (statusFilter === 'inactive') return !auto.enabled;
      if (statusFilter === 'success' || statusFilter === 'error' || statusFilter === 'timeout' || statusFilter === 'skipped') {
        return auto.last_status === statusFilter;
      }
      return true;
    });
  }, [automations, searchQuery, statusFilter]);

  const handleEdit = (auto: N8NAutomation) => {
    setEditingAutomation(auto);
    setEditUrl(auto.webhook_url || '');
    setEditTimeout(String(auto.timeout_ms || 10000));
    setEditHeaders(JSON.stringify(auto.headers || {}, null, 2));
  };

  const handleSave = () => {
    if (!editingAutomation) return;
    let parsedHeaders = {};
    try {
      parsedHeaders = JSON.parse(editHeaders);
    } catch { /* keep empty */ }

    updateAutomation.mutate({
      id: editingAutomation.id,
      webhook_url: editUrl || null,
      timeout_ms: parseInt(editTimeout) || 10000,
      headers: parsedHeaders as Record<string, string>,
    }, { onSuccess: () => setEditingAutomation(null) });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              Automacoes N8N
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {automations.filter(a => a.enabled).length} de {automations.length} ativas
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-1" /> Atualizar
            </Button>
            <Button variant="outline" size="sm" onClick={() => setDocsOpen(true)}>
              <HelpCircle className="w-4 h-4 mr-1" /> Documentacao
            </Button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome, evento, categoria..."
              className="pl-8 h-9 text-sm"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] h-9 text-sm">
              <SelectValue placeholder="Filtrar status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativas</SelectItem>
              <SelectItem value="inactive">Inativas</SelectItem>
              <SelectItem value="success">Ultimo: success</SelectItem>
              <SelectItem value="error">Ultimo: error</SelectItem>
              <SelectItem value="timeout">Ultimo: timeout</SelectItem>
              <SelectItem value="skipped">Ultimo: skipped</SelectItem>
            </SelectContent>
          </Select>
          {(searchQuery || statusFilter !== 'all') && (
            <span className="text-xs text-gray-500">
              {filteredAutomations.length} de {automations.length}
            </span>
          )}
        </div>

        {/* Automation Cards */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredAutomations.map((auto) => (
            <Card key={auto.id} className={`relative transition-all ${auto.enabled ? 'ring-1 ring-blue-200' : 'opacity-75'}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1 min-w-0">
                    <CardTitle className="text-base leading-tight">{auto.display_name}</CardTitle>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="outline" className={CATEGORY_COLORS[auto.category] || CATEGORY_COLORS.general}>
                        {CATEGORY_LABELS[auto.category] || auto.category}
                      </Badge>
                      <Badge variant="outline" className="font-mono text-xs">
                        {auto.trigger_event}
                      </Badge>
                      {auto.cron_job_name && <CronBadge jobName={auto.cron_job_name} />}
                    </div>
                  </div>
                  <Switch
                    checked={auto.enabled}
                    onCheckedChange={(checked) => toggleAutomation.mutate({ id: auto.id, enabled: checked })}
                    disabled={toggleAutomation.isPending}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-gray-500 line-clamp-2">{auto.description}</p>

                {/* Webhook URL preview */}
                <div className="flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span className="text-xs text-gray-500 truncate font-mono">
                    {auto.webhook_url || 'URL nao configurada'}
                  </span>
                </div>

                {/* Last triggered */}
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Ultimo disparo: {formatRelativeTime(auto.last_triggered_at)}</span>
                  {auto.last_status && (
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${STATUS_CONFIG[auto.last_status]?.color || ''}`}>
                      {auto.last_status}
                    </Badge>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-1.5 pt-1">
                  <Button variant="outline" size="sm" className="flex-1 text-xs h-7" onClick={() => handleEdit(auto)}>
                    <Settings2 className="w-3.5 h-3.5 mr-1" /> Configurar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => testAutomation.mutate(auto)}
                    disabled={!auto.webhook_url || !auto.enabled || testAutomation.isPending}
                  >
                    <Play className="w-3.5 h-3.5 mr-1" /> Testar
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => setLogsAutomation(auto)}>
                    <ScrollText className="w-3.5 h-3.5 mr-1" /> Logs
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredAutomations.length === 0 && automations.length > 0 && (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              Nenhuma automacao encontrada para os filtros selecionados.
            </CardContent>
          </Card>
        )}
        {automations.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              Nenhuma automacao configurada. Execute a migration para criar as automacoes seed.
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingAutomation} onOpenChange={(open) => !open && setEditingAutomation(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configurar: {editingAutomation?.display_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Cron Schedule (only shown if automation has cron_job_name) */}
            {editingAutomation?.cron_job_name && (
              <CronScheduleEditor jobName={editingAutomation.cron_job_name} />
            )}

            <div>
              <Label>Webhook URL (N8N)</Label>
              <Input
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
                placeholder="https://n8n.sapunplugged.com/webhook/..."
                className="font-mono text-sm"
              />
            </div>
            <div>
              <Label>Timeout (ms)</Label>
              <Input
                type="number"
                value={editTimeout}
                onChange={(e) => setEditTimeout(e.target.value)}
                placeholder="10000"
              />
            </div>
            <div>
              <Label>Headers extras (JSON)</Label>
              <Textarea
                value={editHeaders}
                onChange={(e) => setEditHeaders(e.target.value)}
                placeholder='{"Authorization": "Bearer ..."}'
                className="font-mono text-sm h-20"
              />
            </div>
            {editingAutomation?.metadata && Object.keys(editingAutomation.metadata).length > 0 && (
              <div>
                <Label className="text-gray-400">Metadata (somente leitura)</Label>
                <pre className="text-xs bg-gray-50 p-2 rounded border overflow-auto max-h-32">
                  {JSON.stringify(editingAutomation.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingAutomation(null)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={updateAutomation.isPending}>
              {updateAutomation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logs Sheet */}
      <Sheet open={!!logsAutomation} onOpenChange={(open) => !open && setLogsAutomation(null)}>
        <SheetContent className="sm:max-w-2xl overflow-auto">
          <SheetHeader>
            <SheetTitle>Logs: {logsAutomation?.display_name}</SheetTitle>
          </SheetHeader>
          {logsAutomation && <WebhookLogsTable automationId={logsAutomation.id} />}
        </SheetContent>
      </Sheet>

      {/* Docs Sheet */}
      <Sheet open={docsOpen} onOpenChange={setDocsOpen}>
        <SheetContent className="sm:max-w-2xl overflow-auto">
          <SheetHeader>
            <SheetTitle>Documentacao - Automacoes N8N</SheetTitle>
          </SheetHeader>
          <DocsContent />
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
}

// ── Webhook Logs Table Component ────────────────────────────────────
function WebhookLogsTable({ automationId }: { automationId: string }) {
  const { data: logs = [], isLoading } = useWebhookLogs(automationId);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin" /></div>;
  }

  if (logs.length === 0) {
    return <p className="text-center text-gray-400 py-8">Nenhum log encontrado.</p>;
  }

  return (
    <div className="mt-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Status</TableHead>
            <TableHead>Evento</TableHead>
            <TableHead className="w-[80px]">HTTP</TableHead>
            <TableHead className="w-[70px]">Tempo</TableHead>
            <TableHead className="w-[120px]">Data</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => {
            const cfg = STATUS_CONFIG[log.status] || STATUS_CONFIG.pending;
            return (
              <TableRow
                key={log.id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
              >
                <TableCell>
                  <Badge variant="outline" className={`${cfg.color} gap-1`}>
                    {cfg.icon} {log.status}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs">{log.trigger_event}</TableCell>
                <TableCell className="text-xs">{log.response_status ?? '-'}</TableCell>
                <TableCell className="text-xs">{log.duration_ms ? `${log.duration_ms}ms` : '-'}</TableCell>
                <TableCell className="text-xs text-gray-500">
                  {new Date(log.created_at).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {/* Expanded payload view */}
      {expandedId && (() => {
        const log = logs.find(l => l.id === expandedId);
        if (!log) return null;
        return (
          <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-600">Payload</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => navigator.clipboard.writeText(JSON.stringify(log.payload, null, 2))}
              >
                <Copy className="w-3 h-3 mr-1" /> Copiar
              </Button>
            </div>
            <pre className="text-xs overflow-auto max-h-48 whitespace-pre-wrap">
              {JSON.stringify(log.payload, null, 2)}
            </pre>
            {log.error_message && (
              <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-700">
                <strong>Erro:</strong> {log.error_message}
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}

// ── Documentation Content ───────────────────────────────────────────
function DocsContent() {
  return (
    <div className="mt-4 space-y-6 text-sm text-gray-700 leading-relaxed">
      <section>
        <h3 className="font-semibold text-gray-900 mb-2">O que sao Automacoes N8N?</h3>
        <p>
          Cada automacao representa um fluxo no N8N que e disparado por um evento do sistema.
          Quando o evento ocorre (ex: relatorio gerado, assinatura ativada), o sistema envia um
          webhook POST para a URL configurada do N8N, que entao executa a logica do fluxo
          (delays, condicoes, envio de mensagens, etc).
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-gray-900 mb-2">Como configurar</h3>
        <ol className="list-decimal list-inside space-y-1.5">
          <li>Crie o workflow no N8N com um node <strong>Webhook</strong> como trigger</li>
          <li>Copie a URL do webhook gerada pelo N8N</li>
          <li>Cole a URL no campo "Webhook URL" da automacao correspondente</li>
          <li>Ative a automacao com o toggle</li>
          <li>Use o botao "Testar" para enviar um payload de teste</li>
          <li>Verifique os logs para confirmar que o N8N recebeu o webhook</li>
        </ol>
      </section>

      <section>
        <h3 className="font-semibold text-gray-900 mb-2">Agendamento (Cron)</h3>
        <p>
          Automacoes com o badge de horario sao disparadas automaticamente por cron.
          Clique em "Configurar" para alterar o horario — o sistema converte automaticamente
          para UTC e reagenda o job.
        </p>
        <p className="mt-1">
          O horario exibido reflete o fuso configurado no seu perfil. Para alterar,
          va em <strong>Minha Conta → Perfil → Fuso Horario</strong>. Minutos disponiveis: 00, 15, 30, 45.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-gray-900 mb-2">Autenticacao N8N → Supabase</h3>
        <p>
          Quando o N8N precisa chamar Edge Functions (send-whatsapp, send-lead-email),
          ele deve enviar o header:
        </p>
        <pre className="bg-gray-100 p-2 rounded mt-1 text-xs font-mono">
{`x-internal-secret: <INTERNAL_FUNCTION_SECRET>`}
        </pre>
        <p className="mt-2">
          Para acessar a API REST do Supabase diretamente (inserir lead_tasks, consultar lead_interactions):
        </p>
        <pre className="bg-gray-100 p-2 rounded mt-1 text-xs font-mono">
{`apikey: <SUPABASE_ANON_KEY>
Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>`}
        </pre>
      </section>

      <section>
        <h3 className="font-semibold text-gray-900 mb-2">Eventos disponiveis</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Evento</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Descricao</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-mono text-xs">report.generated</TableCell>
              <TableCell className="text-xs">dispatch-report-webhook</TableCell>
              <TableCell className="text-xs">Relatorio de diagnostico gerado com sucesso</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-mono text-xs">report.accessed</TableCell>
              <TableCell className="text-xs">handle-report-accessed</TableCell>
              <TableCell className="text-xs">Lead abriu o relatorio pela primeira vez (cria follow-up task)</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-mono text-xs">subscription.*</TableCell>
              <TableCell className="text-xs">ticto-webhook</TableCell>
              <TableCell className="text-xs">Eventos de assinatura (activated, cancelled, etc)</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-mono text-xs">subscription.cancelled</TableCell>
              <TableCell className="text-xs">cancel-subscription</TableCell>
              <TableCell className="text-xs">Cancelamento de assinatura pelo usuario</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-mono text-xs">whatsapp.inbound</TableCell>
              <TableCell className="text-xs">receive-whatsapp-webhook</TableCell>
              <TableCell className="text-xs">Mensagem WhatsApp recebida de lead conhecido</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-mono text-xs">mentoria.interest</TableCell>
              <TableCell className="text-xs">receive-mentoria-waitlist</TableCell>
              <TableCell className="text-xs">Lead entrou na lista de espera da mentoria em grupo</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-mono text-xs">cart.abandoned</TableCell>
              <TableCell className="text-xs">check-abandoned-carts</TableCell>
              <TableCell className="text-xs">Carrinho abandonado detectado (servico visualizado sem compra)</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-mono text-xs">manychat.trigger_flow</TableCell>
              <TableCell className="text-xs">trigger-manychat-flow</TableCell>
              <TableCell className="text-xs">Disparo de fluxo ManyChat com template HSM</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-mono text-xs">sdr.send_whatsapp</TableCell>
              <TableCell className="text-xs">sdr-execute-outreach</TableCell>
              <TableCell className="text-xs">SDR envia mensagem WhatsApp para prospect</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-mono text-xs">sdr.send_linkedin</TableCell>
              <TableCell className="text-xs">sdr-execute-outreach</TableCell>
              <TableCell className="text-xs">SDR envia mensagem LinkedIn para prospect</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-mono text-xs">analytics.daily</TableCell>
              <TableCell className="text-xs">generate-daily-analytics</TableCell>
              <TableCell className="text-xs">Resumo diario com metricas + texto IA + link do dashboard</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-mono text-xs">intelligence.weekly_report</TableCell>
              <TableCell className="text-xs">generate-weekly-report</TableCell>
              <TableCell className="text-xs">Relatorio semanal de inteligencia de vendas</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </section>

      <section>
        <h3 className="font-semibold text-gray-900 mb-2">Payload do Analytics Diario</h3>
        <p>O webhook <code>analytics.daily</code> envia:</p>
        <pre className="bg-gray-100 p-2 rounded mt-1 text-xs font-mono overflow-auto max-h-48">
{`{
  "event": "analytics.daily",
  "snapshot_date": "2026-03-01",
  "ai_summary": "Texto do analista IA...",
  "dashboard_url": "https://hub.euanapratica.com/admin/analytics",
  "metrics": {
    "new_leads": 15,
    "new_signups": 3,
    "active_subscriptions": 42,
    "mrr_estimate": 8400,
    "churn_percent_30d": 2.5,
    "total_credits_used": 28,
    "bookings_today": 5,
    "community_posts": 8,
    "whatsapp_outbound": 120,
    "email_sent": 45,
    "api_cost_usd": 1.23
  }
}`}
        </pre>
      </section>

      <section>
        <h3 className="font-semibold text-gray-900 mb-2">Troubleshooting</h3>
        <ul className="list-disc list-inside space-y-1.5">
          <li><strong>Status "skipped"</strong>: Webhook URL nao configurada</li>
          <li><strong>Status "timeout"</strong>: N8N nao respondeu dentro do timeout configurado</li>
          <li><strong>Status "error"</strong>: N8N retornou erro HTTP — verifique os logs no N8N</li>
          <li><strong>Automacao nunca dispara</strong>: Verifique se esta ativa (toggle) e se o evento correspondente ocorreu</li>
          <li><strong>N8N nao recebe webhook</strong>: Verifique firewall, HTTPS/SSL, e se a URL esta correta</li>
          <li><strong>"Failed to fetch" no teste</strong>: O botao "Testar" usa um proxy server-side (Edge Function). Se persistir, verifique se a funcao <code>test-n8n-webhook</code> esta deployada</li>
          <li><strong>Cron nao dispara</strong>: Verifique se <code>invoke_edge_function</code> e <code>app_configs</code> (supabase_edge_url, internal_function_secret) estao configurados</li>
        </ul>
      </section>
    </div>
  );
}
