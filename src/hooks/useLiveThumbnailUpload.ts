import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const BUCKET = 'live-thumbnails';

export function useLiveThumbnailUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Tipo de arquivo não suportado. Use JPEG, PNG ou WebP.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'Arquivo muito grande. Máximo de 5MB.';
    }
    return null;
  };

  const uploadThumbnail = async (file: File, liveId?: string): Promise<string | null> => {
    const error = validateFile(file);
    if (error) {
      toast.error(error);
      return null;
    }

    setUploading(true);
    setProgress(0);

    try {
      const extension = file.type.split('/')[1];
      const timestamp = Date.now();
      const folder = liveId || 'temp';
      const path = `${folder}/${timestamp}_thumb.${extension}`;

      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 20, 90));
      }, 200);

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, {
          upsert: true,
          cacheControl: '3600',
        });

      clearInterval(progressInterval);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(path);

      setProgress(100);
      toast.success('Thumbnail enviada!');

      return publicUrlData.publicUrl;
    } catch (err: any) {
      toast.error('Erro ao enviar imagem: ' + (err.message || 'Tente novamente'));
      return null;
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const deleteThumbnail = async (url: string): Promise<boolean> => {
    try {
      const parts = url.split(`/${BUCKET}/`);
      if (parts.length < 2) return false;

      const path = parts[1];
      const { error } = await supabase.storage.from(BUCKET).remove([path]);
      if (error) throw error;

      toast.success('Thumbnail removida');
      return true;
    } catch {
      toast.error('Erro ao remover imagem');
      return false;
    }
  };

  return { uploadThumbnail, deleteThumbnail, uploading, progress };
}
