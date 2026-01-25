import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Bug, Lightbulb } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { FeedbackItem } from '@/types/feedback';
import {
  FEEDBACK_STATUS_LABELS,
  FEEDBACK_STATUS_COLORS,
  FEEDBACK_PRIORITY_LABELS,
  FEEDBACK_PRIORITY_COLORS,
} from '@/types/feedback';

interface FeedbackTableProps {
  items: FeedbackItem[];
  onViewDetails: (id: string) => void;
}

const roleLabels: Record<string, string> = {
  student: 'Aluno',
  mentor: 'Mentor',
  admin: 'Admin',
};

export function FeedbackTable({ items, onViewDetails }: FeedbackTableProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhum feedback encontrado.
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">Tipo</TableHead>
            <TableHead>Título</TableHead>
            <TableHead className="w-[140px]">Status</TableHead>
            <TableHead className="w-[100px]">Prioridade</TableHead>
            <TableHead className="w-[100px]">Reporter</TableHead>
            <TableHead className="w-[200px]">Página</TableHead>
            <TableHead className="w-[120px]">Data</TableHead>
            <TableHead className="w-[80px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50" onClick={() => onViewDetails(item.id)}>
              <TableCell>
                {item.type === 'bug' ? (
                  <div className="flex items-center gap-1.5 text-destructive">
                    <Bug className="h-4 w-4" />
                    <span className="text-xs">Bug</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-primary">
                    <Lightbulb className="h-4 w-4" />
                    <span className="text-xs">Melhoria</span>
                  </div>
                )}
              </TableCell>
              <TableCell className="font-medium max-w-[300px] truncate">
                {item.title}
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className={cn('text-xs', FEEDBACK_STATUS_COLORS[item.status])}>
                  {FEEDBACK_STATUS_LABELS[item.status]}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className={cn('text-xs', FEEDBACK_PRIORITY_COLORS[item.priority])}>
                  {FEEDBACK_PRIORITY_LABELS[item.priority]}
                </Badge>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {roleLabels[item.user_role] || item.user_role}
                </span>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                {item.page_url}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {format(new Date(item.created_at), 'dd/MM/yy', { locale: ptBR })}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDetails(item.id);
                  }}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
