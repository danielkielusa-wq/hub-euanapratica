import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  useMentorEspaco, 
  useEspacoStats, 
  useEspacoStudents, 
  useEspacoTimeline,
  useEspacoUpcomingSessions
} from '@/hooks/useMentorEspacos';
import { useSessions } from '@/hooks/useSessions';
import { useAssignments } from '@/hooks/useAssignments';
import { useFolders } from '@/hooks/useFolders';
import { 
  ArrowLeft, 
  Users, 
  Calendar, 
  ClipboardList, 
  FileText, 
  Settings,
  Eye,
  Loader2,
  Plus,
  Video,
  Clock,
  CheckCircle2,
  AlertCircle,
  Mail,
  ChevronRight
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';

const categoryLabels: Record<string, string> = {
  immersion: 'Imersão',
  group_mentoring: 'Mentoria em Grupo',
  workshop: 'Workshop',
  bootcamp: 'Bootcamp',
  course: 'Curso',
};

const statusLabels: Record<string, string> = {
  active: 'Em Andamento',
  inactive: 'Inativo',
  completed: 'Concluído',
};

const statusColors: Record<string, string> = {
  active: 'bg-green-500/10 text-green-600',
  inactive: 'bg-muted text-muted-foreground',
  completed: 'bg-blue-500/10 text-blue-600',
};

export default function MentorEspacoDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  
  const { data: espaco, isLoading: loadingEspaco } = useMentorEspaco(id || '');
  const { data: stats } = useEspacoStats(id || '');
  const { data: students } = useEspacoStudents(id || '');
  const { data: timeline } = useEspacoTimeline(id || '');
  const { data: upcomingSessions } = useEspacoUpcomingSessions(id || '');
  const { data: sessions } = useSessions(id);
  const { data: assignments } = useAssignments(id ? { espaco_id: id } : undefined);
  const { data: folders } = useFolders(id || '');

  if (loadingEspaco) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!espaco) {
    return (
      <DashboardLayout>
        <div className="text-center py-16">
          <h2 className="text-xl font-semibold text-foreground">Espaço não encontrado</h2>
          <p className="text-muted-foreground mt-2">Este espaço não existe ou você não tem acesso.</p>
          <Button onClick={() => navigate('/mentor/espacos')} className="mt-4">
            Voltar para Meus Espaços
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/mentor/espacos')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">{espaco.name}</h1>
                <Badge className={statusColors[espaco.status || 'active']}>
                  {statusLabels[espaco.status || 'active']}
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                <span>{categoryLabels[espaco.category] || espaco.category}</span>
                {espaco.start_date && (
                  <>
                    <span>•</span>
                    <span>
                      {format(new Date(espaco.start_date), "dd MMM yyyy", { locale: ptBR })}
                      {espaco.end_date && ` - ${format(new Date(espaco.end_date), "dd MMM yyyy", { locale: ptBR })}`}
                    </span>
                  </>
                )}
                <span>•</span>
                <span>{stats?.enrolledCount || 0} alunos</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="overview" className="gap-2">
              <Eye className="h-4 w-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="students" className="gap-2">
              <Users className="h-4 w-4" />
              Alunos
            </TabsTrigger>
            <TabsTrigger value="sessions" className="gap-2">
              <Calendar className="h-4 w-4" />
              Sessões
            </TabsTrigger>
            <TabsTrigger value="assignments" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              Tarefas
            </TabsTrigger>
            <TabsTrigger value="materials" className="gap-2">
              <FileText className="h-4 w-4" />
              Materiais
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              Configurações
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats?.enrolledCount || 0}</p>
                      <p className="text-sm text-muted-foreground">Alunos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <Calendar className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats?.upcomingSessions || 0}</p>
                      <p className="text-sm text-muted-foreground">Próximas Sessões</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orange-500/10">
                      <ClipboardList className="h-5 w-5 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats?.pendingReviews || 0}</p>
                      <p className="text-sm text-muted-foreground">Correções Pendentes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats?.completedSessions || 0}</p>
                      <p className="text-sm text-muted-foreground">Sessões Concluídas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => navigate('/mentor/sessao/nova')}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Sessão
              </Button>
              <Button variant="outline" onClick={() => navigate('/mentor/tarefas/nova')}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Tarefa
              </Button>
              <Button variant="outline">
                <Mail className="h-4 w-4 mr-2" />
                Enviar Mensagem
              </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Upcoming Sessions */}
              <Card>
                <CardHeader>
                  <CardTitle>Próximas Sessões</CardTitle>
                  <CardDescription>As próximas 3 sessões agendadas</CardDescription>
                </CardHeader>
                <CardContent>
                  {upcomingSessions && upcomingSessions.length > 0 ? (
                    <div className="space-y-3">
                      {upcomingSessions.map((session) => (
                        <div key={session.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Video className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">{session.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(session.datetime), "dd MMM, HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                          <Badge variant="outline">
                            {session.duration_minutes || 60}min
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Nenhuma sessão agendada</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle>Próximos 14 Dias</CardTitle>
                  <CardDescription>Sessões e prazos de tarefas</CardDescription>
                </CardHeader>
                <CardContent>
                  {timeline && timeline.length > 0 ? (
                    <div className="space-y-2">
                      {timeline.slice(0, 5).map((item) => (
                        <div key={item.id} className="flex items-center gap-3 p-2">
                          <div className={`w-2 h-2 rounded-full ${item.type === 'session' ? 'bg-blue-500' : 'bg-orange-500'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(item.datetime), "dd/MM HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {item.type === 'session' ? 'Sessão' : 'Tarefa'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Nenhum evento nos próximos 14 dias</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Alunos Matriculados</h2>
              <Button variant="outline" size="sm">
                Exportar CSV
              </Button>
            </div>
            
            {students && students.length > 0 ? (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Aluno</TableHead>
                      <TableHead>Matrícula</TableHead>
                      <TableHead>Progresso</TableHead>
                      <TableHead>Último Acesso</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={student.profilePhotoUrl || undefined} />
                              <AvatarFallback>
                                {student.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{student.fullName}</p>
                              <p className="text-sm text-muted-foreground">{student.email}</p>
                            </div>
                            {student.needsAttention && (
                              <AlertCircle className="h-4 w-4 text-orange-500" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {format(new Date(student.enrolledAt), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress 
                              value={student.totalSessions > 0 ? (student.sessionsAttended / student.totalSessions) * 100 : 0} 
                              className="w-16 h-2"
                            />
                            <span className="text-sm text-muted-foreground">
                              {student.sessionsAttended}/{student.totalSessions}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {student.lastAccessAt 
                            ? formatDistanceToNow(new Date(student.lastAccessAt), { addSuffix: true, locale: ptBR })
                            : 'Nunca'
                          }
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">Nenhum aluno matriculado</h3>
                  <p className="text-muted-foreground mt-1">
                    Entre em contato com o administrador para adicionar alunos.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Sessões do Espaço</h2>
              <Button onClick={() => navigate('/mentor/sessao/nova')}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Sessão
              </Button>
            </div>
            
            {sessions && sessions.length > 0 ? (
              <div className="grid gap-4">
                {sessions.map((session) => (
                  <Card key={session.id} className="hover:shadow-sm transition-shadow">
                    <CardContent className="flex items-center gap-4 py-4">
                      <div className={`p-3 rounded-lg ${
                        session.status === 'completed' ? 'bg-green-500/10' :
                        session.status === 'live' ? 'bg-red-500/10' :
                        'bg-blue-500/10'
                      }`}>
                        <Video className={`h-5 w-5 ${
                          session.status === 'completed' ? 'text-green-500' :
                          session.status === 'live' ? 'text-red-500' :
                          'text-blue-500'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{session.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(session.datetime), "dd MMM yyyy, HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      <Badge variant={session.status === 'completed' ? 'secondary' : 'default'}>
                        {session.status === 'scheduled' && 'Agendada'}
                        {session.status === 'live' && 'Ao Vivo'}
                        {session.status === 'completed' && 'Concluída'}
                        {session.status === 'cancelled' && 'Cancelada'}
                      </Badge>
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/mentor/sessao/${session.id}`)}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">Nenhuma sessão criada</h3>
                  <p className="text-muted-foreground mt-1">
                    Crie sua primeira sessão para este espaço.
                  </p>
                  <Button className="mt-4" onClick={() => navigate('/mentor/sessao/nova')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeira Sessão
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Assignments Tab */}
          <TabsContent value="assignments" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Tarefas do Espaço</h2>
              <Button onClick={() => navigate('/mentor/tarefas/nova')}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Tarefa
              </Button>
            </div>
            
            {assignments && assignments.length > 0 ? (
              <div className="grid gap-4">
                {assignments.map((assignment) => (
                  <Card key={assignment.id} className="hover:shadow-sm transition-shadow">
                    <CardContent className="flex items-center gap-4 py-4">
                      <div className="p-3 rounded-lg bg-orange-500/10">
                        <ClipboardList className="h-5 w-5 text-orange-500" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{assignment.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Prazo: {format(new Date(assignment.due_date), "dd MMM yyyy, HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      <Badge variant={assignment.status === 'published' ? 'default' : 'secondary'}>
                        {assignment.status === 'draft' && 'Rascunho'}
                        {assignment.status === 'published' && 'Publicada'}
                        {assignment.status === 'closed' && 'Encerrada'}
                      </Badge>
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/mentor/tarefas/${assignment.id}/entregas`)}>
                        Ver Entregas
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">Nenhuma tarefa criada</h3>
                  <p className="text-muted-foreground mt-1">
                    Crie sua primeira tarefa para este espaço.
                  </p>
                  <Button className="mt-4" onClick={() => navigate('/mentor/tarefas/nova')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeira Tarefa
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Materials Tab */}
          <TabsContent value="materials" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Materiais do Espaço</h2>
              <Button onClick={() => navigate('/admin/biblioteca/upload')}>
                <Plus className="h-4 w-4 mr-2" />
                Upload de Material
              </Button>
            </div>
            
            {folders && folders.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {folders.map((folder) => (
                  <Card key={folder.id} className="hover:shadow-sm transition-shadow cursor-pointer">
                    <CardContent className="flex items-center gap-4 py-4">
                      <div className="p-3 rounded-lg bg-blue-500/10">
                        <FileText className="h-5 w-5 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{folder.name}</p>
                        <p className="text-sm text-muted-foreground">Pasta</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">Nenhum material disponível</h3>
                  <p className="text-muted-foreground mt-1">
                    Faça upload de materiais para este espaço.
                  </p>
                  <Button className="mt-4" onClick={() => navigate('/admin/biblioteca/upload')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Upload de Material
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configurações do Espaço</CardTitle>
                <CardDescription>Gerencie as informações e preferências do espaço</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Nome</label>
                    <p className="text-foreground">{espaco.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Categoria</label>
                    <p className="text-foreground">{categoryLabels[espaco.category] || espaco.category}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <p className="text-foreground">{statusLabels[espaco.status || 'active']}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Capacidade</label>
                    <p className="text-foreground">{espaco.max_students || 30} alunos</p>
                  </div>
                  {espaco.start_date && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Data de Início</label>
                      <p className="text-foreground">
                        {format(new Date(espaco.start_date), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  )}
                  {espaco.end_date && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Data de Término</label>
                      <p className="text-foreground">
                        {format(new Date(espaco.end_date), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  )}
                </div>
                {espaco.description && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Descrição</label>
                    <p className="text-foreground mt-1">{espaco.description}</p>
                  </div>
                )}
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Para editar as configurações do espaço, entre em contato com o administrador.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
