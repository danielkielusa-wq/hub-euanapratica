import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserCheck, UserX, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AttendanceRecord, AttendanceStatus } from '@/hooks/useAttendance';

interface AttendanceTableProps {
  records: AttendanceRecord[];
  onMarkAttendance: (userId: string, status: AttendanceStatus) => void;
  isLoading?: boolean;
}

export function AttendanceTable({
  records,
  onMarkAttendance,
  isLoading,
}: AttendanceTableProps) {
  const getStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
      case 'present':
        return (
          <Badge variant="outline" className="gap-1 text-accent border-accent">
            <UserCheck className="h-3 w-3" />
            Presente
          </Badge>
        );
      case 'absent':
        return (
          <Badge variant="outline" className="gap-1 text-destructive border-destructive">
            <UserX className="h-3 w-3" />
            Ausente
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1 text-muted-foreground">
            <HelpCircle className="h-3 w-3" />
            Não marcado
          </Badge>
        );
    }
  };

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Aluno</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                Nenhum aluno matriculado
              </TableCell>
            </TableRow>
          ) : (
            records.map((record) => (
              <TableRow key={record.id}>
                <TableCell className="font-medium">
                  {record.profile?.full_name || 'N/A'}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {record.profile?.email || 'N/A'}
                </TableCell>
                <TableCell>{getStatusBadge(record.status)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant={record.status === 'present' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => onMarkAttendance(record.user_id, 'present')}
                      disabled={isLoading}
                      className={cn(
                        record.status === 'present' && 'bg-accent hover:bg-accent/90'
                      )}
                    >
                      <UserCheck className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={record.status === 'absent' ? 'destructive' : 'ghost'}
                      size="sm"
                      onClick={() => onMarkAttendance(record.user_id, 'absent')}
                      disabled={isLoading}
                    >
                      <UserX className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
