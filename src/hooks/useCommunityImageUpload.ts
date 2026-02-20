import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function useCommunityImageUpload() {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Tipo de arquivo não suportado. Use JPEG, PNG ou WebP.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'Arquivo muito grande. Máximo de 5MB.';
    }
    // Sanitize: reject files with suspicious extensions hidden in name
    const name = file.name.toLowerCase();
    if (name.includes('.exe') || name.includes('.js') || name.includes('.html') || name.includes('.svg')) {
      return 'Tipo de arquivo não permitido.';
    }
    return null;
  };

  const upload = async (file: File): Promise<string | null> => {
    if (!user) {
      toast({ title: 'Você precisa estar logado', variant: 'destructive' });
      return null;
    }

    const validationError = validateFile(file);
    if (validationError) {
      toast({ title: validationError, variant: 'destructive' });
      return null;
    }

    setUploading(true);
    try {
      const ext = file.type.split('/')[1] === 'jpeg' ? 'jpg' : file.type.split('/')[1];
      const timestamp = Date.now();
      // Folder per user for RLS delete policy
      const path = `${user.id}/${timestamp}_post.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('community-images')
        .upload(path, file, {
          upsert: false,
          cacheControl: '3600',
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('community-images')
        .getPublicUrl(path);

      return publicUrlData.publicUrl;
    } catch (err: any) {
      toast({
        title: 'Erro ao enviar imagem',
        description: err.message || 'Tente novamente',
        variant: 'destructive',
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { upload, uploading, validateFile };
}
