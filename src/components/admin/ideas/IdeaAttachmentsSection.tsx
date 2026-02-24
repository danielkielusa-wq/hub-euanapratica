import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Trash2, Download, Eye, Loader2, Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileIcon } from '@/components/library/FileIcon';
import { formatFileSize, isImageType, isPreviewable } from '@/lib/file-utils';
import {
  useIdeaAttachments,
  type IdeaAttachment,
  type AttachmentWithUrl,
} from '@/hooks/useIdeaAttachments';

interface Props {
  ideaId: string;
  attachments: IdeaAttachment[];
  onAttachmentsChange: (updated: IdeaAttachment[]) => void;
}

export function IdeaAttachmentsSection({ ideaId, attachments, onAttachmentsChange }: Props) {
  const {
    uploadAttachment,
    deleteAttachment,
    getSignedUrls,
    uploading,
    progress,
    loadingUrls,
  } = useIdeaAttachments();

  const [enriched, setEnriched] = useState<AttachmentWithUrl[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [deletingPath, setDeletingPath] = useState<string | null>(null);

  // Fetch signed URLs when attachments change
  useEffect(() => {
    if (attachments.length > 0) {
      getSignedUrls(attachments).then(setEnriched);
    } else {
      setEnriched([]);
    }
  }, [attachments, getSignedUrls]);

  // ─── Drop handler ───
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    let current = attachments;
    for (const file of acceptedFiles) {
      const result = await uploadAttachment(ideaId, file, current);
      if (result) {
        current = result;
        onAttachmentsChange(current);
      }
    }
  }, [ideaId, attachments, uploadAttachment, onAttachmentsChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: 10 * 1024 * 1024,
    disabled: uploading,
  });

  // ─── Delete handler ───
  const handleDelete = useCallback(async (path: string) => {
    setDeletingPath(path);
    const result = await deleteAttachment(ideaId, path, attachments);
    if (result) onAttachmentsChange(result);
    setDeletingPath(null);
  }, [ideaId, attachments, deleteAttachment, onAttachmentsChange]);

  return (
    <div className="mt-5 pt-4 border-t border-gray-100">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-3">
        <Paperclip className="w-3.5 h-3.5 text-gray-500" />
        <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
          Attachments
        </span>
        {attachments.length > 0 && (
          <span className="text-[11px] text-gray-400">({attachments.length})</span>
        )}
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors mb-3',
          isDragActive
            ? 'border-purple-400 bg-purple-50'
            : 'border-gray-200 hover:border-purple-300',
          uploading && 'opacity-50 pointer-events-none'
        )}
      >
        <input {...getInputProps()} />
        <Upload className="h-5 w-5 mx-auto mb-1.5 text-gray-400" />
        {isDragActive ? (
          <p className="text-sm text-purple-600 font-medium">Solte os arquivos aqui...</p>
        ) : (
          <>
            <p className="text-sm text-gray-600">Arraste ou clique para anexar</p>
            <p className="text-[11px] text-gray-400 mt-0.5">JPG, PNG, WebP, PDF, DOCX (max 10MB)</p>
          </>
        )}
      </div>

      {/* Upload progress */}
      {uploading && (
        <div className="flex items-center gap-2 mb-3 px-1">
          <Loader2 className="w-4 h-4 animate-spin text-purple-600 flex-shrink-0" />
          <Progress value={progress} className="h-1.5 flex-1" />
          <span className="text-[11px] text-gray-500 w-8 text-right">{progress}%</span>
        </div>
      )}

      {/* Loading state */}
      {loadingUrls && enriched.length === 0 && attachments.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Carregando anexos...
        </div>
      )}

      {/* File list */}
      {enriched.length > 0 && (
        <div className="space-y-2">
          {enriched.map((att) => {
            const isImage = isImageType(att.fileType) || att.type.startsWith('image/');
            const isDeleting = deletingPath === att.path;

            return (
              <div
                key={att.path}
                className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg group"
              >
                {/* Thumbnail or icon */}
                {isImage && att.signedUrl ? (
                  <img
                    src={att.signedUrl}
                    alt={att.name}
                    className="w-10 h-10 rounded object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded bg-white border border-gray-100 flex items-center justify-center flex-shrink-0">
                    <FileIcon fileType={att.fileType} size={18} />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 truncate">{att.name}</p>
                  <p className="text-[11px] text-gray-400">{formatFileSize(att.size)}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {(isPreviewable(att.fileType) || isImage) && att.signedUrl && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isImage) {
                          setPreviewUrl(att.signedUrl);
                        } else {
                          window.open(att.signedUrl, '_blank');
                        }
                      }}
                    >
                      <Eye className="w-3.5 h-3.5 text-gray-500" />
                    </Button>
                  )}
                  {att.signedUrl && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        const a = document.createElement('a');
                        a.href = att.signedUrl;
                        a.download = att.name;
                        a.click();
                      }}
                    >
                      <Download className="w-3.5 h-3.5 text-gray-500" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    disabled={isDeleting}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(att.path);
                    }}
                  >
                    {isDeleting
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin text-red-400" />
                      : <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    }
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Image preview lightbox */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-[9999] bg-black/70 flex items-center justify-center p-8 cursor-pointer"
          onClick={() => setPreviewUrl(null)}
        >
          <img
            src={previewUrl}
            alt="Preview"
            className="max-w-full max-h-full rounded-lg shadow-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
