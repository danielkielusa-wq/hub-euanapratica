import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StatCard } from '@/components/admin/shared/StatCard';
import { useAdminStats, useRecentEnrollments } from '@/hooks/useAdminStats';
import { Users, GraduationCap, BookOpen, AlertTriangle, Plus, BarChart3, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { data: stats, isLoading } = useAdminStats();
  const { data: recentEnrollments } = useRecentEnrollments(5);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Painel Administrativo</h1>
            <p className="text-muted-foreground mt-1">Visão geral da plataforma</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate('/admin/relatorios')}>
              <BarChart3 className="mr-2 h-4 w-4" /> Relatórios
            </Button>
            <Button onClick={() => navigate('/admin/turmas')}>
              <Plus className="mr-2 h-4 w-4" /> Nova Turma
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total de Usuários" value={stats?.totalUsers ?? 0} icon={Users} />
          <StatCard title="Turmas Ativas" value={stats?.totalActiveEspacos ?? 0} icon={GraduationCap} />
          <StatCard title="Matrículas Ativas" value={stats?.totalActiveEnrollments ?? 0} icon={BookOpen} />
          <StatCard title="Acessos Expirando" value={stats?.expiringAccess30Days ?? 0} icon={AlertTriangle} variant={stats?.expiringAccess30Days ? 'warning' : 'default'} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div><CardTitle>Matrículas Recentes</CardTitle><CardDescription>Últimas matrículas</CardDescription></div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/admin/matriculas')}>Ver todas</Button>
            </CardHeader>
            <CardContent>
              {recentEnrollments && recentEnrollments.length > 0 ? (
                <div className="space-y-4">
                  {recentEnrollments.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10"><AvatarImage src={item.profiles?.profile_photo_url} /><AvatarFallback>{item.profiles?.full_name?.charAt(0) || '?'}</AvatarFallback></Avatar>
                        <div><p className="font-medium text-foreground">{item.profiles?.full_name}</p><p className="text-sm text-muted-foreground">{item.espacos?.name}</p></div>
                      </div>
                      <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(item.enrolled_at), { addSuffix: true, locale: ptBR })}</span>
                    </div>
                  ))}
                </div>
              ) : (<p className="text-muted-foreground text-center py-4">Nenhuma matrícula recente.</p>)}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Ações Rápidas</CardTitle><CardDescription>Acesso rápido às funcionalidades</CardDescription></CardHeader>
            <CardContent className="grid gap-2">
              <Button variant="outline" className="justify-start" onClick={() => navigate('/admin/turmas')}><GraduationCap className="mr-2 h-4 w-4" /> Gerenciar Turmas</Button>
              <Button variant="outline" className="justify-start" onClick={() => navigate('/admin/usuarios')}><Users className="mr-2 h-4 w-4" /> Gerenciar Usuários</Button>
              <Button variant="outline" className="justify-start" onClick={() => navigate('/admin/matriculas')}><BookOpen className="mr-2 h-4 w-4" /> Gerenciar Matrículas</Button>
              <Button variant="outline" className="justify-start" onClick={() => navigate('/admin/produtos')}><AlertTriangle className="mr-2 h-4 w-4" /> Gerenciar Produtos</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
