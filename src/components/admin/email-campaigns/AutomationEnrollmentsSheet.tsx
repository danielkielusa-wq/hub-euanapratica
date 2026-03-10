import { Loader2 } from 'lucide-react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  useDripEnrollments,
  useCancelEnrollment,
  type EmailAutomation,
} from '@/hooks/useAdminEmailCampaigns';

interface Props {
  automation: EmailAutomation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-50 text-green-700 border-green-200',
  completed: 'bg-blue-50 text-blue-700 border-blue-200',
  cancelled: 'bg-gray-50 text-gray-700 border-gray-200',
  paused: 'bg-amber-50 text-amber-700 border-amber-200',
};

export function AutomationEnrollmentsSheet({ automation, open, onOpenChange }: Props) {
  const { data: enrollments = [], isLoading } = useDripEnrollments(automation?.id || null);
  const cancelEnrollment = useCancelEnrollment();

  const totalSteps = automation?.drip_steps?.length || 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[640px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Enrollments — {automation?.name}</SheetTitle>
        </SheetHeader>

        <div className="grid grid-cols-3 gap-2 mt-4 mb-4">
          <div className="bg-muted rounded-lg p-3 text-center">
            <p className="text-lg font-bold">{enrollments.filter((e) => e.status === 'active').length}</p>
            <p className="text-xs text-muted-foreground">Ativos</p>
          </div>
          <div className="bg-muted rounded-lg p-3 text-center">
            <p className="text-lg font-bold">{enrollments.filter((e) => e.status === 'completed').length}</p>
            <p className="text-xs text-muted-foreground">Concluidos</p>
          </div>
          <div className="bg-muted rounded-lg p-3 text-center">
            <p className="text-lg font-bold">{enrollments.filter((e) => e.status === 'cancelled').length}</p>
            <p className="text-xs text-muted-foreground">Cancelados</p>
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
                  <TableCell className="text-sm font-mono">{e.email}</TableCell>
                  <TableCell className="text-sm">{e.current_step}/{totalSteps}</TableCell>
                  <TableCell className="text-sm">
                    {e.status === 'active'
                      ? new Date(e.next_send_at).toLocaleString('pt-BR')
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={STATUS_COLORS[e.status] || ''}>
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
              {enrollments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhum enrollment
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
