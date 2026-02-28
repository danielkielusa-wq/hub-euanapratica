import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { XCircle, Clock, MessageSquare } from 'lucide-react';
import { useFlowSessions, useCancelSession, type WhatsAppFlowSession } from '@/hooks/useAdminWhatsAppFlows';

const SESSION_STATUS: Record<string, { label: string; className: string }> = {
  active: { label: 'Ativo', className: 'bg-blue-100 text-blue-700' },
  waiting_delay: { label: 'Aguardando', className: 'bg-amber-100 text-amber-700' },
  waiting_reply: { label: 'Aguardando Resposta', className: 'bg-purple-100 text-purple-700' },
  completed: { label: 'Concluido', className: 'bg-green-100 text-green-700' },
  expired: { label: 'Expirado', className: 'bg-gray-100 text-gray-500' },
  cancelled: { label: 'Cancelado', className: 'bg-red-100 text-red-600' },
  error: { label: 'Erro', className: 'bg-red-100 text-red-700' },
};

function relativeTime(iso: string | null): string {
  if (!iso) return '-';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

interface FlowSessionsSheetProps {
  flowId: string | null;
  onClose: () => void;
}

export function FlowSessionsSheet({ flowId, onClose }: FlowSessionsSheetProps) {
  const { data: sessions, isLoading } = useFlowSessions(flowId || undefined);
  const cancelSession = useCancelSession();

  return (
    <Sheet open={!!flowId} onOpenChange={() => onClose()}>
      <SheetContent className="sm:max-w-2xl overflow-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Sessoes do Fluxo
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 rounded-xl" />
              ))}
            </div>
          ) : !sessions || sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Nenhuma sessao encontrada</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Etapa Atual</TableHead>
                  <TableHead className="text-center">Msgs</TableHead>
                  <TableHead>Inicio</TableHead>
                  <TableHead>Atividade</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => {
                  const statusCfg = SESSION_STATUS[session.status] || SESSION_STATUS.active;
                  const currentStep = session.current_step as any;

                  return (
                    <TableRow key={session.id}>
                      <TableCell className="font-mono text-sm">
                        {session.phone}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusCfg.className}>
                          {statusCfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {currentStep?.display_name || currentStep?.step_key || '-'}
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {session.messages_sent}/{session.messages_received}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {relativeTime(session.started_at)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {relativeTime(session.last_activity_at)}
                      </TableCell>
                      <TableCell>
                        {['active', 'waiting_delay', 'waiting_reply'].includes(session.status) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() =>
                              cancelSession.mutate({ id: session.id, flow_id: session.flow_id })
                            }
                          >
                            <XCircle className="w-4 h-4 text-destructive" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
