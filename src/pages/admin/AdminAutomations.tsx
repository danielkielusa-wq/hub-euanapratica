import { useState } from 'react';
import { Loader2, Zap, Play, Settings2, ScrollText, RefreshCw, ExternalLink, HelpCircle, Copy, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';
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
  useAutomations,
  useWebhookLogs,
  useToggleAutomation,
  useUpdateAutomation,
  useTestAutomation,
} from '@/hooks/useAdminAutomations';
import type { N8NAutomation, N8NWebhookLog } from '@/hooks/useAdminAutomations';

const CATEGORY_LABELS: Record<string, string> = {
  subscription: 'Assinatura',
  lead: 'Lead',
  notification: 'Notificacao',
  campaign: 'Campanha',
  general: 'Geral',
};

const CATEGORY_COLORS: Record<string, string> = {
  subscription: 'bg-green-50 text-green-700 border-green-200',
  lead: 'bg-blue-50 text-blue-700 border-blue-200',
  notification: 'bg-amber-50 text-amber-700 border-amber-200',
  campaign: 'bg-purple-50 text-purple-700 border-purple-200',
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

        {/* Automation Cards */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {automations.map((auto) => (
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Configurar: {editingAutomation?.display_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Webhook URL (N8N)</Label>
              <Input
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
                placeholder="https://n8n.euanapratica.com/webhook/..."
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
              <TableCell className="text-xs">format-lead-report</TableCell>
              <TableCell className="text-xs">Relatorio de diagnostico gerado com sucesso</TableCell>
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
          </TableBody>
        </Table>
      </section>

      <section>
        <h3 className="font-semibold text-gray-900 mb-2">Troubleshooting</h3>
        <ul className="list-disc list-inside space-y-1.5">
          <li><strong>Status "skipped"</strong>: Webhook URL nao configurada</li>
          <li><strong>Status "timeout"</strong>: N8N nao respondeu dentro do timeout configurado</li>
          <li><strong>Status "error"</strong>: N8N retornou erro HTTP — verifique os logs no N8N</li>
          <li><strong>Automacao nunca dispara</strong>: Verifique se esta ativa (toggle) e se o evento correspondente ocorreu</li>
          <li><strong>N8N nao recebe webhook</strong>: Verifique firewall, HTTPS/SSL, e se a URL esta correta</li>
        </ul>
      </section>
    </div>
  );
}
