import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StatCard } from '@/components/admin/shared/StatCard';
import { useAdminEspaco } from '@/hooks/useAdminEspacos';
import { useEnrollStudent, useCancelEnrollment } from '@/hooks/useAdminEnrollments';
import { useSearchUsers } from '@/hooks/useAdminUsers';
import { CATEGORY_LABELS, ENROLLMENT_STATUS_LABELS } from '@/types/admin';
import { 
  ArrowLeft, 
  Users, 
  Calendar, 
  Settings, 
  UserPlus,
  MoreVertical,
  Trash2,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export default function AdminEspacoDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const { data: espaco, isLoading } = useAdminEspaco(id!);
  const { data: searchResults } = useSearchUsers(searchTerm);
  const enrollMutation = useEnrollStudent();
  const cancelMutation = useCancelEnrollment();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!espaco) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Turma não encontrada.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/admin/turmas')}>
            Voltar para listagem
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const handleAddStudent = () => {
    if (!selectedUserId || !id) return;
    enrollMutation.mutate({
      user_id: selectedUserId,
      espaco_id: id
    }, {
      onSuccess: () => {
        setAddStudentOpen(false);
        setSelectedUserId(null);
        setSearchTerm('');
      }
    });
  };

  const statusVariant = {
    active: 'default',
    inactive: 'secondary',
    completed: 'outline'
  }[espaco.status || 'active'] as 'default' | 'secondary' | 'outline';

  const statusLabel = {
    active: 'Ativa',
    inactive: 'Inativa',
    completed: 'Concluída'
  }[espaco.status || 'active'];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/turmas')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{espaco.name}</h1>
              <Badge variant={statusVariant}>{statusLabel}</Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <Badge variant="outline" className="text-xs">
                {CATEGORY_LABELS[espaco.category] || espaco.category}
              </Badge>
              {espaco.mentor && <span>Mentor: {espaco.mentor.full_name}</span>}
              {espaco.start_date && (
                <>
                  <span>•</span>
                  <span>
                    {format(new Date(espaco.start_date), "dd MMM yyyy", { locale: ptBR })}
                    {espaco.end_date && (
                      <> - {format(new Date(espaco.end_date), "dd MMM yyyy", { locale: ptBR })}</>
                    )}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            title="Alunos Matriculados"
            value={`${espaco.enrolled_count} / ${espaco.max_students}`}
            icon={Users}
          />
          <StatCard
            title="Taxa de Ocupação"
            value={`${Math.round((espaco.enrolled_count! / espaco.max_students) * 100)}%`}
            icon={Users}
          />
          <StatCard
            title="Próxima Sessão"
            value="--"
            icon={Calendar}
            description="Nenhuma agendada"
          />
          <StatCard
            title="Tarefas Pendentes"
            value="--"
            icon={Settings}
            description="Avaliação pendente"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="students">
          <TabsList>
            <TabsTrigger value="students">
              <Users className="h-4 w-4 mr-2" />
              Alunos ({espaco.enrolled_count})
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="students" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Alunos Matriculados</CardTitle>
                <Button onClick={() => setAddStudentOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Adicionar Aluno
                </Button>
              </CardHeader>
              <CardContent>
                {espaco.user_espacos && espaco.user_espacos.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Aluno</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data de Matrícula</TableHead>
                        <TableHead>Expiração</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {espaco.user_espacos.map((enrollment: any) => (
                        <TableRow key={enrollment.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={enrollment.profiles?.profile_photo_url} />
                                <AvatarFallback>
                                  {enrollment.profiles?.full_name?.charAt(0) || '?'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">
                                  {enrollment.profiles?.full_name || 'Usuário'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {enrollment.profiles?.email}
                                </p>
                              </div>
                            </div>
                          </TableCell>
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
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => cancelMutation.mutate(enrollment.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Remover
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Nenhum aluno matriculado.</p>
                    <Button variant="outline" className="mt-4" onClick={() => setAddStudentOpen(true)}>
                      Adicionar primeiro aluno
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Configurações da Turma</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Use o botão de editar na listagem de turmas para modificar as configurações.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Student Dialog */}
      <Dialog open={addStudentOpen} onOpenChange={setAddStudentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Aluno</DialogTitle>
            <DialogDescription>
              Busque e selecione um usuário para matricular nesta turma.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Buscar Usuário</Label>
              <Input
                placeholder="Digite o nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {searchResults && searchResults.length > 0 && (
              <div className="border rounded-md max-h-[200px] overflow-y-auto">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-accent ${
                      selectedUserId === user.id ? 'bg-accent' : ''
                    }`}
                    onClick={() => setSelectedUserId(user.id)}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.profile_photo_url || undefined} />
                      <AvatarFallback>{user.full_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.full_name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {searchTerm && searchTerm.length >= 2 && searchResults?.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum usuário encontrado.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddStudentOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAddStudent} 
              disabled={!selectedUserId || enrollMutation.isPending}
            >
              {enrollMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Matricular
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
