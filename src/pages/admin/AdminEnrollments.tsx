import { useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  useAdminEnrollments, 
  useCancelEnrollment, 
  useExtendAccess,
  useTransferStudent
} from '@/hooks/useAdminEnrollments';
import { useAdminEspacos } from '@/hooks/useAdminEspacos';
import type { EnrollmentFilters } from '@/types/admin';
import { ENROLLMENT_STATUS_LABELS } from '@/types/admin';
import { Search, MoreVertical, X, Clock, ArrowRightLeft, Loader2, Upload, Download } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function AdminEnrollments() {
  const [filters, setFilters] = useState<EnrollmentFilters>({});
  const [search, setSearch] = useState('');
  const [extendDialog, setExtendDialog] = useState<{ id: string; currentDate: string | null } | null>(null);
  const [newExpiryDate, setNewExpiryDate] = useState('');
  const [transferDialog, setTransferDialog] = useState<{ id: string; fromEspacoId: string } | null>(null);
  const [targetEspacoId, setTargetEspacoId] = useState('');

  const { data: enrollments, isLoading } = useAdminEnrollments(filters);
  const { data: espacos } = useAdminEspacos();
  const cancelMutation = useCancelEnrollment();
  const extendMutation = useExtendAccess();
  const transferMutation = useTransferStudent();

  const handleSearchChange = (value: string) => {
    setSearch(value);
    const timeout = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: value || undefined }));
    }, 300);
    return () => clearTimeout(timeout);
  };

  const handleExtendAccess = () => {
    if (!extendDialog || !newExpiryDate) return;
    extendMutation.mutate({
      enrollment_id: extendDialog.id,
      new_expiry_date: newExpiryDate
    }, {
      onSuccess: () => {
        setExtendDialog(null);
        setNewExpiryDate('');
      }
    });
  };

  const handleTransfer = () => {
    if (!transferDialog || !targetEspacoId) return;
    transferMutation.mutate({
      enrollment_id: transferDialog.id,
      from_espaco_id: transferDialog.fromEspacoId,
      to_espaco_id: targetEspacoId
    }, {
      onSuccess: () => {
        setTransferDialog(null);
        setTargetEspacoId('');
      }
    });
  };

  const exportToCSV = () => {
    if (!enrollments || enrollments.length === 0) return;

    const headers = ['Aluno', 'Email', 'Turma', 'Status', 'Data Matrícula', 'Expiração'];
    const rows = enrollments.map(e => [
      e.user?.full_name || '',
      e.user?.email || '',
      e.espaco?.name || '',
      e.status || '',
      e.enrolled_at ? format(new Date(e.enrolled_at), 'dd/MM/yyyy') : '',
      e.access_expires_at ? format(new Date(e.access_expires_at), 'dd/MM/yyyy') : 'Sem expiração'
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `matriculas_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.click();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestão de Matrículas</h1>
            <p className="text-muted-foreground">
              Visualize e gerencie todas as matrículas
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por aluno..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select
            value={filters.espaco_id || 'all'}
            onValueChange={(value) => setFilters(prev => ({ 
              ...prev, 
              espaco_id: value === 'all' ? undefined : value
            }))}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Turma" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Turmas</SelectItem>
              {espacos?.map((espaco) => (
                <SelectItem key={espaco.id} value={espaco.id}>
                  {espaco.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.status || 'all'}
            onValueChange={(value) => setFilters(prev => ({ 
              ...prev, 
              status: value === 'all' ? undefined : value
            }))}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="expired">Expirado</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant={filters.expiring_soon ? 'default' : 'outline'}
            onClick={() => setFilters(prev => ({ 
              ...prev, 
              expiring_soon: !prev.expiring_soon 
            }))}
          >
            <Clock className="mr-2 h-4 w-4" />
            Expirando em 30 dias
          </Button>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : enrollments && enrollments.length > 0 ? (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Turma</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data Matrícula</TableHead>
                  <TableHead>Expiração</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrollments.map((enrollment) => (
                  <TableRow key={enrollment.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={enrollment.user?.profile_photo_url || undefined} />
                          <AvatarFallback>
                            {enrollment.user?.full_name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{enrollment.user?.full_name || 'Usuário'}</p>
                          <p className="text-sm text-muted-foreground">{enrollment.user?.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{enrollment.espaco?.name || '--'}</TableCell>
                    <TableCell>
                      <Badge variant={enrollment.status === 'active' ? 'default' : 'secondary'}>
                        {ENROLLMENT_STATUS_LABELS[enrollment.status as keyof typeof ENROLLMENT_STATUS_LABELS] || enrollment.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {enrollment.enrolled_at
                        ? format(new Date(enrollment.enrolled_at), "dd/MM/yyyy", { locale: ptBR })
                        : '--'}
                    </TableCell>
                    <TableCell>
                      {enrollment.access_expires_at
                        ? format(new Date(enrollment.access_expires_at), "dd/MM/yyyy", { locale: ptBR })
                        : 'Sem expiração'}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setExtendDialog({
                            id: enrollment.id,
                            currentDate: enrollment.access_expires_at
                          })}>
                            <Clock className="mr-2 h-4 w-4" />
                            Estender Acesso
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setTransferDialog({
                            id: enrollment.id,
                            fromEspacoId: enrollment.espaco_id
                          })}>
                            <ArrowRightLeft className="mr-2 h-4 w-4" />
                            Transferir Turma
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => cancelMutation.mutate(enrollment.id)}
                          >
                            <X className="mr-2 h-4 w-4" />
                            Cancelar Matrícula
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhuma matrícula encontrada.</p>
          </div>
        )}
      </div>

      {/* Extend Access Dialog */}
      <Dialog open={!!extendDialog} onOpenChange={(open) => !open && setExtendDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Estender Acesso</DialogTitle>
            <DialogDescription>
              Defina a nova data de expiração do acesso.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nova Data de Expiração</Label>
              <Input
                type="date"
                value={newExpiryDate}
                onChange={(e) => setNewExpiryDate(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setExtendDialog(null)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleExtendAccess}
              disabled={!newExpiryDate || extendMutation.isPending}
            >
              {extendMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={!!transferDialog} onOpenChange={(open) => !open && setTransferDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transferir para Outra Turma</DialogTitle>
            <DialogDescription>
              Selecione a turma de destino para a transferência.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Turma de Destino</Label>
              <Select value={targetEspacoId} onValueChange={setTargetEspacoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a turma" />
                </SelectTrigger>
                <SelectContent>
                  {espacos?.filter(e => e.id !== transferDialog?.fromEspacoId).map((espaco) => (
                    <SelectItem key={espaco.id} value={espaco.id}>
                      {espaco.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferDialog(null)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleTransfer}
              disabled={!targetEspacoId || transferMutation.isPending}
            >
              {transferMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Transferir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
