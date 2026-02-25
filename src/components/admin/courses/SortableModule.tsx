import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  ChevronDown,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Film,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useUpdateModule, useCreateLesson, useDeleteLesson } from '@/hooks/useAdminCourses';
import { formatDuration, VIDEO_STATUS_CONFIG } from '@/types/course';
import type { CourseModule, CourseLesson } from '@/types/course';
import { cn } from '@/lib/utils';

interface SortableModuleProps {
  module: CourseModule;
  index: number;
  espacoId: string;
  onEditLesson: (lesson: CourseLesson) => void;
  onDeleteModule: (id: string) => void;
}

export function SortableModule({
  module,
  index,
  espacoId,
  onEditLesson,
  onDeleteModule,
}: SortableModuleProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(module.title);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [addingLesson, setAddingLesson] = useState(false);

  const updateModule = useUpdateModule();
  const createLesson = useCreateLesson();
  const deleteLesson = useDeleteLesson();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: module.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const lessons = module.lessons || [];
  const totalDuration = lessons.reduce(
    (sum, l) => sum + (l.video_duration_seconds || 0),
    0
  );

  const handleSaveTitle = () => {
    if (title.trim() && title !== module.title) {
      updateModule.mutate({ id: module.id, espacoId, title: title.trim() });
    }
    setEditingTitle(false);
  };

  const handleTogglePublished = (checked: boolean) => {
    updateModule.mutate({ id: module.id, espacoId, is_published: checked });
  };

  const handleAddLesson = () => {
    if (!newLessonTitle.trim()) return;
    createLesson.mutate(
      {
        espacoId,
        module_id: module.id,
        title: newLessonTitle.trim(),
        display_order: lessons.length,
      },
      {
        onSuccess: () => {
          setNewLessonTitle('');
          setAddingLesson(false);
        },
      }
    );
  };

  const videoStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />;
      case 'processing':
        return <Loader2 className="h-3.5 w-3.5 text-amber-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-3.5 w-3.5 text-red-500" />;
      default:
        return <Film className="h-3.5 w-3.5 text-muted-foreground/50" />;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-xl border bg-card transition-shadow",
        isDragging && "shadow-lg ring-2 ring-primary/20 z-50"
      )}
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        {/* Module header */}
        <div className="flex items-center gap-2 p-3">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </button>

          <CollapsibleTrigger className="p-1 rounded hover:bg-muted">
            {isOpen ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </CollapsibleTrigger>

          <div className="flex-1 min-w-0">
            {editingTitle ? (
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTitle();
                  if (e.key === 'Escape') { setTitle(module.title); setEditingTitle(false); }
                }}
                autoFocus
                className="h-7 text-sm"
              />
            ) : (
              <button
                onClick={() => setEditingTitle(true)}
                className="flex items-center gap-2 text-sm font-semibold hover:underline text-left"
              >
                <span className="text-muted-foreground/60 text-xs">
                  {String(index + 1).padStart(2, '0')}
                </span>
                {module.title}
                <Pencil className="h-3 w-3 text-muted-foreground/40" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant="outline" className="text-xs font-normal">
              {lessons.length} {lessons.length === 1 ? 'aula' : 'aulas'}
            </Badge>
            {totalDuration > 0 && (
              <Badge variant="outline" className="text-xs font-normal gap-1">
                <Clock className="h-3 w-3" />
                {formatDuration(totalDuration)}
              </Badge>
            )}
            <Switch
              checked={module.is_published}
              onCheckedChange={handleTogglePublished}
              className="scale-75"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive/60 hover:text-destructive"
              onClick={() => onDeleteModule(module.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Lessons */}
        <CollapsibleContent>
          <div className="px-3 pb-3 space-y-1">
            {lessons.map((lesson, lessonIndex) => (
              <button
                key={lesson.id}
                onClick={() => onEditLesson(lesson)}
                className={cn(
                  "w-full flex items-center gap-3 p-2.5 rounded-lg text-left",
                  "hover:bg-muted/70 transition-colors group"
                )}
              >
                {videoStatusIcon(lesson.video_status)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">
                    <span className="text-muted-foreground/50 mr-1.5">
                      {index + 1}.{lessonIndex + 1}
                    </span>
                    {lesson.title}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {lesson.is_free_preview && (
                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                      Grátis
                    </Badge>
                  )}
                  {lesson.video_duration_seconds && lesson.video_duration_seconds > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {formatDuration(lesson.video_duration_seconds)}
                    </span>
                  )}
                  {lesson.is_published ? (
                    <Eye className="h-3.5 w-3.5 text-emerald-500 opacity-0 group-hover:opacity-100" />
                  ) : (
                    <EyeOff className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100" />
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive/60 hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteLesson.mutate({ id: lesson.id, espacoId });
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </button>
            ))}

            {/* Add lesson */}
            {addingLesson ? (
              <div className="flex gap-2 pl-8">
                <Input
                  placeholder="Nome da aula..."
                  value={newLessonTitle}
                  onChange={(e) => setNewLessonTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddLesson()}
                  autoFocus
                  className="h-8 text-sm"
                />
                <Button size="sm" onClick={handleAddLesson} disabled={!newLessonTitle.trim()}>
                  Criar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setAddingLesson(false); setNewLessonTitle(''); }}>
                  Cancelar
                </Button>
              </div>
            ) : (
              <button
                onClick={() => setAddingLesson(true)}
                className="flex items-center gap-2 pl-8 py-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Adicionar aula
              </button>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
