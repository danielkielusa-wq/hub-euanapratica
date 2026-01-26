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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAdminUsers, useUpdateUserRole, useUpdateUserStatus, useDeleteUser } from '@/hooks/useAdminUsers';
import type { UserFilters } from '@/types/admin';
import { Search, MoreVertical, UserCog, Loader2, Plus, History, UserX, UserCheck, Trash2, AlertTriangle } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
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
import { Checkbox } from '@/components/ui/checkbox';
import { CreateUserDialog } from '@/components/admin/users/CreateUserDialog';
import { UserAuditLogModal } from '@/components/admin/users/UserAuditLogModal';

const ROLE_LABELS = {
  admin: 'Administrador',
  mentor: 'Mentor',
  student: 'Aluno'
};

const ROLE_VARIANTS: Record<string, 'default' | 'secondary' | 'outline'> = {
  admin: 'default',
  mentor: 'secondary',
  student: 'outline'
};

const STATUS_LABELS = {
  active: 'Ativo',
  inactive: 'Inativo'
};

export default function AdminUsers() {
  const [filters, setFilters] = useState<UserFilters>({ includeInactive: false });
  const [search, setSearch] = useState('');
  const [editRoleUser, setEditRoleUser] = useState<{ id: string; name: string; role: string } | null>(null);
  const [newRole, setNewRole] = useState<'admin' | 'mentor' | 'student'>('student');
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [auditLogUser, setAuditLogUser] = useState<{ id: string; name: string } | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [deleteUserName, setDeleteUserName] = useState<string>('');

  const { data: users, isLoading } = useAdminUsers(filters);
  const updateRoleMutation = useUpdateUserRole();
  const updateStatusMutation = useUpdateUserStatus();
  const deleteUserMutation = useDeleteUser();

  const handleSearchChange = (value: string) => {
    setSearch(value);
    const timeout = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: value || undefined }));
    }, 300);
    return () => clearTimeout(timeout);
  };

  const handleEditRole = (user: { id: string; full_name: string; role: string }) => {
    setEditRoleUser({ id: user.id, name: user.full_name, role: user.role });
    setNewRole(user.role as 'admin' | 'mentor' | 'student');
  };

  const handleSaveRole = () => {
    if (!editRoleUser) return;
    updateRoleMutation.mutate({
      userId: editRoleUser.id,
      role: newRole
    }, {
      onSuccess: () => setEditRoleUser(null)
    });
  };

  const handleToggleStatus = (user: { id: string; status: string }) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    updateStatusMutation.mutate({ userId: user.id, status: newStatus });
  };

  const handleViewHistory = (user: { id: string; full_name: string }) => {
    setAuditLogUser({ id: user.id, name: user.full_name });
  };

  const handleDeleteClick = (user: { id: string; full_name: string }) => {
    setDeleteUserId(user.id);
    setDeleteUserName(user.full_name);
  };

  const handleConfirmDelete = () => {
    if (!deleteUserId) return;
    deleteUserMutation.mutate(deleteUserId, {
      onSuccess: () => {
        setDeleteUserId(null);
        setDeleteUserName('');
      }
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestão de Usuários</h1>
            <p className="text-muted-foreground">
              Visualize e gerencie todos os usuários da plataforma
            </p>
          </div>
          <Button onClick={() => setCreateUserOpen(true)} variant="gradient">
            <Plus className="h-4 w-4 mr-2" />
            Novo Usuário
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select
            value={filters.role || 'all'}
            onValueChange={(value) => setFilters(prev => ({ 
              ...prev, 
              role: value === 'all' ? undefined : value as 'admin' | 'mentor' | 'student'
            }))}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Papel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Papéis</SelectItem>
              <SelectItem value="admin">Administrador</SelectItem>
              <SelectItem value="mentor">Mentor</SelectItem>
              <SelectItem value="student">Aluno</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-inactive"
              checked={filters.includeInactive}
              onCheckedChange={(checked) => setFilters(prev => ({ 
                ...prev, 
                includeInactive: checked === true 
              }))}
            />
            <Label htmlFor="show-inactive" className="text-sm cursor-pointer">
              Mostrar inativos
            </Label>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : users && users.length > 0 ? (
          <div className="border rounded-[24px] overflow-hidden bg-card/80 backdrop-blur-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Último Login</TableHead>
                  <TableHead>Espaços</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className={user.status === 'inactive' ? 'opacity-60' : ''}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.profile_photo_url || undefined} />
                          <AvatarFallback>
                            {user.full_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.full_name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={ROLE_VARIANTS[user.role] || 'outline'}>
                        {ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] || user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                        {STATUS_LABELS[user.status as keyof typeof STATUS_LABELS] || user.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.last_login_at ? (
                        <span className="text-sm" title={format(new Date(user.last_login_at), "dd/MM/yyyy HH:mm")}>
                          {formatDistanceToNow(new Date(user.last_login_at), { addSuffix: true, locale: ptBR })}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Nunca</span>
                      )}
                    </TableCell>
                    <TableCell>{user.enrollments_count || 0}</TableCell>
                    <TableCell>
                      {user.created_at
                        ? format(new Date(user.created_at), "dd/MM/yyyy", { locale: ptBR })
                        : '--'}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditRole(user)}>
                            <UserCog className="mr-2 h-4 w-4" />
                            Alterar Papel
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleViewHistory(user)}>
                            <History className="mr-2 h-4 w-4" />
                            Ver Histórico
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleToggleStatus(user)}
                            className={user.status === 'active' ? 'text-destructive' : 'text-primary'}
                          >
                            {user.status === 'active' ? (
                              <>
                                <UserX className="mr-2 h-4 w-4" />
                                Desativar Usuário
                              </>
                            ) : (
                              <>
                                <UserCheck className="mr-2 h-4 w-4" />
                                Reativar Usuário
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteClick(user)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir Usuário
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
            <p className="text-muted-foreground">Nenhum usuário encontrado.</p>
          </div>
        )}
      </div>

      {/* Edit Role Dialog */}
      <Dialog open={!!editRoleUser} onOpenChange={(open) => !open && setEditRoleUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Papel do Usuário</DialogTitle>
            <DialogDescription>
              Alterando o papel de {editRoleUser?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Novo Papel</Label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="mentor">Mentor</SelectItem>
                  <SelectItem value="student">Aluno</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRoleUser(null)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveRole}
              disabled={updateRoleMutation.isPending}
              variant="gradient"
            >
              {updateRoleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={!!deleteUserId} onOpenChange={(open) => !open && setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Exclusão Permanente
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Você está prestes a excluir permanentemente o usuário <strong>{deleteUserName}</strong>.
              </p>
              <p>
                Esta ação irá remover <strong>TODOS</strong> os dados do usuário, incluindo:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Perfil e informações pessoais</li>
                <li>Matrículas em espaços</li>
                <li>Submissões de tarefas</li>
                <li>Histórico de acessos</li>
              </ul>
              <p className="font-semibold text-destructive">
                Se este usuário quiser retornar, precisará criar uma nova conta do zero.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Excluir Permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create User Dialog */}
      <CreateUserDialog open={createUserOpen} onOpenChange={setCreateUserOpen} />

      {/* Audit Log Modal */}
      {auditLogUser && (
        <UserAuditLogModal
          open={!!auditLogUser}
          onOpenChange={(open) => !open && setAuditLogUser(null)}
          userId={auditLogUser.id}
          userName={auditLogUser.name}
        />
      )}
    </DashboardLayout>
  );
}
