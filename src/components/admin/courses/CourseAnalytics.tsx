import { Users, TrendingUp, Activity, Award, Loader2, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAdminCourseAnalytics } from '@/hooks/useAdminCourseAnalytics';
import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CourseAnalyticsProps {
  espacoId: string;
}

export function CourseAnalytics({ espacoId }: CourseAnalyticsProps) {
  const { summary, moduleRates, studentProgress } = useAdminCourseAnalytics(espacoId);
  const [search, setSearch] = useState('');

  const isLoading = summary.isLoading || moduleRates.isLoading || studentProgress.isLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const stats = summary.data;
  const modules = moduleRates.data || [];
  const students = studentProgress.data || [];

  const filteredStudents = search
    ? students.filter(
        (s) =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.email.toLowerCase().includes(search.toLowerCase())
      )
    : students;

  const summaryCards = [
    { label: 'Alunos Matriculados', value: stats?.totalEnrolled || 0, icon: Users, color: 'text-blue-500' },
    { label: 'Conclusão Média', value: `${stats?.avgCompletion || 0}%`, icon: TrendingUp, color: 'text-emerald-500' },
    { label: 'Ativos (7 dias)', value: stats?.activeThisWeek || 0, icon: Activity, color: 'text-purple-500' },
    { label: 'Certificados', value: stats?.certificatesIssued || 0, icon: Award, color: 'text-amber-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="rounded-[20px]">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl bg-muted ${card.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{card.value}</p>
                    <p className="text-xs text-muted-foreground">{card.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Module Completion Chart */}
      {modules.length > 0 && (
        <Card className="rounded-[20px]">
          <CardHeader>
            <CardTitle className="text-base">Conclusão por Módulo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={modules} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={150}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, 'Conclusão']}
                    contentStyle={{ borderRadius: 12, fontSize: 13 }}
                  />
                  <Bar dataKey="rate" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Student Progress Table */}
      <Card className="rounded-[20px]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Progresso dos Alunos</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar aluno..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredStudents.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Progresso</TableHead>
                  <TableHead className="text-center">Aulas</TableHead>
                  <TableHead>Última atividade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.userId}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={student.avatar || undefined} />
                          <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{student.name}</p>
                          <p className="text-xs text-muted-foreground">{student.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-[150px]">
                        <Progress value={student.completionPercent} className="h-2 flex-1" />
                        <span className="text-xs font-medium tabular-nums w-10 text-right">
                          {student.completionPercent}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      {student.lessonsCompleted}/{student.totalLessons}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {student.lastActive
                        ? format(new Date(student.lastActive), 'dd/MM/yy HH:mm', { locale: ptBR })
                        : '--'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center py-8 text-muted-foreground text-sm">
              {search ? 'Nenhum aluno encontrado' : 'Nenhum aluno matriculado'}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
