import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, ClipboardList, Calendar, Trophy } from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();
  
  const stats = [
    { label: 'Turmas Ativas', value: '2', icon: BookOpen, color: 'text-primary' },
    { label: 'Tarefas Pendentes', value: '5', icon: ClipboardList, color: 'text-secondary' },
    { label: 'Próxima Sessão', value: '2 dias', icon: Calendar, color: 'text-accent' },
    { label: 'Pontuação', value: '850', icon: Trophy, color: 'text-chart-4' },
  ];
  
  const courses = [
    {
      id: 1,
      name: 'Mentoria Intensiva - Turma 1',
      progress: 65,
      nextLesson: 'Preparação para Entrevistas',
      mentor: 'Maria Santos',
    },
    {
      id: 2,
      name: 'Imersão Networking',
      progress: 30,
      nextLesson: 'LinkedIn Estratégico',
      mentor: 'João Mentor',
    },
  ];
  
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Olá, {user?.full_name.split(' ')[0]}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Continue sua jornada para trabalhar nos EUA
          </p>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg bg-muted ${stat.color}`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Active Courses */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">Suas Turmas</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {courses.map((course) => (
              <Card key={course.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{course.name}</CardTitle>
                  <CardDescription>Mentor: {course.mentor}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-medium text-foreground">{course.progress}%</span>
                    </div>
                    <Progress value={course.progress} className="h-2" />
                  </div>
                  
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Próxima aula</p>
                      <p className="text-sm font-medium text-foreground">{course.nextLesson}</p>
                    </div>
                    <Button size="sm">Acessar</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        
        {/* Recent Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>Tarefas Pendentes</CardTitle>
            <CardDescription>Complete suas tarefas para avançar nas turmas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { task: 'Atualizar currículo em inglês', course: 'Mentoria Intensiva', due: '2 dias' },
                { task: 'Gravar pitch de apresentação', course: 'Mentoria Intensiva', due: '5 dias' },
                { task: 'Conectar com 10 profissionais', course: 'Imersão Networking', due: '7 dias' },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-foreground">{item.task}</p>
                    <p className="text-sm text-muted-foreground">{item.course}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Prazo: {item.due}</p>
                    <Button variant="link" size="sm" className="h-auto p-0">
                      Ver detalhes
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
