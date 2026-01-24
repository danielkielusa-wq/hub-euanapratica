import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { Users, ClipboardList, Calendar, TrendingUp } from 'lucide-react';

export default function MentorDashboard() {
  const { user } = useAuth();
  
  const stats = [
    { label: 'Total de Alunos', value: '24', icon: Users, change: '+3 este mês' },
    { label: 'Tarefas para Corrigir', value: '12', icon: ClipboardList, change: '5 urgentes' },
    { label: 'Sessões esta Semana', value: '6', icon: Calendar, change: 'Próxima: amanhã' },
    { label: 'Taxa de Engajamento', value: '87%', icon: TrendingUp, change: '+5% vs mês passado' },
  ];
  
  const pendingTasks = [
    { student: 'João Silva', task: 'Currículo em inglês', submitted: '2 horas atrás', cohort: 'Turma 1' },
    { student: 'Ana Costa', task: 'Pitch de apresentação', submitted: '5 horas atrás', cohort: 'Turma 1' },
    { student: 'Pedro Santos', task: 'Carta de motivação', submitted: '1 dia atrás', cohort: 'Turma 2' },
  ];
  
  const upcomingSessions = [
    { cohort: 'Mentoria Intensiva - Turma 1', date: 'Amanhã, 19:00', students: 12, topic: 'Entrevistas Técnicas' },
    { cohort: 'Imersão Networking', date: 'Quinta, 20:00', students: 8, topic: 'Personal Branding' },
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
          <Button size="lg">
            <Calendar className="mr-2 h-4 w-4" />
            Agendar Sessão
          </Button>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-xs text-accent mt-1">{stat.change}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-secondary/10">
                    <stat.icon className="w-5 h-5 text-secondary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Pending Tasks */}
          <Card>
            <CardHeader>
              <CardTitle>Tarefas para Corrigir</CardTitle>
              <CardDescription>Entregas pendentes de revisão</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingTasks.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium text-foreground">{item.student}</p>
                      <p className="text-sm text-muted-foreground">{item.task}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">{item.cohort}</Badge>
                        <span className="text-xs text-muted-foreground">{item.submitted}</span>
                      </div>
                    </div>
                    <Button size="sm">Corrigir</Button>
                  </div>
                ))}
              </div>
              <Button variant="ghost" className="w-full mt-4">
                Ver todas as tarefas
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
              <div className="space-y-4">
                {upcomingSessions.map((session, index) => (
                  <div key={index} className="p-4 rounded-lg border border-border">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-medium text-foreground">{session.cohort}</p>
                        <p className="text-sm text-muted-foreground">{session.topic}</p>
                      </div>
                      <Badge>{session.students} alunos</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-primary">{session.date}</span>
                      <Button variant="outline" size="sm">Preparar</Button>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="ghost" className="w-full mt-4">
                Ver calendário completo
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
