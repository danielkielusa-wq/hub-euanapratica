import { Loader2 } from 'lucide-react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  useAutomationHistory,
  type EmailAutomation,
} from '@/hooks/useAdminEmailCampaigns';

interface Props {
  automation: EmailAutomation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STATUS_COLORS: Record<string, string> = {
  sent: 'bg-green-50 text-green-700 border-green-200',
  failed: 'bg-red-50 text-red-700 border-red-200',
  skipped: 'bg-gray-50 text-gray-700 border-gray-200',
};

const STATUS_LABELS: Record<string, string> = {
  sent: 'Enviado',
  failed: 'Falhou',
  skipped: 'Pulado',
};

export function AutomationHistorySheet({ automation, open, onOpenChange }: Props) {
  const { data: logs = [], isLoading } = useAutomationHistory(open ? automation : null);

  const sentCount = logs.filter(l => l.status === 'sent').length;
  const failedCount = logs.filter(l => l.status === 'failed').length;
  const skippedCount = logs.filter(l => l.status === 'skipped').length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[720px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Historico de Envios — {automation?.name}</SheetTitle>
        </SheetHeader>

        <div className="grid grid-cols-3 gap-2 mt-4 mb-4">
          <div className="bg-muted rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-green-700">{sentCount}</p>
            <p className="text-xs text-muted-foreground">Enviados</p>
          </div>
          <div className="bg-muted rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-red-600">{failedCount}</p>
            <p className="text-xs text-muted-foreground">Falharam</p>
          </div>
          <div className="bg-muted rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-gray-600">{skippedCount}</p>
            <p className="text-xs text-muted-foreground">Pulados</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
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
                    <Badge variant="outline" className={STATUS_COLORS[log.status] || ''}>
                      {STATUS_LABELS[log.status] || log.status}
                    </Badge>
                    {log.error_message && (
                      <p className="text-[10px] text-destructive mt-0.5 truncate max-w-[150px]" title={log.error_message}>
                        {log.error_message}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {log.created_at
                      ? new Date(log.created_at).toLocaleString('pt-BR')
                      : '-'}
                  </TableCell>
                </TableRow>
              ))}
              {logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    Nenhum envio registrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </SheetContent>
    </Sheet>
  );
}
