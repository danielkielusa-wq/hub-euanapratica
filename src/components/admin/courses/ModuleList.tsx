import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SortableModule } from './SortableModule';
import { LessonEditor } from './LessonEditor';
import { useCreateModule, useReorderModules, useDeleteModule } from '@/hooks/useAdminCourses';
import type { CourseModule, CourseLesson } from '@/types/course';

interface ModuleListProps {
  espacoId: string;
  modules: CourseModule[];
}

export function ModuleList({ espacoId, modules }: ModuleListProps) {
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [addingModule, setAddingModule] = useState(false);
  const [editingLesson, setEditingLesson] = useState<CourseLesson | null>(null);
  const [deleteModuleId, setDeleteModuleId] = useState<string | null>(null);

  const createModule = useCreateModule();
  const reorderModules = useReorderModules();
  const deleteModule = useDeleteModule();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleAddModule = () => {
    if (!newModuleTitle.trim()) return;
    createModule.mutate(
      { espaco_id: espacoId, title: newModuleTitle.trim(), display_order: modules.length },
      {
        onSuccess: () => {
          setNewModuleTitle('');
          setAddingModule(false);
        },
      }
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = modules.findIndex((m) => m.id === active.id);
    const newIndex = modules.findIndex((m) => m.id === over.id);
    const reordered = arrayMove(modules, oldIndex, newIndex);

    reorderModules.mutate({
      espacoId,
      modules: reordered.map((m, i) => ({ id: m.id, display_order: i })),
    });
  };

  const handleConfirmDelete = () => {
    if (!deleteModuleId) return;
    deleteModule.mutate(
      { id: deleteModuleId, espacoId },
      { onSuccess: () => setDeleteModuleId(null) }
    );
  };

  return (
    <div className="space-y-4">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={modules.map((m) => m.id)} strategy={verticalListSortingStrategy}>
          {modules.map((module, index) => (
            <SortableModule
              key={module.id}
              module={module}
              index={index}
              espacoId={espacoId}
              onEditLesson={setEditingLesson}
              onDeleteModule={(id) => setDeleteModuleId(id)}
            />
          ))}
        </SortableContext>
      </DndContext>

      {/* Add module */}
      {addingModule ? (
        <div className="flex gap-2 p-4 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5">
          <Input
            placeholder="Nome do módulo..."
            value={newModuleTitle}
            onChange={(e) => setNewModuleTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddModule()}
            autoFocus
          />
          <Button onClick={handleAddModule} disabled={!newModuleTitle.trim() || createModule.isPending}>
            Criar
          </Button>
          <Button variant="ghost" onClick={() => { setAddingModule(false); setNewModuleTitle(''); }}>
            Cancelar
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          className="w-full rounded-xl border-dashed h-12"
          onClick={() => setAddingModule(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Módulo
        </Button>
      )}

      {/* Lesson editor sheet */}
      <LessonEditor
        lesson={editingLesson}
        espacoId={espacoId}
        open={!!editingLesson}
        onOpenChange={(open) => { if (!open) setEditingLesson(null); }}
      />

      {/* Delete module confirmation */}
      <Dialog open={!!deleteModuleId} onOpenChange={(open) => { if (!open) setDeleteModuleId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir módulo?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Todas as aulas e materiais deste módulo serão excluídos permanentemente.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModuleId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={deleteModule.isPending}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
