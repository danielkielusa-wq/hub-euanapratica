import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, Trash2, Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useLessonAttachments, useCreateAttachment, useDeleteAttachment } from '@/hooks/useAdminCourses';
import { cn } from '@/lib/utils';

interface AttachmentUploaderProps {
  lessonId: string;
}

const FILE_TYPE_ICONS: Record<string, string> = {
  pdf: '📄',
  docx: '📝',
  xlsx: '📊',
  pptx: '📈',
  zip: '📦',
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentUploader({ lessonId }: AttachmentUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const { data: attachments = [], isLoading } = useLessonAttachments(lessonId);
  const createAttachment = useCreateAttachment();
  const deleteAttachment = useDeleteAttachment();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true);
    try {
      for (const file of acceptedFiles) {
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        const path = `lessons/${lessonId}/${Date.now()}_${file.name}`;

        const { error: uploadError } = await supabase.storage
          .from('course-attachments')
          .upload(path, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('course-attachments')
          .getPublicUrl(path);

        await createAttachment.mutateAsync({
          lesson_id: lessonId,
          file_name: file.name,
          file_url: urlData.publicUrl,
          file_type: ext,
          file_size: file.size,
        });
      }
    } catch (err: any) {
      console.error('Attachment upload error:', err);
    } finally {
      setUploading(false);
    }
  }, [lessonId, createAttachment]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'application/zip': ['.zip'],
      'image/*': ['.png', '.jpg', '.jpeg'],
    },
    maxSize: 52428800, // 50MB
    disabled: uploading,
  });

  return (
    <div className="space-y-3">
      {/* File list */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50 group"
            >
              <span className="text-lg">
                {FILE_TYPE_ICONS[att.file_type || ''] || '📎'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{att.file_name}</p>
                {att.file_size && (
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(att.file_size)}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  asChild
                >
                  <a href={att.file_url} target="_blank" rel="noopener noreferrer">
                    <Download className="h-3.5 w-3.5" />
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  onClick={() => deleteAttachment.mutate({ id: att.id, lessonId, fileUrl: att.file_url })}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          "flex items-center justify-center gap-2 p-4 rounded-lg border-2 border-dashed cursor-pointer transition-colors",
          isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50",
          uploading && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <Upload className="h-4 w-4 text-muted-foreground" />
        )}
        <p className="text-sm text-muted-foreground">
          {uploading ? 'Enviando...' : 'Arraste ou clique para adicionar materiais'}
        </p>
      </div>
    </div>
  );
}
