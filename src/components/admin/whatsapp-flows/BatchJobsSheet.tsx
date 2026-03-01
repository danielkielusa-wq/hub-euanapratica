import { useState } from 'react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Users, Pause, Play, XCircle, ChevronDown,
  CheckCircle2, AlertCircle, Clock, Ban, Calendar,
} from 'lucide-react';
import {
  useBatchJobs,
  useBatchContacts,
  usePauseBatchJob,
  useResumeBatchJob,
  useCancelBatchJob,
  type BatchJob,
} from '@/hooks/useAdminBatchDispatch';

// ── Status configs ──────────────────────────────────────────────────

const JOB_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  scheduled: { label: 'Agendado', className: 'bg-indigo-100 text-indigo-700' },
  queued: { label: 'Na Fila', className: 'bg-gray-100 text-gray-700' },
  processing: { label: 'Processando', className: 'bg-blue-100 text-blue-700' },
  paused: { label: 'Pausado', className: 'bg-amber-100 text-amber-700' },
  completed: { label: 'Concluido', className: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelado', className: 'bg-red-100 text-red-600' },
};

const CONTACT_STATUS_CONFIG: Record<string, {
  label: string;
  icon: React.ElementType;
  className: string;
}> = {
  queued: { label: 'Na Fila', icon: Clock, className: 'text-gray-500' },
  processing: { label: 'Enviando', icon: Clock, className: 'text-blue-500 animate-pulse' },
  sent: { label: 'Enviado', icon: CheckCircle2, className: 'text-green-500' },
  failed: { label: 'Falhou', icon: AlertCircle, className: 'text-red-500' },
  skipped: { label: 'Ignorado', icon: Ban, className: 'text-gray-400' },
};

// ── Main Component ──────────────────────────────────────────────────

interface BatchJobsSheetProps {
  flowId: string | null;
  onClose: () => void;
}

export function BatchJobsSheet({ flowId, onClose }: BatchJobsSheetProps) {
  const { data: jobs, isLoading } = useBatchJobs(flowId || undefined);
  const pauseJob = usePauseBatchJob();
  const resumeJob = useResumeBatchJob();
  const cancelJob = useCancelBatchJob();

  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

  return (
    <Sheet open={!!flowId} onOpenChange={() => onClose()}>
      <SheetContent className="sm:max-w-2xl overflow-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Lotes de Envio
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
            </div>
          ) : !jobs || jobs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Nenhum lote criado para este fluxo</p>
            </div>
          ) : (
            jobs.map((job) => (
              <BatchJobCard
                key={job.id}
                job={job}
                flowId={flowId!}
                isExpanded={expandedJobId === job.id}
                onToggleExpand={() =>
                  setExpandedJobId(expandedJobId === job.id ? null : job.id)
                }
                onPause={() => pauseJob.mutate({ jobId: job.id, flowId: flowId! })}
                onResume={() => resumeJob.mutate({ jobId: job.id, flowId: flowId! })}
                onCancel={() => cancelJob.mutate({ jobId: job.id, flowId: flowId! })}
              />
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── BatchJobCard ────────────────────────────────────────────────────

function BatchJobCard({
  job, flowId, isExpanded, onToggleExpand, onPause, onResume, onCancel,
}: {
  job: BatchJob;
  flowId: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
}) {
  const statusCfg = JOB_STATUS_CONFIG[job.status] || JOB_STATUS_CONFIG.queued;
  const processed = job.contacts_sent + job.contacts_failed + job.contacts_skipped;
  const progressPct = job.total_contacts > 0 ? (processed / job.total_contacts) * 100 : 0;

  const isActive = ['queued', 'processing', 'scheduled'].includes(job.status);
  const isPaused = job.status === 'paused';
  const isScheduled = job.status === 'scheduled';

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggleExpand}>
      <div className="border rounded-xl overflow-hidden">
        {/* Header */}
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-medium text-sm">{job.name}</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                {job.source_type === 'report_backfill' ? 'Backfill Relatorios' : 'Lista Manual'}
                {' · '}
                {new Date(job.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <Badge variant="outline" className={statusCfg.className}>
              {statusCfg.label}
            </Badge>
          </div>

          {/* Scheduled info */}
          {isScheduled && job.scheduled_at && (
            <div className="flex items-center gap-1.5 text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg px-2.5 py-1.5">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              Agendado para{' '}
              {new Date(job.scheduled_at).toLocaleDateString('pt-BR')}{' '}
              as{' '}
              {new Date(job.scheduled_at).toLocaleTimeString('pt-BR', {
                hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo',
              })}{' '}
              BRT
            </div>
          )}

          {/* Progress bar */}
          <div className="space-y-1">
            <Progress value={progressPct} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{processed}/{job.total_contacts} processados</span>
              <div className="flex gap-3">
                <span className="text-green-600">{job.contacts_sent} enviados</span>
                <span className="text-red-500">{job.contacts_failed} falhas</span>
                <span className="text-gray-400">{job.contacts_skipped} ignorados</span>
              </div>
            </div>
          </div>

          {/* Auto-pause warning */}
          {job.metadata?.auto_paused_reason && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-800 flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              Pausado automaticamente: {String(job.metadata.auto_paused_reason)}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            {isActive && (
              <Button variant="outline" size="sm" className="rounded-xl gap-1" onClick={onPause}>
                <Pause className="w-3.5 h-3.5" /> Pausar
              </Button>
            )}
            {isPaused && (
              <Button variant="outline" size="sm" className="rounded-xl gap-1" onClick={onResume}>
                <Play className="w-3.5 h-3.5" /> Retomar
              </Button>
            )}
            {(isActive || isPaused) && (
              <Button variant="outline" size="sm" className="rounded-xl gap-1 text-destructive" onClick={onCancel}>
                <XCircle className="w-3.5 h-3.5" /> Cancelar
              </Button>
            )}
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="rounded-xl gap-1 ml-auto">
                <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                Contatos
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>

        {/* Expanded: contact list */}
        <CollapsibleContent>
          <BatchContactsTable jobId={job.id} />
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// ── BatchContactsTable ──────────────────────────────────────────────

function BatchContactsTable({ jobId }: { jobId: string }) {
  const { data: contacts, isLoading } = useBatchContacts(jobId);

  if (isLoading) {
    return <div className="p-4"><Skeleton className="h-20 rounded-xl" /></div>;
  }

  if (!contacts || contacts.length === 0) {
    return <div className="p-4 text-xs text-muted-foreground text-center">Nenhum contato</div>;
  }

  return (
    <div className="border-t max-h-60 overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs">#</TableHead>
            <TableHead className="text-xs">Telefone</TableHead>
            <TableHead className="text-xs">Nome</TableHead>
            <TableHead className="text-xs">Status</TableHead>
            <TableHead className="text-xs">Detalhe</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((contact) => {
            const statusCfg = CONTACT_STATUS_CONFIG[contact.status] || CONTACT_STATUS_CONFIG.queued;
            const StatusIcon = statusCfg.icon;
            return (
              <TableRow key={contact.id}>
                <TableCell className="text-xs text-muted-foreground">{contact.position}</TableCell>
                <TableCell className="text-xs font-mono">{contact.phone}</TableCell>
                <TableCell className="text-xs">{contact.lead_name || '-'}</TableCell>
                <TableCell>
                  <span className={`flex items-center gap-1 text-xs ${statusCfg.className}`}>
                    <StatusIcon className="w-3 h-3" />
                    {statusCfg.label}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-32 truncate">
                  {contact.error_message || contact.skip_reason || '-'}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
