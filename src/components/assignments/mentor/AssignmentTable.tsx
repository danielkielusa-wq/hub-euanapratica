import { useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye, 
  Send, 
  Copy,
  Users,
  FileCheck
} from 'lucide-react';
import { useAssignments, useDeleteAssignment, usePublishAssignment } from '@/hooks/useAssignments';
import { useAssignmentStats } from '@/hooks/useSubmissions';
import type { Assignment, AssignmentStatus } from '@/types/assignments';

interface AssignmentTableProps {
  espacoId?: string;
}

function StatsCell({ assignmentId }: { assignmentId: string }) {
  const { data: stats } = useAssignmentStats(assignmentId);
  
  if (!stats) return <span className="text-muted-foreground">-</span>;
  
  return (
    <div className="text-sm">
      <span className="font-medium">{stats.submitted_count}</span>
      <span className="text-muted-foreground">/{stats.total_students}</span>
      <span className="text-muted-foreground ml-1">({stats.submission_rate}%)</span>
    </div>
  );
}

export function AssignmentTable({ espacoId }: AssignmentTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const { data: assignments, isLoading } = useAssignments({ espaco_id: espacoId });
  const deleteAssignment = useDeleteAssignment();
  const publishAssignment = usePublishAssignment();

  const handleDelete = async () => {
    if (deleteId) {
      await deleteAssignment.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const handlePublish = async (id: string) => {
    await publishAssignment.mutateAsync(id);
  };

  const getStatusBadge = (status: AssignmentStatus) => {
    const config = {
      draft: { label: 'Rascunho', variant: 'secondary' as const },
      published: { label: 'Publicada', variant: 'default' as const },
      closed: { label: 'Encerrada', variant: 'outline' as const },
    };
    const { label, variant } = config[status];
    return <Badge variant={variant}>{label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!assignments || assignments.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <FileCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Nenhuma tarefa criada ainda</p>
        <Button asChild className="mt-4">
          <Link to="/mentor/tarefas/nova">Criar Primeira Tarefa</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Turma</TableHead>
              <TableHead>Prazo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Entregas</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignments.map((assignment) => (
              <TableRow key={assignment.id}>
                <TableCell className="font-medium">{assignment.title}</TableCell>
                <TableCell>
                  {assignment.espaco ? (
                    <Badge variant="outline">{assignment.espaco.name}</Badge>
                  ) : '-'}
                </TableCell>
                <TableCell>
                  {format(new Date(assignment.due_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </TableCell>
                <TableCell>{getStatusBadge(assignment.status)}</TableCell>
                <TableCell>
                  <StatsCell assignmentId={assignment.id} />
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to={`/mentor/tarefas/${assignment.id}/entregas`}>
                          <Users className="h-4 w-4 mr-2" />
                          Ver Entregas
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={`/mentor/tarefas/${assignment.id}`}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </Link>
                      </DropdownMenuItem>
                      {assignment.status === 'draft' && (
                        <DropdownMenuItem onClick={() => handlePublish(assignment.id)}>
                          <Send className="h-4 w-4 mr-2" />
                          Publicar
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => setDeleteId(assignment.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Tarefa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita.
              Tarefas com entregas não podem ser excluídas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
