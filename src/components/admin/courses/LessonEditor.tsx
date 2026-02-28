import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Save } from 'lucide-react';
import { VideoUploader } from './VideoUploader';
import { AttachmentUploader } from './AttachmentUploader';
import { QuizEditor } from './QuizEditor';
import { useUpdateLesson } from '@/hooks/useAdminCourses';
import { supabase } from '@/integrations/supabase/client';
import type { CourseLesson } from '@/types/course';

interface LessonEditorProps {
  lesson: CourseLesson | null;
  espacoId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LessonEditor({ lesson, espacoId, open, onOpenChange }: LessonEditorProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contentHtml, setContentHtml] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [isFreePreview, setIsFreePreview] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const updateLesson = useUpdateLesson();
  const queryClient = useQueryClient();

  // Fetch Bunny library ID for admin preview embed
  const { data: bunnyLibraryId } = useQuery({
    queryKey: ['bunny-library-id'],
    queryFn: async () => {
      const { data } = await supabase
        .from('api_configs')
        .select('credentials')
        .eq('api_key', 'bunny_stream')
        .single();
      return (data?.credentials as any)?.library_id as string | undefined;
    },
    staleTime: Infinity,
  });

  useEffect(() => {
    if (lesson) {
      setTitle(lesson.title);
      setDescription(lesson.description || '');
      setContentHtml(lesson.content_html || '');
      setVideoUrl(lesson.video_url || '');
      setIsFreePreview(lesson.is_free_preview);
      setIsPublished(lesson.is_published);
    }
  }, [lesson]);

  if (!lesson) return null;

  const handleSave = () => {
    updateLesson.mutate(
      {
        id: lesson.id,
        espacoId,
        title,
        description: description || undefined,
        content_html: contentHtml || undefined,
        video_url: videoUrl || undefined,
        is_free_preview: isFreePreview,
        is_published: isPublished,
      },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg p-0">
        <SheetHeader className="px-6 pt-6 pb-4">
          <SheetTitle className="text-lg">Editar Aula</SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-140px)]">
          <div className="px-6 pb-6 space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Introdução ao tema"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Breve descrição da aula..."
                rows={2}
              />
            </div>

            <Separator />

            {/* Video */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">Vídeo</Label>
              <VideoUploader
                lessonId={lesson.id}
                currentVideoId={lesson.bunny_video_id}
                videoStatus={lesson.video_status}
                thumbnailUrl={lesson.thumbnail_url}
                libraryId={bunnyLibraryId}
                onUploadComplete={() => {
                  queryClient.invalidateQueries({ queryKey: ['admin-course', espacoId] });
                }}
              />
              <div className="space-y-2 pt-2">
                <Label className="text-xs text-muted-foreground">
                  Ou URL externa (YouTube, Vimeo)
                </Label>
                <Input
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="text-sm"
                />
              </div>
            </div>

            <Separator />

            {/* Content */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">Conteúdo Complementar</Label>
              <Textarea
                value={contentHtml}
                onChange={(e) => setContentHtml(e.target.value)}
                placeholder="Texto adicional, notas, links..."
                rows={5}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">Suporta HTML básico</p>
            </div>

            <Separator />

            {/* Attachments */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">Materiais de Apoio</Label>
              <AttachmentUploader lessonId={lesson.id} />
            </div>

            <Separator />

            {/* Quiz */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">Quiz</Label>
              <QuizEditor lessonId={lesson.id} />
            </div>

            <Separator />

            {/* Toggles */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Preview Gratuita</Label>
                  <p className="text-xs text-muted-foreground">
                    Visível sem compra do curso
                  </p>
                </div>
                <Switch checked={isFreePreview} onCheckedChange={setIsFreePreview} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Publicada</Label>
                  <p className="text-xs text-muted-foreground">
                    Visível para alunos matriculados
                  </p>
                </div>
                <Switch checked={isPublished} onCheckedChange={setIsPublished} />
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-background">
          <Button
            onClick={handleSave}
            disabled={!title || updateLesson.isPending}
            className="w-full"
          >
            {updateLesson.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar Aula
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
