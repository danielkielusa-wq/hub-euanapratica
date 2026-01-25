import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function useEspacoCoverUpload() {
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

  const uploadCover = async (file: File, espacoId?: string): Promise<string | null> => {
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
      const folder = espacoId || 'temp';
      const path = `covers/${folder}/${timestamp}_cover.${extension}`;

      // Simulate progress (Supabase doesn't have native progress tracking)
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 20, 90));
      }, 200);

      const { data, error: uploadError } = await supabase.storage
        .from('espaco-covers')
        .upload(path, file, { 
          upsert: true,
          cacheControl: '3600'
        });

      clearInterval(progressInterval);

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from('espaco-covers')
        .getPublicUrl(path);

      setProgress(100);
      toast.success('Imagem de capa enviada com sucesso!');
      
      return publicUrlData.publicUrl;
    } catch (err: any) {
      console.error('Error uploading cover:', err);
      toast.error('Erro ao enviar imagem: ' + (err.message || 'Tente novamente'));
      return null;
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const deleteCover = async (coverUrl: string): Promise<boolean> => {
    try {
      // Extract path from URL
      const urlParts = coverUrl.split('/espaco-covers/');
      if (urlParts.length < 2) return false;

      const path = urlParts[1];
      
      const { error } = await supabase.storage
        .from('espaco-covers')
        .remove([path]);

      if (error) throw error;
      
      toast.success('Imagem removida');
      return true;
    } catch (err: any) {
      console.error('Error deleting cover:', err);
      toast.error('Erro ao remover imagem');
      return false;
    }
  };

  return {
    uploadCover,
    deleteCover,
    uploading,
    progress,
  };
}
