import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Search, BookOpen, Users, Film, Clock } from 'lucide-react';
import { useAdminCourses, useCreateCourse } from '@/hooks/useAdminCourses';
import { formatDuration } from '@/types/course';

export default function AdminCourses() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const { data: courses = [], isLoading } = useAdminCourses();
  const createCourse = useCreateCourse();

  const filtered = courses.filter((c) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = () => {
    if (!newName.trim()) return;
    createCourse.mutate(
      { name: newName.trim(), description: newDesc || undefined },
      {
        onSuccess: (data) => {
          setCreateOpen(false);
          setNewName('');
          setNewDesc('');
          navigate(`/admin/cursos/${data.id}`);
        },
      }
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Cursos</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie seus cursos gravados com vídeo-aulas
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Curso
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cursos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Nenhum curso encontrado</h3>
            <p className="text-muted-foreground mt-1">
              Crie seu primeiro curso para começar
            </p>
            <Button className="mt-4" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Curso
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((course) => (
              <Card
                key={course.id}
                className="rounded-[20px] cursor-pointer hover:shadow-md hover:border-primary/20 transition-all"
                onClick={() => navigate(`/admin/cursos/${course.id}`)}
              >
                {/* Cover */}
                <div className="aspect-[16/10] rounded-t-[20px] overflow-hidden bg-gradient-to-br from-amber-400 to-orange-500 relative">
                  {course.cover_image_url && (
                    <img
                      src={course.cover_image_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute top-3 right-3">
                    <Badge
                      variant={course.status === 'active' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {course.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-4 space-y-3">
                  <h3 className="font-semibold text-base line-clamp-2">{course.name}</h3>
                  {course.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {course.description}
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3.5 w-3.5" />
                      {course.module_count} módulos
                    </span>
                    <span className="flex items-center gap-1">
                      <Film className="h-3.5 w-3.5" />
                      {course.lesson_count} aulas
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {course.enrolled_count}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Curso</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Curso</Label>
              <Input
                placeholder="Ex: Masterclass de Currículo Americano"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição (opcional)</Label>
              <Input
                placeholder="Breve descrição do curso..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={!newName.trim() || createCourse.isPending}>
              {createCourse.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Criar Curso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
