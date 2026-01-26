import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { 
  useMentorEspaco, 
  useEspacoStats, 
  useEspacoStudents,
  useArchiveEspaco
} from '@/hooks/useMentorEspacos';
import { useSessions } from '@/hooks/useSessions';
import { useAssignments } from '@/hooks/useAssignments';
import { useFolders } from '@/hooks/useFolders';
import { useEspacoDiscussionCount } from '@/hooks/useSessionPosts';
import { EspacoLibrary } from '@/components/library/EspacoLibrary';
import {
  EspacoHeroHeader,
  EspacoMetricsRow,
  EspacoStickyTabs,
  SessionTimeline,
  TaskListGrouped,
  OverviewContent,
  DiscussionSessionsList,
} from '@/components/espacos/detail';
import { InviteStudentModal } from '@/components/mentor/InviteStudentModal';
import { 
  Plus, 
  Eye, 
  MoreHorizontal, 
  UserMinus,
  Archive,
  RefreshCw,
  Settings,
  AlertCircle,
  BookOpen,
  UserPlus
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function MentorEspacoDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  
  const archiveMutation = useArchiveEspaco();
  const { data: espaco, isLoading: espacoLoading } = useMentorEspaco(id || '');
  const { data: stats } = useEspacoStats(id || '');
  const { data: students } = useEspacoStudents(id || '');
  const { data: sessions, isLoading: sessionsLoading } = useSessions(id);
  const { data: assignments, isLoading: assignmentsLoading } = useAssignments({ espaco_id: id });
  const { data: folders } = useFolders(id || '');
  const { data: discussionCount = 0 } = useEspacoDiscussionCount(id);

  // Filter upcoming sessions
  const upcomingSessions = sessions?.filter(s => 
    new Date(s.datetime) >= new Date() && 
    (s.status === 'scheduled' || s.status === 'live')
  ) || [];

  // Get pending submissions for mentor (assignments needing review)
  const pendingSubmissions = stats?.pendingReviews || 0;

  // Get next session with meeting link
  const nextSessionWithLink = upcomingSessions.find(s => s.meeting_link);

  const handleArchive = async () => {
    if (!id) return;
    const isArchived = espaco?.status === 'arquivado';
    archiveMutation.mutate({ 
      espacoId: id, 
      archive: !isArchived 
    });
  };

  if (espacoLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-muted/30">
          <div className="space-y-4 p-4">
            <Skeleton className="h-48 rounded-2xl" />
            <div className="flex gap-3 overflow-hidden">
              <Skeleton className="h-20 w-36 rounded-2xl shrink-0" />
              <Skeleton className="h-20 w-36 rounded-2xl shrink-0" />
              <Skeleton className="h-20 w-36 rounded-2xl shrink-0" />
            </div>
            <Skeleton className="h-12 rounded-xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!espaco) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
          <div className="text-center py-12 px-6 max-w-sm mx-auto rounded-3xl bg-card/70 backdrop-blur-sm border border-border/40">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2 text-foreground">Espaço não encontrado</h2>
            <p className="text-muted-foreground mb-6">
              Este espaço não existe ou você não tem acesso a ele.
            </p>
            <Button 
              onClick={() => navigate('/mentor/espacos')}
              className="bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-xl"
            >
              Voltar para Meus Espaços
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-muted/30">
        {/* Hero Header - Role aware */}
        <EspacoHeroHeader 
          espaco={espaco}
          nextSession={nextSessionWithLink}
          role="mentor"
          onSettingsClick={() => setActiveTab('settings')}
          onInviteClick={() => setInviteModalOpen(true)}
        />

        {/* Invite Modal */}
        <InviteStudentModal
          open={inviteModalOpen}
          onOpenChange={setInviteModalOpen}
          espacoId={id || ''}
          espacoName={espaco.name}
        />

        {/* Metrics Row - Mentor specific */}
        <EspacoMetricsRow
          sessionsCount={upcomingSessions.length}
          tasksCount={pendingSubmissions}
          materialsCount={folders?.length || 0}
          maxStudents={stats?.enrolledCount ?? espaco.max_students}
          isMentor
        />

        {/* Sticky Tabs - Extended for mentor */}
        <EspacoStickyTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          pendingTasks={pendingSubmissions}
          upcomingSessions={upcomingSessions.length}
          discussionCount={discussionCount}
          showMentorTabs
          studentsCount={stats?.enrolledCount}
        />

        {/* Tab Content */}
        <div className="px-4 py-6 pb-28 md:pb-8">
          <div className="max-w-6xl mx-auto">
            {activeTab === 'overview' && (
              <OverviewContent
                upcomingSessions={upcomingSessions}
                pendingAssignments={assignments?.filter(a => a.status === 'published') || []}
                sessionsLoading={sessionsLoading}
                assignmentsLoading={assignmentsLoading}
                onViewAllSessions={() => setActiveTab('sessions')}
                onViewAllAssignments={() => setActiveTab('assignments')}
                isMentor
                espacoId={id}
              />
            )}

            {activeTab === 'sessions' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">Sessões</h2>
                  <Button 
                    onClick={() => navigate(`/mentor/sessao/nova?espaco=${id}`)}
                    className="rounded-xl"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Sessão
                  </Button>
                </div>
                <SessionTimeline 
                  sessions={sessions} 
                  isLoading={sessionsLoading}
                />
              </div>
            )}

            {activeTab === 'assignments' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">Tarefas</h2>
                  <Button 
                    onClick={() => navigate(`/mentor/tarefas/nova?espaco=${id}`)}
                    className="rounded-xl"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Tarefa
                  </Button>
                </div>
                <TaskListGrouped 
                  assignments={assignments} 
                  isLoading={assignmentsLoading}
                />
              </div>
            )}

            {activeTab === 'library' && (
              <EspacoLibrary
                espacoId={id!}
                espacoName={espaco.name}
                userRole="mentor"
              />
            )}

            {activeTab === 'discussao' && (
              <DiscussionSessionsList
                sessions={sessions}
                isLoading={sessionsLoading}
              />
            )}

            {activeTab === 'students' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">Alunos Matriculados</h2>
                  <Button 
                    variant="outline"
                    onClick={() => setInviteModalOpen(true)}
                    className="rounded-xl gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    Convidar
                  </Button>
                </div>
                
                {students && students.length > 0 ? (
                  <Card className="rounded-[24px] overflow-hidden">
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
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem className="gap-2 cursor-pointer">
                                    <Eye className="h-4 w-4" />
                                    Ver Perfil
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="gap-2 cursor-pointer text-destructive">
                                    <UserMinus className="h-4 w-4" />
                                    Remover
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                ) : (
                  <Card className="rounded-[24px]">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                      <UserPlus className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold">Nenhum aluno matriculado</h3>
                      <p className="text-muted-foreground mt-1">
                        Convide alunos para começar sua turma.
                      </p>
                      <Button 
                        className="mt-4 rounded-xl"
                        onClick={() => setInviteModalOpen(true)}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Convidar Aluno
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-foreground">Configurações</h2>
                
                <Card className="rounded-[24px]">
                  <CardHeader>
                    <CardTitle>Ações do Espaço</CardTitle>
                    <CardDescription>Gerencie o status e configurações do espaço</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/mentor/espacos/${id}/editar`)}
                      className="w-full justify-start gap-2 rounded-xl"
                    >
                      <Settings className="h-4 w-4" />
                      Editar Informações
                    </Button>
                    
                    <Button
                      variant={espaco.status === 'arquivado' ? 'default' : 'outline'}
                      onClick={handleArchive}
                      disabled={archiveMutation.isPending}
                      className="w-full justify-start gap-2 rounded-xl"
                    >
                      {espaco.status === 'arquivado' ? (
                        <>
                          <RefreshCw className="h-4 w-4" />
                          Restaurar Espaço
                        </>
                      ) : (
                        <>
                          <Archive className="h-4 w-4" />
                          Arquivar Espaço
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
