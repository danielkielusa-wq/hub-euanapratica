import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  ArrowLeft,
  Loader2,
  BookOpen,
  Film,
  Users,
  Clock,
  Settings,
  Save,
  BarChart3,
} from 'lucide-react';
import { useAdminCourse, useUpdateCourse } from '@/hooks/useAdminCourses';
import { ModuleList } from '@/components/admin/courses/ModuleList';
import { CourseAnalytics } from '@/components/admin/courses/CourseAnalytics';
import { CurriculumImportDialog } from '@/components/admin/courses/CurriculumImportDialog';
import { formatDuration } from '@/types/course';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type Tab = 'curriculum' | 'settings' | 'students' | 'analytics';

export default function AdminCourseBuilder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('curriculum');

  const { data: course, isLoading } = useAdminCourse(id!);
  const updateCourse = useUpdateCourse();

  // Settings form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Load settings when course data arrives
  if (course && !settingsLoaded) {
    setName(course.name);
    setDescription(course.description || '');
    setSettingsLoaded(true);
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!course) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Curso não encontrado.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/admin/cursos')}>
            Voltar
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const tabs: { key: Tab; label: string; icon: React.ElementType; count?: number }[] = [
    { key: 'curriculum', label: 'Conteúdo', icon: BookOpen },
    { key: 'analytics', label: 'Analytics', icon: BarChart3 },
    { key: 'students', label: 'Alunos', icon: Users, count: course.enrolled_count },
    { key: 'settings', label: 'Configurações', icon: Settings },
  ];

  const handleSaveSettings = () => {
    updateCourse.mutate({
      id: course.id,
      name: name.trim(),
      description: description || undefined,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/cursos')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">{course.name}</h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5" />
                {course.modules.length} módulos
              </span>
              <span className="flex items-center gap-1">
                <Film className="h-3.5 w-3.5" />
                {course.totalLessons} aulas
              </span>
              {course.totalDurationSeconds > 0 && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDuration(course.totalDurationSeconds)}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {course.enrolled_count} alunos
              </span>
            </div>
          </div>
          <CurriculumImportDialog espacoId={course.id} existingModuleCount={course.modules.length} />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted/50 p-1 rounded-full w-fit">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                  activeTab === tab.key
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {tab.count !== undefined && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                    {tab.count}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'curriculum' && (
          <ModuleList espacoId={course.id} modules={course.modules} />
        )}

        {activeTab === 'analytics' && (
          <CourseAnalytics espacoId={course.id} />
        )}

        {activeTab === 'settings' && (
          <Card className="rounded-[20px]">
            <CardHeader>
              <CardTitle>Configurações do Curso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-w-lg">
              <div className="space-y-2">
                <Label>Nome do Curso</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <Button
                onClick={handleSaveSettings}
                disabled={!name.trim() || updateCourse.isPending}
              >
                {updateCourse.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Salvar
              </Button>
            </CardContent>
          </Card>
        )}

        {activeTab === 'students' && (
          <Card className="rounded-[20px]">
            <CardHeader>
              <CardTitle>Alunos Matriculados ({course.enrolled_count})</CardTitle>
            </CardHeader>
            <CardContent>
              {course.user_espacos.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Aluno</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Matrícula</TableHead>
                      <TableHead>Expiração</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {course.user_espacos.map((enrollment: any) => (
                      <TableRow key={enrollment.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={enrollment.profiles?.profile_photo_url} />
                              <AvatarFallback>
                                {enrollment.profiles?.full_name?.charAt(0) || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{enrollment.profiles?.full_name || 'Usuário'}</p>
                              <p className="text-sm text-muted-foreground">{enrollment.profiles?.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={enrollment.status === 'active' ? 'default' : 'secondary'}>
                            {enrollment.status === 'active' ? 'Ativo' : enrollment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {enrollment.enrolled_at
                            ? format(new Date(enrollment.enrolled_at), 'dd/MM/yyyy', { locale: ptBR })
                            : '--'}
                        </TableCell>
                        <TableCell>
                          {enrollment.access_expires_at
                            ? format(new Date(enrollment.access_expires_at), 'dd/MM/yyyy', { locale: ptBR })
                            : 'Sem expiração'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center py-8 text-muted-foreground">
                  Nenhum aluno matriculado neste curso.
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
