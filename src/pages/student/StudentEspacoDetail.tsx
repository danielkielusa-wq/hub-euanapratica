import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useEspaco } from '@/hooks/useEspacos';
import { useSessions } from '@/hooks/useSessions';
import { useAssignments } from '@/hooks/useAssignments';
import { useFolders } from '@/hooks/useFolders';
import { CATEGORY_LABELS } from '@/types/admin';
import { 
  ArrowLeft, 
  Calendar, 
  FileText, 
  FolderOpen, 
  Video,
  Clock,
  Users,
  BookOpen
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function StudentEspacoDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: espaco, isLoading: espacoLoading } = useEspaco(id!);
  const { data: sessions, isLoading: sessionsLoading } = useSessions(id);
  const { data: assignments, isLoading: assignmentsLoading } = useAssignments({ espaco_id: id, status: 'published' });
  const { data: folders } = useFolders(id!);

  const isLoading = espacoLoading;

  // Filtrar sessões futuras
  const upcomingSessions = sessions?.filter(s => 
    new Date(s.datetime) >= new Date() && 
    (s.status === 'scheduled' || s.status === 'live')
  ).slice(0, 5) || [];

  // Tarefas pendentes
  const pendingAssignments = assignments?.filter(a => 
    !a.my_submission || a.my_submission.status === 'draft'
  ).slice(0, 5) || [];

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-8 w-64" />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!espaco) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Espaço não encontrado</h2>
          <p className="text-muted-foreground mb-4">
            Este espaço não existe ou você não tem acesso a ele.
          </p>
          <Button onClick={() => navigate('/dashboard/espacos')}>
            Voltar para Meus Espaços
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const statusColors: Record<string, string> = {
    active: 'bg-green-500/10 text-green-700 border-green-500/20',
    inactive: 'bg-muted text-muted-foreground',
    completed: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
  };

  const statusLabels: Record<string, string> = {
    active: 'Ativo',
    inactive: 'Inativo',
    completed: 'Concluído',
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/espacos')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold">{espaco.name}</h1>
              <Badge className={statusColors[espaco.status || 'active']}>
                {statusLabels[espaco.status || 'active']}
              </Badge>
              {espaco.category && (
                <Badge variant="outline">
                  {CATEGORY_LABELS[espaco.category] || espaco.category}
                </Badge>
              )}
            </div>
            {espaco.description && (
              <p className="text-muted-foreground mt-1">{espaco.description}</p>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Próximas Sessões</p>
                  <p className="text-2xl font-bold">{upcomingSessions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <FileText className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tarefas Pendentes</p>
                  <p className="text-2xl font-bold">{pendingAssignments.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <FolderOpen className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Materiais</p>
                  <p className="text-2xl font-bold">{folders?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Users className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vagas</p>
                  <p className="text-2xl font-bold">{espaco.max_students || '∞'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="sessions">Sessões</TabsTrigger>
            <TabsTrigger value="assignments">Tarefas</TabsTrigger>
            <TabsTrigger value="materials">Materiais</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Próximas Sessões */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Próximas Sessões
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {sessionsLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-16" />
                      <Skeleton className="h-16" />
                    </div>
                  ) : upcomingSessions.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      Nenhuma sessão agendada
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {upcomingSessions.map(session => (
                        <div key={session.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div>
                            <p className="font-medium">{session.title}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {format(new Date(session.datetime), "dd/MM 'às' HH:mm", { locale: ptBR })}
                            </div>
                          </div>
                          {session.meeting_link && (
                            <Button size="sm" asChild>
                              <a href={session.meeting_link} target="_blank" rel="noopener noreferrer">
                                <Video className="h-4 w-4 mr-1" />
                                Acessar
                              </a>
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tarefas Pendentes */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-orange-500" />
                    Tarefas Pendentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {assignmentsLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-16" />
                      <Skeleton className="h-16" />
                    </div>
                  ) : pendingAssignments.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      Nenhuma tarefa pendente 🎉
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {pendingAssignments.map(assignment => (
                        <div 
                          key={assignment.id} 
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors"
                          onClick={() => navigate(`/dashboard/tarefas/${assignment.id}`)}
                        >
                          <div>
                            <p className="font-medium">{assignment.title}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              Prazo: {format(new Date(assignment.due_date), "dd/MM 'às' HH:mm", { locale: ptBR })}
                            </div>
                          </div>
                          <Button size="sm" variant="outline">
                            Entregar
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sessions">
            <Card>
              <CardHeader>
                <CardTitle>Todas as Sessões</CardTitle>
              </CardHeader>
              <CardContent>
                {sessionsLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-16" />
                    <Skeleton className="h-16" />
                    <Skeleton className="h-16" />
                  </div>
                ) : !sessions || sessions.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhuma sessão cadastrada neste espaço
                  </p>
                ) : (
                  <div className="space-y-3">
                    {sessions.map(session => (
                      <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{session.title}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {format(new Date(session.datetime), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={session.status === 'completed' ? 'secondary' : 'default'}>
                            {session.status === 'scheduled' ? 'Agendada' : 
                             session.status === 'live' ? 'Ao Vivo' : 
                             session.status === 'completed' ? 'Concluída' : 'Cancelada'}
                          </Badge>
                          {session.meeting_link && session.status !== 'completed' && (
                            <Button size="sm" asChild>
                              <a href={session.meeting_link} target="_blank" rel="noopener noreferrer">
                                <Video className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assignments">
            <Card>
              <CardHeader>
                <CardTitle>Todas as Tarefas</CardTitle>
              </CardHeader>
              <CardContent>
                {assignmentsLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-16" />
                    <Skeleton className="h-16" />
                  </div>
                ) : !assignments || assignments.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhuma tarefa publicada neste espaço
                  </p>
                ) : (
                  <div className="space-y-3">
                    {assignments.map(assignment => {
                      const isSubmitted = assignment.my_submission?.status === 'submitted' || 
                                         assignment.my_submission?.status === 'reviewed';
                      return (
                        <div 
                          key={assignment.id} 
                          className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => navigate(`/dashboard/tarefas/${assignment.id}`)}
                        >
                          <div>
                            <p className="font-medium">{assignment.title}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              Prazo: {format(new Date(assignment.due_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </div>
                          </div>
                          <Badge variant={isSubmitted ? 'secondary' : 'default'}>
                            {isSubmitted ? 'Entregue' : 'Pendente'}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="materials">
            <Card>
              <CardHeader>
                <CardTitle>Materiais do Espaço</CardTitle>
              </CardHeader>
              <CardContent>
                {!folders || folders.length === 0 ? (
                  <div className="text-center py-8">
                    <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">
                      Nenhum material disponível ainda
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => navigate('/biblioteca')}
                    >
                      Ir para Biblioteca
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {folders.map(folder => (
                      <div 
                        key={folder.id} 
                        className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => navigate(`/biblioteca?folder=${folder.id}`)}
                      >
                        <FolderOpen className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">{folder.name}</p>
                          {folder.description && (
                            <p className="text-sm text-muted-foreground">{folder.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
