import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useMentorEspacos } from '@/hooks/useMentorEspacos';
import { useUpcomingSessions } from '@/hooks/useSessions';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Users, ClipboardList, Calendar, TrendingUp, Loader2, ArrowRight, GraduationCap } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function MentorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const { data: espacos, isLoading: loadingEspacos } = useMentorEspacos();
  const { data: upcomingSessions, isLoading: loadingSessions } = useUpcomingSessions(5);
  
  // Get pending submissions for mentor's espacos
  const { data: mentorStats, isLoading: loadingStats } = useQuery({
    queryKey: ['mentor-dashboard-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Get all espacos where user is mentor
      const { data: mentorEspacos } = await supabase
        .from('espacos')
        .select('id')
        .eq('mentor_id', user.id);
      
      const espacoIds = mentorEspacos?.map(e => e.id) || [];
      
      if (espacoIds.length === 0) {
        return {
          totalStudents: 0,
          pendingSubmissions: 0,
          upcomingSessionsCount: 0,
          pendingSubmissionsList: []
        };
      }
      
      // Get total students enrolled
      const { count: totalStudents } = await supabase
        .from('user_espacos')
        .select('id', { count: 'exact', head: true })
        .in('espaco_id', espacoIds)
        .eq('status', 'active');
      
      // Get assignments for these espacos
      const { data: assignments } = await supabase
        .from('assignments')
        .select('id, title, espaco_id')
        .in('espaco_id', espacoIds)
        .eq('status', 'published');
      
      const assignmentIds = assignments?.map(a => a.id) || [];
      
      // Get pending submissions
      let pendingSubmissionsList: any[] = [];
      let pendingSubmissions = 0;
      
      if (assignmentIds.length > 0) {
        const { data: submissions, count } = await supabase
          .from('submissions')
          .select(`
            id,
            submitted_at,
            user_id,
            assignment_id
          `, { count: 'exact' })
          .in('assignment_id', assignmentIds)
          .eq('status', 'submitted')
          .order('submitted_at', { ascending: false })
          .limit(5);
        
        pendingSubmissions = count || 0;
        
        if (submissions && submissions.length > 0) {
          // Get user profiles
          const userIds = submissions.map(s => s.user_id);
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', userIds);
          
          const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);
          const assignmentMap = new Map(assignments?.map(a => [a.id, a.title]) || []);
          
          pendingSubmissionsList = submissions.map(s => ({
            id: s.id,
            studentName: profileMap.get(s.user_id) || 'Aluno',
            taskTitle: assignmentMap.get(s.assignment_id) || 'Tarefa',
            submittedAt: s.submitted_at,
            assignmentId: s.assignment_id
          }));
        }
      }
      
      // Count upcoming sessions
      const { count: upcomingSessionsCount } = await supabase
        .from('sessions')
        .select('id', { count: 'exact', head: true })
        .in('espaco_id', espacoIds)
        .gte('datetime', new Date().toISOString())
        .eq('status', 'scheduled');
      
      return {
        totalStudents: totalStudents || 0,
        pendingSubmissions,
        upcomingSessionsCount: upcomingSessionsCount || 0,
        pendingSubmissionsList
      };
    },
    enabled: !!user?.id
  });
  
  const isLoading = loadingEspacos || loadingSessions || loadingStats;
  
  const stats = [
    { 
      label: 'Total de Alunos', 
      value: mentorStats?.totalStudents || 0, 
      icon: Users, 
      change: `Em ${espacos?.length || 0} espaços` 
    },
    { 
      label: 'Tarefas para Corrigir', 
      value: mentorStats?.pendingSubmissions || 0, 
      icon: ClipboardList, 
      change: mentorStats?.pendingSubmissions && mentorStats.pendingSubmissions > 5 ? 'Urgente' : 'Pendentes',
      urgent: (mentorStats?.pendingSubmissions || 0) > 5
    },
    { 
      label: 'Próximas Sessões', 
      value: mentorStats?.upcomingSessionsCount || 0, 
      icon: Calendar, 
      change: upcomingSessions?.[0] ? `Próxima: ${format(new Date(upcomingSessions[0].datetime), "dd/MM", { locale: ptBR })}` : 'Nenhuma agendada'
    },
    { 
      label: 'Meus Espaços', 
      value: espacos?.length || 0, 
      icon: GraduationCap, 
      change: 'Ativos' 
    },
  ];
  
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Dashboard do Mentor
            </h1>
            <p className="text-muted-foreground mt-1">
              Bem-vindo, {user?.full_name}
            </p>
          </div>
          <Button size="lg" onClick={() => navigate('/mentor/sessao/nova')}>
            <Calendar className="mr-2 h-4 w-4" />
            Agendar Sessão
          </Button>
        </div>
        
        {/* Stats Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <Card key={stat.label}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className={`text-xs mt-1 ${stat.urgent ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {stat.change}
                      </p>
                    </div>
                    <div className="p-2 rounded-lg bg-primary/10">
                      <stat.icon className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Pending Tasks */}
          <Card>
            <CardHeader>
              <CardTitle>Tarefas para Corrigir</CardTitle>
              <CardDescription>Entregas pendentes de revisão</CardDescription>
            </CardHeader>
            <CardContent>
              {mentorStats?.pendingSubmissionsList && mentorStats.pendingSubmissionsList.length > 0 ? (
                <div className="space-y-4">
                  {mentorStats.pendingSubmissionsList.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium text-foreground">{item.studentName}</p>
                        <p className="text-sm text-muted-foreground">{item.taskTitle}</p>
                        <span className="text-xs text-muted-foreground">
                          {item.submittedAt && format(new Date(item.submittedAt), "dd/MM 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => navigate(`/mentor/tarefas/${item.assignmentId}/entregas`)}
                      >
                        Corrigir
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma tarefa pendente de correção</p>
                </div>
              )}
              <Button 
                variant="ghost" 
                className="w-full mt-4"
                onClick={() => navigate('/mentor/tarefas')}
              >
                Ver todas as tarefas
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
          
          {/* Upcoming Sessions */}
          <Card>
            <CardHeader>
              <CardTitle>Próximas Sessões</CardTitle>
              <CardDescription>Suas mentorias agendadas</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingSessions && upcomingSessions.length > 0 ? (
                <div className="space-y-4">
                  {upcomingSessions.slice(0, 3).map((session) => (
                    <div key={session.id} className="p-4 rounded-lg border border-border">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-medium text-foreground">{session.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {session.espacos?.name}
                          </p>
                        </div>
                        <Badge variant="secondary">
                          {session.duration_minutes || 60}min
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-primary">
                          {format(new Date(session.datetime), "dd MMM, HH:mm", { locale: ptBR })}
                        </span>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/mentor/sessao/${session.id}`)}
                        >
                          Preparar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma sessão agendada</p>
                </div>
              )}
              <Button 
                variant="ghost" 
                className="w-full mt-4"
                onClick={() => navigate('/mentor/agenda')}
              >
                Ver calendário completo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Access to Espacos */}
        {espacos && espacos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Meus Espaços</CardTitle>
              <CardDescription>Acesso rápido aos seus espaços</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {espacos.slice(0, 3).map((espaco) => (
                  <div 
                    key={espaco.id} 
                    className="p-4 rounded-lg border border-border hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer"
                    onClick={() => navigate(`/mentor/espacos/${espaco.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-foreground">{espaco.name}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {espaco.enrolled_count || 0} alunos
                        </p>
                      </div>
                      <Badge variant={espaco.status === 'active' ? 'default' : 'secondary'}>
                        {espaco.status === 'active' ? 'Ativo' : espaco.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              {espacos.length > 3 && (
                <Button 
                  variant="ghost" 
                  className="w-full mt-4"
                  onClick={() => navigate('/mentor/espacos')}
                >
                  Ver todos os espaços ({espacos.length})
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
