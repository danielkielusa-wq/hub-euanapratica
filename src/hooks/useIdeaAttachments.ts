import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getFileTypeFromMime } from '@/lib/file-utils';
import type { FileType } from '@/types/library';

// ─── Types ───────────────────────────────────────────────────────────

export interface IdeaAttachment {
  path: string;        // Storage path: "{ideaId}/{timestamp}_{safeName}"
  name: string;        // Original filename
  size: number;        // Bytes
  type: string;        // MIME type
  uploaded_at: string; // ISO timestamp
}

export interface AttachmentWithUrl extends IdeaAttachment {
  signedUrl: string;
  fileType: FileType;
}

// ─── Constants ───────────────────────────────────────────────────────

const BUCKET = 'idea-attachments';
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const SIGNED_URL_EXPIRY = 3600; // 1 hour

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

// ─── Hook ────────────────────────────────────────────────────────────

export function useIdeaAttachments() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingUrls, setLoadingUrls] = useState(false);

  const validateFile = useCallback((file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Tipo de arquivo não suportado. Use JPG, PNG, WebP, PDF ou DOCX.';
    }
    if (file.size > MAX_SIZE) {
      return `Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Máximo: 10MB.`;
    }
    return null;
  }, []);

  // Upload a single file and persist metadata to business_ideas.attachments
  const uploadAttachment = useCallback(async (
    ideaId: string,
    file: File,
    currentAttachments: IdeaAttachment[]
  ): Promise<IdeaAttachment[] | null> => {
    const error = validateFile(file);
    if (error) {
      toast.error(error);
      return null;
    }

    setUploading(true);
    setProgress(0);

    try {
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const path = `${ideaId}/${timestamp}_${safeName}`;

      // Simulate progress (Supabase JS has no native upload progress)
      const interval = setInterval(() => {
        setProgress(prev => Math.min(prev + 15, 85));
      }, 200);

      const { error: uploadErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: false, cacheControl: '3600', contentType: file.type });

      clearInterval(interval);

      if (uploadErr) throw uploadErr;

      const attachment: IdeaAttachment = {
        path,
        name: file.name,
        size: file.size,
        type: file.type,
        uploaded_at: new Date().toISOString(),
      };

      const updated = [...currentAttachments, attachment];

      // Persist to DB
      const { error: dbErr } = await (supabase
        .from('business_ideas' as any)
        .update({ attachments: updated })
        .eq('id', ideaId) as any);

      if (dbErr) {
        // Rollback: delete the uploaded file
        await supabase.storage.from(BUCKET).remove([path]);
        throw dbErr;
      }

      setProgress(100);
      toast.success(`"${file.name}" anexado`);
      return updated;
    } catch (err: any) {
      toast.error('Erro ao anexar: ' + (err.message || 'Tente novamente'));
      return null;
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 600);
    }
  }, [validateFile]);

  // Delete a single attachment from storage + DB
  const deleteAttachment = useCallback(async (
    ideaId: string,
    attachmentPath: string,
    currentAttachments: IdeaAttachment[]
  ): Promise<IdeaAttachment[] | null> => {
    try {
      const { error: storageErr } = await supabase.storage
        .from(BUCKET)
        .remove([attachmentPath]);

      if (storageErr) throw storageErr;

      const updated = currentAttachments.filter(a => a.path !== attachmentPath);

      const { error: dbErr } = await (supabase
        .from('business_ideas' as any)
        .update({ attachments: updated })
        .eq('id', ideaId) as any);

      if (dbErr) throw dbErr;

      toast.success('Anexo removido');
      return updated;
    } catch (err: any) {
      toast.error('Erro ao remover anexo: ' + (err.message || 'Tente novamente'));
      return null;
    }
  }, []);

  // Generate signed URLs for all attachments (private bucket)
  const getSignedUrls = useCallback(async (
    attachments: IdeaAttachment[]
  ): Promise<AttachmentWithUrl[]> => {
    if (attachments.length === 0) return [];

    setLoadingUrls(true);
    try {
      const results = await Promise.all(
        attachments.map(async (att) => {
          const { data, error } = await supabase.storage
            .from(BUCKET)
            .createSignedUrl(att.path, SIGNED_URL_EXPIRY);

          return {
            ...att,
            signedUrl: error ? '' : data.signedUrl,
            fileType: att.type.startsWith('image/') ? getFileTypeFromMime(att.type) || 'jpg' as FileType : getFileTypeFromMime(att.type),
          } as AttachmentWithUrl;
        })
      );
      return results;
    } finally {
      setLoadingUrls(false);
    }
  }, []);

  return {
    uploadAttachment,
    deleteAttachment,
    getSignedUrls,
    validateFile,
    uploading,
    progress,
    loadingUrls,
  };
}
