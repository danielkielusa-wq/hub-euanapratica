import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { Users, GraduationCap, DollarSign, TrendingUp, Plus, MoreHorizontal } from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  
  const stats = [
    { label: 'Total de Usuários', value: '156', icon: Users, change: '+12%', color: 'bg-primary/10 text-primary' },
    { label: 'Turmas Ativas', value: '8', icon: GraduationCap, change: '+2 novas', color: 'bg-secondary/10 text-secondary' },
    { label: 'Receita Mensal', value: 'R$ 45.2k', icon: DollarSign, change: '+8%', color: 'bg-accent/10 text-accent' },
    { label: 'Taxa de Conclusão', value: '78%', icon: TrendingUp, change: '+5%', color: 'bg-chart-4/10 text-chart-4' },
  ];
  
  const recentUsers = [
    { name: 'Maria Oliveira', email: 'maria@email.com', role: 'student', date: 'Há 2 horas' },
    { name: 'Carlos Lima', email: 'carlos@email.com', role: 'student', date: 'Há 5 horas' },
    { name: 'Ana Costa', email: 'ana@email.com', role: 'mentor', date: 'Há 1 dia' },
  ];
  
  const activeCohorts = [
    { name: 'Mentoria Intensiva - Turma 3', students: 15, mentors: 2, status: 'Em andamento', progress: 45 },
    { name: 'Imersão Networking 2024', students: 20, mentors: 3, status: 'Em andamento', progress: 30 },
    { name: 'Bootcamp Entrevistas', students: 12, mentors: 1, status: 'Iniciando', progress: 5 },
  ];
  
  const roleColors = {
    student: 'bg-primary/10 text-primary',
    mentor: 'bg-secondary/10 text-secondary',
    admin: 'bg-accent/10 text-accent',
  };
  
  const roleLabels = {
    student: 'Aluno',
    mentor: 'Mentor',
    admin: 'Admin',
  };
  
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Painel Administrativo
            </h1>
            <p className="text-muted-foreground mt-1">
              Visão geral da plataforma EUA Na Prática
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              Relatórios
            </Button>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Turma
            </Button>
          </div>
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
                  <div className={`p-2 rounded-lg ${stat.color}`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Users */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Usuários Recentes</CardTitle>
                <CardDescription>Últimos cadastros na plataforma</CardDescription>
              </div>
              <Button variant="ghost" size="sm">Ver todos</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentUsers.map((user, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-sm font-medium text-foreground">
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={roleColors[user.role as keyof typeof roleColors]}>
                        {roleLabels[user.role as keyof typeof roleLabels]}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{user.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Active Cohorts */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Turmas Ativas</CardTitle>
                <CardDescription>Gerenciamento de turmas em andamento</CardDescription>
              </div>
              <Button variant="ghost" size="sm">Ver todas</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeCohorts.map((cohort, index) => (
                  <div key={index} className="p-4 rounded-lg border border-border">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-medium text-foreground">{cohort.name}</p>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span>{cohort.students} alunos</span>
                          <span>•</span>
                          <span>{cohort.mentors} mentores</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{cohort.status}</Badge>
                      <span className="text-sm font-medium text-primary">{cohort.progress}% concluído</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
