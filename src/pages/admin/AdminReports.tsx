import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/admin/shared/StatCard';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAdminStats, useExpiringAccess, useRecentEnrollments } from '@/hooks/useAdminStats';
import { Users, GraduationCap, BookOpen, Clock, AlertTriangle, Loader2, Download } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

export default function AdminReports() {
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: expiringAccess, isLoading: expiringLoading } = useExpiringAccess();
  const { data: recentEnrollments, isLoading: enrollmentsLoading } = useRecentEnrollments(10);

  const exportEnrollmentsReport = () => {
    if (!recentEnrollments || recentEnrollments.length === 0) return;

    const headers = ['Aluno', 'Email', 'Turma', 'Status', 'Data Matrícula'];
    const rows = recentEnrollments.map((e: any) => [
      e.profiles?.full_name || '',
      e.profiles?.email || '',
      e.espacos?.name || '',
      e.status || '',
      e.enrolled_at ? format(new Date(e.enrolled_at), 'dd/MM/yyyy') : ''
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_matriculas_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.click();
  };

  const exportExpiringReport = () => {
    if (!expiringAccess || expiringAccess.length === 0) return;

    const headers = ['Aluno', 'Email', 'Turma', 'Data Expiração'];
    const rows = expiringAccess.map((e: any) => [
      e.profiles?.full_name || '',
      e.profiles?.email || '',
      e.espacos?.name || '',
      e.access_expires_at ? format(new Date(e.access_expires_at), 'dd/MM/yyyy') : ''
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `acessos_expirando_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.click();
  };

  if (statsLoading) {
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
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios e Analytics</h1>
          <p className="text-muted-foreground">
            Visualize métricas e exporte relatórios da plataforma
          </p>
        </div>

        {/* Main Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total de Usuários"
            value={stats?.totalUsers ?? 0}
            icon={Users}
          />
          <StatCard
            title="Turmas Ativas"
            value={stats?.totalActiveEspacos ?? 0}
            icon={GraduationCap}
          />
          <StatCard
            title="Matrículas Ativas"
            value={stats?.totalActiveEnrollments ?? 0}
            icon={BookOpen}
          />
          <StatCard
            title="Novas Matrículas (30 dias)"
            value={stats?.newEnrollments30Days ?? 0}
            icon={Clock}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Expiring Access Alert */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <CardTitle>Acessos Expirando (30 dias)</CardTitle>
              </div>
              <Button variant="outline" size="sm" onClick={exportExpiringReport}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </CardHeader>
            <CardContent>
              {expiringLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : expiringAccess && expiringAccess.length > 0 ? (
                <div className="space-y-3">
                  {expiringAccess.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {item.profiles?.full_name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{item.profiles?.full_name}</p>
                          <p className="text-xs text-muted-foreground">{item.espacos?.name}</p>
                        </div>
                      </div>
                      <Badge variant="destructive">
                        Expira {formatDistanceToNow(new Date(item.access_expires_at), { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                      </Badge>
                    </div>
                  ))}
                  {stats?.expiringAccess30Days && stats.expiringAccess30Days > 10 && (
                    <Button 
                      variant="link" 
                      className="w-full" 
                      onClick={() => navigate('/admin/matriculas?expiring_soon=true')}
                    >
                      Ver todos ({stats.expiringAccess30Days})
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Nenhum acesso expirando nos próximos 30 dias.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Enrollments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Matrículas Recentes</CardTitle>
              <Button variant="outline" size="sm" onClick={exportEnrollmentsReport}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </CardHeader>
            <CardContent>
              {enrollmentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : recentEnrollments && recentEnrollments.length > 0 ? (
                <div className="space-y-3">
                  {recentEnrollments.slice(0, 5).map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={item.profiles?.profile_photo_url} />
                          <AvatarFallback>
                            {item.profiles?.full_name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{item.profiles?.full_name}</p>
                          <p className="text-xs text-muted-foreground">{item.espacos?.name}</p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(item.enrolled_at), { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                      </span>
                    </div>
                  ))}
                  <Button 
                    variant="link" 
                    className="w-full" 
                    onClick={() => navigate('/admin/matriculas')}
                  >
                    Ver todas as matrículas
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Nenhuma matrícula recente.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Available Reports */}
        <Card>
          <CardHeader>
            <CardTitle>Relatórios Disponíveis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Button 
                variant="outline" 
                className="h-auto py-4 flex-col gap-2"
                onClick={() => navigate('/admin/turmas')}
              >
                <GraduationCap className="h-6 w-6" />
                <span>Alunos por Turma</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex-col gap-2"
                onClick={() => navigate('/admin/matriculas')}
              >
                <BookOpen className="h-6 w-6" />
                <span>Histórico de Matrículas</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex-col gap-2"
                onClick={() => navigate('/admin/matriculas?expiring_soon=true')}
              >
                <AlertTriangle className="h-6 w-6" />
                <span>Acessos Expirando</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex-col gap-2"
                onClick={() => navigate('/admin/usuarios')}
              >
                <Users className="h-6 w-6" />
                <span>Relatório de Usuários</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
